package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	redisv8 "github.com/go-redis/redis/v8"

	"wealthjourney/handlers"
	"wealthjourney/domain/auth"
	gateway "wealthjourney/domain/gateway"
	grpcserver "wealthjourney/domain/grpcserver"
	"wealthjourney/domain/repository"
	"wealthjourney/domain/service"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	appmiddleware "wealthjourney/pkg/middleware"
	"wealthjourney/pkg/redis"
	"wealthjourney/pkg/types"
	investmentv1 "wealthjourney/protobuf/v1"
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

	// Set dependencies for handlers
	handlers.SetDependencies(db, cfg)

	// Initialize repositories
	repos := &service.Repositories{
		User:                  repository.NewUserRepository(db),
		Wallet:                repository.NewWalletRepository(db),
		Transaction:           repository.NewTransactionRepository(db),
		Category:              repository.NewCategoryRepository(db),
		Budget:                repository.NewBudgetRepository(db),
		BudgetItem:            repository.NewBudgetItemRepository(db),
		Investment:            repository.NewInvestmentRepository(db),
		InvestmentTransaction: repository.NewInvestmentTransactionRepository(db),
		MarketData:            repository.NewMarketDataRepository(db),
		FXRate:                repository.NewFXRateRepository(db),
	}

	// Initialize redis
	redisClient, err := redis.New(cfg)
	if err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	} else {
		handlers.SetRedis(redisClient)
	}

	// Get the underlying redis.Client for services
	var underlyingRedisClient *redisv8.Client = nil
	if redisClient != nil {
		underlyingRedisClient = redisClient.GetClient()
	}

	// Initialize services
	services := service.NewServices(repos, underlyingRedisClient)

	// Initialize handlers
	h := handlers.NewHandlers(services)

	// Create context for background jobs cancellation
	backgroundCtx, backgroundCancel := context.WithCancel(context.Background())
	defer backgroundCancel()

	// Initialize background price update job
	// This runs every 15 minutes to update investment prices from Yahoo Finance
	// The cache duration is also 15 minutes, so this ensures fresh data
	go func() {
		ticker := time.NewTicker(15 * time.Minute)
		defer ticker.Stop()

		// Wait for server to be fully initialized
		time.Sleep(5 * time.Second)

		log.Println("Background price update job started (runs every 15 minutes)")

		for {
			select {
			case <-ticker.C:
				log.Println("Running scheduled price update...")

				ctx := context.Background()

				// Get all users from the system
				// We use a large page size to get all users in one request
				usersResp, err := services.User.ListUsers(ctx, types.PaginationParams{
					Page:     1,
					PageSize: 1000, // Adjust based on expected user count
					OrderBy:  "",
					Order:    "",
				})

				if err != nil {
					log.Printf("Error fetching users for price update: %v", err)
					continue
				}

				if !usersResp.Success || len(usersResp.Users) == 0 {
					log.Println("No users found for price update")
					continue
				}

				log.Printf("Updating prices for %d users...", len(usersResp.Users))

				successCount := 0
				errorCount := 0

				// Update prices for each user
				for _, user := range usersResp.Users {
					// Call UpdatePrices for this user
					// We don't specify investment IDs to update all investments
					// ForceRefresh=false to use cached data when available
					updateResp, err := services.Investment.UpdatePrices(ctx, user.Id, &investmentv1.UpdatePricesRequest{
						InvestmentIds: []int32{}, // Empty means update all
						ForceRefresh:  false,     // Use cache if available
					})

					if err != nil {
						log.Printf("Failed to update prices for user %d (%s): %v", user.Id, user.Email, err)
						errorCount++
						continue
					}

					if updateResp.Success {
						successCount++
						log.Printf("Updated prices for user %d (%s): %s", user.Id, user.Email, updateResp.Message)
					} else {
						log.Printf("No investments to update for user %d (%s)", user.Id, user.Email)
					}
				}

				log.Printf("Scheduled price update completed: %d users updated successfully, %d errors", successCount, errorCount)

			case <-backgroundCtx.Done():
				log.Println("Background price update job stopped (shutting down)")
				return
			}
		}
	}()

	// Initialize redis
	rdb, err := redis.New(cfg)
	if err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	} else {
		handlers.SetRedis(rdb)
	}

	// Initialize rate limiter
	rateLimiter := appmiddleware.NewRateLimiter(appmiddleware.RateLimiterConfig{
		RequestsPerMinute: cfg.RateLimit.RequestsPerMinute,
		CleanupInterval:   time.Minute,
	})

	// Initialize Gin app
	app := gin.New()

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
	handlers.RegisterRoutes(v1, h, rateLimiter)

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

	// Start REST server in a goroutine
	go func() {
		log.Printf("Starting REST server on port %s...", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start REST server: %v", err)
		}
	}()

	// Initialize and start gRPC server
	authSrv := auth.NewServer(db, rdb, cfg)
	// Wire up user and category services to auth server for default category creation
	authSrv.SetServices(services.User, services.Category)

	// Make the auth server available to REST handlers
	handlers.SetAuthServer(authSrv)

	grpcSrv := grpcserver.NewServer(authSrv, services)
	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50051" // Default gRPC port
	}

	// Initialize gRPC-Gateway server
	gatewayPort := os.Getenv("GATEWAY_PORT")
	if gatewayPort == "" {
		gatewayPort = "8081" // Default gateway port
	}
	gwSrv := gateway.NewServer(gateway.Config{
		GRPCPort: grpcPort,
		HTTPPort: gatewayPort,
	})

	// Register services with the gateway
	if err := gwSrv.RegisterServices(grpcSrv); err != nil {
		log.Fatalf("Failed to register gateway services: %v", err)
	}

	var wg sync.WaitGroup

	// Start gRPC server
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := grpcSrv.Start(grpcPort); err != nil {
			log.Fatalf("Failed to start gRPC server: %v", err)
		}
	}()

	// Start gRPC-Gateway server
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Printf("Starting gRPC-Gateway server on port %s...", gatewayPort)
		if err := gwSrv.Start(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start gRPC-Gateway server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down servers...")

	// Stop background jobs
	backgroundCancel()

	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	// Shutdown REST server
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("REST server forced to shutdown: %v", err)
	}

	// Shutdown gRPC server
	if err := grpcSrv.Stop(ctx); err != nil {
		log.Fatalf("gRPC server forced to shutdown: %v", err)
	}

	// Shutdown gRPC-Gateway server
	if err := gwSrv.Stop(ctx); err != nil {
		log.Fatalf("gRPC-Gateway server forced to shutdown: %v", err)
	}

	// Wait for all servers to stop
	wg.Wait()

	log.Println("Servers exited")
}
