package service

import (
	"wealthjourney/domain/models"
	"wealthjourney/pkg/types"
	protobufv1 "wealthjourney/protobuf/v1"
)

// WalletMapper handles conversion between domain models and proto types.
type WalletMapper struct{}

// NewWalletMapper creates a new WalletMapper.
func NewWalletMapper() *WalletMapper {
	return &WalletMapper{}
}

// ModelToProto converts a Wallet domain model to proto Wallet type.
func (m *WalletMapper) ModelToProto(wallet *models.Wallet) *protobufv1.Wallet {
	if wallet == nil {
		return nil
	}

	return &protobufv1.Wallet{
		Id:         wallet.ID,
		UserId:     wallet.UserID,
		WalletName: wallet.WalletName,
		Balance: &protobufv1.Money{
			Amount:   wallet.Balance,
			Currency: wallet.Currency,
		},
		CreatedAt: wallet.CreatedAt.Unix(),
		UpdatedAt: wallet.UpdatedAt.Unix(),
		Type:      wallet.Type,
	}
}

// ModelSliceToProto converts a slice of Wallet models to proto Wallets.
func (m *WalletMapper) ModelSliceToProto(wallets []*models.Wallet) []*protobufv1.Wallet {
	if wallets == nil {
		return nil
	}

	result := make([]*protobufv1.Wallet, len(wallets))
	for i, w := range wallets {
		result[i] = m.ModelToProto(w)
	}
	return result
}

// PaginationResultToProto converts service PaginationResult to proto.
func (m *WalletMapper) PaginationResultToProto(result types.PaginationResult) *protobufv1.PaginationResult {
	return &protobufv1.PaginationResult{
		Page:       int32(result.Page),
		PageSize:   int32(result.PageSize),
		TotalCount: int32(result.TotalCount),
		TotalPages: int32(result.TotalPages),
	}
}

// UserMapper handles conversion between domain models and proto types.
type UserMapper struct{}

// NewUserMapper creates a new UserMapper.
func NewUserMapper() *UserMapper {
	return &UserMapper{}
}

// ModelToProto converts a User domain model to proto User type.
func (m *UserMapper) ModelToProto(user *models.User) *protobufv1.User {
	if user == nil {
		return nil
	}

	return &protobufv1.User{
		Id:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Picture:   user.Picture,
		CreatedAt: user.CreatedAt.Unix(),
		UpdatedAt: user.UpdatedAt.Unix(),
	}
}

// ModelSliceToProto converts a slice of User models to proto Users.
func (m *UserMapper) ModelSliceToProto(users []*models.User) []*protobufv1.User {
	if users == nil {
		return nil
	}

	result := make([]*protobufv1.User, len(users))
	for i, u := range users {
		result[i] = m.ModelToProto(u)
	}
	return result
}

// PaginationResultToProto converts service PaginationResult to proto.
func (m *UserMapper) PaginationResultToProto(result types.PaginationResult) *protobufv1.PaginationResult {
	return &protobufv1.PaginationResult{
		Page:       int32(result.Page),
		PageSize:   int32(result.PageSize),
		TotalCount: int32(result.TotalCount),
		TotalPages: int32(result.TotalPages),
	}
}

// BudgetMapper handles conversion between budget domain models and proto types.
type BudgetMapper struct{}

// NewBudgetMapper creates a new BudgetMapper.
func NewBudgetMapper() *BudgetMapper {
	return &BudgetMapper{}
}

// ModelToProto converts a Budget domain model to proto Budget type.
func (m *BudgetMapper) ModelToProto(budget *models.Budget) *protobufv1.Budget {
	if budget == nil {
		return nil
	}

	return &protobufv1.Budget{
		Id:        budget.ID,
		UserId:    budget.UserID,
		Name:      budget.Name,
		Total: &protobufv1.Money{
			Amount:   budget.Total,
			Currency: "VND", // Budgets use VND as default currency
		},
		CreatedAt: budget.CreatedAt.Unix(),
		UpdatedAt: budget.UpdatedAt.Unix(),
	}
}

// ModelSliceToProto converts a slice of Budget models to proto Budgets.
func (m *BudgetMapper) ModelSliceToProto(budgets []*models.Budget) []*protobufv1.Budget {
	if budgets == nil {
		return nil
	}

	result := make([]*protobufv1.Budget, len(budgets))
	for i, b := range budgets {
		result[i] = m.ModelToProto(b)
	}
	return result
}

// ModelItemToProto converts a BudgetItem domain model to proto BudgetItem type.
func (m *BudgetMapper) ModelItemToProto(item *models.BudgetItem) *protobufv1.BudgetItem {
	if item == nil {
		return nil
	}

	return &protobufv1.BudgetItem{
		Id:        item.ID,
		BudgetId:  item.BudgetID,
		Name:      item.Name,
		Total: &protobufv1.Money{
			Amount:   item.Total,
			Currency: "VND", // Budget items use VND as default currency
		},
		CreatedAt: item.CreatedAt.Unix(),
		UpdatedAt: item.UpdatedAt.Unix(),
	}
}

// ModelSliceToProtoItems converts a slice of BudgetItem models to proto BudgetItems.
func (m *BudgetMapper) ModelSliceToProtoItems(items []*models.BudgetItem) []*protobufv1.BudgetItem {
	if items == nil {
		return nil
	}

	result := make([]*protobufv1.BudgetItem, len(items))
	for i, item := range items {
		result[i] = m.ModelItemToProto(item)
	}
	return result
}

// PaginationResultToProto converts service PaginationResult to proto.
func (m *BudgetMapper) PaginationResultToProto(result types.PaginationResult) *protobufv1.PaginationResult {
	return &protobufv1.PaginationResult{
		Page:       int32(result.Page),
		PageSize:   int32(result.PageSize),
		TotalCount: int32(result.TotalCount),
		TotalPages: int32(result.TotalPages),
	}
}
