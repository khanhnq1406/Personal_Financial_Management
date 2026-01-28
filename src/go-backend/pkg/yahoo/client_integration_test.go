//go:build integration
// +build integration

package yahoo

import (
	"context"
	"testing"
	"time"
)

// TestGetQuoteValidSymbol tests fetching a quote for a valid symbol (requires network)
func TestGetQuoteValidSymbol(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	tests := []struct {
		name    string
		symbol  string
		wantUSD bool
	}{
		{
			name:    "Apple Inc. (AAPL)",
			symbol:  "AAPL",
			wantUSD: true,
		},
		{
			name:    "Microsoft Corporation (MSFT)",
			symbol:  "MSFT",
			wantUSD: true,
		},
		{
			name:    "Alphabet Inc. (GOOGL)",
			symbol:  "GOOGL",
			wantUSD: true,
		},
		{
			name:    "Tesla Inc. (TSLA)",
			symbol:  "TSLA",
			wantUSD: true,
		},
		{
			name:    "Bitcoin (BTC-USD)",
			symbol:  "BTC-USD",
			wantUSD: true,
		},
		{
			name:    "Ethereum (ETH-USD)",
			symbol:  "ETH-USD",
			wantUSD: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create client with timeout
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			client := NewClient(tt.symbol)

			// Get quote
			quote, err := client.GetQuote(ctx)
			if err != nil {
				t.Fatalf("GetQuote() failed for symbol %s: %v", tt.symbol, err)
			}

			// Verify all fields are populated
			if quote.Symbol == "" {
				t.Error("GetQuote() returned empty Symbol")
			}
			if quote.Symbol != tt.symbol {
				t.Errorf("GetQuote() Symbol = %s, want %s", quote.Symbol, tt.symbol)
			}

			if quote.Price <= 0 {
				t.Errorf("GetQuote() Price = %d, want > 0", quote.Price)
			}

			if quote.Volume24h < 0 {
				t.Errorf("GetQuote() Volume24h = %d, want >= 0", quote.Volume24h)
			}

			if quote.Currency == "" {
				t.Error("GetQuote() returned empty Currency")
			}
			if tt.wantUSD && quote.Currency != "USD" {
				t.Errorf("GetQuote() Currency = %s, want USD", quote.Currency)
			}

			if quote.PreviousClose <= 0 {
				t.Errorf("GetQuote() PreviousClose = %d, want > 0", quote.PreviousClose)
			}

			// Verify price conversion is correct (should be in cents)
			// Price should be a reasonable value for the symbol
			if quote.Price < 1 { // At least 1 cent
				t.Errorf("GetQuote() Price = %d, seems too low (in cents)", quote.Price)
			}

			// Change percentage can be negative or positive, but should be reasonable
			// A change of more than 50% in a day is unusual for most stocks
			if quote.Change24h < -50 || quote.Change24h > 50 {
				t.Logf("Warning: Unusual 24h change percentage: %.2f%% for %s", quote.Change24h, tt.symbol)
			}

			// Log the quote data for manual inspection
			t.Logf("Quote for %s: Price=$%d.%02d, Change=%.2f%%, Volume=%d, Currency=%s, PrevClose=$%d.%02d",
				quote.Symbol,
				quote.Price/100, quote.Price%100,
				quote.Change24h,
				quote.Volume24h,
				quote.Currency,
				quote.PreviousClose/100, quote.PreviousClose%100,
			)
		})
	}
}

// TestGetQuoteInvalidSymbol tests error handling for invalid symbols (requires network)
func TestGetQuoteInvalidSymbol(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	tests := []struct {
		name        string
		symbol      string
		expectedErr error
	}{
		{
			name:        "Invalid ticker with numbers",
			symbol:      "INVALIDTICKER123",
			expectedErr: ErrSymbolNotFound,
		},
		{
			name:        "Non-existent symbol",
			symbol:      "FAKESYMBOLXYZ",
			expectedErr: ErrSymbolNotFound,
		},
		{
			name:        "Empty string",
			symbol:      "",
			expectedErr: ErrSymbolNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create client with timeout
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			client := NewClient(tt.symbol)

			// Get quote should fail
			quote, err := client.GetQuote(ctx)

			// Verify error
			if err == nil {
				t.Errorf("GetQuote() expected error for invalid symbol %s, but got nil", tt.symbol)
				t.Logf("Unexpectedly got quote: %+v", quote)
			}
		})
	}
}

// TestGetQuoteTimeout tests timeout handling (requires network)
func TestGetQuoteTimeout(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Create a context with a very short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Nanosecond)
	defer cancel()

	// Give the context time to expire
	time.Sleep(10 * time.Millisecond)

	client := NewClient("AAPL")

	// GetQuote should fail due to timeout
	_, err := client.GetQuote(ctx)
	if err == nil {
		t.Error("GetQuote() expected error due to timeout, but got nil")
	}
}

// TestGetQuoteCancellation tests context cancellation handling (requires network)
func TestGetQuoteCancellation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Create a context that can be cancelled
	ctx, cancel := context.WithCancel(context.Background())

	// Cancel immediately
	cancel()

	client := NewClient("AAPL")

	// GetQuote should fail due to cancellation
	_, err := client.GetQuote(ctx)
	if err == nil {
		t.Error("GetQuote() expected error due to cancellation, but got nil")
	}
}

// TestThrottlerIntegration tests that the global throttler works with real API calls (requires network)
func TestThrottlerIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Make multiple rapid requests to verify throttling works
	symbols := []string{"AAPL", "MSFT", "GOOGL"}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	start := time.Now()
	for _, symbol := range symbols {
		client := NewClient(symbol)
		_, err := client.GetQuote(ctx)
		if err != nil {
			t.Logf("Warning: GetQuote() failed for %s: %v (may be rate limiting)", symbol, err)
		}
	}
	elapsed := time.Since(start)

	t.Logf("Fetched %d quotes in %v (avg: %v per quote)", len(symbols), elapsed, elapsed/time.Duration(len(symbols)))

	// With 3 requests and 120 req/min limit, this should complete quickly
	// but we're just verifying it doesn't hang
	if elapsed > 30*time.Second {
		t.Errorf("Fetching quotes took too long: %v", elapsed)
	}
}

// TestCurrencyValidation tests that different currency symbols are returned correctly (requires network)
func TestCurrencyValidation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	tests := []struct {
		name             string
		symbol           string
		expectedCurrency string
	}{
		{
			name:             "US Stock (AAPL)",
			symbol:           "AAPL",
			expectedCurrency: "USD",
		},
		{
			name:             "Bitcoin (BTC-USD)",
			symbol:           "BTC-USD",
			expectedCurrency: "USD",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			client := NewClient(tt.symbol)

			quote, err := client.GetQuote(ctx)
			if err != nil {
				t.Fatalf("GetQuote() failed: %v", err)
			}

			if quote.Currency != tt.expectedCurrency {
				t.Errorf("GetQuote() Currency = %s, want %s", quote.Currency, tt.expectedCurrency)
			}
		})
	}
}

// TestDataConversionsIntegration tests that data conversions are correct with real data (requires network)
func TestDataConversionsIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client := NewClient("AAPL")

	quote, err := client.GetQuote(ctx)
	if err != nil {
		t.Fatalf("GetQuote() failed: %v", err)
	}

	// Verify price is in cents (int64)
	// AAPL price is typically between $100 and $200, so in cents should be 10000-20000
	if quote.Price < 5000 || quote.Price > 50000 {
		t.Errorf("Price %d (in cents) seems outside reasonable range for AAPL", quote.Price)
	}

	// Verify volume is int64 and positive
	if quote.Volume24h <= 0 {
		t.Errorf("Volume24h = %d, want > 0", quote.Volume24h)
	}

	// Verify change percentage is float64
	if quote.Change24h < -100 || quote.Change24h > 100 {
		// More than 100% change in a day is very unusual
		t.Logf("Warning: Unusual 24h change: %.2f%%", quote.Change24h)
	}

	// Verify previous close is in cents
	if quote.PreviousClose < 5000 || quote.PreviousClose > 50000 {
		t.Errorf("PreviousClose %d (in cents) seems outside reasonable range for AAPL", quote.PreviousClose)
	}

	// Verify the price change is calculated correctly
	// change24h = ((price - previousClose) / previousClose) * 100
	expectedChange := ((float64(quote.Price) - float64(quote.PreviousClose)) / float64(quote.PreviousClose)) * 100
	diff := quote.Change24h - expectedChange
	if diff > 0.01 || diff < -0.01 {
		t.Errorf("Change24h calculation mismatch: got %.2f%%, calculated %.2f%% (diff: %.2f%%)",
			quote.Change24h, expectedChange, diff)
	}

	t.Logf("Data conversion validation passed for AAPL:")
	t.Logf("  Price: $%d.%02d", quote.Price/100, quote.Price%100)
	t.Logf("  Previous Close: $%d.%02d", quote.PreviousClose/100, quote.PreviousClose%100)
	t.Logf("  Change: %.2f%%", quote.Change24h)
	t.Logf("  Volume: %d", quote.Volume24h)
	t.Logf("  Currency: %s", quote.Currency)
}

// TestConcurrentRequests tests that multiple concurrent requests work correctly (requires network)
func TestConcurrentRequests(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	symbols := []string{"AAPL", "MSFT", "GOOGL", "TSLA", "META"}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	results := make(chan struct {
		symbol string
		quote  *QuoteData
		err    error
	}, len(symbols))

	// Make concurrent requests
	for _, symbol := range symbols {
		go func(sym string) {
			client := NewClient(sym)
			quote, err := client.GetQuote(ctx)
			results <- struct {
				symbol string
				quote  *QuoteData
				err    error
			}{sym, quote, err}
		}(symbol)
	}

	// Collect results
	successCount := 0
	for i := 0; i < len(symbols); i++ {
		result := <-results
		if result.err != nil {
			t.Logf("Warning: Failed to fetch quote for %s: %v", result.symbol, result.err)
		} else {
			successCount++
			t.Logf("Successfully fetched quote for %s: $%d.%02d",
				result.symbol,
				result.quote.Price/100,
				result.quote.Price%100)
		}
	}

	if successCount == 0 {
		t.Error("All concurrent requests failed")
	}

	t.Logf("Concurrent requests: %d/%d succeeded", successCount, len(symbols))
}
