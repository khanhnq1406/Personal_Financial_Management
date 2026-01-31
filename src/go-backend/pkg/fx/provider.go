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

// Service defines the interface for foreign exchange rate business logic.
// This interface is defined here to avoid circular dependencies with domain/service.
type Service interface {
	// GetRate retrieves the latest FX rate for a currency pair.
	// Returns the rate (how much of to_currency equals 1 unit of from_currency).
	GetRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error)

	// ConvertAmount converts an amount from one currency to another.
	ConvertAmount(ctx context.Context, amount int64, fromCurrency, toCurrency string) (int64, error)

	// ConvertAmountWithRate converts an amount using a provided FX rate (avoids fetching the rate).
	ConvertAmountWithRate(ctx context.Context, amount int64, rate float64, fromCurrency, toCurrency string) (int64, error)

	// BatchGetRates retrieves multiple FX rates in parallel for efficiency.
	BatchGetRates(ctx context.Context, pairs []CurrencyPair) (map[CurrencyPair]float64, error)

	// UpdateRate fetches and stores the latest FX rate for a currency pair.
	UpdateRate(ctx context.Context, fromCurrency, toCurrency string) error

	// IsSupportedCurrency checks if a currency code is supported.
	IsSupportedCurrency(currency string) bool

	// GetSupportedCurrencies returns the list of supported currency codes.
	GetSupportedCurrencies() []string
}

// CurrencyPair represents a from-to currency pair for FX rate lookups.
type CurrencyPair struct {
	From string
	To   string
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
