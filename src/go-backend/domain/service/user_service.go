package service

import (
	"context"

	protobufv1 "wealthjourney/gen/protobuf/v1"
	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
)

// userService implements UserService.
type userService struct {
	userRepo  repository.UserRepository
	mapper    *UserMapper
}

// NewUserService creates a new UserService.
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
		mapper:   NewUserMapper(),
	}
}

// GetUser retrieves a user by ID.
func (s *userService) GetUser(ctx context.Context, userID int32) (*protobufv1.User, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.mapper.ModelToProto(user), nil
}

// GetUserByEmail retrieves a user by email.
func (s *userService) GetUserByEmail(ctx context.Context, email string) (*protobufv1.User, error) {
	if err := validator.Email(email); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return s.mapper.ModelToProto(user), nil
}

// ListUsers retrieves all users with pagination.
func (s *userService) ListUsers(ctx context.Context, params types.PaginationParams) ([]*protobufv1.User, *types.PaginationResult, error) {
	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	users, total, err := s.userRepo.List(ctx, opts)
	if err != nil {
		return nil, nil, err
	}

	pagination := types.NewPaginationResult(params.Page, params.PageSize, total)
	return s.mapper.ModelSliceToProto(users), &pagination, nil
}

// CreateUser creates a new user.
func (s *userService) CreateUser(ctx context.Context, email, name, picture string) (*protobufv1.User, error) {
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

	return s.mapper.ModelToProto(user), nil
}

// UpdateUser updates a user's information.
func (s *userService) UpdateUser(ctx context.Context, userID int32, email, name, picture string) (*protobufv1.User, error) {
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

	return s.mapper.ModelToProto(user), nil
}

// DeleteUser deletes a user.
func (s *userService) DeleteUser(ctx context.Context, userID int32) error {
	if err := validator.ID(userID); err != nil {
		return err
	}
	return s.userRepo.Delete(ctx, userID)
}

// ExistsByEmail checks if a user exists by email.
func (s *userService) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	if err := validator.Email(email); err != nil {
		return false, err
	}
	return s.userRepo.ExistsByEmail(ctx, email)
}
