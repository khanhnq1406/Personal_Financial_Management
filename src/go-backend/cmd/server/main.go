package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"wealthjourney/api/handlers"
	"wealthjourney/internal/repository"
	"wealthjourney/internal/service"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	appmiddleware "wealthjourney/pkg/middleware"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode based on config
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.DebugMode
	}
	gin.SetMode(ginMode)

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	repos := &service.Repositories{
		User:   repository.NewUserRepository(db),
		Wallet: repository.NewWalletRepository(db),
	}

	// Initialize services
	services := service.NewServices(repos)

	// Initialize handlers
	h := handlers.NewHandlers(services)

	// Initialize rate limiter
	rateLimiter := appmiddleware.NewRateLimiter(appmiddleware.RateLimiterConfig{
		RequestsPerMinute: cfg.RateLimit.RequestsPerMinute,
		CleanupInterval:   time.Minute,
	})

	// Initialize Gin app
	app := gin.New()

	// Global middleware
	app.Use(appmiddleware.Recovery())
	app.Use(appmiddleware.RequestID())
	app.Use(appmiddleware.Logger(appmiddleware.DefaultLoggerConfig()))

	// Health check endpoint (no rate limiting)
	app.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "wealthjourney-api",
			"version": "2.0.0",
		})
	})

	// API v1 group with rate limiting
	v1 := app.Group("/api/v1")
	v1.Use(appmiddleware.RateLimitByIP(rateLimiter))

	// Register routes
	registerRoutes(v1, h, rateLimiter)

	// Global 404 handler
	app.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":       "NOT_FOUND",
				"message":    "The requested endpoint does not exist",
				"statusCode": 404,
			},
		})
	})

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      app,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s...", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

func registerRoutes(v1 *gin.RouterGroup, h *handlers.AllHandlers, rateLimiter *appmiddleware.RateLimiter) {
	// Auth routes (higher rate limit allowed for auth)
	auth := v1.Group("/auth")
	auth.Use(appmiddleware.RateLimitByIP(rateLimiter))
	{
		// Keep old auth handlers for now - they need to be refactored
		// auth.POST("/register", h.Auth.Register)
		// auth.POST("/login", h.Auth.Login)
		// auth.POST("/logout", h.Auth.Logout)
		// auth.GET("/verify", h.Auth.Verify)
	}

	// User routes (protected)
	users := v1.Group("/users")
	users.Use(appmiddleware.RateLimitByUser(rateLimiter))
	users.Use(handlers.AuthMiddleware()) // Keep using existing auth middleware
	{
		users.GET("", h.User.GetUser)
		// users.GET("/:email", h.User.GetUserByEmail)
		// users.POST("", h.User.CreateUser)
	}

	// Wallet routes (protected)
	wallets := v1.Group("/wallets")
	wallets.Use(appmiddleware.RateLimitByUser(rateLimiter))
	wallets.Use(handlers.AuthMiddleware()) // Keep using existing auth middleware
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
