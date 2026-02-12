package repository

import (
	"context"
	"time"

	"wealthjourney/domain/models"
)

// ExchangeRateRepository defines the interface for exchange rate data access
type ExchangeRateRepository interface {
	// GetRate retrieves an exchange rate for a specific date
	GetRate(ctx context.Context, fromCurrency, toCurrency string, date time.Time) (*models.ExchangeRate, error)

	// SaveRate saves a new exchange rate
	SaveRate(ctx context.Context, rate *models.ExchangeRate) error

	// ListRates retrieves exchange rates within a date range
	ListRates(ctx context.Context, fromCurrency, toCurrency string, startDate, endDate time.Time) ([]*models.ExchangeRate, error)

	// GetLatestRate retrieves the most recent exchange rate
	GetLatestRate(ctx context.Context, fromCurrency, toCurrency string) (*models.ExchangeRate, error)
}
