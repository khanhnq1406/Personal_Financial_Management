package repository

import (
	"context"
	"errors"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
	apperrors "wealthjourney/pkg/errors"

	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
)

// investmentRepository implements InvestmentRepository using GORM.
type investmentRepository struct {
	*BaseRepository
}

// NewInvestmentRepository creates a new InvestmentRepository.
func NewInvestmentRepository(db *database.Database) InvestmentRepository {
	return &investmentRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new investment.
func (r *investmentRepository) Create(ctx context.Context, investment *models.Investment) error {
	result := r.db.DB.WithContext(ctx).Create(investment)
	if result.Error != nil {
		return r.handleDBError(result.Error, "investment", "create investment")
	}
	return nil
}

// GetByID retrieves an investment by ID.
func (r *investmentRepository) GetByID(ctx context.Context, id int32) (*models.Investment, error) {
	var investment models.Investment
	err := r.executeGetByID(ctx, &investment, id, "investment")
	if err != nil {
		return nil, err
	}
	return &investment, nil
}

// GetByIDForUser retrieves an investment by ID, ensuring it belongs to the user's wallet.
func (r *investmentRepository) GetByIDForUser(ctx context.Context, investmentID, userID int32) (*models.Investment, error) {
	var investment models.Investment
	result := r.db.DB.WithContext(ctx).
		Joins("JOIN wallet ON wallet.id = investment.wallet_id").
		Where("investment.id = ? AND wallet.user_id = ?", investmentID, userID).
		First(&investment)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "investment", "get investment")
	}
	return &investment, nil
}

// GetByWalletAndSymbol retrieves an investment by wallet and symbol.
// Returns nil if not found (no error).
func (r *investmentRepository) GetByWalletAndSymbol(ctx context.Context, walletID int32, symbol string) (*models.Investment, error) {
	var investment models.Investment
	result := r.db.DB.WithContext(ctx).
		Where("wallet_id = ? AND symbol = ?", walletID, symbol).
		First(&investment)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Not found is not an error for this method
		}
		return nil, r.handleDBError(result.Error, "investment", "get investment by wallet and symbol")
	}
	return &investment, nil
}

// ListByUserID retrieves all investments for a user (via their wallets).
func (r *investmentRepository) ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Investment, int, error) {
	// First, get all wallet IDs for the user
	var walletIDs []int32
	err := r.db.DB.WithContext(ctx).
		Model(&models.Wallet{}).
		Where("user_id = ? AND status = 1", userID).
		Pluck("id", &walletIDs).Error
	if err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to get user wallets", err)
	}

	// If no wallets, return empty result
	if len(walletIDs) == 0 {
		return []*models.Investment{}, 0, nil
	}

	// Get total count
	var total int64
	err = r.db.DB.WithContext(ctx).
		Model(&models.Investment{}).
		Where("wallet_id IN ?", walletIDs).
		Count(&total).Error
	if err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count investments", err)
	}

	// Build query with pagination
	orderClause := r.buildOrderClause(opts)
	query := r.db.DB.WithContext(ctx).
		Model(&models.Investment{}).
		Where("wallet_id IN ?", walletIDs).
		Order(orderClause)
	query = r.applyPagination(query, opts)

	// Execute query
	var investments []*models.Investment
	err = query.Find(&investments).Error
	if err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list investments", err)
	}

	return investments, int(total), nil
}

// ListByWalletID retrieves all investments in a wallet.
func (r *investmentRepository) ListByWalletID(ctx context.Context, walletID int32, opts ListOptions, typeFilter v1.InvestmentType) ([]*models.Investment, int, error) {
	// Build base query
	query := r.db.DB.WithContext(ctx).Model(&models.Investment{}).Where("wallet_id = ?", walletID)

	// Apply type filter if specified (0 is unspecified, so we don't filter on it)
	if typeFilter != v1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED && typeFilter != 0 {
		query = query.Where("type = ?", typeFilter)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count investments", err)
	}

	// Apply ordering and pagination
	orderClause := r.buildOrderClause(opts)
	query = query.Order(orderClause)
	query = r.applyPagination(query, opts)

	// Execute query
	var investments []*models.Investment
	if err := query.Find(&investments).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list investments", err)
	}

	return investments, int(total), nil
}

// Update updates an investment.
func (r *investmentRepository) Update(ctx context.Context, investment *models.Investment) error {
	result := r.db.DB.WithContext(ctx).Save(investment)
	if result.Error != nil {
		return apperrors.NewInternalErrorWithCause("failed to update investment", result.Error)
	}
	return nil
}

// Delete soft deletes an investment by ID.
func (r *investmentRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.Investment{}, id, "investment")
}

// UpdatePrices updates current prices for multiple investments.
func (r *investmentRepository) UpdatePrices(ctx context.Context, updates []PriceUpdate) error {
	if len(updates) == 0 {
		return nil
	}

	// Use a transaction for batch updates
	err := r.db.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			// Update current_price for the investment
			// The GORM hooks (BeforeUpdate) will automatically recalculate
			// current_value, unrealized_pnl, and unrealized_pnl_percent
			result := tx.Model(&models.Investment{}).
				Where("id = ?", update.InvestmentID).
				Update("current_price", update.Price)
			if result.Error != nil {
				return apperrors.NewInternalErrorWithCause("failed to update investment price", result.Error)
			}
		}
		return nil
	})

	if err != nil {
		return err
	}

	return nil
}

// GetPortfolioSummary calculates summary stats for a wallet.
func (r *investmentRepository) GetPortfolioSummary(ctx context.Context, walletID int32) (*PortfolioSummary, error) {
	// Get all investments for the wallet
	investments, _, err := r.ListByWalletID(ctx, walletID, ListOptions{}, v1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED)
	if err != nil {
		return nil, err
	}

	// Initialize summary
	summary := &PortfolioSummary{
		TotalValue:        0,
		TotalCost:         0,
		TotalPNL:          0,
		TotalPNLPercent:   0,
		RealizedPNL:       0,
		UnrealizedPNL:     0,
		TotalInvestments:  int32(len(investments)),
		InvestmentsByType: make(map[v1.InvestmentType]*TypeSummary),
	}

	// Handle empty portfolio
	if len(investments) == 0 {
		return summary, nil
	}

	// Calculate totals by iterating through investments
	for _, inv := range investments {
		summary.TotalValue += inv.CurrentValue
		summary.TotalCost += inv.TotalCost
		summary.UnrealizedPNL += inv.UnrealizedPNL
		summary.RealizedPNL += inv.RealizedPNL

		// Update type-specific totals
		if _, exists := summary.InvestmentsByType[inv.Type]; !exists {
			summary.InvestmentsByType[inv.Type] = &TypeSummary{
				TotalValue: 0,
				Count:      0,
			}
		}
		summary.InvestmentsByType[inv.Type].TotalValue += inv.CurrentValue
		summary.InvestmentsByType[inv.Type].Count++
	}

	// Calculate total PNL
	summary.TotalPNL = summary.UnrealizedPNL + summary.RealizedPNL

	// Calculate total PNL percent
	if summary.TotalCost > 0 {
		summary.TotalPNLPercent = (float64(summary.TotalPNL) / float64(summary.TotalCost)) * 100
	}

	return summary, nil
}
