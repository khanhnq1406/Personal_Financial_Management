package handlers

import (
	"wealthjourney/domain/service"
	"wealthjourney/pkg/fx"
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

	// Create FX service for currency conversion (for import service)
	var fxService service.FXService
	if deps != nil && deps.RDB != nil && deps.Cfg != nil {
		fxService = fx.NewExchangeService(deps.Cfg.FX, repos.ExchangeRate, deps.RDB.GetClient())
	}

	// Create import service with categorization and currency conversion support
	importService := service.NewImportService(
		repos.Import,
		repos.Transaction,
		repos.Wallet,
		repos.Category,
		repos.MerchantRule,
		repos.Keyword,
		repos.UserMapping,
		fxService,
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
