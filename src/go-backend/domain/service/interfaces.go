package service

import (
	"context"

	"wealthjourney/pkg/types"
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
