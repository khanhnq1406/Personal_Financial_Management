package gateway

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/proto"

	grpcv1 "wealthjourney/gen/protobuf/protobuf/v1"
	"wealthjourney/domain/grpcserver"
)

// Server wraps the gRPC-Gateway HTTP server
type Server struct {
	mux         *runtime.ServeMux
	server      *http.Server
	grpcPort    string
	httpPort    string
	grpcDialOpts []grpc.DialOption
}

// Config holds the gateway configuration
type Config struct {
	GRPCPort string // Port where the gRPC server is listening
	HTTPPort string // Port where the gateway HTTP server will listen
}

// NewServer creates a new gRPC-Gateway server
func NewServer(cfg Config) *Server {
	// Create a runtime mux for the gateway
	mux := runtime.NewServeMux(
		runtime.WithForwardResponseOption(setHeader),
	)

	// gRPC dial options
	grpcDialOpts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}

	return &Server{
		mux:         mux,
		grpcPort:    cfg.GRPCPort,
		httpPort:    cfg.HTTPPort,
		grpcDialOpts: grpcDialOpts,
	}
}

// RegisterServices registers all gRPC services with the gateway
func (s *Server) RegisterServices(grpcServer *grpcserver.Server) error {
	ctx := context.Background()
	grpcEndpoint := fmt.Sprintf("localhost:%s", s.grpcPort)

	// Register Wallet Service
	if err := grpcv1.RegisterWalletServiceHandlerFromEndpoint(ctx, s.mux, grpcEndpoint, s.grpcDialOpts); err != nil {
		return fmt.Errorf("failed to register wallet service handler: %w", err)
	}

	// Register Auth Service
	if err := grpcv1.RegisterAuthServiceHandlerFromEndpoint(ctx, s.mux, grpcEndpoint, s.grpcDialOpts); err != nil {
		return fmt.Errorf("failed to register auth service handler: %w", err)
	}

	// Register User Service
	if err := grpcv1.RegisterUserServiceHandlerFromEndpoint(ctx, s.mux, grpcEndpoint, s.grpcDialOpts); err != nil {
		return fmt.Errorf("failed to register user service handler: %w", err)
	}

	return nil
}

// Start starts the gRPC-Gateway HTTP server
func (s *Server) Start() error {
	s.server = &http.Server{
		Addr:         ":" + s.httpPort,
		Handler:      s.mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return s.server.ListenAndServe()
}

// Stop gracefully shuts down the gateway server
func (s *Server) Stop(ctx context.Context) error {
	if s.server != nil {
		return s.server.Shutdown(ctx)
	}
	return nil
}

// setHeader adds custom headers to the response
func setHeader(_ context.Context, w http.ResponseWriter, _ proto.Message) error {
	// Add CORS headers if needed
	w.Header().Set("Content-Type", "application/json")
	return nil
}
