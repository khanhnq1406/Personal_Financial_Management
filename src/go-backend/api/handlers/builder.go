package handlers

import (
	"wealthjourney/domain/service"
)

// AllHandlers contains all handler instances.
type AllHandlers struct {
	Wallet      *WalletHandlers
	User        *UserHandlers
	Auth        *AuthHandlers
	Transaction *TransactionHandlers
	Category    *CategoryHandlers
	Budget      *BudgetHandlers
}

// NewHandlers creates all handler instances with proper dependency injection.
func NewHandlers(services *service.Services) *AllHandlers {
	return &AllHandlers{
		Wallet:      NewWalletHandlers(services.Wallet),
		User:        NewUserHandlers(services.User),
		Auth:        NewAuthHandlers(services.User),
		Transaction: NewTransactionHandlers(services.Transaction),
		Category:    NewCategoryHandlers(services.Category),
		Budget:      NewBudgetHandlers(services.Budget),
	}
}

// AuthHandlers handles authentication-related HTTP requests.
type AuthHandlers struct {
	userService service.UserService
}

// NewAuthHandlers creates auth handlers.
func NewAuthHandlers(userService service.UserService) *AuthHandlers {
	return &AuthHandlers{
		userService: userService,
	}
}
