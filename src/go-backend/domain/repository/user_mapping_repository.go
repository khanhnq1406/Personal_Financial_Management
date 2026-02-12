package repository

import (
	"context"
	"wealthjourney/domain/models"
)

// UserMappingRepository defines the interface for user category mapping operations.
type UserMappingRepository interface {
	// Create creates a new user category mapping.
	Create(ctx context.Context, mapping *models.UserCategoryMapping) error

	// GetByID retrieves a user category mapping by ID.
	GetByID(ctx context.Context, id int32) (*models.UserCategoryMapping, error)

	// GetByUserIDAndPattern retrieves a mapping by user ID and description pattern.
	GetByUserIDAndPattern(ctx context.Context, userID int32, pattern string) (*models.UserCategoryMapping, error)

	// ListByUserID retrieves all category mappings for a user.
	ListByUserID(ctx context.Context, userID int32) ([]*models.UserCategoryMapping, error)

	// CreateOrUpdate creates a new mapping or updates existing one (upsert).
	CreateOrUpdate(ctx context.Context, mapping *models.UserCategoryMapping) error

	// UpdateLastUsed updates the last used timestamp and increments usage count.
	UpdateLastUsed(ctx context.Context, id int32) error

	// Update updates a user category mapping.
	Update(ctx context.Context, mapping *models.UserCategoryMapping) error

	// Delete soft deletes a user category mapping.
	Delete(ctx context.Context, id int32) error
}
