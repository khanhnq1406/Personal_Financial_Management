package grpcserver

import (
	"context"
	"fmt"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	protobufv1 "wealthjourney/gen/protobuf/v1"
	"wealthjourney/domain/auth"
	"wealthjourney/domain/service"
)

// Server wraps the gRPC server and all dependencies
type Server struct {
	server   *grpc.Server
	authSrv  *auth.Server
	services *service.Services
}

// NewServer creates a new gRPC server
func NewServer(authSrv *auth.Server, services *service.Services) *Server {
	s := grpc.NewServer()

	// Register services
	protobufv1.RegisterAuthServiceServer(s, NewAuthServer(authSrv))
	protobufv1.RegisterUserServiceServer(s, NewUserServer(services.User))
	protobufv1.RegisterWalletServiceServer(s, NewWalletServer(services.Wallet))

	// Register reflection service for debugging
	reflection.Register(s)

	return &Server{
		server:   s,
		authSrv:  authSrv,
		services: services,
	}
}

// Start starts the gRPC server on the specified port
func (s *Server) Start(port string) error {
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		return fmt.Errorf("failed to listen on port %s: %w", port, err)
	}

	fmt.Printf("gRPC server starting on port %s...\n", port)
	return s.server.Serve(lis)
}

// Stop stops the gRPC server gracefully
func (s *Server) Stop(ctx context.Context) error {
	fmt.Println("Shutting down gRPC server...")
	s.server.GracefulStop()
	return nil
}

// GetServer returns the underlying gRPC server for middleware configuration
func (s *Server) GetServer() *grpc.Server {
	return s.server
}
