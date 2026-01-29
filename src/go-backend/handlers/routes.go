package handlers

import (
	appmiddleware "wealthjourney/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers all API routes.
// This function supports both rate limited (main server) and non-rate limited (vercel) setups.
// If rateLimiter is nil, rate limiting middleware is skipped.
func RegisterRoutes(
	v1 *gin.RouterGroup,
	h *AllHandlers,
	rateLimiter *appmiddleware.RateLimiter,
) {
	// Auth routes (higher rate limit allowed for auth)
	auth := v1.Group("/auth")
	if rateLimiter != nil {
		auth.Use(appmiddleware.RateLimitByIP(rateLimiter))
	}
	{
		auth.POST("/register", Register)
		auth.POST("/login", Login)
		auth.POST("/logout", Logout)
		auth.GET("/verify", VerifyAuth)
	}

	// Protected auth routes (require authentication)
	authProtected := v1.Group("/auth")
	authProtected.Use(AuthMiddleware())
	if rateLimiter != nil {
		authProtected.Use(appmiddleware.RateLimitByIP(rateLimiter))
	}
	{
		authProtected.GET("", GetAuth) // Get current authenticated user
	}

	// User routes (protected)
	users := v1.Group("/users")
	if rateLimiter != nil {
		users.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	users.Use(AuthMiddleware())
	{
		users.GET("", h.User.GetUser)           // Get current user
		users.GET("/all", h.User.ListUsers)     // List all users (admin)
		users.PUT("/preferences", h.User.UpdatePreferences) // Update user preferences
		users.GET("/:email", h.User.GetUserByEmail)
		users.POST("", h.User.CreateUser)
		users.PUT("", h.User.UpdateUser)
		users.DELETE("", h.User.DeleteUser)
	}

	// Wallet routes (protected)
	wallets := v1.Group("/wallets")
	if rateLimiter != nil {
		wallets.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	wallets.Use(AuthMiddleware())
	{
		wallets.POST("", h.Wallet.CreateWallet)
		wallets.GET("", h.Wallet.ListWallets)
		// Specific routes must come before :id parameterized route
		wallets.GET("/total-balance", h.Wallet.GetTotalBalance)
		wallets.GET("/balance-history", h.Wallet.GetBalanceHistory)
		wallets.GET("/monthly-dominance", h.Wallet.GetMonthlyDominance)
		wallets.POST("/transfer", h.Wallet.TransferFunds)
		// Wallet investment routes (must come before :id parameterized route)
		wallets.GET("/:id/investments", h.Investment.ListInvestments)
		wallets.GET("/:id/portfolio-summary", h.Investment.GetPortfolioSummary)
		// Parameterized routes
		wallets.GET("/:id", h.Wallet.GetWallet)
		wallets.PUT("/:id", h.Wallet.UpdateWallet)
		wallets.POST("/:id/delete", h.Wallet.DeleteWallet)
		wallets.POST("/:id/add", h.Wallet.AddFunds)
		wallets.POST("/:id/withdraw", h.Wallet.WithdrawFunds)
		wallets.POST("/:id/adjust", h.Wallet.AdjustBalance)
	}

	// Transaction routes (protected)
	transactions := v1.Group("/transactions")
	if rateLimiter != nil {
		transactions.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	transactions.Use(AuthMiddleware())
	{
		transactions.POST("", h.Transaction.CreateTransaction)
		transactions.GET("", h.Transaction.ListTransactions)
		// Specific routes must come before :id parameterized route
		transactions.GET("/available-years", h.Transaction.GetAvailableYears)
		transactions.GET("/financial-report", h.Transaction.GetFinancialReport)
		// Parameterized routes
		transactions.GET("/:id", h.Transaction.GetTransaction)
		transactions.PUT("/:id", h.Transaction.UpdateTransaction)
		transactions.DELETE("/:id", h.Transaction.DeleteTransaction)
	}

	// Category routes (protected)
	categories := v1.Group("/categories")
	if rateLimiter != nil {
		categories.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	categories.Use(AuthMiddleware())
	{
		categories.POST("", h.Category.CreateCategory)
		categories.GET("", h.Category.ListCategories)
		categories.GET("/:id", h.Category.GetCategory)
		categories.PUT("/:id", h.Category.UpdateCategory)
		categories.DELETE("/:id", h.Category.DeleteCategory)
	}

	// Budget routes (protected)
	budgets := v1.Group("/budgets")
	if rateLimiter != nil {
		budgets.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	budgets.Use(AuthMiddleware())
	{
		budgets.POST("", h.Budget.CreateBudget)
		budgets.GET("", h.Budget.ListBudgets)
		budgets.GET("/:id", h.Budget.GetBudget)
		budgets.PUT("/:id", h.Budget.UpdateBudget)
		budgets.DELETE("/:id", h.Budget.DeleteBudget)
		budgets.GET("/:id/items", h.Budget.GetBudgetItems)
		budgets.POST("/:id/items", h.Budget.CreateBudgetItem)
		budgets.PUT("/:id/items/:itemId", h.Budget.UpdateBudgetItem)
		budgets.DELETE("/:id/items/:itemId", h.Budget.DeleteBudgetItem)
	}

	// Investment routes (protected)
	investments := v1.Group("/investments")
	if rateLimiter != nil {
		investments.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	investments.Use(AuthMiddleware())
	{
		// Investment management routes
		investments.POST("", h.Investment.CreateInvestment)
		investments.POST("/update-prices", h.Investment.UpdatePrices)
		// Symbol search routes (must come before :id parameterized route)
		investments.GET("/symbols/search", h.Investment.SearchSymbols)
		// Specific routes must come before :id parameterized route
		// Investment transaction routes (use :id to be consistent with other routes)
		investments.GET("/:id/transactions", h.Investment.ListTransactions)
		investments.POST("/:id/transactions", h.Investment.AddTransaction)
		// Parameterized investment routes
		investments.GET("/:id", h.Investment.GetInvestment)
		investments.PUT("/:id", h.Investment.UpdateInvestment)
		investments.DELETE("/:id", h.Investment.DeleteInvestment)
	}

	// Investment transaction routes (protected)
	investmentTransactions := v1.Group("/investment-transactions")
	if rateLimiter != nil {
		investmentTransactions.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	investmentTransactions.Use(AuthMiddleware())
	{
		investmentTransactions.PUT("/:id", h.Investment.EditTransaction)
		investmentTransactions.DELETE("/:id", h.Investment.DeleteTransaction)
	}
}
