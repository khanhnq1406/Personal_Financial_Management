package service

import (
	"wealthjourney/pkg/types"
	protobufv1 "wealthjourney/protobuf/v1"
)

// Proto type aliases for user DTOs
// These allow the service layer to use proto types directly
type User = protobufv1.User

// Proto type aliases for wallet DTOs
// These allow the service layer to use proto types directly

// CreateWalletRequest uses proto CreateWalletRequest from gen/protobuf/v1/wallet.pb.go
type CreateWalletRequest = protobufv1.CreateWalletRequest

// UpdateWalletRequest uses proto UpdateWalletRequest from gen/protobuf/v1/wallet.pb.go
type UpdateWalletRequest = protobufv1.UpdateWalletRequest

// AddFundsRequest uses proto AddFundsRequest from gen/protobuf/v1/wallet.pb.go
type AddFundsRequest = protobufv1.AddFundsRequest

// WithdrawFundsRequest uses proto WithdrawFundsRequest from gen/protobuf/v1/wallet.pb.go
type WithdrawFundsRequest = protobufv1.WithdrawFundsRequest

// TransferFundsRequest uses proto TransferFundsRequest from gen/protobuf/v1/wallet.pb.go
type TransferFundsRequest = protobufv1.TransferFundsRequest

// Helper functions for working with proto types in service layer

// NewCreateWalletRequest creates a new CreateWalletRequest from service parameters.
func NewCreateWalletRequest(name string, amount int64, currency string) *CreateWalletRequest {
	return &protobufv1.CreateWalletRequest{
		WalletName: name,
		InitialBalance: &protobufv1.Money{
			Amount:   amount,
			Currency: currency,
		},
	}
}

// NewUpdateWalletRequest creates a new UpdateWalletRequest.
func NewUpdateWalletRequest(name string) *UpdateWalletRequest {
	return &protobufv1.UpdateWalletRequest{
		WalletName: name,
	}
}

// NewAddFundsRequest creates a new AddFundsRequest.
func NewAddFundsRequest(amount int64, currency string) *AddFundsRequest {
	return &protobufv1.AddFundsRequest{
		Amount: &protobufv1.Money{
			Amount:   amount,
			Currency: currency,
		},
	}
}

// NewWithdrawFundsRequest creates a new WithdrawFundsRequest.
func NewWithdrawFundsRequest(amount int64, currency string) *WithdrawFundsRequest {
	return &protobufv1.WithdrawFundsRequest{
		Amount: &protobufv1.Money{
			Amount:   amount,
			Currency: currency,
		},
	}
}

// NewTransferFundsRequest creates a new TransferFundsRequest.
func NewTransferFundsRequest(fromWalletID, toWalletID int32, amount int64, currency string) *TransferFundsRequest {
	return &protobufv1.TransferFundsRequest{
		FromWalletId: fromWalletID,
		ToWalletId:   toWalletID,
		Amount: &protobufv1.Money{
			Amount:   amount,
			Currency: currency,
		},
	}
}

// MoneyToProtoMoney converts types.Money to proto Money.
func MoneyToProtoMoney(m types.Money) *protobufv1.Money {
	return &protobufv1.Money{
		Amount:   m.Amount,
		Currency: m.Currency,
	}
}

// ProtoMoneyToMoney converts proto Money to types.Money.
func ProtoMoneyToMoney(m *protobufv1.Money) types.Money {
	if m == nil {
		return types.Money{Amount: 0, Currency: types.USD}
	}
	return types.Money{
		Amount:   m.Amount,
		Currency: m.Currency,
	}
}

// ProtoToPaginationParams converts proto PaginationParams to service PaginationParams.
func ProtoToPaginationParams(p *protobufv1.PaginationParams) types.PaginationParams {
	if p == nil {
		return types.PaginationParams{
			Page:     1,
			PageSize: 10,
			OrderBy:  "id",
			Order:    "asc",
		}
	}
	return types.PaginationParams{
		Page:     int(p.Page),
		PageSize: int(p.PageSize),
		OrderBy:  p.OrderBy,
		Order:    p.Order,
	}
}
