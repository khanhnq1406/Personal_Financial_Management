package service

import (
	"github.com/go-redis/redis/v8"

	"wealthjourney/domain/repository"
	"wealthjourney/pkg/cache"
)

// Services holds all service instances.
type Services struct {
	Wallet             WalletService
	User               UserService
	Transaction        TransactionService
	Category           CategoryService
	Budget             BudgetService
	Investment         InvestmentService
	FXRate             FXRateService
	PortfolioHistory   PortfolioHistoryService
	MarketData         MarketDataService
}

// NewServices creates all service instances.
func NewServices(repos *Repositories, redisClient *redis.Client) *Services {
	categorySvc := NewCategoryService(repos.Category)
	userSvc := NewUserService(repos.User)

	// Wire up the category service to user service for default category creation
	if us, ok := userSvc.(*userService); ok {
		us.SetCategoryService(categorySvc)
	}

	// Create FX rate service first (needed by other services)
	fxRateSvc := NewFXRateService(repos.FXRate, redisClient)

	// Create gold price service (needed by market data service)
	goldPriceSvc := NewGoldPriceService(redisClient)

	// Create silver price service (needed by market data service)
	silverPriceSvc := NewSilverPriceService(redisClient)

	// Create market data service
	marketDataSvc := NewMarketDataService(repos.MarketData, goldPriceSvc, silverPriceSvc)

	// Create currency cache
	currencyCache := cache.NewCurrencyCache(redisClient)

	// Wire up repositories for currency conversion after fxRateSvc and currencyCache are created
	if us, ok := userSvc.(*userService); ok {
		us.SetRepositories(repos.Wallet, repos.Transaction, repos.Budget, repos.BudgetItem, repos.Investment, fxRateSvc, currencyCache, redisClient)
	}

	walletSvc := NewWalletService(repos.Wallet, repos.User, repos.Transaction, repos.Category, categorySvc, fxRateSvc, currencyCache, repos.Investment, redisClient)

	// Create portfolio history service
	portfolioHistorySvc := NewPortfolioHistoryService(repos.PortfolioHistory, NewInvestmentService(repos.Investment, repos.Wallet, repos.InvestmentTransaction, marketDataSvc, repos.User, fxRateSvc, currencyCache, walletSvc), repos.User, fxRateSvc)

	return &Services{
		Wallet:           walletSvc,
		User:             userSvc,
		Transaction:      NewTransactionService(repos.Transaction, repos.Wallet, repos.Category, repos.User, fxRateSvc, currencyCache),
		Category:         categorySvc,
		Budget:           NewBudgetService(repos.Budget, repos.BudgetItem, repos.User, fxRateSvc, currencyCache),
		Investment:       NewInvestmentService(repos.Investment, repos.Wallet, repos.InvestmentTransaction, marketDataSvc, repos.User, fxRateSvc, currencyCache, walletSvc),
		FXRate:           fxRateSvc,
		PortfolioHistory: portfolioHistorySvc,
		MarketData:       marketDataSvc,
	}
}

// Repositories holds all repository instances.
type Repositories struct {
	Wallet                repository.WalletRepository
	User                  repository.UserRepository
	Transaction           repository.TransactionRepository
	Category              repository.CategoryRepository
	Budget                repository.BudgetRepository
	BudgetItem            repository.BudgetItemRepository
	Investment            repository.InvestmentRepository
	InvestmentTransaction repository.InvestmentTransactionRepository
	MarketData            repository.MarketDataRepository
	FXRate                repository.FXRateRepository
	PortfolioHistory      repository.PortfolioHistoryRepository
	Import                repository.ImportRepository
}

// NewRepositories creates all repository instances.
func NewRepositories(repos *Repositories) *Repositories {
	return repos
}
