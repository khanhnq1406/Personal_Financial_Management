package fx

import (
	"context"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// Throttler manages rate limiting for FX rate API requests
type Throttler struct {
	limiter  *rate.Limiter
	lastCall time.Time
	mu       sync.Mutex
}

// Global throttler instance (shared across all FX providers)
var (
	globalThrottler     *Throttler
	globalThrottlerOnce sync.Once
)

// GetGlobalThrottler returns the singleton global throttler
func GetGlobalThrottler() *Throttler {
	globalThrottlerOnce.Do(func() {
		globalThrottler = NewThrottler(120) // 120 requests per minute (same as Yahoo Finance)
	})
	return globalThrottler
}

// NewThrottler creates a new throttler with the given requests per minute limit
func NewThrottler(requestsPerMinute int) *Throttler {
	// Convert to rate per second
	// e.g., 120 requests/min = 2 requests/sec
	requestsPerSecond := float64(requestsPerMinute) / 60.0

	return &Throttler{
		limiter: rate.NewLimiter(rate.Limit(requestsPerSecond), 1), // Allow burst of 1
	}
}

// Wait blocks until a request is allowed under the rate limit
func (t *Throttler) Wait(ctx context.Context) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Wait for rate limiter
	if err := t.limiter.Wait(ctx); err != nil {
		return err
	}

	// Update last call time
	t.lastCall = time.Now()

	return nil
}

// GetLastCallTime returns the time of the last successful request
func (t *Throttler) GetLastCallTime() time.Time {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.lastCall
}
