package service

import (
	"context"
	"time"

	"wealthjourney/domain/models"
	"wealthjourney/domain/repository"
	apperrors "wealthjourney/pkg/errors"
	"wealthjourney/pkg/types"
	"wealthjourney/pkg/validator"
	budgetv1 "wealthjourney/protobuf/v1"
)

// budgetService implements BudgetService.
type budgetService struct {
	budgetRepo     repository.BudgetRepository
	budgetItemRepo repository.BudgetItemRepository
	userRepo       repository.UserRepository
	mapper         *BudgetMapper
}

// NewBudgetService creates a new BudgetService.
func NewBudgetService(
	budgetRepo repository.BudgetRepository,
	budgetItemRepo repository.BudgetItemRepository,
	userRepo repository.UserRepository,
) BudgetService {
	return &budgetService{
		budgetRepo:     budgetRepo,
		budgetItemRepo: budgetItemRepo,
		userRepo:       userRepo,
		mapper:         NewBudgetMapper(),
	}
}

// GetBudget retrieves a budget by ID, ensuring it belongs to the user.
func (s *budgetService) GetBudget(ctx context.Context, budgetID int32, userID int32) (*budgetv1.GetBudgetResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Get budget and verify ownership
	budget, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	return &budgetv1.GetBudgetResponse{
		Success:   true,
		Message:   "Budget retrieved successfully",
		Data:      s.mapper.ModelToProto(budget),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// ListBudgets retrieves all budgets for a user with pagination.
func (s *budgetService) ListBudgets(ctx context.Context, userID int32, params types.PaginationParams) (*budgetv1.ListBudgetsResponse, error) {
	// Validate user ID
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	params = params.Validate()

	opts := repository.ListOptions{
		Limit:   params.Limit(),
		Offset:  params.Offset(),
		OrderBy: params.OrderBy,
		Order:   params.Order,
	}

	budgets, total, err := s.budgetRepo.ListByUserID(ctx, userID, opts)
	if err != nil {
		return nil, err
	}

	protoBudgets := s.mapper.ModelSliceToProto(budgets)
	paginationResult := types.NewPaginationResult(params.Page, params.PageSize, total)

	return &budgetv1.ListBudgetsResponse{
		Success:    true,
		Message:    "Budgets retrieved successfully",
		Budgets:    protoBudgets,
		Pagination: s.mapper.PaginationResultToProto(paginationResult),
		Timestamp:  time.Now().Format(time.RFC3339),
	}, nil
}

// CreateBudget creates a new budget for a user.
func (s *budgetService) CreateBudget(ctx context.Context, userID int32, req *budgetv1.CreateBudgetRequest) (*budgetv1.CreateBudgetResponse, error) {
	// Validate inputs
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Validate budget name
	if err := validateBudgetName(req.Name); err != nil {
		return nil, err
	}

	// Validate total amount
	if err := validateMoneyAmount(req.Total); err != nil {
		return nil, err
	}

	// Verify user exists (ensures userID is valid)
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, apperrors.NewNotFoundError("user")
	}

	// Create budget model
	total := int64(0)
	if req.Total != nil {
		total = req.Total.Amount
	}

	budget := &models.Budget{
		UserID: userID,
		Name:   req.Name,
		Total:  total,
	}

	if err := s.budgetRepo.Create(ctx, budget); err != nil {
		return nil, err
	}

	// Create budget items if provided
	if len(req.Items) > 0 {
		for _, itemReq := range req.Items {
			// Validate item name
			if err := validateBudgetItemName(itemReq.Name); err != nil {
				return nil, err
			}

			// Validate item total
			if err := validateMoneyAmount(itemReq.Total); err != nil {
				return nil, err
			}

			itemTotal := int64(0)
			if itemReq.Total != nil {
				itemTotal = itemReq.Total.Amount
			}

			item := &models.BudgetItem{
				BudgetID: budget.ID,
				Name:     itemReq.Name,
				Total:    itemTotal,
			}

			if err := s.budgetItemRepo.Create(ctx, item); err != nil {
				return nil, apperrors.NewInternalErrorWithCause("failed to create budget item", err)
			}
		}
	}

	// Fetch budget with items for response
	budgetWithItems, err := s.budgetRepo.GetByIDForUser(ctx, budget.ID, userID)
	if err != nil {
		return nil, err
	}

	return &budgetv1.CreateBudgetResponse{
		Success:   true,
		Message:   "Budget created successfully",
		Data:      s.mapper.ModelToProto(budgetWithItems),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateBudget updates a budget's information.
func (s *budgetService) UpdateBudget(ctx context.Context, budgetID int32, userID int32, req *budgetv1.UpdateBudgetRequest) (*budgetv1.UpdateBudgetResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Validate budget name
	if err := validateBudgetName(req.Name); err != nil {
		return nil, err
	}

	// Validate total amount if provided
	if err := validateMoneyAmount(req.Total); err != nil {
		return nil, err
	}

	// Get budget and verify ownership
	budget, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Total != nil {
		budget.Total = req.Total.Amount
	}
	budget.Name = req.Name

	if err := s.budgetRepo.Update(ctx, budget); err != nil {
		return nil, err
	}

	return &budgetv1.UpdateBudgetResponse{
		Success:   true,
		Message:   "Budget updated successfully",
		Data:      s.mapper.ModelToProto(budget),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteBudget deletes a budget.
func (s *budgetService) DeleteBudget(ctx context.Context, budgetID int32, userID int32) (*budgetv1.DeleteBudgetResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify ownership
	_, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	// Delete all budget items first
	if err := s.budgetItemRepo.DeleteByBudgetID(ctx, budgetID); err != nil {
		return nil, apperrors.NewInternalErrorWithCause("failed to delete budget items", err)
	}

	// Delete budget
	if err := s.budgetRepo.Delete(ctx, budgetID); err != nil {
		return nil, err
	}

	return &budgetv1.DeleteBudgetResponse{
		Success:   true,
		Message:   "Budget deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// GetBudgetItems retrieves all budget items for a budget.
func (s *budgetService) GetBudgetItems(ctx context.Context, budgetID int32, userID int32) (*budgetv1.GetBudgetItemsResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify budget ownership
	_, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	// Get budget items
	items, err := s.budgetItemRepo.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return nil, err
	}

	protoItems := s.mapper.ModelSliceToProtoItems(items)

	return &budgetv1.GetBudgetItemsResponse{
		Success:   true,
		Message:   "Budget items retrieved successfully",
		Items:     protoItems,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// CreateBudgetItem creates a new budget item.
func (s *budgetService) CreateBudgetItem(ctx context.Context, budgetID int32, userID int32, req *budgetv1.CreateBudgetItemRequest) (*budgetv1.CreateBudgetItemResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Validate item name
	if err := validateBudgetItemName(req.Name); err != nil {
		return nil, err
	}

	// Validate total amount
	if err := validateMoneyAmount(req.Total); err != nil {
		return nil, err
	}

	// Verify budget ownership
	_, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	// Create budget item
	total := int64(0)
	if req.Total != nil {
		total = req.Total.Amount
	}

	item := &models.BudgetItem{
		BudgetID: budgetID,
		Name:     req.Name,
		Total:    total,
	}

	if err := s.budgetItemRepo.Create(ctx, item); err != nil {
		return nil, err
	}

	return &budgetv1.CreateBudgetItemResponse{
		Success:   true,
		Message:   "Budget item created successfully",
		Data:      s.mapper.ModelItemToProto(item),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// UpdateBudgetItem updates a budget item's information.
func (s *budgetService) UpdateBudgetItem(ctx context.Context, budgetID int32, itemID int32, userID int32, req *budgetv1.UpdateBudgetItemRequest) (*budgetv1.UpdateBudgetItemResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(itemID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Validate item name
	if err := validateBudgetItemName(req.Name); err != nil {
		return nil, err
	}

	// Validate total amount if provided
	if err := validateMoneyAmount(req.Total); err != nil {
		return nil, err
	}

	// Verify budget ownership
	_, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	// Get budget item and verify it belongs to the budget
	item, err := s.budgetItemRepo.GetByIDForBudget(ctx, itemID, budgetID)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Total != nil {
		item.Total = req.Total.Amount
	}
	item.Name = req.Name

	if err := s.budgetItemRepo.Update(ctx, item); err != nil {
		return nil, err
	}

	return &budgetv1.UpdateBudgetItemResponse{
		Success:   true,
		Message:   "Budget item updated successfully",
		Data:      s.mapper.ModelItemToProto(item),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// DeleteBudgetItem deletes a budget item.
func (s *budgetService) DeleteBudgetItem(ctx context.Context, budgetID int32, itemID int32, userID int32) (*budgetv1.DeleteBudgetItemResponse, error) {
	// Validate inputs
	if err := validator.ID(budgetID); err != nil {
		return nil, err
	}
	if err := validator.ID(itemID); err != nil {
		return nil, err
	}
	if err := validator.ID(userID); err != nil {
		return nil, err
	}

	// Verify budget ownership
	_, err := s.budgetRepo.GetByIDForUser(ctx, budgetID, userID)
	if err != nil {
		return nil, err
	}

	// Verify item belongs to budget
	_, err = s.budgetItemRepo.GetByIDForBudget(ctx, itemID, budgetID)
	if err != nil {
		return nil, err
	}

	// Delete budget item
	if err := s.budgetItemRepo.Delete(ctx, itemID); err != nil {
		return nil, err
	}

	return &budgetv1.DeleteBudgetItemResponse{
		Success:   true,
		Message:   "Budget item deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

// Helper methods for validation

// validateBudgetName validates budget name constraints.
func validateBudgetName(name string) error {
	if name == "" {
		return apperrors.NewValidationError("budget name is required")
	}
	if len(name) > 100 {
		return apperrors.NewValidationError("budget name cannot exceed 100 characters")
	}
	return nil
}

// validateBudgetItemName validates budget item name constraints.
func validateBudgetItemName(name string) error {
	if name == "" {
		return apperrors.NewValidationError("budget item name is required")
	}
	if len(name) > 100 {
		return apperrors.NewValidationError("budget item name cannot exceed 100 characters")
	}
	return nil
}

// validateNonNegativeAmount validates that an amount is non-negative.
func validateNonNegativeAmount(amount int64) error {
	if amount < 0 {
		return apperrors.NewValidationError("amount cannot be negative")
	}
	return nil
}

// validateMoneyAmount validates a Money protobuf message is non-negative.
func validateMoneyAmount(money *budgetv1.Money) error {
	if money == nil {
		return nil // nil is treated as zero
	}
	if money.Amount < 0 {
		return apperrors.NewValidationError("amount cannot be negative")
	}
	return nil
}

