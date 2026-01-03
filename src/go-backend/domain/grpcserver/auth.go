package grpcserver

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"wealthjourney/domain/auth"
	protobufv1 "wealthjourney/gen/protobuf/protobuf/v1"
)

// grpcAuthServer implements the AuthService gRPC interface
type grpcAuthServer struct {
	protobufv1.UnimplementedAuthServiceServer
	server *auth.Server
}

// NewAuthServer creates a new AuthService gRPC server
func NewAuthServer(server *auth.Server) protobufv1.AuthServiceServer {
	return &grpcAuthServer{
		server: server,
	}
}

// Register registers a new user using Google OAuth token
func (s *grpcAuthServer) Register(ctx context.Context, req *protobufv1.RegisterRequest) (*protobufv1.RegisterResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	return s.server.Register(ctx, req.Token)
}

// Login logs in a user using Google OAuth token
func (s *grpcAuthServer) Login(ctx context.Context, req *protobufv1.LoginRequest) (*protobufv1.LoginResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	return s.server.Login(ctx, req.Token)
}

// Logout logs out a user and invalidates the token
func (s *grpcAuthServer) Logout(ctx context.Context, req *protobufv1.LogoutRequest) (*protobufv1.LogoutResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	return s.server.Logout(req.Token)
}

// VerifyAuth verifies the authentication status
func (s *grpcAuthServer) VerifyAuth(ctx context.Context, req *protobufv1.VerifyAuthRequest) (*protobufv1.VerifyAuthResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	result, err := s.server.VerifyAuth(req.Token)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	return result, nil
}

// GetAuth retrieves user information by email
func (s *grpcAuthServer) GetAuth(ctx context.Context, req *protobufv1.GetAuthRequest) (*protobufv1.GetAuthResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	return s.server.GetAuth(ctx, req.Email)
}
