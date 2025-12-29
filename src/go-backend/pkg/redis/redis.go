package redis

import (
	"context"
	"fmt"
	"log"
	"wealthjourney/pkg/config"
	"time"

	"github.com/go-redis/redis/v8"
)

type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

const (
	whitelistPrefix = "whitelist"
	defaultExpiry   = 7 * 24 * time.Hour // 7 days
)

// New creates a new Redis client
func New(cfg *config.Config) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.URL,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Redis connected successfully")

	return &RedisClient{
		client: client,
		ctx:    ctx,
	}, nil
}

// Get retrieves a value from Redis
func (r *RedisClient) Get(prefix, key string) (string, error) {
	return r.client.Get(r.ctx, fmt.Sprintf("%s:%s", prefix, key)).Result()
}

// Set stores a value in Redis
func (r *RedisClient) Set(prefix, key, value string) error {
	return r.client.Set(r.ctx, fmt.Sprintf("%s:%s", prefix, key), value, 0).Err()
}

// SetWithExpiry stores a value in Redis with expiration
func (r *RedisClient) SetWithExpiry(prefix, key, value string, expiry time.Duration) error {
	return r.client.Set(r.ctx, fmt.Sprintf("%s:%s", prefix, key), value, expiry).Err()
}

// Delete removes a value from Redis
func (r *RedisClient) Delete(prefix, key string) error {
	return r.client.Del(r.ctx, fmt.Sprintf("%s:%s", prefix, key)).Err()
}

// AddToWhitelist adds a token to the whitelist
func (r *RedisClient) AddToWhitelist(email, token string) error {
	return r.SetWithExpiry(whitelistPrefix, email, token, defaultExpiry)
}

// GetFromWhitelist retrieves a token from the whitelist
func (r *RedisClient) GetFromWhitelist(email string) (string, error) {
	return r.Get(whitelistPrefix, email)
}

// RemoveFromWhitelist removes a token from the whitelist
func (r *RedisClient) RemoveFromWhitelist(email string) error {
	return r.Delete(whitelistPrefix, email)
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}
