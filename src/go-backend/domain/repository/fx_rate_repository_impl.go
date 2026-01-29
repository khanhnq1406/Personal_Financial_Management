package repository

import (
	"context"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
	apperrors "wealthjourney/pkg/errors"
)

// fxRateRepository implements FXRateRepository using GORM.
type fxRateRepository struct {
	*BaseRepository
}

// NewFXRateRepository creates a new FXRateRepository.
func NewFXRateRepository(db *database.Database) FXRateRepository {
	return &fxRateRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// GetByPair retrieves the latest FX rate for a currency pair.
func (r *fxRateRepository) GetByPair(ctx context.Context, fromCurrency, toCurrency string) (*models.FXRate, error) {
	var rate models.FXRate
	result := r.db.DB.WithContext(ctx).
		Where("from_currency = ? AND to_currency = ?", fromCurrency, toCurrency).
		Order("timestamp DESC").
		First(&rate)

	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "fx rate", "get fx rate")
	}
	return &rate, nil
}

// Create creates a new FX rate entry.
func (r *fxRateRepository) Create(ctx context.Context, rate *models.FXRate) error {
	result := r.db.DB.WithContext(ctx).Create(rate)
	if result.Error != nil {
		return r.handleDBError(result.Error, "fx rate", "create fx rate")
	}
	return nil
}

// Update updates an FX rate entry.
func (r *fxRateRepository) Update(ctx context.Context, rate *models.FXRate) error {
	return r.executeUpdate(ctx, rate, "fx rate")
}

// Delete deletes an FX rate by ID.
func (r *fxRateRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.FXRate{}, id, "fx rate")
}

// List retrieves all FX rates with pagination.
func (r *fxRateRepository) List(ctx context.Context, opts ListOptions) ([]*models.FXRate, int, error) {
	var rates []*models.FXRate
	var total int64

	// Get total count
	if err := r.db.DB.WithContext(ctx).Model(&models.FXRate{}).Count(&total).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count fx rates", err)
	}

	// Build order clause
	orderClause := r.buildOrderClause(opts)
	query := r.db.DB.WithContext(ctx).Model(&models.FXRate{}).Order(orderClause)

	// Apply pagination
	query = r.applyPagination(query, opts)

	// Execute query
	result := query.Find(&rates)
	if result.Error != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list fx rates", result.Error)
	}

	return rates, int(total), nil
}

// GetLatestRates retrieves the latest rates for a given from currency.
func (r *fxRateRepository) GetLatestRates(ctx context.Context, fromCurrency string) ([]*models.FXRate, error) {
	var rates []*models.FXRate

	// Get the latest rate for each to_currency
	subquery := r.db.DB.WithContext(ctx).
		Select("MAX(id) as id").
		Table("fx_rate").
		Where("from_currency = ?", fromCurrency).
		Group("to_currency")

	result := r.db.DB.WithContext(ctx).
		Where("id IN (?)", subquery).
		Find(&rates)

	if result.Error != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to get latest fx rates", result.Error)
	}

	return rates, nil
}
