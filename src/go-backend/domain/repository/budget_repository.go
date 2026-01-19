package repository

import (
	"context"

	"wealthjourney/domain/models"
	"wealthjourney/pkg/database"
	apperrors "wealthjourney/pkg/errors"
)

// budgetRepository implements BudgetRepository using GORM.
type budgetRepository struct {
	*BaseRepository
}

// NewBudgetRepository creates a new BudgetRepository.
func NewBudgetRepository(db *database.Database) BudgetRepository {
	return &budgetRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new budget.
func (r *budgetRepository) Create(ctx context.Context, budget *models.Budget) error {
	result := r.db.DB.WithContext(ctx).Create(budget)
	if result.Error != nil {
		return r.handleDBError(result.Error, "budget", "create budget")
	}
	return nil
}

// GetByID retrieves a budget by ID.
func (r *budgetRepository) GetByID(ctx context.Context, id int32) (*models.Budget, error) {
	var budget models.Budget
	err := r.executeGetByID(ctx, &budget, id, "budget")
	if err != nil {
		return nil, err
	}
	return &budget, nil
}

// GetByIDForUser retrieves a budget by ID, ensuring it belongs to the user.
func (r *budgetRepository) GetByIDForUser(ctx context.Context, budgetID, userID int32) (*models.Budget, error) {
	var budget models.Budget
	result := r.db.DB.WithContext(ctx).
		Preload("Items").
		Where("id = ? AND user_id = ?", budgetID, userID).
		First(&budget)

	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "budget", "get budget")
	}
	return &budget, nil
}

// ListByUserID retrieves all budgets for a user.
func (r *budgetRepository) ListByUserID(ctx context.Context, userID int32, opts ListOptions) ([]*models.Budget, int, error) {
	var budgets []*models.Budget
	var total int64

	// Get total count for this user
	if err := r.db.DB.WithContext(ctx).Model(&models.Budget{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to count budgets", err)
	}

	// Build query with user filter and pagination
	orderClause := r.buildOrderClause(opts)
	query := r.db.DB.WithContext(ctx).Model(&models.Budget{}).Where("user_id = ?", userID).Order(orderClause)
	query = r.applyPagination(query, opts)

	result := query.Preload("Items").Find(&budgets)
	if result.Error != nil {
		return nil, 0, apperrors.NewInternalErrorWithCause("failed to list budgets", result.Error)
	}

	return budgets, int(total), nil
}

// Update updates a budget.
func (r *budgetRepository) Update(ctx context.Context, budget *models.Budget) error {
	return r.executeUpdate(ctx, budget, "budget")
}

// Delete soft deletes a budget by ID.
func (r *budgetRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.Budget{}, id, "budget")
}

// ExistsForUser checks if a budget exists by ID and belongs to the user.
func (r *budgetRepository) ExistsForUser(ctx context.Context, budgetID, userID int32) (bool, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.Budget{}).
		Where("id = ? AND user_id = ?", budgetID, userID).
		Count(&count)
	if result.Error != nil {
		return false, apperrors.NewInternalErrorWithCause("failed to check budget existence", result.Error)
	}
	return count > 0, nil
}

// CountByUserID returns the number of budgets for a user.
func (r *budgetRepository) CountByUserID(ctx context.Context, userID int32) (int, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.Budget{}).Where("user_id = ?", userID).Count(&count)
	if result.Error != nil {
		return 0, apperrors.NewInternalErrorWithCause("failed to count budgets", result.Error)
	}
	return int(count), nil
}

// budgetItemRepository implements BudgetItemRepository using GORM.
type budgetItemRepository struct {
	*BaseRepository
}

// NewBudgetItemRepository creates a new BudgetItemRepository.
func NewBudgetItemRepository(db *database.Database) BudgetItemRepository {
	return &budgetItemRepository{
		BaseRepository: NewBaseRepository(db),
	}
}

// Create creates a new budget item.
func (r *budgetItemRepository) Create(ctx context.Context, item *models.BudgetItem) error {
	result := r.db.DB.WithContext(ctx).Create(item)
	if result.Error != nil {
		return r.handleDBError(result.Error, "budget item", "create budget item")
	}
	return nil
}

// GetByID retrieves a budget item by ID.
func (r *budgetItemRepository) GetByID(ctx context.Context, id int32) (*models.BudgetItem, error) {
	var item models.BudgetItem
	err := r.executeGetByID(ctx, &item, id, "budget item")
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// GetByIDForBudget retrieves a budget item by ID, ensuring it belongs to the budget.
func (r *budgetItemRepository) GetByIDForBudget(ctx context.Context, itemID, budgetID int32) (*models.BudgetItem, error) {
	var item models.BudgetItem
	result := r.db.DB.WithContext(ctx).
		Where("id = ? AND budget_id = ?", itemID, budgetID).
		First(&item)

	if result.Error != nil {
		return nil, r.handleDBError(result.Error, "budget item", "get budget item")
	}
	return &item, nil
}

// ListByBudgetID retrieves all budget items for a budget.
func (r *budgetItemRepository) ListByBudgetID(ctx context.Context, budgetID int32) ([]*models.BudgetItem, error) {
	var items []*models.BudgetItem
	result := r.db.DB.WithContext(ctx).
		Where("budget_id = ?", budgetID).
		Find(&items)

	if result.Error != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to list budget items", result.Error)
	}

	return items, nil
}

// Update updates a budget item.
func (r *budgetItemRepository) Update(ctx context.Context, item *models.BudgetItem) error {
	return r.executeUpdate(ctx, item, "budget item")
}

// Delete soft deletes a budget item by ID.
func (r *budgetItemRepository) Delete(ctx context.Context, id int32) error {
	return r.executeDelete(ctx, &models.BudgetItem{}, id, "budget item")
}

// DeleteByBudgetID deletes all budget items for a budget.
func (r *budgetItemRepository) DeleteByBudgetID(ctx context.Context, budgetID int32) error {
	result := r.db.DB.WithContext(ctx).
		Where("budget_id = ?", budgetID).
		Delete(&models.BudgetItem{})

	if result.Error != nil {
		return apperrors.NewInternalErrorWithCause("failed to delete budget items", result.Error)
	}

	return nil
}

// CountByBudgetID returns the number of budget items for a budget.
func (r *budgetItemRepository) CountByBudgetID(ctx context.Context, budgetID int32) (int, error) {
	var count int64
	result := r.db.DB.WithContext(ctx).Model(&models.BudgetItem{}).Where("budget_id = ?", budgetID).Count(&count)
	if result.Error != nil {
		return 0, apperrors.NewInternalErrorWithCause("failed to count budget items", result.Error)
	}
	return int(count), nil
}
