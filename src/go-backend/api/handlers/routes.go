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
		users.GET("", h.User.GetUser)       // Get current user
		users.GET("/all", h.User.ListUsers) // List all users (admin)
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
		wallets.GET("/:id", h.Wallet.GetWallet)
		wallets.PUT("/:id", h.Wallet.UpdateWallet)
		wallets.DELETE("/:id", h.Wallet.DeleteWallet)
		wallets.POST("/:id/add", h.Wallet.AddFunds)
		wallets.POST("/:id/withdraw", h.Wallet.WithdrawFunds)
		wallets.POST("/transfer", h.Wallet.TransferFunds)
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
}
