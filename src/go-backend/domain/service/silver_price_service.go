package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"

	"wealthjourney/pkg/cache"
	"wealthjourney/pkg/silver"
	"wealthjourney/pkg/yahoo"
)

// SilverPriceService handles fetching silver prices from ancarat and Yahoo Finance
type SilverPriceService interface {
	FetchPriceForSymbol(ctx context.Context, symbol string) (*CachedSilverPrice, error)
	FetchAllPrices(ctx context.Context) ([]*CachedSilverPrice, error)
}

// CachedSilverPrice represents a cached silver price with metadata
type CachedSilverPrice struct {
	TypeCode   string
	Name       string
	Buy        int64  // Price in smallest currency unit (VND: 1, USD: cents)
	Sell       int64  // Price in smallest currency unit
	Currency   string // "VND" or "USD"
	UpdateTime time.Time
}

// silverPriceService implements SilverPriceService
type silverPriceService struct {
	client *silver.Client
	cache  *cache.SilverPriceCache
}

// NewSilverPriceService creates a new silver price service
func NewSilverPriceService(redisClient *redis.Client) SilverPriceService {
	return &silverPriceService{
		client: silver.NewClient(10 * time.Second),
		cache:  cache.NewSilverPriceCache(redisClient),
	}
}

// FetchPriceForSymbol fetches price for a specific silver symbol
func (s *silverPriceService) FetchPriceForSymbol(ctx context.Context, symbol string) (*CachedSilverPrice, error) {
	if symbol == "XAG" || symbol == "SI=F" {
		// For USD silver, fetch from Yahoo Finance
		return s.fetchUSDSilverPrice(ctx)
	}

	// Determine the API type code based on symbol
	// - AG_VND_Tael: use "A4" (1 lượng)
	// - AG_VND_Kg: use "K4" (1 kg)
	var typeCode string
	switch symbol {
	case "AG_VND_Tael":
		typeCode = "A4" // Price per tael
	case "AG_VND_Kg":
		typeCode = "K4" // Price per kg
	default:
		// Legacy AG_VND or unknown - default to tael
		typeCode = "A4" // Price per tael

	}

	// Use symbol-specific cache key (cache both tael and kg separately)
	cacheKey := symbol

	// Try cache first
	cached, err := s.cache.Get(ctx, cacheKey, "VND")
	if err == nil && cached > 0 {
		return &CachedSilverPrice{
			TypeCode:   symbol,
			Buy:        cached,
			Currency:   "VND",
			UpdateTime: time.Now(),
		}, nil
	}

	// Fetch from API using the correct type code
	apiPrice, err := s.client.FetchPriceByType(ctx, typeCode)
	if err != nil {
		return nil, fmt.Errorf("fetch price from API: %w", err)
	}

	// Convert float64 to smallest currency unit
	// VND: No decimal places (multiply by 1)
	price := &CachedSilverPrice{
		TypeCode:   symbol,
		Name:       apiPrice.Name,
		Buy:        int64(apiPrice.Buy),
		Sell:       int64(apiPrice.Sell),
		Currency:   apiPrice.Currency,
		UpdateTime: time.Now(),
	}

	// Cache the result (non-blocking) - each symbol cached separately
	go func() {
		if err := s.cache.Set(context.Background(), cacheKey, price.Buy, "VND", cache.SilverPriceCacheTTL); err != nil {
			log.Printf("Warning: failed to cache silver price for %s: %v", cacheKey, err)
		}
	}()

	return price, nil
}

// fetchUSDSilverPrice fetches USD silver price from Yahoo Finance
// XAG is the silver futures symbol on Yahoo Finance
func (s *silverPriceService) fetchUSDSilverPrice(ctx context.Context) (*CachedSilverPrice, error) {
	// Try cache first
	cached, err := s.cache.Get(ctx, "XAG", "USD")
	if err == nil && cached > 0 {
		return &CachedSilverPrice{
			TypeCode:   "XAG",
			Name:       "Silver World (XAG/USD)",
			Buy:        cached,
			Currency:   "USD",
			UpdateTime: time.Now(),
		}, nil
	}

	// Fetch from Yahoo Finance
	// SI=F is the silver futures symbol, alternatively we can use XAGUSD=X
	quote, err := yahoo.GetQuote(ctx, "SI=F")
	if err != nil {
		// Try alternative symbol
		quote, err = yahoo.GetQuote(ctx, "XAGUSD=X")
		if err != nil {
			return nil, fmt.Errorf("fetch USD silver price from Yahoo Finance: %w", err)
		}
	}

	// Convert price to cents (smallest currency unit for USD)
	priceInCents := yahoo.ToSmallestCurrencyUnitByCurrency(quote.RegularMarketPrice, "USD")

	price := &CachedSilverPrice{
		TypeCode:   "XAG",
		Name:       "Silver World (XAG/USD)",
		Buy:        priceInCents,
		Sell:       priceInCents, // Use same price for sell (no spread in futures data)
		Currency:   "USD",
		UpdateTime: time.Now(),
	}

	// Cache the result (non-blocking)
	go func() {
		if err := s.cache.Set(context.Background(), "XAG", price.Buy, "USD", cache.SilverPriceCacheTTL); err != nil {
			log.Printf("Warning: failed to cache silver price for XAG: %v", err)
		}
	}()

	return price, nil
}

// FetchAllPrices fetches all silver prices
func (s *silverPriceService) FetchAllPrices(ctx context.Context) ([]*CachedSilverPrice, error) {
	// Fetch VND silver prices from ancarat API
	pricesMap, err := s.client.FetchPrices(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetch prices from API: %w", err)
	}

	prices := make([]*CachedSilverPrice, 0, len(pricesMap)+1) // +1 for XAG
	for _, apiPrice := range pricesMap {
		price := &CachedSilverPrice{
			TypeCode:   apiPrice.TypeCode,
			Name:       apiPrice.Name,
			Buy:        int64(apiPrice.Buy),
			Sell:       int64(apiPrice.Sell),
			Currency:   apiPrice.Currency,
			UpdateTime: time.Now(),
		}
		prices = append(prices, price)

		// Cache each price (non-blocking)
		go func(p *CachedSilverPrice) {
			if err := s.cache.Set(context.Background(), p.TypeCode, p.Buy, p.Currency, cache.SilverPriceCacheTTL); err != nil {
				log.Printf("Warning: failed to cache silver price for %s: %v", p.TypeCode, err)
			}
		}(price)
	}

	// Also fetch USD silver price
	xagPrice, err := s.fetchUSDSilverPrice(ctx)
	if err == nil {
		prices = append(prices, xagPrice)
	} else {
		log.Printf("Warning: failed to fetch XAG price: %v", err)
	}

	return prices, nil
}
