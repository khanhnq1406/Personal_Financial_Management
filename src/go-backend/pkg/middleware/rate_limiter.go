package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ImportRateLimiter tracks import requests per user to prevent abuse.
type ImportRateLimiter struct {
	mu            sync.RWMutex
	requests      map[int32][]time.Time // userID -> timestamps
	maxRequests   int                   // Max requests per window
	window        time.Duration         // Time window
	cleanupTicker *time.Ticker
	done          chan struct{}
}

// NewImportRateLimiter creates a new rate limiter for imports.
// Default: 10 imports per hour per user.
func NewImportRateLimiter(maxRequests int, window time.Duration) *ImportRateLimiter {
	limiter := &ImportRateLimiter{
		requests:    make(map[int32][]time.Time),
		maxRequests: maxRequests,
		window:      window,
		done:        make(chan struct{}),
	}

	// Start cleanup goroutine (runs every hour)
	limiter.cleanupTicker = time.NewTicker(time.Hour)
	go limiter.cleanup()

	return limiter
}

// Allow checks if a user can make an import request.
func (rl *ImportRateLimiter) Allow(userID int32) (bool, string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	// Get user's request history
	timestamps, exists := rl.requests[userID]
	if !exists {
		// First request for this user
		rl.requests[userID] = []time.Time{now}
		return true, ""
	}

	// Filter out old requests outside the window
	var validRequests []time.Time
	for _, ts := range timestamps {
		if ts.After(cutoff) {
			validRequests = append(validRequests, ts)
		}
	}

	// Check if under limit
	if len(validRequests) >= rl.maxRequests {
		// Calculate when the oldest request will expire
		oldestRequest := validRequests[0]
		retryAfter := oldestRequest.Add(rl.window).Sub(now)
		retryAfterSeconds := int(retryAfter.Seconds())
		if retryAfterSeconds < 1 {
			retryAfterSeconds = 1
		}

		message := fmt.Sprintf("Rate limit exceeded. Maximum %d imports per %v. Try again in %d seconds.",
			rl.maxRequests, rl.window, retryAfterSeconds)
		return false, message
	}

	// Add current request
	validRequests = append(validRequests, now)
	rl.requests[userID] = validRequests

	return true, ""
}

// cleanup removes old entries to prevent memory leaks.
func (rl *ImportRateLimiter) cleanup() {
	for {
		select {
		case <-rl.cleanupTicker.C:
			rl.mu.Lock()
			now := time.Now()
			cutoff := now.Add(-rl.window)

			// Clean up entries with no recent requests
			for userID, timestamps := range rl.requests {
				var validRequests []time.Time
				for _, ts := range timestamps {
					if ts.After(cutoff) {
						validRequests = append(validRequests, ts)
					}
				}

				if len(validRequests) == 0 {
					delete(rl.requests, userID)
				} else {
					rl.requests[userID] = validRequests
				}
			}
			rl.mu.Unlock()

		case <-rl.done:
			rl.cleanupTicker.Stop()
			return
		}
	}
}

// Stop stops the cleanup goroutine.
func (rl *ImportRateLimiter) Stop() {
	close(rl.done)
}

// ImportRateLimitMiddleware creates a Gin middleware for rate limiting imports.
func ImportRateLimitMiddleware(limiter *ImportRateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract user ID from context (set by auth middleware)
		userIDInterface, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			c.Abort()
			return
		}

		userID, ok := userIDInterface.(int32)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Invalid user ID format",
			})
			c.Abort()
			return
		}

		// Check rate limit
		allowed, message := limiter.Allow(userID)
		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": message,
				"error": map[string]interface{}{
					"code":    "RATE_LIMIT_EXCEEDED",
					"details": "You have exceeded the import rate limit",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
