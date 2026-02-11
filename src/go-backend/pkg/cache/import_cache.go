package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"wealthjourney/pkg/parser"
)

const (
	// ImportParsedKeyPrefix is the prefix for cached parsed file data
	ImportParsedKeyPrefix = "import:parsed"
	// ImportParsedCacheTTL is the time-to-live for parsed data (1 hour)
	ImportParsedCacheTTL = 1 * time.Hour
)

// ImportCache handles caching of parsed import file data in Redis
type ImportCache struct {
	client *redis.Client
}

// NewImportCache creates a new import cache
func NewImportCache(client *redis.Client) *ImportCache {
	return &ImportCache{
		client: client,
	}
}

// buildParsedKey builds the cache key for parsed file data
func (c *ImportCache) buildParsedKey(fileID string) string {
	return fmt.Sprintf("%s:%s", ImportParsedKeyPrefix, fileID)
}

// CacheParsedData caches parsed file data for 1 hour to avoid re-parsing
func (c *ImportCache) CacheParsedData(ctx context.Context, fileID string, data []*parser.ParsedRow) error {
	key := c.buildParsedKey(fileID)
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal parsed data: %w", err)
	}

	return c.client.Set(ctx, key, jsonData, ImportParsedCacheTTL).Err()
}

// GetParsedData retrieves cached parsed data
// Returns nil if cache miss (not an error)
func (c *ImportCache) GetParsedData(ctx context.Context, fileID string) ([]*parser.ParsedRow, error) {
	key := c.buildParsedKey(fileID)
	jsonData, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			// Cache miss - not an error, just return nil
			return nil, nil
		}
		return nil, fmt.Errorf("get parsed data from cache: %w", err)
	}

	var data []*parser.ParsedRow
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return nil, fmt.Errorf("unmarshal parsed data: %w", err)
	}

	return data, nil
}

// DeleteParsedData removes cached parsed data (e.g., after successful import)
func (c *ImportCache) DeleteParsedData(ctx context.Context, fileID string) error {
	key := c.buildParsedKey(fileID)
	return c.client.Del(ctx, key).Err()
}
