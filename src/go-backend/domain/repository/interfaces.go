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

	// GetTotalBalance calculates the sum of all wallet balances for a user.
	GetTotalBalance(ctx context.Context, userID int32) (int64, error)

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
	WalletIDs  []int32 // Support multiple wallet IDs
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

	// GetAvailableYears retrieves distinct years from user's transactions.
	GetAvailableYears(ctx context.Context, userID int32) ([]int32, error)

	// CountByWalletID returns the number of transactions for a wallet.
	CountByWalletID(ctx context.Context, walletID int32) (int32, error)

	// GetSumAmounts returns the sum of all transaction amounts for a wallet (signed).
	// Positive values indicate income, negative values indicate expense.
	GetSumAmounts(ctx context.Context, walletID int32) (int64, error)

	// TransferToWallet transfers all transactions from one wallet to another.
	TransferToWallet(ctx context.Context, fromWalletID, toWalletID int32) error
}

// CategoryRepository defines the interface for category data operations.
type CategoryRepository interface {
	// Create creates a new category.
	Create(ctx context.Context, category *models.Category) error

	// GetByID retrieves a category by ID.
	GetByID(ctx context.Context, id int32) (*models.Category, error)

	// GetByIDForUser retrieves a category by ID, ensuring it belongs to the user.
	GetByIDForUser(ctx context.Context, categoryID, userID int32) (*models.Category, error)

	// GetByIDs retrieves multiple categories by their IDs in a single query.
	GetByIDs(ctx context.Context, ids []int32) (map[int32]*models.Category, error)

	// GetByNameAndType retrieves a category by name and type for a user.
	// Returns the category if found, or creates it if it doesn't exist.
	GetByNameAndType(ctx context.Context, userID int32, name string, categoryType v1.CategoryType) (*models.Category, error)

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

	// CreateDefaultCategories creates default categories for a new user.
	CreateDefaultCategories(ctx context.Context, userID int32) error
}

// BudgetRepository defines the interface for budget data operations.
type BudgetRepository interface {
	// Create creates a new budget.
	Create(ctx context.Context, budget *models.Budget) error

	// GetByID retrieves a budget by ID.
	GetByID(ctx context.Context, id int32) (*models.Budget, error)

	// GetByIDForUser retrieves a budget by ID, ensuring it belongs to the user.
	GetByIDForUser(ctx context.Context, budgetID, userID int32) (*models.Budget, error)

	// ListByUserID retrieves all budgets for a user.
	ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Budget, int, error)

	// Update updates a budget.
	Update(ctx context.Context, budget *models.Budget) error

	// Delete soft deletes a budget by ID.
	Delete(ctx context.Context, id int32) error

	// ExistsForUser checks if a budget exists by ID and belongs to the user.
	ExistsForUser(ctx context.Context, budgetID, userID int32) (bool, error)

	// CountByUserID returns the number of budgets for a user.
	CountByUserID(ctx context.Context, userID int32) (int, error)
}

// BudgetItemRepository defines the interface for budget item data operations.
type BudgetItemRepository interface {
	// Create creates a new budget item.
	Create(ctx context.Context, item *models.BudgetItem) error

	// GetByID retrieves a budget item by ID.
	GetByID(ctx context.Context, id int32) (*models.BudgetItem, error)

	// GetByIDForBudget retrieves a budget item by ID, ensuring it belongs to the budget.
	GetByIDForBudget(ctx context.Context, itemID, budgetID int32) (*models.BudgetItem, error)

	// ListByBudgetID retrieves all budget items for a budget.
	ListByBudgetID(ctx context.Context, budgetID int32) ([]*models.BudgetItem, error)

	// Update updates a budget item.
	Update(ctx context.Context, item *models.BudgetItem) error

	// Delete soft deletes a budget item by ID.
	Delete(ctx context.Context, id int32) error

	// DeleteByBudgetID deletes all budget items for a budget.
	DeleteByBudgetID(ctx context.Context, budgetID int32) error

	// CountByBudgetID returns the number of budget items for a budget.
	CountByBudgetID(ctx context.Context, budgetID int32) (int, error)
}

// MarketDataRepository defines the interface for market data operations.
type MarketDataRepository interface {
	// GetBySymbolAndCurrency retrieves the latest market data for a symbol.
	GetBySymbolAndCurrency(ctx context.Context, symbol, currency string) (*models.MarketData, error)

	// Create creates a new market data entry.
	Create(ctx context.Context, data *models.MarketData) error

	// Update updates an existing market data entry.
	Update(ctx context.Context, data *models.MarketData) error

	// Delete soft deletes a market data entry by ID.
	Delete(ctx context.Context, id int32) error

	// List retrieves market data with pagination.
	List(ctx context.Context, opts ListOptions) ([]*models.MarketData, int, error)
}

// FXRateRepository defines the interface for foreign exchange rate operations.
type FXRateRepository interface {
	// GetByPair retrieves the latest FX rate for a currency pair.
	GetByPair(ctx context.Context, fromCurrency, toCurrency string) (*models.FXRate, error)

	// Create creates a new FX rate entry.
	Create(ctx context.Context, rate *models.FXRate) error

	// Update updates an existing FX rate entry.
	Update(ctx context.Context, rate *models.FXRate) error

	// Delete soft deletes an FX rate entry by ID.
	Delete(ctx context.Context, id int32) error

	// List retrieves FX rates with pagination.
	List(ctx context.Context, opts ListOptions) ([]*models.FXRate, int, error)

	// GetLatestRates retrieves the latest rates for a given from currency.
	GetLatestRates(ctx context.Context, fromCurrency string) ([]*models.FXRate, error)
}
