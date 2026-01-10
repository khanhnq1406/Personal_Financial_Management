package repository

import (
	"context"
	"time"
	v1 "wealthjourney/protobuf/v1"
	"wealthjourney/domain/models"
)

// ListOptions represents common list query options.
type ListOptions struct {
	Limit   int
	Offset  int
	OrderBy string
	Order   string // "asc" or "desc"
}

// UserRepository defines the interface for user data operations.
type UserRepository interface {
	// Create creates a new user.
	Create(ctx context.Context, user *models.User) error

	// GetByID retrieves a user by ID.
	GetByID(ctx context.Context, id int32) (*models.User, error)

	// GetByEmail retrieves a user by email.
	GetByEmail(ctx context.Context, email string) (*models.User, error)

	// List retrieves users with pagination.
	List(ctx context.Context, opts ListOptions) ([]*models.User, int, error)

	// Update updates a user.
	Update(ctx context.Context, user *models.User) error

	// Delete soft deletes a user by ID.
	Delete(ctx context.Context, id int32) error

	// Exists checks if a user exists by email.
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}

// WalletRepository defines the interface for wallet data operations.
type WalletRepository interface {
	// Create creates a new wallet.
	Create(ctx context.Context, wallet *models.Wallet) error

	// GetByID retrieves a wallet by ID.
	GetByID(ctx context.Context, id int32) (*models.Wallet, error)

	// GetByIDForUser retrieves a wallet by ID, ensuring it belongs to the user.
	GetByIDForUser(ctx context.Context, walletID, userID int32) (*models.Wallet, error)

	// ListByUserID retrieves all wallets for a user.
	ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Wallet, int, error)

	// Update updates a wallet.
	Update(ctx context.Context, wallet *models.Wallet) error

	// UpdateBalance updates the balance of a wallet.
	// Use positive delta to add, negative to subtract.
	UpdateBalance(ctx context.Context, walletID int32, delta int64) (*models.Wallet, error)

	// Delete soft deletes a wallet by ID.
	Delete(ctx context.Context, id int32) error

	// Exists checks if a wallet exists by ID and belongs to the user.
	ExistsForUser(ctx context.Context, walletID, userID int32) (bool, error)

	// CountByUserID returns the number of wallets for a user.
	CountByUserID(ctx context.Context, userID int32) (int, error)

	// WithTx returns a repository instance that uses the given transaction.
	WithTx(tx interface{}) WalletRepository
}

// TransactionManager defines the interface for managing database transactions.
type TransactionManager interface {
	// WithTx executes a function within a transaction.
	// If the function returns an error, the transaction is rolled back.
	// Otherwise, it is committed.
	WithTx(ctx context.Context, fn func(tm TransactionManager) error) error
}

// TransactionFilter defines filter options for listing transactions.
type TransactionFilter struct {
	WalletID   *int32
	CategoryID *int32
	Type       *v1.TransactionType
	StartDate  *time.Time
	EndDate    *time.Time
	MinAmount  *int64
	MaxAmount  *int64
	SearchNote *string
}

// TransactionRepository defines the interface for transaction data operations.
type TransactionRepository interface {
	// Create creates a new transaction.
	Create(ctx context.Context, tx *models.Transaction) error

	// GetByID retrieves a transaction by ID.
	GetByID(ctx context.Context, id int32) (*models.Transaction, error)

	// GetByIDForUser retrieves a transaction by ID, ensuring it belongs to the user's wallet.
	GetByIDForUser(ctx context.Context, txID, userID int32) (*models.Transaction, error)

	// Update updates a transaction.
	Update(ctx context.Context, tx *models.Transaction) error

	// Delete soft deletes a transaction by ID.
	Delete(ctx context.Context, id int32) error

	// List retrieves transactions with filtering and pagination.
	List(ctx context.Context, userID int32, filter TransactionFilter, opts ListOptions) ([]*models.Transaction, int, error)

	// GetWithWallet retrieves a transaction with its wallet relationship.
	GetWithWallet(ctx context.Context, id int32) (*models.Transaction, error)
}

// CategoryRepository defines the interface for category data operations.
type CategoryRepository interface {
	// Create creates a new category.
	Create(ctx context.Context, category *models.Category) error

	// GetByID retrieves a category by ID.
	GetByID(ctx context.Context, id int32) (*models.Category, error)

	// GetByIDForUser retrieves a category by ID, ensuring it belongs to the user.
	GetByIDForUser(ctx context.Context, categoryID, userID int32) (*models.Category, error)

	// Update updates a category.
	Update(ctx context.Context, category *models.Category) error

	// Delete soft deletes a category by ID.
	Delete(ctx context.Context, id int32) error

	// ListByUserID retrieves all categories for a user with optional type filtering.
	ListByUserID(ctx context.Context, userID int32, categoryType *v1.CategoryType, opts ListOptions) ([]*models.Category, int, error)

	// ExistsForUser checks if a category exists by ID and belongs to the user.
	ExistsForUser(ctx context.Context, categoryID, userID int32) (bool, error)

	// CountByUserID returns the number of categories for a user.
	CountByUserID(ctx context.Context, userID int32) (int, error)
}
