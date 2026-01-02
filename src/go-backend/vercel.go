package handler

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"wealthjourney/api/handlers"
	"wealthjourney/domain/repository"
	"wealthjourney/domain/service"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/redis"
)

var (
	app *gin.Engine
	h   *handlers.AllHandlers
	cfg *config.Config
)

func init() {
	// Set Gin to release mode for Vercel
	gin.SetMode(gin.ReleaseMode)

	// Initialize Gin app
	app = gin.New()
	app.Use(gin.Recovery())
	app.Use(loggerMiddleware())

	// Load configuration
	var err error
	cfg, err = config.Load()
	if err != nil {
		log.Printf("Warning: Failed to load config: %v", err)
	}

	// Initialize database (only if not in Vercel environment or if DB is configured)
	if cfg != nil && (os.Getenv("VERCEL") != "1" || os.Getenv("DATABASE_URL") != "") {
		db, err := database.New(cfg)
		if err != nil {
			log.Printf("Warning: Database connection failed: %v", err)
		} else {
			// Initialize repositories
			repos := &service.Repositories{
				User:   repository.NewUserRepository(db),
				Wallet: repository.NewWalletRepository(db),
			}

			// Initialize services
			services := service.NewServices(repos)

			// Initialize handlers
			h = handlers.NewHandlers(services)
		}
	}

	// Initialize Redis (only if configured)
	if cfg != nil && os.Getenv("REDIS_URL") != "" {
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

	// API v1 group (no rate limiting for Vercel)
	v1 := app.Group("/api/v1")
	if h != nil {
		handlers.RegisterRoutes(v1, h, nil)
	} else {
		// Fallback to old handlers if service initialization failed
		registerFallbackRoutes(v1)
	}

	// 404 handler
	app.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "not_found",
			"message": "The requested endpoint does not exist",
			"path":    c.Request.URL.Path,
		})
	})
}

// registerFallbackRoutes registers routes using old handler functions
// Used when service layer initialization fails
func registerFallbackRoutes(v1 *gin.RouterGroup) {
	// Auth routes
	auth := v1.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
		auth.POST("/logout", handlers.Logout)
		auth.GET("/verify", handlers.VerifyAuth)
	}
}

// loggerMiddleware is a simple logger for Gin
func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("%s %s - %s", c.Request.Method, c.Request.URL.Path, c.ClientIP())
		c.Next()
	}
}
