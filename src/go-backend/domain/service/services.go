package service

import (
	"wealthjourney/domain/repository"
)

// Services holds all service instances.
type Services struct {
	Wallet      WalletService
	User        UserService
	Transaction TransactionService
	Category    CategoryService
}

// NewServices creates all service instances.
func NewServices(repos *Repositories) *Services {
	categorySvc := NewCategoryService(repos.Category)
	userSvc := NewUserService(repos.User)

	// Wire up the category service to user service for default category creation
	if us, ok := userSvc.(*userService); ok {
		us.SetCategoryService(categorySvc)
	}

	return &Services{
		Wallet:      NewWalletService(repos.Wallet, repos.User, repos.Transaction, repos.Category),
		User:        userSvc,
		Transaction: NewTransactionService(repos.Transaction, repos.Wallet, repos.Category),
		Category:    categorySvc,
	}
}

// Repositories holds all repository instances.
type Repositories struct {
	Wallet      repository.WalletRepository
	User        repository.UserRepository
	Transaction repository.TransactionRepository
	Category    repository.CategoryRepository
}

// NewRepositories creates all repository instances.
func NewRepositories(repos *Repositories) *Repositories {
	return repos
}
