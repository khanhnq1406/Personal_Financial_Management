package fx

import (
	"context"
	"fmt"
	"strings"

	yahoofinance "github.com/oscarli916/yahoo-finance-api"
)

// YahooFinanceProvider implements Provider using Yahoo Finance API
type YahooFinanceProvider struct {
	throttler *Throttler
}

// NewYahooFinanceProvider creates a new Yahoo Finance FX provider
func NewYahooFinanceProvider() *YahooFinanceProvider {
	return &YahooFinanceProvider{
		throttler: GetGlobalThrottler(),
	}
}

// GetRate retrieves the current FX rate for a currency pair from Yahoo Finance
// Yahoo Finance uses currency pair format like "USDVND=X" for FX rates
func (p *YahooFinanceProvider) GetRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error) {
	// Validate inputs
	if fromCurrency == "" || toCurrency == "" {
		return 0, &ErrInvalidCurrencyPair{From: fromCurrency, To: toCurrency}
	}

	// Normalize currency codes (uppercase)
	fromCurrency = strings.ToUpper(strings.TrimSpace(fromCurrency))
	toCurrency = strings.ToUpper(strings.TrimSpace(toCurrency))

	// Same currency check
	if fromCurrency == toCurrency {
		return 1.0, &ErrSameCurrency{Currency: fromCurrency}
	}

	// Respect rate limit
	if err := p.throttler.Wait(ctx); err != nil {
		return 0, fmt.Errorf("rate limit wait failed: %w", err)
	}

	// Yahoo Finance uses format like "USDVND=X" for FX rates
	symbol := fmt.Sprintf("%s%s=X", fromCurrency, toCurrency)

	// Create ticker and get quote
	ticker := yahoofinance.NewTicker(symbol)
	if ticker == nil {
		return 0, fmt.Errorf("failed to create ticker for %s", symbol)
	}

	// Wrap in panic recovery
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Recovered from Yahoo Finance API panic for FX rate %s: %v\n", symbol, r)
		}
	}()

	// Get quote data
	quote, err := ticker.Quote()
	if err != nil {
		return 0, fmt.Errorf("failed to fetch FX rate for %s%s: %w", fromCurrency, toCurrency, err)
	}

	// Validate response
	if quote.Close == 0 {
		return 0, &ErrInvalidCurrencyPair{From: fromCurrency, To: toCurrency}
	}

	return quote.Close, nil
}
