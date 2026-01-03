package service

import (
	"context"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	protobufv1 "wealthjourney/gen/protobuf/protobuf/v1"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
)

// userService implements UserService.
type userService struct {
	userRepo repository.UserRepository
	mapper   *UserMapper
}

// NewUserService creates a new UserService.
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
		mapper:   NewUserMapper(),
	}
}

// GetUser retrieves a user by ID.
func (s *userService) GetUser(ctx context.Context, userID int32) (*protobufv1.GetUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &protobufv1.GetUserResponse{
		Success:   true,
		Message:   "User retrieved successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetUserByEmail retrieves a user by email.
func (s *userService) GetUserByEmail(ctx context.Context, email string) (*protobufv1.GetUserByEmailResponse, error) {
	if err := validator.Email(email); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return &protobufv1.GetUserByEmailResponse{
		Success:   true,
		Message:   "User retrieved successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListUsers retrieves all users with pagination.
func (s *userService) ListUsers(ctx context.Context, params types.PaginationParams) (*protobufv1.ListUsersResponse, error) {
	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	users, total, err := s.userRepo.List(ctx, opts)
	if err != nil {
		return nil, err
	}

	pagination := types.NewPaginationResult(params.Page, params.PageSize, total)

	return &protobufv1.ListUsersResponse{
		Success:    true,
		Message:    "Users retrieved successfully",
		Users:      s.mapper.ModelSliceToProto(users),
		Pagination: s.mapper.PaginationResultToProto(pagination),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// CreateUser creates a new user.
func (s *userService) CreateUser(ctx context.Context, email, name, picture string) (*protobufv1.CreateUserResponse, error) {
	// Validate inputs
	if err := validator.Email(email); err != nil {
		return nil, err
	}
	if name != "" {
		if err := validator.Name(name); err != nil {
			return nil, err
		}
	}

	// Check if user already exists
	exists, err := s.userRepo.ExistsByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, apperrors.NewConflictError("user with this email already exists")
	}

	// Create user model
	user := &models.User{
		Email:   email,
		Name:    name,
		Picture: picture,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return &protobufv1.CreateUserResponse{
		Success:   true,
		Message:   "User created successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateUser updates a user's information.
func (s *userService) UpdateUser(ctx context.Context, userID int32, email, name, picture string) (*protobufv1.UpdateUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get existing user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Validate and update email if provided
	if email != "" && email != user.Email {
		if err := validator.Email(email); err != nil {
			return nil, err
		}
		// Check if email is already taken
		exists, err := s.userRepo.ExistsByEmail(ctx, email)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, apperrors.NewConflictError("email already in use")
		}
		user.Email = email
	}

	// Validate and update name if provided
	if name != "" {
		if err := validator.Name(name); err != nil {
			return nil, err
		}
		user.Name = name
	}

	// Update picture if provided
	if picture != "" {
		user.Picture = picture
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return &protobufv1.UpdateUserResponse{
		Success:   true,
		Message:   "User updated successfully",
		Data:      s.mapper.ModelToProto(user),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteUser deletes a user.
func (s *userService) DeleteUser(ctx context.Context, userID int32) (*protobufv1.DeleteUserResponse, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	if err := s.userRepo.Delete(ctx, userID); err != nil {
		return nil, err
	}

	return &protobufv1.DeleteUserResponse{
		Success:   true,
		Message:   "User deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ExistsByEmail checks if a user exists by email.
func (s *userService) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	if err := validator.Email(email); err != nil {
		return false, err
	}
	return s.userRepo.ExistsByEmail(ctx, email)
}
