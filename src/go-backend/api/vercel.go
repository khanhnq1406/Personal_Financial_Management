package api

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"wealthjourney/api/handlers"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/redis"
)

var (
	app *gin.Engine
)

func init() {
	// Set Gin to release mode for Vercel
	gin.SetMode(gin.ReleaseMode)

	// Initialize Gin app
	app = gin.New()
	app.Use(gin.Recovery())
	app.Use(loggerMiddleware())

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Printf("Warning: Failed to load config: %v", err)
	}

	// Initialize database (only if not in Vercel environment or if DB is configured)
	if os.Getenv("VERCEL") != "1" || os.Getenv("DATABASE_URL") != "" {
		db, err := database.New(cfg)
		if err != nil {
			log.Printf("Warning: Database connection failed: %v", err)
		} else {
			// Store db and cfg in handler dependencies
			handlers.SetDependencies(db, cfg)
		}
	}

	// Initialize Redis (only if configured)
	if os.Getenv("REDIS_URL") != "" {
		rdb, err := redis.New(cfg)
		if err != nil {
			log.Printf("Warning: Redis connection failed: %v", err)
		} else {
			handlers.SetRedis(rdb)
		}
	}

	// Register routes
	registerRoutes(app)
}

// Handler is the entry point for Vercel serverless functions
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}

// registerRoutes sets up all API routes
func registerRoutes(app *gin.Engine) {
	// Health check endpoint
	app.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "wealthjourney-api",
			"version": "1.0.0",
		})
	})

	// API v1 group
	v1 := app.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/verify", handlers.VerifyAuth)
		}

		// User routes (protected)
		users := v1.Group("/users")
		users.Use(handlers.AuthMiddleware())
		{
			users.GET("", handlers.GetAllUsers)
			users.GET("/:email", handlers.GetUserByEmail)
			users.POST("", handlers.CreateUser)
		}

		// Wallet routes (protected)
		wallets := v1.Group("/wallets")
		wallets.Use(handlers.AuthMiddleware())
		{
			wallets.POST("", handlers.CreateWallet)
			wallets.GET("", handlers.ListWallets)
			wallets.GET("/:id", handlers.GetWallet)
		}
	}

	// Swagger documentation (optional)
	// app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 404 handler
	app.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": "The requested endpoint does not exist",
			"path":    c.Request.URL.Path,
		})
	})
}

// loggerMiddleware is a simple logger for Gin
func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("%s %s - %s", c.Request.Method, c.Request.URL.Path, c.ClientIP())
		c.Next()
	}
}
