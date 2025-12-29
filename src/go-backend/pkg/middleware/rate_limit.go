package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiterConfig holds configuration for the rate limiter.
type RateLimiterConfig struct {
	RequestsPerMinute int
	CleanupInterval   time.Duration
}

// DefaultRateLimiterConfig returns the default rate limiter configuration.
func DefaultRateLimiterConfig() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerMinute: 60,
		CleanupInterval:   time.Minute,
	}
}

// tokenBucket represents a token bucket for rate limiting.
type tokenBucket struct {
	tokens     int
	lastRefill time.Time
	mu         sync.Mutex
}

// RateLimiter is a simple in-memory rate limiter using token bucket algorithm.
// For distributed systems, use a Redis-based implementation.
type RateLimiter struct {
	buckets map[string]*tokenBucket
	config  RateLimiterConfig
	mu      sync.RWMutex
}

// NewRateLimiter creates a new rate limiter.
func NewRateLimiter(config RateLimiterConfig) *RateLimiter {
	rl := &RateLimiter{
		buckets: make(map[string]*tokenBucket),
		config:  config,
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// allow checks if a request from the given key should be allowed.
func (rl *RateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, exists := rl.buckets[key]
	if !exists {
		bucket = &tokenBucket{
			tokens:     rl.config.RequestsPerMinute,
			lastRefill: time.Now(),
		}
		rl.buckets[key] = bucket
	}

	bucket.mu.Lock()
	defer bucket.mu.Unlock()

	// Refill tokens based on time elapsed
	elapsed := time.Since(bucket.lastRefill)
	tokensToAdd := int(elapsed.Minutes()) * rl.config.RequestsPerMinute
	if tokensToAdd > 0 {
		bucket.tokens = min(bucket.tokens+tokensToAdd, rl.config.RequestsPerMinute)
		bucket.lastRefill = time.Now()
	}

	// Check if we have tokens available
	if bucket.tokens > 0 {
		bucket.tokens--
		return true
	}

	return false
}

// cleanup removes stale buckets.
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.config.CleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		for key, bucket := range rl.buckets {
			bucket.mu.Lock()
			if time.Since(bucket.lastRefill) > rl.config.CleanupInterval*2 {
				delete(rl.buckets, key)
			}
			bucket.mu.Unlock()
		}
		rl.mu.Unlock()
	}
}

// RateLimit creates a rate limiting middleware.
// The key is extracted using the provided key function.
func RateLimit(rl *RateLimiter, keyFn func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := keyFn(c)
		if key == "" {
			c.Next()
			return
		}

		if !rl.allow(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"code":       "RATE_LIMIT_EXCEEDED",
					"message":    "Too many requests. Please try again later.",
					"statusCode": 429,
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitByIP creates a rate limiting middleware based on IP address.
func RateLimitByIP(rl *RateLimiter) gin.HandlerFunc {
	return RateLimit(rl, func(c *gin.Context) string {
		return c.ClientIP()
	})
}

// RateLimitByUser creates a rate limiting middleware based on user ID.
// Falls back to IP if user is not authenticated.
func RateLimitByUser(rl *RateLimiter) gin.HandlerFunc {
	return RateLimit(rl, func(c *gin.Context) string {
		if userID, exists := c.Get("user_id"); exists {
			return fmt.Sprintf("user:%v", userID)
		}
		return c.ClientIP()
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
