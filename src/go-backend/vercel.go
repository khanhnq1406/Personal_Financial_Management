package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"

	"wealthjourney/api/handlers"
	"wealthjourney/domain/auth"
	grpcserver "wealthjourney/domain/grpcserver"
	"wealthjourney/domain/repository"
	"wealthjourney/domain/service"
	grpcv1 "wealthjourney/gen/protobuf/protobuf/v1"
	"wealthjourney/pkg/config"
	"wealthjourney/pkg/database"
	"wealthjourney/pkg/redis"
)

// corsWrapper wraps an http.Handler to add CORS headers
type corsWrapper struct {
	handler http.Handler
}

func (w *corsWrapper) ServeHTTP(wr http.ResponseWriter, r *http.Request) {
	// Set CORS headers for all requests
	wr.Header().Set("Access-Control-Allow-Origin", "*")
	wr.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	wr.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
	wr.Header().Set("Access-Control-Expose-Headers", "Content-Length")
	wr.Header().Set("Access-Control-Allow-Credentials", "true")
	wr.Header().Set("Access-Control-Max-Age", "43200")

	// Handle OPTIONS preflight requests
	if r.Method == "OPTIONS" {
		wr.WriteHeader(http.StatusNoContent)
		return
	}

	w.handler.ServeHTTP(wr, r)
}

var (
	app        *gin.Engine
	h          *handlers.AllHandlers
	cfg        *config.Config
	gatewayMux *runtime.ServeMux
	svc        *service.Services
	walletSrv  grpcv1.WalletServiceServer
	authSrv    grpcv1.AuthServiceServer
	userSrv    grpcv1.UserServiceServer
)

func init() {
	// Set Gin to release mode for Vercel
	gin.SetMode(gin.ReleaseMode)

	// Initialize Gin app
	app = gin.New()
	app.Use(gin.Recovery())
	app.Use(loggerMiddleware())

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
			svc = service.NewServices(repos)

			// Initialize handlers
			h = handlers.NewHandlers(svc)

			// Initialize auth domain server
			authDomainSrv := auth.NewServer(db, nil, cfg)

			// Initialize gRPC service implementations for gateway
			walletSrv = grpcserver.NewWalletServer(svc.Wallet)
			authSrv = grpcserver.NewAuthServer(authDomainSrv)
			userSrv = grpcserver.NewUserServer(svc.User)

			// Initialize gRPC-Gateway mux
			gatewayMux = runtime.NewServeMux()

			// Register gRPC services directly with the gateway (no network needed)
			ctx := context.Background()
			if err := registerGatewayServices(ctx); err != nil {
				log.Printf("Warning: Failed to register gateway services: %v", err)
			}
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

// registerGatewayServices registers gRPC services with the gateway mux
func registerGatewayServices(ctx context.Context) error {
	// Register Wallet Service
	if err := grpcv1.RegisterWalletServiceHandlerServer(ctx, gatewayMux, walletSrv); err != nil {
		return err
	}

	// Register Auth Service
	if err := grpcv1.RegisterAuthServiceHandlerServer(ctx, gatewayMux, authSrv); err != nil {
		return err
	}

	// Register User Service
	if err := grpcv1.RegisterUserServiceHandlerServer(ctx, gatewayMux, userSrv); err != nil {
		return err
	}

	return nil
}

// Handler is the entry point for Vercel serverless functions
func Handler(w http.ResponseWriter, r *http.Request) {
	// Wrap the Gin app with CORS handling
	wrappedHandler := &corsWrapper{handler: app}
	wrappedHandler.ServeHTTP(w, r)
}

// registerRoutes sets up all API routes
func registerRoutes(app *gin.Engine) {
	// Global OPTIONS handler - must be registered first
	app.OPTIONS("/*path", func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "43200")
		c.AbortWithStatus(http.StatusNoContent)
	})

	// Health check endpoint
	app.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "wealthjourney-api",
			"version": "2.0.0",
		})
	})

	// API v1 group (no rate limiting for Vercel)
	v1 := app.Group("/api/v1")

	if gatewayMux != nil {
		// Use gRPC-Gateway for auto-generated endpoints
		// Exclude OPTIONS method as it's handled above
		v1.GET("/*path", gin.WrapH(gatewayMux))
		v1.POST("/*path", gin.WrapH(gatewayMux))
		v1.PUT("/*path", gin.WrapH(gatewayMux))
		v1.PATCH("/*path", gin.WrapH(gatewayMux))
		v1.DELETE("/*path", gin.WrapH(gatewayMux))
	} else if h != nil {
		// Fallback to manual handlers
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
