package repository

import (
	"context"
	"errors"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
	apperrors "wealthjourney/pkg/errors"

	"gorm.io/gorm"
)

// walletRepository implements WalletRepository using GORM.
type walletRepository struct {
	*BaseRepository
}

// NewWalletRepository creates a new WalletRepository.
func NewWalletRepository(db *database.Database) WalletRepository {
	return &walletRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new wallet.
func (r *walletRepository) Create(ctx context.Context, wallet *models.Wallet) error {
	result := r.db.DB.WithContext(ctx).Create(wallet)
	if result.Error != nil {
		return r.handleDBError(result.Error, "wallet", "create wallet")
	}
	return nil
}

// GetByID retrieves a wallet by ID.
func (r *walletRepository) GetByID(ctx context.Context, id int32) (*models.Wallet, error) {
	var wallet models.Wallet
	err := r.executeGetByID(ctx, &wallet, id, "wallet")
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

// GetByIDForUser retrieves a wallet by ID, ensuring it belongs to the user.
func (r *walletRepository) GetByIDForUser(ctx context.Context, walletID, userID int32) (*models.Wallet, error) {
	var wallet models.Wallet
	result := r.db.DB.WithContext(ctx).Where("id = ? AND user_id = ?", walletID, userID).First(&wallet)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "wallet", "get wallet")
	}
	return &wallet, nil
}

// ListByUserID retrieves all wallets for a user.
func (r *walletRepository) ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Wallet, int, error) {
	var wallets []*models.Wallet
	var total int64

	// Get total count for this user (only active wallets)
	if err := r.db.DB.WithContext(ctx).Model(&models.Wallet{}).Where("user_id = ? AND status = 1", userID).Count(&total).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count wallets", err)
	}

	// Build query with user filter, active status, and pagination
	orderClause := r.buildOrderClause(opts)
	query := r.db.DB.WithContext(ctx).Model(&models.Wallet{}).Where("user_id = ? AND status = 1", userID).Order(orderClause)
	query = r.applyPagination(query, opts)

	result := query.Find(&wallets)
	if result.Error != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list wallets", result.Error)
	}

	return wallets, int(total), nil
}

// Update updates a wallet.
func (r *walletRepository) Update(ctx context.Context, wallet *models.Wallet) error {
	return r.executeUpdate(ctx, wallet, "wallet")
}

// UpdateBalance updates the balance of a wallet.
// Use positive delta to add, negative to subtract.
// Returns the updated wallet.
func (r *walletRepository) UpdateBalance(ctx context.Context, walletID int32, delta int64) (*models.Wallet, error) {
	var wallet models.Wallet

	// Use a transaction to ensure atomicity
	err := r.db.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Lock the row for update
		if err := tx.First(&wallet, walletID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperrors.NewNotFoundError("wallet")
			}
			return apperrors.NewInternalErrorWithCause("failed to get wallet", err)
		}

		// Check for negative balance
		newBalance := wallet.Balance + delta
		if newBalance < 0 {
			return apperrors.NewValidationError("Insufficient balance")
		}

		// Update balance
		if err := tx.Model(&wallet).Update("balance", newBalance).Error; err != nil {
			return apperrors.NewInternalErrorWithCause("failed to update balance", err)
		}

		// Refresh the wallet model
		wallet.Balance = newBalance
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &wallet, nil
}

// UpdateBalanceWithTx updates wallet balance within a database transaction.
func (r *walletRepository) UpdateBalanceWithTx(ctx context.Context, dbTx interface{}, walletID int32, delta int64) (*models.Wallet, error) {
	tx, ok := dbTx.(*gorm.DB)
	if !ok {
		return nil, apperrors.NewInternalErrorWithCause("invalid transaction type", nil)
	}

	var wallet models.Wallet

	// Lock the row for update and get current wallet
	if err := tx.WithContext(ctx).First(&wallet, walletID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewNotFoundError("wallet")
		}
		return nil, apperrors.NewInternalErrorWithCause("failed to get wallet", err)
	}

	// Calculate new balance
	newBalance := wallet.Balance + delta
	if newBalance < 0 {
		return nil, apperrors.NewValidationError("Insufficient balance")
	}

	// Update balance using raw SQL to ensure atomicity
	if err := tx.WithContext(ctx).Model(&wallet).Update("balance", newBalance).Error; err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to update balance", err)
	}

	// Update the wallet model with new balance for return
	wallet.Balance = newBalance

	return &wallet, nil
}

// Delete soft deletes a wallet by ID.
func (r *walletRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.Wallet{}, id, "wallet")
}

// ExistsForUser checks if a wallet exists by ID and belongs to the user.
func (r *walletRepository) ExistsForUser(ctx context.Context, walletID, userID int32) (bool, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.Wallet{}).
		Where("id = ? AND user_id = ?", walletID, userID).
		Count(&count)
	if result.Error != nil {
		return false, apperrors.NewInternalErrorWithCause("failed to check wallet existence", result.Error)
	}
	return count > 0, nil
}

// CountByUserID returns the number of wallets for a user.
func (r *walletRepository) CountByUserID(ctx context.Context, userID int32) (int, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.Wallet{}).Where("user_id = ?", userID).Count(&count)
	if result.Error != nil {
		return 0, apperrors.NewInternalErrorWithCause("failed to count wallets", result.Error)
	}
	return int(count), nil
}

// GetTotalBalance calculates the sum of all wallet balances for a user (only active wallets).
func (r *walletRepository) GetTotalBalance(ctx context.Context, userID int32) (int64, error) {
	var totalBalance int64
	result := r.db.DB.WithContext(ctx).
		Model(&models.Wallet{}).
		Where("user_id = ? AND status = 1", userID).
		Select("COALESCE(SUM(balance), 0)").
		Scan(&totalBalance)

	if result.Error != nil {
		return 0, apperrors.NewInternalErrorWithCause("failed to calculate total balance", result.Error)
	}

	return totalBalance, nil
}

// WithTx returns a repository instance that uses the given transaction.
func (r *walletRepository) WithTx(tx interface{}) WalletRepository {
	// For now, we'll implement a simple version that returns a new repository with a transaction
	// In a full implementation, you'd wrap the GORM transaction
	return r
}

// transactionManager implements TransactionManager.
type transactionManager struct {
	db *database.Database
}

// NewTransactionManager creates a new TransactionManager.
func NewTransactionManager(db *database.Database) TransactionManager {
	return &transactionManager{db: db}
}

// WithTx executes a function within a transaction.
func (tm *transactionManager) WithTx(ctx context.Context, fn func(TransactionManager) error) error {
	return tm.db.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tmTx := &transactionManager{db: &database.Database{DB: tx}}
		return fn(tmTx)
	})
}
