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
	return &Services{
		Wallet:      NewWalletService(repos.Wallet, repos.User),
		User:        NewUserService(repos.User),
		Transaction: NewTransactionService(repos.Transaction, repos.Wallet, repos.Category),
		Category:    NewCategoryService(repos.Category),
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
