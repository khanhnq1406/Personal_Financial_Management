package service

import (
	"context"

	"wealthjourney/internal/models"
	"wealthjourney/internal/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
)

// userService implements UserService.
type userService struct {
	userRepo repository.UserRepository
}

// NewUserService creates a new UserService.
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

// GetUser retrieves a user by ID.
func (s *userService) GetUser(ctx context.Context, userID int32) (*UserDTO, error) {
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.toUserDTO(user), nil
}

// GetUserByEmail retrieves a user by email.
func (s *userService) GetUserByEmail(ctx context.Context, email string) (*UserDTO, error) {
	if err := validator.Email(email); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return s.toUserDTO(user), nil
}

// ListUsers retrieves all users with pagination.
func (s *userService) ListUsers(ctx context.Context, params types.PaginationParams) ([]*UserDTO, *types.PaginationResult, error) {
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

	userDTOs := make([]*UserDTO, len(users))
	for i, u := range users {
		userDTOs[i] = s.toUserDTO(u)
	}

	pagination := types.NewPaginationResult(params.Page, params.PageSize, total)
	return userDTOs, &pagination, nil
}

// CreateUser creates a new user.
func (s *userService) CreateUser(ctx context.Context, email, name, picture string) (*UserDTO, error) {
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

	return s.toUserDTO(user), nil
}

// UpdateUser updates a user's information.
func (s *userService) UpdateUser(ctx context.Context, userID int32, email, name, picture string) (*UserDTO, error) {
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

	return s.toUserDTO(user), nil
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

// toUserDTO converts a User model to a UserDTO.
func (s *userService) toUserDTO(user *models.User) *UserDTO {
	return &UserDTO{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		Picture:   user.Picture,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}
