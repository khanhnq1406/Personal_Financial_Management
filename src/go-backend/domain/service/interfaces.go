package service

import (
	"context"

	"wealthjourney/pkg/types"
	transactionv1 "wealthjourney/protobuf/v1"
	walletv1 "wealthjourney/protobuf/v1"
)

// WalletService defines the interface for wallet business logic.
type WalletService interface {
	// CreateWallet creates a new wallet for a user.
	CreateWallet(ctx context.Context, userID int32, req *walletv1.CreateWalletRequest) (*walletv1.CreateWalletResponse, error)

	// GetWallet retrieves a wallet by ID, ensuring it belongs to the user.
	GetWallet(ctx context.Context, walletID int32, requestingUserID int32) (*walletv1.GetWalletResponse, error)

	// ListWallets retrieves all wallets for a user with pagination.
	ListWallets(ctx context.Context, userID int32, params types.PaginationParams) (*walletv1.ListWalletsResponse, error)

	// UpdateWallet updates a wallet's name.
	UpdateWallet(ctx context.Context, walletID int32, userID int32, req *walletv1.UpdateWalletRequest) (*walletv1.UpdateWalletResponse, error)

	// DeleteWallet deletes a wallet.
	DeleteWallet(ctx context.Context, walletID int32, userID int32) (*walletv1.DeleteWalletResponse, error)

	// AddFunds adds funds to a wallet.
	AddFunds(ctx context.Context, walletID int32, userID int32, req *walletv1.AddFundsRequest) (*walletv1.AddFundsResponse, error)

	// WithdrawFunds withdraws funds from a wallet.
	WithdrawFunds(ctx context.Context, walletID int32, userID int32, req *walletv1.WithdrawFundsRequest) (*walletv1.WithdrawFundsResponse, error)

	// TransferFunds transfers funds between two wallets belonging to the same user.
	TransferFunds(ctx context.Context, userID int32, req *walletv1.TransferFundsRequest) (*walletv1.TransferFundsResponse, error)

	// GetTotalBalance calculates the total balance across all user wallets.
	GetTotalBalance(ctx context.Context, userID int32) (*walletv1.GetTotalBalanceResponse, error)

	// GetBalanceHistory retrieves balance history for chart visualization.
	GetBalanceHistory(ctx context.Context, userID int32, req *walletv1.GetBalanceHistoryRequest) (*walletv1.GetBalanceHistoryResponse, error)

	// GetMonthlyDominance retrieves monthly balance data for all wallets.
	GetMonthlyDominance(ctx context.Context, userID int32, req *walletv1.GetMonthlyDominanceRequest) (*walletv1.GetMonthlyDominanceResponse, error)
}

// UserService defines the interface for user business logic.
type UserService interface {
	// GetUser retrieves a user by ID.
	GetUser(ctx context.Context, userID int32) (*walletv1.GetUserResponse, error)

	// GetUserByEmail retrieves a user by email.
	GetUserByEmail(ctx context.Context, email string) (*walletv1.GetUserByEmailResponse, error)

	// ListUsers retrieves all users with pagination.
	ListUsers(ctx context.Context, params types.PaginationParams) (*walletv1.ListUsersResponse, error)

	// CreateUser creates a new user.
	CreateUser(ctx context.Context, email, name, picture string) (*walletv1.CreateUserResponse, error)

	// UpdateUser updates a user's information.
	UpdateUser(ctx context.Context, userID int32, email, name, picture string) (*walletv1.UpdateUserResponse, error)

	// DeleteUser deletes a user.
	DeleteUser(ctx context.Context, userID int32) (*walletv1.DeleteUserResponse, error)

	// ExistsByEmail checks if a user exists by email.
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}

// TransactionService defines the interface for transaction business logic.
type TransactionService interface {
	// CreateTransaction creates a new transaction and updates wallet balance.
	CreateTransaction(ctx context.Context, userID int32, req *transactionv1.CreateTransactionRequest) (*transactionv1.CreateTransactionResponse, error)

	// GetTransaction retrieves a transaction by ID, ensuring it belongs to the user's wallet.
	GetTransaction(ctx context.Context, transactionID int32, userID int32) (*transactionv1.GetTransactionResponse, error)

	// ListTransactions retrieves transactions with filtering and pagination.
	ListTransactions(ctx context.Context, userID int32, req *transactionv1.ListTransactionsRequest) (*transactionv1.ListTransactionsResponse, error)

	// UpdateTransaction updates a transaction and adjusts wallet balance accordingly.
	UpdateTransaction(ctx context.Context, transactionID int32, userID int32, req *transactionv1.UpdateTransactionRequest) (*transactionv1.UpdateTransactionResponse, error)

	// DeleteTransaction deletes a transaction and restores the wallet balance.
	DeleteTransaction(ctx context.Context, transactionID int32, userID int32) (*transactionv1.DeleteTransactionResponse, error)

	// GetAvailableYears retrieves distinct years from user's transactions.
	GetAvailableYears(ctx context.Context, userID int32) (*transactionv1.GetAvailableYearsResponse, error)
}

// CategoryService defines the interface for category business logic.
type CategoryService interface {
	// CreateCategory creates a new category for a user.
	CreateCategory(ctx context.Context, userID int32, req *transactionv1.CreateCategoryRequest) (*transactionv1.CreateCategoryResponse, error)

	// GetCategory retrieves a category by ID, ensuring it belongs to the user.
	GetCategory(ctx context.Context, categoryID int32, userID int32) (*transactionv1.GetCategoryResponse, error)

	// ListCategories retrieves categories for a user with optional type filtering.
	ListCategories(ctx context.Context, userID int32, req *transactionv1.ListCategoriesRequest) (*transactionv1.ListCategoriesResponse, error)

	// UpdateCategory updates a category's name.
	UpdateCategory(ctx context.Context, categoryID int32, userID int32, req *transactionv1.UpdateCategoryRequest) (*transactionv1.UpdateCategoryResponse, error)

	// DeleteCategory deletes a category.
	DeleteCategory(ctx context.Context, categoryID int32, userID int32) (*transactionv1.DeleteCategoryResponse, error)

	// CreateDefaultCategories creates default categories for a new user.
	CreateDefaultCategories(ctx context.Context, userID int32) error
}
