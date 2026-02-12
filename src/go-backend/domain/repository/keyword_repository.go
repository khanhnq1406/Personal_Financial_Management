package repository

import (
	"context"
	"wealthjourney/domain/models"
)

// KeywordRepository defines the interface for category keyword operations.
type KeywordRepository interface {
	// Create creates a new category keyword.
	Create(ctx context.Context, keyword *models.CategoryKeyword) error

	// GetByID retrieves a category keyword by ID.
	GetByID(ctx context.Context, id int32) (*models.CategoryKeyword, error)

	// ListActive retrieves all active category keywords.
	ListActive(ctx context.Context) ([]*models.CategoryKeyword, error)

	// ListByCategoryID retrieves all keywords for a specific category.
	ListByCategoryID(ctx context.Context, categoryID int32) ([]*models.CategoryKeyword, error)

	// Update updates a category keyword.
	Update(ctx context.Context, keyword *models.CategoryKeyword) error

	// Delete soft deletes a category keyword.
	Delete(ctx context.Context, id int32) error

	// BulkCreate creates multiple keywords in a single transaction.
	BulkCreate(ctx context.Context, keywords []*models.CategoryKeyword) error
}
