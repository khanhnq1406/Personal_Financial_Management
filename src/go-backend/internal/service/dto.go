package service

import (
	"time"

	"wealthjourney/pkg/types"
)

// UserDTO represents a user data transfer object.
type UserDTO struct {
	ID        int32     `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Picture   string    `json:"picture"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// WalletDTO represents a wallet data transfer object.
type WalletDTO struct {
	ID         int32     `json:"id"`
	UserID     int32     `json:"user_id"`
	WalletName string    `json:"wallet_name"`
	Balance    types.Money `json:"balance"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CreateWalletRequest represents a request to create a wallet.
type CreateWalletRequest struct {
	WalletName string      `json:"wallet_name" binding:"required"`
	InitialBalance types.Money `json:"initial_balance"`
}

// UpdateWalletRequest represents a request to update a wallet.
type UpdateWalletRequest struct {
	WalletName string `json:"wallet_name" binding:"required"`
}

// AddFundsRequest represents a request to add funds to a wallet.
type AddFundsRequest struct {
	Amount types.Money `json:"amount" binding:"required"`
}

// WithdrawFundsRequest represents a request to withdraw funds from a wallet.
type WithdrawFundsRequest struct {
	Amount types.Money `json:"amount" binding:"required"`
}

// TransferFundsRequest represents a request to transfer funds between wallets.
type TransferFundsRequest struct {
	FromWalletID int32       `json:"from_wallet_id" binding:"required"`
	ToWalletID   int32       `json:"to_wallet_id" binding:"required"`
	Amount       types.Money `json:"amount" binding:"required"`
}

// TransferResult represents the result of a funds transfer.
type TransferResult struct {
	FromWallet WalletDTO `json:"from_wallet"`
	ToWallet   WalletDTO `json:"to_wallet"`
	Amount     types.Money `json:"amount"`
}

// WalletListResult represents a paginated list of wallets.
type WalletListResult struct {
	Wallets    []WalletDTO           `json:"wallets"`
	Pagination types.PaginationResult `json:"pagination"`
}
