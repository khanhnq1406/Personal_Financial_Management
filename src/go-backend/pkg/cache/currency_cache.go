package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

const (
	// CurrencyCacheKeyPrefix is the prefix for currency conversion cache keys
	CurrencyCacheKeyPrefix = "currency"
	// CurrencyCacheTTL is the time-to-live for currency conversion cache entries
	CurrencyCacheTTL = 24 * time.Hour
)

// CurrencyCache handles caching of converted monetary values
type CurrencyCache struct {
	client *redis.Client
}

// NewCurrencyCache creates a new currency cache
func NewCurrencyCache(client *redis.Client) *CurrencyCache {
	return &CurrencyCache{
		client: client,
	}
}

// SetConvertedValue stores a converted value in the cache
// Key format: "currency:{userID}:entity:{type}:{id}:{currency}"
func (c *CurrencyCache) SetConvertedValue(ctx context.Context, userID int32, entityType string, entityID int32, currency string, value int64) error {
	key := c.buildKey(userID, entityType, entityID, currency)
	return c.client.Set(ctx, key, value, CurrencyCacheTTL).Err()
}

// GetConvertedValue retrieves a converted value from the cache
func (c *CurrencyCache) GetConvertedValue(ctx context.Context, userID int32, entityType string, entityID int32, currency string) (int64, error) {
	key := c.buildKey(userID, entityType, entityID, currency)
	val, err := c.client.Get(ctx, key).Int64()
	if err != nil {
		if err == redis.Nil {
			// Cache miss
			return 0, nil
		}
		return 0, fmt.Errorf("failed to get converted value from cache: %w", err)
	}
	return val, nil
}

// DeleteUserCache removes all cached values for a user
func (c *CurrencyCache) DeleteUserCache(ctx context.Context, userID int32) error {
	pattern := c.buildUserPattern(userID)
	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := c.client.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("failed to delete key %s: %w", iter.Val(), err)
		}
	}
	return iter.Err()
}

// DeleteEntityCache removes a specific entity from the cache
func (c *CurrencyCache) DeleteEntityCache(ctx context.Context, userID int32, entityType string, entityID int32) error {
	pattern := c.buildEntityPattern(userID, entityType, entityID)
	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := c.client.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("failed to delete key %s: %w", iter.Val(), err)
		}
	}
	return iter.Err()
}

// buildKey builds a cache key for a converted value
func (c *CurrencyCache) buildKey(userID int32, entityType string, entityID int32, currency string) string {
	return fmt.Sprintf("%s:%d:entity:%s:%d:%s", CurrencyCacheKeyPrefix, userID, entityType, entityID, currency)
}

// buildUserPattern builds a pattern to match all cache keys for a user
func (c *CurrencyCache) buildUserPattern(userID int32) string {
	return fmt.Sprintf("%s:%d:*", CurrencyCacheKeyPrefix, userID)
}

// buildEntityPattern builds a pattern to match all cache keys for an entity
func (c *CurrencyCache) buildEntityPattern(userID int32, entityType string, entityID int32) string {
	return fmt.Sprintf("%s:%d:entity:%s:%d:*", CurrencyCacheKeyPrefix, userID, entityType, entityID)
}
