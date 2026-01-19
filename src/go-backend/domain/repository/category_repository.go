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

// GetByIDs retrieves multiple categories by their IDs in a single query.
func (r *categoryRepository) GetByIDs(ctx context.Context, ids []int32) (map[int32]*models.Category, error) {
	if len(ids) == 0 {
		return make(map[int32]*models.Category), nil
	}

	var categories []*models.Category
	result := r.db.DB.WithContext(ctx).Where("id IN ?", ids).Find(&categories)
	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "category", "get categories by ids")
	}

	// Build map for easy lookup
	categoryMap := make(map[int32]*models.Category, len(categories))
	for _, category := range categories {
		categoryMap[category.ID] = category
	}

	return categoryMap, nil
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

// CreateDefaultCategories creates default categories for a new user.
func (r *categoryRepository) CreateDefaultCategories(ctx context.Context, userID int32) error {
	// Define default expense categories
	expenseCategories := []string{
		"Food and Beverage",
		"Bills & Utilities",
		"Shopping",
		"Family",
		"Transportation",
		"Health & Fitness",
		"Education",
		"Entertainment",
		"Gifts & Donations",
		"Insurances",
		"Investment",
		"Other Expense",
		"Outgoing Transfer",
		"Pay Interest",
		"Uncategorized",
	}

	// Define default income categories
	incomeCategories := []string{
		"Salary",
		"Other Income",
		"Incoming Transfer",
		"Collect Interest",
		"Uncategorized",
	}

	// Create expense categories
	for _, name := range expenseCategories {
		category := &models.Category{
			UserID: userID,
			Name:   name,
			Type:   v1.CategoryType_CATEGORY_TYPE_EXPENSE,
		}
		if err := r.Create(ctx, category); err != nil {
			return apperrors.NewInternalErrorWithCause("failed to create default expense category", err)
		}
	}

	// Create income categories
	for _, name := range incomeCategories {
		category := &models.Category{
			UserID: userID,
			Name:   name,
			Type:   v1.CategoryType_CATEGORY_TYPE_INCOME,
		}
		if err := r.Create(ctx, category); err != nil {
			return apperrors.NewInternalErrorWithCause("failed to create default income category", err)
		}
	}

	return nil
}

// GetByNameAndType retrieves a category by name and type for a user.
// Returns the category if found, or creates it if it doesn't exist.
func (r *categoryRepository) GetByNameAndType(ctx context.Context, userID int32, name string, categoryType v1.CategoryType) (*models.Category, error) {
	var category models.Category
	result := r.db.DB.WithContext(ctx).
		Where("user_id = ? AND name = ? AND type = ?", userID, name, int(categoryType)).
		First(&category)

	if result.Error == nil {
		// Category found, return it
		return &category, nil
	}

	// Category not found, create it
	newCategory := &models.Category{
		UserID: userID,
		Name:   name,
		Type:   categoryType,
	}

	if err := r.Create(ctx, newCategory); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to create transfer category", err)
	}

	return newCategory, nil
}
