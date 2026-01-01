package service

import (
	"context"

	walletv1 "wealthjourney/gen/protobuf/v1"
	"wealthjourney/pkg/types"
)

// WalletService defines the interface for wallet business logic.
type WalletService interface {
	// CreateWallet creates a new wallet for a user.
	CreateWallet(ctx context.Context, userID int32, req *walletv1.CreateWalletRequest) (*walletv1.Wallet, error)

	// GetWallet retrieves a wallet by ID, ensuring it belongs to the user.
	GetWallet(ctx context.Context, walletID int32, requestingUserID int32) (*walletv1.Wallet, error)

	// ListWallets retrieves all wallets for a user with pagination.
	ListWallets(ctx context.Context, userID int32, params types.PaginationParams) (*WalletListResult, error)

	// UpdateWallet updates a wallet's name.
	UpdateWallet(ctx context.Context, walletID int32, userID int32, req *walletv1.UpdateWalletRequest) (*walletv1.Wallet, error)

	// DeleteWallet deletes a wallet.
	DeleteWallet(ctx context.Context, walletID int32, userID int32) error

	// AddFunds adds funds to a wallet.
	AddFunds(ctx context.Context, walletID int32, userID int32, req *walletv1.AddFundsRequest) (*walletv1.Wallet, error)

	// WithdrawFunds withdraws funds from a wallet.
	WithdrawFunds(ctx context.Context, walletID int32, userID int32, req *walletv1.WithdrawFundsRequest) (*walletv1.Wallet, error)

	// TransferFunds transfers funds between two wallets belonging to the same user.
	TransferFunds(ctx context.Context, userID int32, req *walletv1.TransferFundsRequest) (*TransferResult, error)
}

// UserService defines the interface for user business logic.
type UserService interface {
	// GetUser retrieves a user by ID.
	GetUser(ctx context.Context, userID int32) (*walletv1.User, error)

	// GetUserByEmail retrieves a user by email.
	GetUserByEmail(ctx context.Context, email string) (*walletv1.User, error)

	// ListUsers retrieves all users with pagination.
	ListUsers(ctx context.Context, params types.PaginationParams) ([]*walletv1.User, *types.PaginationResult, error)

	// CreateUser creates a new user.
	CreateUser(ctx context.Context, email, name, picture string) (*walletv1.User, error)

	// UpdateUser updates a user's information.
	UpdateUser(ctx context.Context, userID int32, email, name, picture string) (*walletv1.User, error)

	// DeleteUser deletes a user.
	DeleteUser(ctx context.Context, userID int32) error

	// ExistsByEmail checks if a user exists by email.
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}
