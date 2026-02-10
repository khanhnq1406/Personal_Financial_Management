package database

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestPingWithRetry_Success(t *testing.T) {
	attempts := 0
	pingFunc := func() error {
		attempts++
		return nil
	}

	err := pingWithRetry(context.Background(), pingFunc, 3, 100*time.Millisecond)
	if err != nil {
		t.Errorf("Expected nil error, got: %v", err)
	}
	if attempts != 1 {
		t.Errorf("Expected 1 attempt, got: %d", attempts)
	}
}

func TestPingWithRetry_SuccessAfterRetries(t *testing.T) {
	attempts := 0
	pingFunc := func() error {
		attempts++
		if attempts < 3 {
			return errors.New("connection refused")
		}
		return nil
	}

	err := pingWithRetry(context.Background(), pingFunc, 3, 50*time.Millisecond)
	if err != nil {
		t.Errorf("Expected nil error after retries, got: %v", err)
	}
	if attempts != 3 {
		t.Errorf("Expected 3 attempts, got: %d", attempts)
	}
}

func TestPingWithRetry_MaxRetriesExceeded(t *testing.T) {
	attempts := 0
	pingFunc := func() error {
		attempts++
		return errors.New("connection refused")
	}

	err := pingWithRetry(context.Background(), pingFunc, 3, 10*time.Millisecond)
	if err == nil {
		t.Error("Expected error after max retries, got nil")
	}
	if attempts != 4 {
		t.Errorf("Expected 4 attempts (initial + 3 retries), got: %d", attempts)
	}
}

func TestPingWithRetry_ContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	attempts := 0
	pingFunc := func() error {
		attempts++
		if attempts == 2 {
			cancel()
		}
		return errors.New("connection refused")
	}

	err := pingWithRetry(ctx, pingFunc, 5, 50*time.Millisecond)
	if err == nil {
		t.Error("Expected context cancellation error, got nil")
	}
	if attempts > 3 {
		t.Errorf("Expected <= 3 attempts after cancellation, got: %d", attempts)
	}
}
