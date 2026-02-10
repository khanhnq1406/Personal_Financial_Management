package database

import (
	"context"
	"fmt"
	"log"
	"time"
)

// pingWithRetry executes a ping function with exponential backoff retry logic.
// It will retry up to maxRetries times with exponential backoff starting at initialBackoff.
// The backoff doubles between retries: initialBackoff, 2*initialBackoff, 4*initialBackoff, etc.
// If the context is cancelled, retry stops immediately.
// Returns nil on success, error after all retries are exhausted or context is cancelled.
func pingWithRetry(ctx context.Context, pingFunc func() error, maxRetries int, initialBackoff time.Duration) error {
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		// Try the ping function
		err := pingFunc()
		if err == nil {
			// Success - no retry needed
			if attempt > 0 {
				log.Printf("Database ping succeeded on attempt %d after %d retries", attempt+1, attempt)
			}
			return nil
		}

		lastErr = err

		// If this was the last attempt, don't wait
		if attempt == maxRetries {
			break
		}

		// Calculate backoff time with exponential increase
		backoff := initialBackoff * time.Duration(1<<uint(attempt))

		log.Printf("Database ping attempt %d failed: %v. Retrying in %v...", attempt+1, err, backoff)

		// Wait with context cancellation support
		select {
		case <-ctx.Done():
			return fmt.Errorf("database ping cancelled: %w", ctx.Err())
		case <-time.After(backoff):
			// Continue to next attempt
		}
	}

	return fmt.Errorf("database ping failed after %d attempts: %w", maxRetries+1, lastErr)
}
