package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

const (
	// FXRateKeyPrefix is the prefix for FX rate cache keys
	FXRateKeyPrefix = "fx_rate"
	// FXRateCacheTTL is the time-to-live for FX rate cache entries
	FXRateCacheTTL = 1 * time.Hour
)

// FXRateCache handles caching of FX rates in Redis
type FXRateCache struct {
	client *redis.Client
}

// NewFXRateCache creates a new FX rate cache
func NewFXRateCache(client *redis.Client) *FXRateCache {
	return &FXRateCache{
		client: client,
	}
}

// Get retrieves a cached FX rate for a currency pair
func (c *FXRateCache) Get(ctx context.Context, fromCurrency, toCurrency string) (float64, error) {
	key := c.buildKey(fromCurrency, toCurrency)
	val, err := c.client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			// Cache miss
			return 0, nil
		}
		return 0, fmt.Errorf("failed to get FX rate from cache: %w", err)
	}

	// Parse the float value
	var rate float64
	_, err = fmt.Sscanf(val, "%f", &rate)
	if err != nil {
		return 0, fmt.Errorf("failed to parse cached FX rate: %w", err)
	}

	return rate, nil
}

// Set stores an FX rate in the cache
func (c *FXRateCache) Set(ctx context.Context, fromCurrency, toCurrency string, rate float64) error {
	key := c.buildKey(fromCurrency, toCurrency)
	value := fmt.Sprintf("%f", rate)
	return c.client.Set(ctx, key, value, FXRateCacheTTL).Err()
}

// Delete removes an FX rate from the cache
func (c *FXRateCache) Delete(ctx context.Context, fromCurrency, toCurrency string) error {
	key := c.buildKey(fromCurrency, toCurrency)
	return c.client.Del(ctx, key).Err()
}

// ClearAll removes all FX rate entries from the cache
func (c *FXRateCache) ClearAll(ctx context.Context) error {
	pattern := fmt.Sprintf("%s:*", FXRateKeyPrefix)
	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := c.client.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("failed to delete key %s: %w", iter.Val(), err)
		}
	}
	return iter.Err()
}

// buildKey builds a cache key for a currency pair
func (c *FXRateCache) buildKey(fromCurrency, toCurrency string) string {
	return fmt.Sprintf("%s:%s:%s", FXRateKeyPrefix, fromCurrency, toCurrency)
}
