package yahoo

import (
	"context"
	"sync"
	"time"
)

// Throttler manages rate limiting for API calls to prevent exceeding request limits.
// It uses a sliding window approach to ensure a minimum time interval between requests.
type Throttler struct {
	mu           sync.Mutex
	lastCallTime time.Time     // Timestamp of the last allowed request
	minInterval  time.Duration // Minimum duration that must elapse between requests
}

// NewThrottler creates a new Throttler that limits requests to the specified rate.
//
// Parameters:
//   - requestsPerMinute: Maximum number of requests allowed per minute
//
// Returns:
//   - A configured Throttler instance
//
// Example:
//
//	throttler := NewThrottler(120) // 120 requests per minute = 1 request every 500ms
func NewThrottler(requestsPerMinute int) *Throttler {
	// Calculate the minimum interval between requests
	// 120 requests/minute = 1 request every 500ms
	// 60 requests/minute = 1 request every 1000ms
	interval := time.Minute / time.Duration(requestsPerMinute)

	return &Throttler{
		minInterval: interval,
		// lastCallTime is zero value, meaning first call will not be throttled
	}
}

// Wait blocks until it's safe to make the next request, respecting the rate limit.
// This method is thread-safe and can be called concurrently from multiple goroutines.
//
// The method calculates the time elapsed since the last request and waits if
// necessary to maintain the minimum interval between requests.
//
// Parameters:
//   - ctx: Context for cancellation and timeout control
//
// Returns:
//   - error: Context error if the context is cancelled during the wait
//
// Example:
//
//	ctx := context.Background()
//	if err := throttler.Wait(ctx); err != nil {
//	    return err // Context was cancelled
//	}
//	// Safe to make API call now
func (t *Throttler) Wait(ctx context.Context) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(t.lastCallTime)

	// If enough time has passed since the last call, no need to wait
	if elapsed >= t.minInterval {
		t.lastCallTime = now
		return nil
	}

	// Calculate how long to wait before the next request can be made
	waitTime := t.minInterval - elapsed

	// Wait for the required interval, respecting context cancellation
	select {
	case <-ctx.Done():
		// Context was cancelled or timed out
		return ctx.Err()
	case <-time.After(waitTime):
		// Wait completed successfully
		t.lastCallTime = time.Now()
		return nil
	}
}

// globalThrottler is the shared throttler instance for Yahoo Finance API calls.
// Limited to 120 requests per minute (approximately 1 request every 500ms).
//
// This rate limit is based on Yahoo Finance's public API usage guidelines.
// Using a single global instance ensures all API calls respect the limit collectively.
var globalThrottler = NewThrottler(120)

// GetGlobalThrottler returns the global throttler instance for Yahoo Finance API calls.
//
// This shared throttler ensures that all components making Yahoo Finance API requests
// collectively respect the rate limit of 120 requests per minute.
//
// Returns:
//   - *Throttler: The global throttler instance
//
// Example:
//
//	throttler := yahoo.GetGlobalThrottler()
//	if err := throttler.Wait(ctx); err != nil {
//	    return err
//	}
//	// Make API call
func GetGlobalThrottler() *Throttler {
	return globalThrottler
}
