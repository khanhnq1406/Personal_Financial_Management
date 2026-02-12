package handlers

import (
	"wealthjourney/domain/service"
	"wealthjourney/pkg/jobs"
)

// AllHandlers contains all handler instances.
type AllHandlers struct {
	Wallet      *WalletHandlers
	User        *UserHandlers
	Auth        *AuthHandlers
	Transaction *TransactionHandlers
	Category    *CategoryHandlers
	Budget      *BudgetHandlers
	Investment  *InvestmentHandlers
	Gold        *GoldHandler
	Silver      *SilverHandler
	Import      *ImportHandler
}

// NewHandlers creates all handler instances with proper dependency injection.
func NewHandlers(services *service.Services, repos *service.Repositories) *AllHandlers {
	// Get dependencies
	deps := GetDependencies()

	// Create FX rate service for currency conversion (for import service)
	var fxService service.FXRateService
	if deps != nil && deps.RDB != nil && repos.FXRate != nil {
		fxService = service.NewFXRateService(repos.FXRate, deps.RDB.GetClient())
	}

	// Create import job queue (Redis-based) with adapter
	var adaptedQueue service.ImportJobQueue
	if deps != nil && deps.RDB != nil {
		redisQueue := jobs.NewRedisImportQueue(deps.RDB.GetClient())
		adaptedQueue = jobs.NewImportQueueAdapter(redisQueue)
	}

	// Create import service with categorization and currency conversion support
	importService := service.NewImportService(
		deps.DB,
		repos.Import,
		repos.Transaction,
		repos.Wallet,
		repos.Category,
		repos.MerchantRule,
		repos.Keyword,
		repos.UserMapping,
		fxService,
		adaptedQueue,
	)

	return &AllHandlers{
		Wallet:      NewWalletHandlers(services.Wallet),
		User:        NewUserHandlers(services.User),
		Auth:        NewAuthHandlers(services.User),
		Transaction: NewTransactionHandlers(services.Transaction),
		Category:    NewCategoryHandlers(services.Category),
		Budget:      NewBudgetHandlers(services.Budget),
		Investment:  NewInvestmentHandlers(services.Investment, services.PortfolioHistory, services.MarketData),
		Gold:        NewGoldHandler(),
		Silver:      NewSilverHandler(),
		Import:      NewImportHandler(repos.Import, importService),
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
