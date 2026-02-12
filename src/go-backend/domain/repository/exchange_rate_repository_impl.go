package repository

import (
	"context"
	"time"

	"wealthjourney/domain/models"
	apperrors "wealthjourney/pkg/errors"

	"gorm.io/gorm"
)

type exchangeRateRepository struct {
	db *gorm.DB
}

// NewExchangeRateRepository creates a new ExchangeRateRepository
func NewExchangeRateRepository(db *gorm.DB) ExchangeRateRepository {
	return &exchangeRateRepository{db: db}
}

// GetRate retrieves an exchange rate for a specific date
func (r *exchangeRateRepository) GetRate(ctx context.Context, fromCurrency, toCurrency string, date time.Time) (*models.ExchangeRate, error) {
	var rate models.ExchangeRate

	// Normalize date to midnight UTC for consistent comparison
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)

	err := r.db.WithContext(ctx).
		Where("from_currency = ? AND to_currency = ? AND rate_date = ?", fromCurrency, toCurrency, normalizedDate).
		Order("fetched_at DESC").
		First(&rate).Error

	if err == gorm.ErrRecordNotFound {
		return nil, apperrors.NewNotFoundError("exchange rate")
	}
	if err != nil {
		return nil, err
	}

	return &rate, nil
}

// SaveRate saves a new exchange rate
func (r *exchangeRateRepository) SaveRate(ctx context.Context, rate *models.ExchangeRate) error {
	// Normalize date to midnight UTC
	rate.RateDate = time.Date(rate.RateDate.Year(), rate.RateDate.Month(), rate.RateDate.Day(), 0, 0, 0, 0, time.UTC)

	// Use FirstOrCreate to avoid duplicates for same date
	result := r.db.WithContext(ctx).
		Where("from_currency = ? AND to_currency = ? AND rate_date = ?", rate.FromCurrency, rate.ToCurrency, rate.RateDate).
		Assign(models.ExchangeRate{
			Rate:      rate.Rate,
			Source:    rate.Source,
			FetchedAt: rate.FetchedAt,
		}).
		FirstOrCreate(rate)

	return result.Error
}

// ListRates retrieves exchange rates within a date range
func (r *exchangeRateRepository) ListRates(ctx context.Context, fromCurrency, toCurrency string, startDate, endDate time.Time) ([]*models.ExchangeRate, error) {
	var rates []*models.ExchangeRate

	// Normalize dates to midnight UTC
	startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, time.UTC)
	endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 0, 0, 0, 0, time.UTC)

	err := r.db.WithContext(ctx).
		Where("from_currency = ? AND to_currency = ? AND rate_date BETWEEN ? AND ?", fromCurrency, toCurrency, startDate, endDate).
		Order("rate_date DESC").
		Find(&rates).Error

	if err != nil {
		return nil, err
	}

	return rates, nil
}

// GetLatestRate retrieves the most recent exchange rate
func (r *exchangeRateRepository) GetLatestRate(ctx context.Context, fromCurrency, toCurrency string) (*models.ExchangeRate, error) {
	var rate models.ExchangeRate

	err := r.db.WithContext(ctx).
		Where("from_currency = ? AND to_currency = ?", fromCurrency, toCurrency).
		Order("rate_date DESC, fetched_at DESC").
		First(&rate).Error

	if err == gorm.ErrRecordNotFound {
		return nil, apperrors.NewNotFoundError("exchange rate")
	}
	if err != nil {
		return nil, err
	}

	return &rate, nil
}
