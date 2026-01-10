package grpcserver

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"wealthjourney/domain/service"
	protobufv1 "wealthjourney/protobuf/v1"
)

// userServer implements the UserService gRPC interface
type userServer struct {
	protobufv1.UnimplementedUserServiceServer
	userService service.UserService
}

// NewUserServer creates a new UserService gRPC server
func NewUserServer(userService service.UserService) protobufv1.UserServiceServer {
	return &userServer{
		userService: userService,
	}
}

// GetUser retrieves the authenticated user's profile
func (s *userServer) GetUser(ctx context.Context, req *protobufv1.GetUserRequest) (*protobufv1.GetUserResponse, error) {
	if req.UserId == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	return s.userService.GetUser(ctx, req.UserId)
}

// GetUserByEmail retrieves a user by email
func (s *userServer) GetUserByEmail(ctx context.Context, req *protobufv1.GetUserByEmailRequest) (*protobufv1.GetUserByEmailResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	return s.userService.GetUserByEmail(ctx, req.Email)
}

// ListUsers retrieves all users with pagination
func (s *userServer) ListUsers(ctx context.Context, req *protobufv1.ListUsersRequest) (*protobufv1.ListUsersResponse, error) {
	params := service.ProtoToPaginationParams(req.GetPagination())

	return s.userService.ListUsers(ctx, params)
}

// CreateUser creates a new user
func (s *userServer) CreateUser(ctx context.Context, req *protobufv1.CreateUserRequest) (*protobufv1.CreateUserResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	return s.userService.CreateUser(ctx, req.Email, req.Name, req.Picture)
}

// UpdateUser updates user information
func (s *userServer) UpdateUser(ctx context.Context, req *protobufv1.UpdateUserRequest) (*protobufv1.UpdateUserResponse, error) {
	if req.UserId == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	return s.userService.UpdateUser(ctx, req.UserId, req.Email, req.Name, req.Picture)
}

// DeleteUser deletes a user
func (s *userServer) DeleteUser(ctx context.Context, req *protobufv1.DeleteUserRequest) (*protobufv1.DeleteUserResponse, error) {
	if req.UserId == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	return s.userService.DeleteUser(ctx, req.UserId)
}
