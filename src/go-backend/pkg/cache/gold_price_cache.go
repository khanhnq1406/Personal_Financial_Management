package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

const (
	// GoldPriceKeyPrefix is the prefix for gold price cache keys
	GoldPriceKeyPrefix = "gold_price"
	// GoldPriceCacheTTL is the time-to-live for gold price cache entries
	GoldPriceCacheTTL = 15 * time.Minute
)

// GoldPriceCache handles caching of gold prices from vang.today in Redis
type GoldPriceCache struct {
	client *redis.Client
}

// NewGoldPriceCache creates a new gold price cache
func NewGoldPriceCache(client *redis.Client) *GoldPriceCache {
	return &GoldPriceCache{
		client: client,
	}
}

// CachedGoldPrice represents a cached gold price
type CachedGoldPrice struct {
	TypeCode   string `json:"type_code"`
	Buy        int64  `json:"buy"`
	Sell       int64  `json:"sell"`
	ChangeBuy  int64  `json:"change_buy"`
	ChangeSell int64  `json:"change_sell"`
	UpdateTime int64  `json:"update_time"`
}

// buildKey builds the cache key for a gold symbol
func (c *GoldPriceCache) buildKey(symbol string) string {
	return fmt.Sprintf("%s:%s", GoldPriceKeyPrefix, symbol)
}

// Set stores a gold price in cache
func (c *GoldPriceCache) Set(ctx context.Context, symbol string, price *CachedGoldPrice, ttl time.Duration) error {
	key := c.buildKey(symbol)
	data, err := json.Marshal(price)
	if err != nil {
		return fmt.Errorf("marshal gold price: %w", err)
	}

	return c.client.Set(ctx, key, data, ttl).Err()
}

// Get retrieves a cached gold price
func (c *GoldPriceCache) Get(ctx context.Context, symbol string) (*CachedGoldPrice, error) {
	key := c.buildKey(symbol)
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			// Cache miss
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get gold price from cache: %w", err)
	}

	var price CachedGoldPrice
	if err := json.Unmarshal(data, &price); err != nil {
		return nil, fmt.Errorf("unmarshal gold price: %w", err)
	}

	return &price, nil
}

// Delete removes a gold price from cache
func (c *GoldPriceCache) Delete(ctx context.Context, symbol string) error {
	key := c.buildKey(symbol)
	return c.client.Del(ctx, key).Err()
}
