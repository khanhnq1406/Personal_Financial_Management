package repository

import (
	"context"
	"errors"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
	apperrors "wealthjourney/pkg/errors"

	v1 "wealthjourney/protobuf/v1"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// transactionRepository implements TransactionRepository using GORM.
type transactionRepository struct {
	*BaseRepository
}

// NewTransactionRepository creates a new TransactionRepository.
func NewTransactionRepository(db *database.Database) TransactionRepository {
	return &transactionRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new transaction.
func (r *transactionRepository) Create(ctx context.Context, tx *models.Transaction) error {
	result := r.db.DB.WithContext(ctx).Create(tx)
	if result.Error != nil {
		return r.handleDBError(result.Error, "transaction", "create transaction")
	}
	return nil
}

// GetByID retrieves a transaction by ID.
func (r *transactionRepository) GetByID(ctx context.Context, id int32) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.executeGetByID(ctx, &transaction, id, "transaction")
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

// GetByIDForUser retrieves a transaction by ID, ensuring it belongs to the user's wallet.
func (r *transactionRepository) GetByIDForUser(ctx context.Context, txID, userID int32) (*models.Transaction, error) {
	var transaction models.Transaction
	result := r.db.DB.WithContext(ctx).
		Joins("JOIN wallet ON wallet.id = transaction.wallet_id").
		Where("transaction.id = ? AND wallet.user_id = ?", txID, userID).
		First(&transaction)

	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "transaction", "get transaction")
	}
	return &transaction, nil
}

// GetWithWallet retrieves a transaction with its wallet relationship.
func (r *transactionRepository) GetWithWallet(ctx context.Context, id int32) (*models.Transaction, error) {
	var transaction models.Transaction
	result := r.db.DB.WithContext(ctx).
		Preload("Wallet").
		Preload("Category").
		First(&transaction, id)

	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "transaction", "get transaction with wallet")
	}
	return &transaction, nil
}

// Update updates a transaction.
func (r *transactionRepository) Update(ctx context.Context, tx *models.Transaction) error {
	return r.executeUpdate(ctx, tx, "transaction")
}

// Delete soft deletes a transaction by ID.
func (r *transactionRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.Transaction{}, id, "transaction")
}

// List retrieves transactions with filtering and pagination.
func (r *transactionRepository) List(ctx context.Context, userID int32, filter TransactionFilter, opts ListOptions) ([]*models.Transaction, int, error) {
	var transactions []*models.Transaction
	var total int64

	// Build the base query with wallet join for user ownership
	query := r.db.DB.WithContext(ctx).
		Model(&models.Transaction{}).
		Joins("JOIN wallet ON wallet.id = transaction.wallet_id").
		Where("wallet.user_id = ?", userID)

	// Apply filters
	if filter.WalletID != nil {
		query = query.Where("transaction.wallet_id = ?", *filter.WalletID)
	}

	if filter.CategoryID != nil {
		query = query.Where("transaction.category_id = ?", *filter.CategoryID)
	}

	if filter.Type != nil {
		// Filter by transaction type through category relationship
		var categoryType v1.CategoryType
		switch *filter.Type {
		case v1.TransactionType_TRANSACTION_TYPE_INCOME:
			categoryType = v1.CategoryType_CATEGORY_TYPE_INCOME
		case v1.TransactionType_TRANSACTION_TYPE_EXPENSE:
			categoryType = v1.CategoryType_CATEGORY_TYPE_EXPENSE
		default:
			categoryType = v1.CategoryType_CATEGORY_TYPE_UNSPECIFIED
		}

		if categoryType != v1.CategoryType_CATEGORY_TYPE_UNSPECIFIED {
			query = query.Joins("LEFT JOIN category ON category.id = transaction.category_id").
				Where("category.type = ?", int(categoryType))
		}
	}

	if filter.StartDate != nil {
		query = query.Where("transaction.date >= ?", *filter.StartDate)
	}

	if filter.EndDate != nil {
		query = query.Where("transaction.date <= ?", *filter.EndDate)
	}

	if filter.MinAmount != nil {
		query = query.Where("transaction.amount >= ?", *filter.MinAmount)
	}

	if filter.MaxAmount != nil {
		query = query.Where("transaction.amount <= ?", *filter.MaxAmount)
	}

	if filter.SearchNote != nil && *filter.SearchNote != "" {
		query = query.Where("transaction.note LIKE ?", "%"+*filter.SearchNote+"%")
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count transactions", err)
	}

	// Build order clause
	orderClause := r.buildOrderClause(opts)
	query = query.Order(orderClause)

	// Apply pagination
	query = r.applyPagination(query, opts)

	// Execute query with preloads
	result := query.
		Preload("Wallet").
		Preload("Category").
		Find(&transactions)

	if result.Error != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list transactions", result.Error)
	}

	return transactions, int(total), nil
}

// ExecuteTransactionWithBalanceUpdate executes a function within a transaction,
// returning the updated wallet.
func (r *transactionRepository) ExecuteTransactionWithBalanceUpdate(ctx context.Context, walletID int32, balanceDelta int64, fn func(tx *gorm.DB) error) error {
	return r.db.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Lock the wallet row for update
		var wallet models.Wallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&wallet, walletID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperrors.NewNotFoundError("wallet")
			}
			return apperrors.NewInternalErrorWithCause("failed to get wallet", err)
		}

		// Calculate new balance
		newBalance := wallet.Balance + balanceDelta
		if newBalance < 0 {
			return apperrors.NewValidationError("Insufficient balance")
		}

		// Execute the provided function (e.g., create/update transaction)
		if err := fn(tx); err != nil {
			return err
		}

		// Update wallet balance
		if err := tx.Model(&wallet).Update("balance", newBalance).Error; err != nil {
			return apperrors.NewInternalErrorWithCause("failed to update wallet balance", err)
		}

		return nil
	})
}
