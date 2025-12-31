package grpcserver

import (
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	authv1 "wealthjourney/gen/auth/v1"
	"wealthjourney/internal/auth"
)

// grpcAuthServer implements the AuthService gRPC interface
type grpcAuthServer struct {
	authv1.UnimplementedAuthServiceServer
	server *auth.Server
}

// NewAuthServer creates a new AuthService gRPC server
func NewAuthServer(server *auth.Server) authv1.AuthServiceServer {
	return &grpcAuthServer{
		server: server,
	}
}

// Register registers a new user using Google OAuth token
func (s *grpcAuthServer) Register(ctx context.Context, req *authv1.RegisterRequest) (*authv1.RegisterResponse, error) {
	if req.GoogleToken == "" {
		return nil, status.Error(codes.InvalidArgument, "google_token is required")
	}

	result, err := s.server.Register(ctx, req.GoogleToken)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var userData *authv1.User
	if result.Data != nil {
		userData = &authv1.User{
			Id:        result.Data.ID,
			Email:     result.Data.Email,
			Name:      result.Data.Name,
			Picture:   result.Data.Picture,
			CreatedAt: result.Data.CreatedAt.Unix(),
			UpdatedAt: result.Data.CreatedAt.Unix(), // Use CreatedAt if UpdatedAt not available
		}
	}

	return &authv1.RegisterResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      userData,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Login logs in a user using Google OAuth token
func (s *grpcAuthServer) Login(ctx context.Context, req *authv1.LoginRequest) (*authv1.LoginResponse, error) {
	if req.GoogleToken == "" {
		return nil, status.Error(codes.InvalidArgument, "google_token is required")
	}

	result, err := s.server.Login(ctx, req.GoogleToken)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	var loginData *authv1.LoginData
	if result.Data != nil {
		loginData = &authv1.LoginData{
			AccessToken: result.Data.AccessToken,
			Email:       result.Data.Email,
			Fullname:    result.Data.Fullname,
			Picture:     result.Data.Picture,
		}
	}

	return &authv1.LoginResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      loginData,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Logout logs out a user and invalidates the token
func (s *grpcAuthServer) Logout(ctx context.Context, req *authv1.LogoutRequest) (*authv1.LogoutResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	result, err := s.server.Logout(req.Token)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &authv1.LogoutResponse{
		Success:   result.Success,
		Message:   result.Message,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// VerifyAuth verifies the authentication status
func (s *grpcAuthServer) VerifyAuth(ctx context.Context, req *authv1.VerifyAuthRequest) (*authv1.VerifyAuthResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	result, _, err := s.server.VerifyAuth(req.Token)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	var userData *authv1.User
	if result.Data != nil {
		userData = &authv1.User{
			Id:        result.Data.ID,
			Email:     result.Data.Email,
			Name:      result.Data.Name,
			Picture:   result.Data.Picture,
			CreatedAt: result.Data.CreatedAt.Unix(),
			UpdatedAt: result.Data.CreatedAt.Unix(),
		}
	}

	return &authv1.VerifyAuthResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      userData,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetAuth retrieves user information by email
func (s *grpcAuthServer) GetAuth(ctx context.Context, req *authv1.GetAuthRequest) (*authv1.GetAuthResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	result, err := s.server.GetAuth(ctx, req.Email)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	var userData *authv1.User
	if result.Data != nil {
		userData = &authv1.User{
			Id:        result.Data.ID,
			Email:     result.Data.Email,
			Name:      result.Data.Name,
			Picture:   result.Data.Picture,
			CreatedAt: result.Data.CreatedAt.Unix(),
			UpdatedAt: result.Data.CreatedAt.Unix(),
		}
	}

	return &authv1.GetAuthResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      userData,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
