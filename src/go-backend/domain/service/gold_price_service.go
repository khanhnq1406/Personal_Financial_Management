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
	Buy        int64
	Sell       int64
	ChangeBuy  int64
	ChangeSell int64
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
			Buy:        cached.Buy,
			Sell:       cached.Sell,
			ChangeBuy:  cached.ChangeBuy,
			ChangeSell: cached.ChangeSell,
			UpdateTime: time.Unix(cached.UpdateTime, 0),
		}, nil
	}

	// Fetch from API
	apiPrice, err := s.client.FetchPriceByType(ctx, symbol)
	if err != nil {
		return nil, fmt.Errorf("fetch price from API: %w", err)
	}

	price := &CachedGoldPrice{
		TypeCode:   apiPrice.TypeCode,
		Buy:        apiPrice.Buy,
		Sell:       apiPrice.Sell,
		ChangeBuy:  apiPrice.ChangeBuy,
		ChangeSell: apiPrice.ChangeSell,
		UpdateTime: time.Unix(apiPrice.UpdateTime, 0),
	}

	// Cache the result (non-blocking)
	go func() {
		cachedPrice := &cache.CachedGoldPrice{
			TypeCode:   apiPrice.TypeCode,
			Buy:        apiPrice.Buy,
			Sell:       apiPrice.Sell,
			ChangeBuy:  apiPrice.ChangeBuy,
			ChangeSell: apiPrice.ChangeSell,
			UpdateTime: apiPrice.UpdateTime,
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
	response, err := s.client.FetchPrices(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetch prices from API: %w", err)
	}

	prices := make([]*CachedGoldPrice, 0, len(response.Data))
	for _, apiPrice := range response.Data {
		price := &CachedGoldPrice{
			TypeCode:   apiPrice.TypeCode,
			Buy:        apiPrice.Buy,
			Sell:       apiPrice.Sell,
			ChangeBuy:  apiPrice.ChangeBuy,
			ChangeSell: apiPrice.ChangeSell,
			UpdateTime: time.Unix(apiPrice.UpdateTime, 0),
		}
		prices = append(prices, price)

		// Cache each price (non-blocking)
		go func(p *CachedGoldPrice) {
			cachedPrice := &cache.CachedGoldPrice{
				TypeCode:   p.TypeCode,
				Buy:        p.Buy,
				Sell:       p.Sell,
				ChangeBuy:  p.ChangeBuy,
				ChangeSell: p.ChangeSell,
				UpdateTime: p.UpdateTime.Unix(),
			}
			if err := s.cache.Set(context.Background(), p.TypeCode, cachedPrice, cache.GoldPriceCacheTTL); err != nil {
				log.Printf("Warning: failed to cache gold price for %s: %v", p.TypeCode, err)
			}
		}(price)
	}

	return prices, nil
}
