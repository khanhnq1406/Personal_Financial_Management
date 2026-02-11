package fx

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	"wealthjourney/pkg/config"
	apperrors "wealthjourney/pkg/errors"
)

// ExchangeService handles exchange rate operations with caching
type ExchangeService struct {
	client             *Client
	repo               repository.ExchangeRateRepository
	redisClient        *redis.Client
	cfg                config.FX
	historicalCacheTTL time.Duration
	latestCacheTTL     time.Duration
}

// NewExchangeService creates a new FX exchange service
func NewExchangeService(
	cfg config.FX,
	repo repository.ExchangeRateRepository,
	redisClient *redis.Client,
) *ExchangeService {
	client := NewClient(cfg.APIBaseURL, cfg.Timeout, cfg.MaxRetries)

	return &ExchangeService{
		client:             client,
		repo:               repo,
		redisClient:        redisClient,
		cfg:                cfg,
		historicalCacheTTL: cfg.HistoricalCacheTTL,
		latestCacheTTL:     cfg.LatestCacheTTL,
	}
}

// GetHistoricalRate retrieves the exchange rate for a specific date
// It checks cache -> database -> API (with fallback to latest if configured)
func (s *ExchangeService) GetHistoricalRate(ctx context.Context, fromCurrency, toCurrency string, date time.Time) (float64, error) {
	if !s.cfg.Enabled {
		return 0, apperrors.NewValidationError("exchange rate service is disabled")
	}

	// Normalize date to midnight UTC
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	// Check Redis cache first
	cacheKey := fmt.Sprintf("fx:rate:%s:%s:%s", fromCurrency, toCurrency, normalizedDate.Format("2006-01-02"))
	if s.redisClient != nil {
		cachedRate, err := s.redisClient.Get(ctx, cacheKey).Float64()
		if err == nil {
			return cachedRate, nil
		}
	}

	// Check database
	dbRate, err := s.repo.GetRate(ctx, fromCurrency, toCurrency, normalizedDate)
	if err == nil {
		// Cache it for future use
		if s.redisClient != nil {
			_ = s.redisClient.Set(ctx, cacheKey, dbRate.Rate, s.historicalCacheTTL).Err()
		}
		return dbRate.Rate, nil
	}

	// Fetch from API (exchangerate-api.com doesn't support historical dates directly)
	// So we fall back to latest rate if configured
	if s.cfg.FallbackToLatest {
		return s.GetLatestRate(ctx, fromCurrency, toCurrency)
	}

	return 0, apperrors.NewNotFoundError(fmt.Sprintf("exchange rate for %s/%s on %s", fromCurrency, toCurrency, normalizedDate.Format("2006-01-02")))
}

// GetLatestRate retrieves the current exchange rate
func (s *ExchangeService) GetLatestRate(ctx context.Context, fromCurrency, toCurrency string) (float64, error) {
	if !s.cfg.Enabled {
		return 0, apperrors.NewValidationError("exchange rate service is disabled")
	}

	// Same currency, return 1.0
	if fromCurrency == toCurrency {
		return 1.0, nil
	}

	// Check Redis cache first
	cacheKey := fmt.Sprintf("fx:latest:%s:%s", fromCurrency, toCurrency)
	if s.redisClient != nil {
		cachedRate, err := s.redisClient.Get(ctx, cacheKey).Float64()
		if err == nil {
			return cachedRate, nil
		}
	}

	// Check database for recent rate (within last 24 hours)
	latestRate, err := s.repo.GetLatestRate(ctx, fromCurrency, toCurrency)
	if err == nil && time.Since(latestRate.RateDate) < 24*time.Hour {
		// Cache it
		if s.redisClient != nil {
			_ = s.redisClient.Set(ctx, cacheKey, latestRate.Rate, s.latestCacheTTL).Err()
		}
		return latestRate.Rate, nil
	}

	// Fetch from API
	apiResp, err := s.client.GetLatestRates(ctx, fromCurrency)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch exchange rates: %w", err)
	}

	// Extract the target currency rate
	rate, ok := apiResp.Rates[toCurrency]
	if !ok {
		return 0, apperrors.NewValidationError(fmt.Sprintf("currency %s not found in API response", toCurrency))
	}

	// Save to database
	now := time.Now()
	exchangeRate := &models.ExchangeRate{
		FromCurrency: fromCurrency,
		ToCurrency:   toCurrency,
		Rate:         rate,
		RateDate:     now,
		Source:       "exchangerate-api.com",
		FetchedAt:    now,
	}
	_ = s.repo.SaveRate(ctx, exchangeRate)

	// Cache it
	if s.redisClient != nil {
		_ = s.redisClient.Set(ctx, cacheKey, rate, s.latestCacheTTL).Err()
	}

	return rate, nil
}

// Convert converts an amount from one currency to another
func (s *ExchangeService) Convert(ctx context.Context, amount int64, fromCurrency, toCurrency string, date time.Time) (int64, float64, error) {
	if fromCurrency == toCurrency {
		return amount, 1.0, nil
	}

	// Get exchange rate
	rate, err := s.GetHistoricalRate(ctx, fromCurrency, toCurrency, date)
	if err != nil {
		return 0, 0, err
	}

	// Convert amount (maintaining precision by using int64 throughout)
	// amount is in smallest unit (e.g., cents)
	convertedAmount := int64(float64(amount) * rate)

	return convertedAmount, rate, nil
}
