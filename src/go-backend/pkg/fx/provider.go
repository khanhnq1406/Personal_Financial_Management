package fx

import (
	"context"
	"fmt"
)

// Provider defines the interface for fetching FX rates from external sources
type Provider interface {
	// GetRate retrieves the current FX rate for a currency pair
	// Returns the rate (how much of toCurrency equals 1 unit of fromCurrency)
	GetRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error)
}

// ErrInvalidCurrencyPair is returned when the currency pair is invalid
type ErrInvalidCurrencyPair struct {
	From string
	To   string
}

func (e *ErrInvalidCurrencyPair) Error() string {
	return fmt.Sprintf("invalid currency pair: %s -> %s", e.From, e.To)
}

// ErrSameCurrency is returned when trying to convert between the same currency
type ErrSameCurrency struct {
	Currency string
}

func (e *ErrSameCurrency) Error() string {
	return fmt.Sprintf("cannot convert currency to itself: %s", e.Currency)
}
