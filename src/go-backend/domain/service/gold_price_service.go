package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"

	"wealthjourney/pkg/cache"
	"wealthjourney/pkg/gold"
)

// GoldPriceService handles fetching gold prices from vang.today
type GoldPriceService interface {
	FetchPriceForSymbol(ctx context.Context, symbol string) (*CachedGoldPrice, error)
	FetchAllPrices(ctx context.Context) ([]*CachedGoldPrice, error)
}

// CachedGoldPrice represents a cached gold price with metadata
type CachedGoldPrice struct {
	TypeCode   string
	Name       string
	Buy        int64    // Price in smallest currency unit (VND: 1, USD: cents)
	Sell       int64    // Price in smallest currency unit
	ChangeBuy  int64    // Change in smallest currency unit
	ChangeSell int64    // Change in smallest currency unit
	Currency   string   // "VND" or "USD"
	UpdateTime time.Time
}

// goldPriceService implements GoldPriceService
type goldPriceService struct {
	client *gold.Client
	cache  *cache.GoldPriceCache
}

// NewGoldPriceService creates a new gold price service
func NewGoldPriceService(redisClient *redis.Client) GoldPriceService {
	return &goldPriceService{
		client: gold.NewClient(10 * time.Second),
		cache:  cache.NewGoldPriceCache(redisClient),
	}
}

// FetchPriceForSymbol fetches price for a specific gold symbol
func (s *goldPriceService) FetchPriceForSymbol(ctx context.Context, symbol string) (*CachedGoldPrice, error) {
	// Try cache first
	cached, err := s.cache.Get(ctx, symbol)
	if err == nil && cached != nil {
		return &CachedGoldPrice{
			TypeCode:   cached.TypeCode,
			Name:       cached.Name,
			Buy:        cached.Buy,
			Sell:       cached.Sell,
			ChangeBuy:  cached.ChangeBuy,
			ChangeSell: cached.ChangeSell,
			Currency:   cached.Currency,
			UpdateTime: time.Unix(cached.UpdateTime, 0),
		}, nil
	}

	// Fetch from API
	apiPrice, err := s.client.FetchPriceByType(ctx, symbol)
	if err != nil {
		return nil, fmt.Errorf("fetch price from API: %w", err)
	}

	// Convert float64 to smallest currency unit
	// VND: No decimal places (multiply by 1)
	// USD: 2 decimal places (multiply by 100)
	var multiplier float64 = 1
	if apiPrice.Currency == "USD" {
		multiplier = 100
	}

	price := &CachedGoldPrice{
		TypeCode:   apiPrice.TypeCode,
		Name:       apiPrice.Name,
		Buy:        int64(apiPrice.Buy * multiplier),
		Sell:       int64(apiPrice.Sell * multiplier),
		ChangeBuy:  int64(apiPrice.ChangeBuy * multiplier),
		ChangeSell: int64(apiPrice.ChangeSell * multiplier),
		Currency:   apiPrice.Currency,
		UpdateTime: time.Now(),
	}

	// Cache the result (non-blocking)
	go func() {
		cachedPrice := &cache.CachedGoldPrice{
			TypeCode:   apiPrice.TypeCode,
			Name:       apiPrice.Name,
			Buy:        price.Buy,
			Sell:       price.Sell,
			ChangeBuy:  price.ChangeBuy,
			ChangeSell: price.ChangeSell,
			Currency:   apiPrice.Currency,
			UpdateTime: time.Now().Unix(),
		}
		if err := s.cache.Set(context.Background(), symbol, cachedPrice, cache.GoldPriceCacheTTL); err != nil {
			log.Printf("Warning: failed to cache gold price for %s: %v", symbol, err)
		}
	}()

	return price, nil
}

// FetchAllPrices fetches all gold prices
func (s *goldPriceService) FetchAllPrices(ctx context.Context) ([]*CachedGoldPrice, error) {
	// Fetch from API
	pricesMap, err := s.client.FetchPrices(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetch prices from API: %w", err)
	}

	prices := make([]*CachedGoldPrice, 0, len(pricesMap))
	for _, apiPrice := range pricesMap {
		// Convert float64 to smallest currency unit
		var multiplier float64 = 1
		if apiPrice.Currency == "USD" {
			multiplier = 100
		}

		price := &CachedGoldPrice{
			TypeCode:   apiPrice.TypeCode,
			Name:       apiPrice.Name,
			Buy:        int64(apiPrice.Buy * multiplier),
			Sell:       int64(apiPrice.Sell * multiplier),
			ChangeBuy:  int64(apiPrice.ChangeBuy * multiplier),
			ChangeSell: int64(apiPrice.ChangeSell * multiplier),
			Currency:   apiPrice.Currency,
			UpdateTime: time.Now(),
		}
		prices = append(prices, price)

		// Cache each price (non-blocking)
		go func(p *CachedGoldPrice) {
			cachedPrice := &cache.CachedGoldPrice{
				TypeCode:   p.TypeCode,
				Name:       p.Name,
				Buy:        p.Buy,
				Sell:       p.Sell,
				ChangeBuy:  p.ChangeBuy,
				ChangeSell:  p.ChangeSell,
				Currency:   p.Currency,
				UpdateTime: time.Now().Unix(),
			}
			if err := s.cache.Set(context.Background(), p.TypeCode, cachedPrice, cache.GoldPriceCacheTTL); err != nil {
				log.Printf("Warning: failed to cache gold price for %s: %v", p.TypeCode, err)
			}
		}(price)
	}

	return prices, nil
}
