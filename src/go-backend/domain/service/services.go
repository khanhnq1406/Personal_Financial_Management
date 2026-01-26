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
	Budget      BudgetService
	Investment  InvestmentService
}

// NewServices creates all service instances.
func NewServices(repos *Repositories) *Services {
	categorySvc := NewCategoryService(repos.Category)
	userSvc := NewUserService(repos.User)

	// Wire up the category service to user service for default category creation
	if us, ok := userSvc.(*userService); ok {
		us.SetCategoryService(categorySvc)
	}

	// Create market data service
	marketDataSvc := NewMarketDataService(repos.MarketData)

	return &Services{
		Wallet:      NewWalletService(repos.Wallet, repos.User, repos.Transaction, repos.Category, categorySvc),
		User:        userSvc,
		Transaction: NewTransactionService(repos.Transaction, repos.Wallet, repos.Category),
		Category:    categorySvc,
		Budget:      NewBudgetService(repos.Budget, repos.BudgetItem, repos.User),
		Investment:  NewInvestmentService(repos.Investment, repos.Wallet, repos.InvestmentTransaction, marketDataSvc),
	}
}

// Repositories holds all repository instances.
type Repositories struct {
	Wallet                    repository.WalletRepository
	User                      repository.UserRepository
	Transaction               repository.TransactionRepository
	Category                  repository.CategoryRepository
	Budget                    repository.BudgetRepository
	BudgetItem                repository.BudgetItemRepository
	Investment                repository.InvestmentRepository
	InvestmentTransaction     repository.InvestmentTransactionRepository
	MarketData                repository.MarketDataRepository
}

// NewRepositories creates all repository instances.
func NewRepositories(repos *Repositories) *Repositories {
	return repos
}
