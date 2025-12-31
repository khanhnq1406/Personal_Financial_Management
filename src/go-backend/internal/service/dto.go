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
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// WalletDTO represents a wallet data transfer object.
type WalletDTO struct {
	ID         int32     `json:"id"`
	UserID     int32     `json:"userId"`
	WalletName string    `json:"walletName"`
	Balance    types.Money `json:"balance"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// CreateWalletRequest represents a request to create a wallet.
type CreateWalletRequest struct {
	WalletName      string      `json:"walletName" binding:"required"`
	InitialBalance  types.Money `json:"initialBalance"`
}

// UpdateWalletRequest represents a request to update a wallet.
type UpdateWalletRequest struct {
	WalletName string `json:"walletName" binding:"required"`
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
	FromWalletID int32       `json:"fromWalletId" binding:"required"`
	ToWalletID   int32       `json:"toWalletId" binding:"required"`
	Amount       types.Money `json:"amount" binding:"required"`
}

// TransferResult represents the result of a funds transfer.
type TransferResult struct {
	FromWallet WalletDTO `json:"fromWallet"`
	ToWallet   WalletDTO `json:"toWallet"`
	Amount     types.Money `json:"amount"`
}

// WalletListResult represents a paginated list of wallets.
type WalletListResult struct {
	Wallets    []WalletDTO           `json:"wallets"`
	Pagination types.PaginationResult `json:"pagination"`
}
