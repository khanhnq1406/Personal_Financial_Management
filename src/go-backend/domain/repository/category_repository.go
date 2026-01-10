package repository

import (
	"context"

	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/database"
	"wealthjourney/domain/models"

	v1 "wealthjourney/protobuf/v1"
)

// categoryRepository implements CategoryRepository using GORM.
type categoryRepository struct {
	*BaseRepository
}

// NewCategoryRepository creates a new CategoryRepository.
func NewCategoryRepository(db *database.Database) CategoryRepository {
	return &categoryRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new category.
func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	// Validate category type before creating
	if !category.IsValidType() {
		return apperrors.NewValidationError("invalid category type")
	}
	result := r.db.DB.WithContext(ctx).Create(category)
	if result.Error != nil {
		return r.handleDBError(result.Error, "category", "create category")
	}
	return nil
}

// GetByID retrieves a category by ID.
func (r *categoryRepository) GetByID(ctx context.Context, id int32) (*models.Category, error) {
	var category models.Category
	err := r.executeGetByID(ctx, &category, id, "category")
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// GetByIDForUser retrieves a category by ID, ensuring it belongs to the user.
func (r *categoryRepository) GetByIDForUser(ctx context.Context, categoryID, userID int32) (*models.Category, error) {
	var category models.Category
	result := r.db.DB.WithContext(ctx).Where("id = ? AND user_id = ?", categoryID, userID).First(&category)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "category", "get category")
	}
	return &category, nil
}

// Update updates a category.
func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.executeUpdate(ctx, category, "category")
}

// Delete soft deletes a category by ID.
func (r *categoryRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.Category{}, id, "category")
}

// ListByUserID retrieves all categories for a user with optional type filtering.
func (r *categoryRepository) ListByUserID(ctx context.Context, userID int32, categoryType *v1.CategoryType, opts ListOptions) ([]*models.Category, int, error) {
	var categories []*models.Category
	var total int64

	// Build the base query for counting
	countQuery := r.db.DB.WithContext(ctx).Model(&models.Category{}).Where("user_id = ?", userID)

	// Apply type filter if provided
	if categoryType != nil && *categoryType != v1.CategoryType_CATEGORY_TYPE_UNSPECIFIED {
		countQuery = countQuery.Where("type = ?", int(*categoryType))
	}

	// Get total count
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count categories", err)
	}

	// Build the base query for fetching results
	query := r.db.DB.WithContext(ctx).Model(&models.Category{}).Where("user_id = ?", userID)
	if categoryType != nil && *categoryType != v1.CategoryType_CATEGORY_TYPE_UNSPECIFIED {
		query = query.Where("type = ?", int(*categoryType))
	}

	// Build order clause - only allow ordering by category columns
	allowedOrderBy := map[string]bool{
		"id": true, "name": true, "type": true, "created_at": true, "updated_at": true,
	}
	orderClause := "created_at desc"
	if allowedOrderBy[opts.OrderBy] {
		direction := "asc"
		if opts.Order == "desc" {
			direction = "desc"
		}
		orderClause = opts.OrderBy + " " + direction
	}
	query = query.Order(orderClause)

	// Apply pagination
	query = r.applyPagination(query, opts)

	// Execute query
	result := query.Find(&categories)
	if result.Error != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list categories", result.Error)
	}

	return categories, int(total), nil
}

// ExistsForUser checks if a category exists by ID and belongs to the user.
func (r *categoryRepository) ExistsForUser(ctx context.Context, categoryID, userID int32) (bool, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.Category{}).
		Where("id = ? AND user_id = ?", categoryID, userID).
		Count(&count)
	if result.Error != nil {
		return false, apperrors.NewInternalErrorWithCause("failed to check category existence", result.Error)
	}
	return count > 0, nil
}

// CountByUserID returns the number of categories for a user.
func (r *categoryRepository) CountByUserID(ctx context.Context, userID int32) (int, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.Category{}).Where("user_id = ?", userID).Count(&count)
	if result.Error != nil {
		return 0, apperrors.NewInternalErrorWithCause("failed to count categories", result.Error)
	}
	return int(count), nil
}
