package grpcserver

import (
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	protobufv1 "wealthjourney/gen/protobuf/v1"
	"wealthjourney/domain/auth"
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

// userDataToProto converts auth.UserData to proto User
func userDataToProto(data *auth.UserData) *protobufv1.User {
	if data == nil {
		return nil
	}
	return &protobufv1.User{
		Id:        data.ID,
		Email:     data.Email,
		Name:      data.Name,
		Picture:   data.Picture,
		CreatedAt: data.CreatedAt.Unix(),
		UpdatedAt: data.CreatedAt.Unix(),
	}
}

// Register registers a new user using Google OAuth token
func (s *grpcAuthServer) Register(ctx context.Context, req *protobufv1.RegisterRequest) (*protobufv1.RegisterResponse, error) {
	if req.GoogleToken == "" {
		return nil, status.Error(codes.InvalidArgument, "google_token is required")
	}

	result, err := s.server.Register(ctx, req.GoogleToken)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.RegisterResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      userDataToProto(result.Data),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Login logs in a user using Google OAuth token
func (s *grpcAuthServer) Login(ctx context.Context, req *protobufv1.LoginRequest) (*protobufv1.LoginResponse, error) {
	if req.GoogleToken == "" {
		return nil, status.Error(codes.InvalidArgument, "google_token is required")
	}

	result, err := s.server.Login(ctx, req.GoogleToken)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	var loginData *protobufv1.LoginData
	if result.Data != nil {
		loginData = &protobufv1.LoginData{
			AccessToken: result.Data.AccessToken,
			Email:       result.Data.Email,
			Fullname:    result.Data.Fullname,
			Picture:     result.Data.Picture,
		}
	}

	return &protobufv1.LoginResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      loginData,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Logout logs out a user and invalidates the token
func (s *grpcAuthServer) Logout(ctx context.Context, req *protobufv1.LogoutRequest) (*protobufv1.LogoutResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	result, err := s.server.Logout(req.Token)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &protobufv1.LogoutResponse{
		Success:   result.Success,
		Message:   result.Message,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// VerifyAuth verifies the authentication status
func (s *grpcAuthServer) VerifyAuth(ctx context.Context, req *protobufv1.VerifyAuthRequest) (*protobufv1.VerifyAuthResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	result, _, err := s.server.VerifyAuth(req.Token)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, err.Error())
	}

	return &protobufv1.VerifyAuthResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      userDataToProto(result.Data),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetAuth retrieves user information by email
func (s *grpcAuthServer) GetAuth(ctx context.Context, req *protobufv1.GetAuthRequest) (*protobufv1.GetAuthResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	result, err := s.server.GetAuth(ctx, req.Email)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &protobufv1.GetAuthResponse{
		Success:   result.Success,
		Message:   result.Message,
		Data:      userDataToProto(result.Data),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
