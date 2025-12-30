package handlers

import (
	"github.com/gin-gonic/gin"
	appmiddleware "wealthjourney/pkg/middleware"
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

	// User routes (protected)
	users := v1.Group("/users")
	if rateLimiter != nil {
		users.Use(appmiddleware.RateLimitByUser(rateLimiter))
	}
	users.Use(AuthMiddleware())
	{
		users.GET("", h.User.GetUser)           // Get current user
		users.GET("/all", h.User.ListUsers)     // List all users (admin)
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
}
