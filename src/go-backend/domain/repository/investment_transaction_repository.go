package repository

import (
	"context"

	"wealthjourney/domain/models"
	investmentv1 "wealthjourney/protobuf/v1"
)

// InvestmentTransactionRepository defines the interface for investment transaction data operations.
type InvestmentTransactionRepository interface {
	// Create creates a new investment transaction.
	Create(ctx context.Context, tx *models.InvestmentTransaction) error

	// GetByID retrieves an investment transaction by ID.
	GetByID(ctx context.Context, id int32) (*models.InvestmentTransaction, error)

	// GetByIDForUser retrieves an investment transaction by ID, ensuring it belongs to the user's investment.
	GetByIDForUser(ctx context.Context, txID, userID int32) (*models.InvestmentTransaction, error)

	// ListByInvestmentID retrieves all transactions for an investment with pagination.
	ListByInvestmentID(ctx context.Context, investmentID int32, typeFilter *investmentv1.InvestmentTransactionType, opts ListOptions) ([]*models.InvestmentTransaction, int, error)

	// Update updates an investment transaction.
	Update(ctx context.Context, tx *models.InvestmentTransaction) error

	// Delete soft deletes an investment transaction by ID.
	Delete(ctx context.Context, id int32) error

	// GetOpenLots retrieves all open lots for an investment (remaining_quantity > 0), ordered by purchased_at ASC (FIFO).
	GetOpenLots(ctx context.Context, investmentID int32) ([]*models.InvestmentLot, error)

	// CreateLot creates a new investment lot.
	CreateLot(ctx context.Context, lot *models.InvestmentLot) error

	// UpdateLot updates an investment lot.
	UpdateLot(ctx context.Context, lot *models.InvestmentLot) error

	// GetLotByID retrieves a lot by ID.
	GetLotByID(ctx context.Context, lotID int32) (*models.InvestmentLot, error)

	// GetLotByIDForInvestment retrieves a lot by ID, ensuring it belongs to the investment.
	GetLotByIDForInvestment(ctx context.Context, lotID, investmentID int32) (*models.InvestmentLot, error)
}
