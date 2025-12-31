package grpcserver

import (
	"context"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	userv1 "wealthjourney/gen/user/v1"
	"wealthjourney/internal/service"
)

// userServer implements the UserService gRPC interface
type userServer struct {
	userv1.UnimplementedUserServiceServer
	userService service.UserService
}

// NewUserServer creates a new UserService gRPC server
func NewUserServer(userService service.UserService) userv1.UserServiceServer {
	return &userServer{
		userService: userService,
	}
}

// domainUserToProto converts a domain UserDTO to proto User
func domainUserToProto(user *service.UserDTO) *userv1.User {
	return &userv1.User{
		Id:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Picture:   user.Picture,
		CreatedAt: user.CreatedAt.Unix(),
		UpdatedAt: user.UpdatedAt.Unix(),
	}
}

// GetUser retrieves the authenticated user's profile
func (s *userServer) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
	if req.UserId == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	user, err := s.userService.GetUser(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &userv1.GetUserResponse{
		Success:   true,
		Data:      domainUserToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetUserByEmail retrieves a user by email
func (s *userServer) GetUserByEmail(ctx context.Context, req *userv1.GetUserByEmailRequest) (*userv1.GetUserByEmailResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	user, err := s.userService.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	return &userv1.GetUserByEmailResponse{
		Success:   true,
		Data:      domainUserToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListUsers retrieves all users with pagination
func (s *userServer) ListUsers(ctx context.Context, req *userv1.ListUsersRequest) (*userv1.ListUsersResponse, error) {
	params := ProtoPaginationParams(req.GetPagination())

	users, pagination, err := s.userService.ListUsers(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	protoUsers := make([]*userv1.User, len(users))
	for i, u := range users {
		protoUsers[i] = domainUserToProto(u)
	}

	return &userv1.ListUsersResponse{
		Success:    true,
		Users:      protoUsers,
		Pagination: DomainPaginationResult(*pagination),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// CreateUser creates a new user
func (s *userServer) CreateUser(ctx context.Context, req *userv1.CreateUserRequest) (*userv1.CreateUserResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	user, err := s.userService.CreateUser(ctx, req.Email, req.Name, req.Picture)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userv1.CreateUserResponse{
		Success:   true,
		Data:      domainUserToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateUser updates user information
func (s *userServer) UpdateUser(ctx context.Context, req *userv1.UpdateUserRequest) (*userv1.UpdateUserResponse, error) {
	if req.UserId == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	user, err := s.userService.UpdateUser(ctx, req.UserId, req.Email, req.Name, req.Picture)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userv1.UpdateUserResponse{
		Success:   true,
		Data:      domainUserToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteUser deletes a user
func (s *userServer) DeleteUser(ctx context.Context, req *userv1.DeleteUserRequest) (*userv1.DeleteUserResponse, error) {
	if req.UserId == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	err := s.userService.DeleteUser(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &userv1.DeleteUserResponse{
		Success:   true,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}
