# Budget Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Budget page for the WealthJourney personal finance management application based on Figma designs (desktop and mobile variants), following existing project patterns and styling.

**Architecture:** The Budget feature requires full-stack implementation:
- **Backend:** Add Budget protobuf API, Go service layer, repository, and REST handlers
- **Frontend:** Create Next.js page with circular progress visualization, budget item list, and CRUD modals

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Go 1.23, Gin, GORM, MySQL, Protocol Buffers

---

## Design Analysis Summary

Based on the Figma design files ([`design/data/budget-page/desktop.json`](../../design/data/budget-page/desktop.json) and [`design/data/budget-page/mobile.json`](../../design/data/budget-page/mobile.json)):

### Key UI Components

1. **Budget Summary Card** (Desktop: 425x472px, Mobile: 389x472px)
   - Two circular progress indicators (concentric circles)
   - Outer gray circle: Total Budget (10,000,000 VND)
   - Inner green circle: Amount you can spend (2,000,000 VND)
   - "Edit Budget" button (primary green)
   - "Budget 1" dropdown (for switching between budgets)

2. **Budget Item List** (cards: 406x82px each)
   - Each item shows: category name, allocated amount
   - Action buttons: edit (pencil icon), delete (trash icon)
   - Checkmark icon for active items
   - Items: Food & Beverage (3,000,000), Play (500,000), Saving (1,000,000), Rental (2,000,000), Investment (1,000,000), Give (500,000)

3. **"Create budget" Button** (163x38px, primary green)
   - Located at bottom left on desktop
   - Fixed at bottom on mobile with action buttons

4. **Mobile Header** (161px tall green header)
   - Menu icon (left), "Budget" title (center), User avatar (right)
   - Plus/Transfer/Transaction action buttons overlay

### Color Scheme
- Background: `#f7f8fc` (fg), `#008148` (bg - green)
- Primary button: `#00a445` (hgreen)
- Text: `#181c14` (dark), `#99a3a5` (gray labels)
- Card shadows: `rgba(0,0,0,0.25)`

### Responsive Behavior
- Desktop (>800px): Sidebar navigation, 2-column layout
- Mobile (<800px): Hamburger menu, full-width cards, fixed bottom buttons

---

## Database Schema (Already Exists)

The database tables already exist from the legacy Node.js backend:

**Tables:**
- `budget` (id, user_id, name, total, created_at, updated_at)
- `list_budget` (id, budget_id, name, total, created_at, updated_at)

**Location:** [`src/wj-server/src/common/database/schema/06-budgets.sql`](../../src/wj-server/src/common/database/schema/06-budgets.sql)

---

## Task 1: Create Budget Protobuf API Definition

**Files:**
- Create: `api/protobuf/v1/budget.proto`

**Step 1: Write the protobuf definition**

```protobuf
syntax = "proto3";

package wealthjourney.budget.v1;

import "protobuf/v1/common.proto";
import "google/api/annotations.proto";

option go_package = "protobuf/v1";

// Budget service for budget management operations
service BudgetService {
  // Get a budget by ID
  rpc GetBudget(GetBudgetRequest) returns (GetBudgetResponse) {
    option (google.api.http) = {
      get: "/api/v1/budgets/{budgetId}"
    };
  }

  // List all budgets for authenticated user with pagination
  rpc ListBudgets(ListBudgetsRequest) returns (ListBudgetsResponse) {
    option (google.api.http) = {
      get: "/api/v1/budgets"
    };
  }

  // Create a new budget
  rpc CreateBudget(CreateBudgetRequest) returns (CreateBudgetResponse) {
    option (google.api.http) = {
      post: "/api/v1/budgets"
      body: "*"
    };
  }

  // Update budget information
  rpc UpdateBudget(UpdateBudgetRequest) returns (UpdateBudgetResponse) {
    option (google.api.http) = {
      put: "/api/v1/budgets/{budgetId}"
      body: "*"
    };
  }

  // Delete a budget
  rpc DeleteBudget(DeleteBudgetRequest) returns (DeleteBudgetResponse) {
    option (google.api.http) = {
      delete: "/api/v1/budgets/{budgetId}"
    };
  }

  // Get budget items for a budget
  rpc GetBudgetItems(GetBudgetItemsRequest) returns (GetBudgetItemsResponse) {
    option (google.api.http) = {
      get: "/api/v1/budgets/{budgetId}/items"
    };
  }

  // Create a budget item
  rpc CreateBudgetItem(CreateBudgetItemRequest) returns (CreateBudgetItemResponse) {
    option (google.api.http) = {
      post: "/api/v1/budgets/{budgetId}/items"
      body: "*"
    };
  }

  // Update a budget item
  rpc UpdateBudgetItem(UpdateBudgetItemRequest) returns (UpdateBudgetItemResponse) {
    option (google.api.http) = {
      put: "/api/v1/budgets/{budgetId}/items/{itemId}"
      body: "*"
    };
  }

  // Delete a budget item
  rpc DeleteBudgetItem(DeleteBudgetItemRequest) returns (DeleteBudgetItemResponse) {
    option (google.api.http) = {
      delete: "/api/v1/budgets/{budgetId}/items/{itemId}"
    };
  }
}

// Budget message
message Budget {
  int32 id = 1 [json_name = "id"];
  int32 userId = 2 [json_name = "userId"];
  string name = 3 [json_name = "name"];
  int64 total = 4 [json_name = "total"];  // Total budget in smallest currency unit (VND)
  int64 createdAt = 5 [json_name = "createdAt"];
  int64 updatedAt = 6 [json_name = "updatedAt"];
}

// BudgetItem message
message BudgetItem {
  int32 id = 1 [json_name = "id"];
  int32 budgetId = 2 [json_name = "budgetId"];
  string name = 3 [json_name = "name"];
  int64 total = 4 [json_name = "total"];  // Allocated amount in smallest currency unit
  int64 createdAt = 5 [json_name = "createdAt"];
  int64 updatedAt = 6 [json_name = "updatedAt"];
}

// GetBudget request
message GetBudgetRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
}

// ListBudgets request
message ListBudgetsRequest {
  wealthjourney.common.v1.PaginationParams pagination = 1 [json_name = "pagination"];
}

// CreateBudget request
message CreateBudgetRequest {
  string name = 1 [json_name = "name"];
  int64 total = 2 [json_name = "total"];
  repeated CreateBudgetItemRequest items = 3 [json_name = "items"];
}

// UpdateBudget request
message UpdateBudgetRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
  string name = 2 [json_name = "name"];
  int64 total = 3 [json_name = "total"];
}

// DeleteBudget request
message DeleteBudgetRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
}

// GetBudgetItems request
message GetBudgetItemsRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
}

// CreateBudgetItem request
message CreateBudgetItemRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
  string name = 2 [json_name = "name"];
  int64 total = 3 [json_name = "total"];
}

// UpdateBudgetItem request
message UpdateBudgetItemRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
  int32 itemId = 2 [json_name = "itemId"];
  string name = 3 [json_name = "name"];
  int64 total = 4 [json_name = "total"];
}

// DeleteBudgetItem request
message DeleteBudgetItemRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
  int32 itemId = 2 [json_name = "itemId"];
}

// Response messages (standard format)
message GetBudgetResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  Budget data = 3 [json_name = "data"];
  string timestamp = 4 [json_name = "timestamp"];
}

message ListBudgetsResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  repeated Budget budgets = 3 [json_name = "budgets"];
  wealthjourney.common.v1.PaginationResult pagination = 4 [json_name = "pagination"];
  string timestamp = 5 [json_name = "timestamp"];
}

message CreateBudgetResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  Budget data = 3 [json_name = "data"];
  string timestamp = 4 [json_name = "timestamp"];
}

message UpdateBudgetResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  Budget data = 3 [json_name = "data"];
  string timestamp = 4 [json_name = "timestamp"];
}

message DeleteBudgetResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  string timestamp = 3 [json_name = "timestamp"];
}

message GetBudgetItemsResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  repeated BudgetItem items = 3 [json_name = "items"];
  string timestamp = 4 [json_name = "timestamp"];
}

message CreateBudgetItemResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  BudgetItem data = 3 [json_name = "data"];
  string timestamp = 4 [json_name = "timestamp"];
}

message UpdateBudgetItemResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  BudgetItem data = 3 [json_name = "data"];
  string timestamp = 4 [json_name = "timestamp"];
}

message DeleteBudgetItemResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  string timestamp = 3 [json_name = "timestamp"];
}
```

**Step 2: Run protobuf generation**

```bash
task proto:all
```

Expected: Go code generated in `src/go-backend/gen/protobuf/v1/` and TypeScript types in `src/wj-client/gen/protobuf/v1/`

**Step 3: Commit**

```bash
git add api/protobuf/v1/budget.proto
git commit -m "feat(budget): add budget protobuf API definition"
```

---

## Task 2: Create Budget GORM Models

**Files:**
- Create: `src/go-backend/domain/models/budget.go`

**Step 1: Write the GORM models**

```go
package models

import (
	"time"
)

// Budget represents a budget plan for expense tracking
type Budget struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int32          `gorm:"not null;index" json:"userId"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Total     int64          `gorm:"type:bigint;default:0;not null" json:"total"` // Stored in smallest currency unit
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Items     []BudgetItem   `gorm:"foreignKey:BudgetID" json:"items,omitempty"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Budget) TableName() string {
	return "budget"
}

// BudgetItem represents a single budget item (category allocation)
type BudgetItem struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	BudgetID  int32          `gorm:"not null;index" json:"budgetId"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Total     int64          `gorm:"type:bigint;default:0;not null" json:"total"` // Stored in smallest currency unit
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Budget    *Budget        `gorm:"foreignKey:BudgetID" json:"budget,omitempty"`
}

func (BudgetItem) TableName() string {
	return "list_budget"
}
```

**Step 2: Run Go format check**

```bash
cd src/go-backend && gofmt -l domain/models/budget.go
```

Expected: No output (file is properly formatted)

**Step 3: Commit**

```bash
git add src/go-backend/domain/models/budget.go
git commit -m "feat(budget): add Budget and BudgetItem GORM models"
```

---

## Task 3: Create Budget Repository Interface and Implementation

**Files:**
- Create: `src/go-backend/domain/repository/budget_repository.go`
- Modify: `src/go-backend/domain/repository/interfaces.go` (add BudgetRepository interface)

**Step 1: Write the repository interface** (modify `interfaces.go`)

Add to `src/go-backend/domain/repository/interfaces.go` after `WalletRepository` interface:

```go
// BudgetRepository defines the interface for budget data operations
type BudgetRepository interface {
    Create(ctx context.Context, budget *models.Budget) error
    GetByID(ctx context.Context, id int32) (*models.Budget, error)
    ListByUserID(ctx context.Context, userID int32, pagination *types.Pagination) ([]*models.Budget, error)
    Update(ctx context.Context, budget *models.Budget) error
    Delete(ctx context.Context, id int32) error
}

// BudgetItemRepository defines the interface for budget item data operations
type BudgetItemRepository interface {
    Create(ctx context.Context, item *models.BudgetItem) error
    GetByID(ctx context.Context, id int32) (*models.BudgetItem, error)
    ListByBudgetID(ctx context.Context, budgetID int32) ([]*models.BudgetItem, error)
    Update(ctx context.Context, item *models.BudgetItem) error
    Delete(ctx context.Context, id int32) error
}
```

**Step 2: Write the repository implementation** (create `budget_repository.go`)

```go
package repository

import (
	"context"
	"wealthjourney/domain/models"
	"wealthjourney/pkg/types"

	"gorm.io/gorm"
)

type budgetRepository struct {
	db *gorm.DB
}

func NewBudgetRepository(db *gorm.DB) BudgetRepository {
	return &budgetRepository{db: db}
}

func (r *budgetRepository) Create(ctx context.Context, budget *models.Budget) error {
	return r.db.WithContext(ctx).Create(budget).Error
}

func (r *budgetRepository) GetByID(ctx context.Context, id int32) (*models.Budget, error) {
	var budget models.Budget
	err := r.db.WithContext(ctx).Preload("Items").First(&budget, id).Error
	if err != nil {
		return nil, err
	}
	return &budget, nil
}

func (r *budgetRepository) ListByUserID(ctx context.Context, userID int32, pagination *types.Pagination) ([]*models.Budget, error) {
	var budgets []*models.Budget
	query := r.db.WithContext(ctx).Where("user_id = ?", userID)

	if pagination != nil {
		offset := (pagination.Page - 1) * pagination.PageSize
		query = query.Offset(int(offset)).Limit(int(pageSize))
		if pagination.OrderBy != "" {
			order := pagination.OrderBy
			if pagination.Order == "desc" {
				order += " DESC"
			}
			query = query.Order(order)
		}
	}

	err := query.Preload("Items").Find(&budgets).Error
	return budgets, err
}

func (r *budgetRepository) Update(ctx context.Context, budget *models.Budget) error {
	return r.db.WithContext(ctx).Save(budget).Error
}

func (r *budgetRepository) Delete(ctx context.Context, id int32) error {
	return r.db.WithContext(ctx).Delete(&models.Budget{}, id).Error
}

type budgetItemRepository struct {
	db *gorm.DB
}

func NewBudgetItemRepository(db *gorm.DB) BudgetItemRepository {
	return &budgetItemRepository{db: db}
}

func (r *budgetItemRepository) Create(ctx context.Context, item *models.BudgetItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *budgetItemRepository) GetByID(ctx context.Context, id int32) (*models.BudgetItem, error) {
	var item models.BudgetItem
	err := r.db.WithContext(ctx).First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *budgetItemRepository) ListByBudgetID(ctx context.Context, budgetID int32) ([]*models.BudgetItem, error) {
	var items []*models.BudgetItem
	err := r.db.WithContext(ctx).Where("budget_id = ?", budgetID).Find(&items).Error
	return items, err
}

func (r *budgetItemRepository) Update(ctx context.Context, item *models.BudgetItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *budgetItemRepository) Delete(ctx context.Context, id int32) error {
	return r.db.WithContext(ctx).Delete(&models.BudgetItem{}, id).Error
}
```

**Step 3: Run Go format check**

```bash
cd src/go-backend && gofmt -l domain/repository/budget_repository.go domain/repository/interfaces.go
```

Expected: No output (files are properly formatted)

**Step 4: Commit**

```bash
git add src/go-backend/domain/repository/budget_repository.go src/go-backend/domain/repository/interfaces.go
git commit -m "feat(budget): add budget and budget item repositories"
```

---

## Task 4: Create Budget Service

**Files:**
- Modify: `src/go-backend/domain/service/interfaces.go` (add BudgetService interface)
- Create: `src/go-backend/domain/service/budget_service.go`
- Modify: `src/go-backend/domain/service/services.go` (wire up dependencies)

**Step 1: Add service interface to interfaces.go**

Add to `src/go-backend/domain/service/interfaces.go`:

```go
type BudgetService interface {
    CreateBudget(ctx context.Context, userID int32, req *budgetv1.CreateBudgetRequest) (*budgetv1.CreateBudgetResponse, error)
    GetBudget(ctx context.Context, userID, budgetID int32) (*budgetv1.GetBudgetResponse, error)
    ListBudgets(ctx context.Context, userID int32, pagination *types.Pagination) (*budgetv1.ListBudgetsResponse, error)
    UpdateBudget(ctx context.Context, userID int32, req *budgetv1.UpdateBudgetRequest) (*budgetv1.UpdateBudgetResponse, error)
    DeleteBudget(ctx context.Context, userID, budgetID int32) (*budgetv1.DeleteBudgetResponse, error)

    CreateBudgetItem(ctx context.Context, userID int32, req *budgetv1.CreateBudgetItemRequest) (*budgetv1.CreateBudgetItemResponse, error)
    UpdateBudgetItem(ctx context.Context, userID int32, req *budgetv1.UpdateBudgetItemRequest) (*budgetv1.UpdateBudgetItemResponse, error)
    DeleteBudgetItem(ctx context.Context, userID, budgetID, itemID int32) (*budgetv1.DeleteBudgetItemResponse, error)
    GetBudgetItems(ctx context.Context, userID, budgetID int32) (*budgetv1.GetBudgetItemsResponse, error)
}
```

**Step 2: Write the budget service implementation**

```go
package service

import (
	"context"
	"errors"
	"wealthjourney/domain/models"
	"wealthjourney/pkg/apperrors"
	"wealthjourney/pkg/types"
	budgetv1 "wealthjourney/gen/protobuf/v1"

	"github.com/google/uuid"
)

type budgetService struct {
	budgetRepo     repository.BudgetRepository
	budgetItemRepo repository.BudgetItemRepository
	userRepo       repository.UserRepository
}

func NewBudgetService(
	budgetRepo repository.BudgetRepository,
	budgetItemRepo repository.BudgetItemRepository,
	userRepo repository.UserRepository,
) BudgetService {
	return &budgetService{
		budgetRepo:     budgetRepo,
		budgetItemRepo: budgetItemRepo,
		userRepo:       userRepo,
	}
}

func (s *budgetService) CreateBudget(ctx context.Context, userID int32, req *budgetv1.CreateBudgetRequest) (*budgetv1.CreateBudgetResponse, error) {
	// Verify user exists
	user, err := s.userRepo.GetByID(ctx, userID)
	if user == nil {
		return nil, apperrors.NewNotFoundError("user")
	}

	// Create budget
	budget := &models.Budget{
		UserID: userID,
		Name:   req.Name,
		Total:  req.Total,
	}

	if err := s.budgetRepo.Create(ctx, budget); err != nil {
		return nil, err
	}

	// Create items if provided
	for _, itemReq := range req.Items {
		item := &models.BudgetItem{
			BudgetID: budget.ID,
			Name:     itemReq.Name,
			Total:    itemReq.Total,
		}
		if err := s.budgetItemRepo.Create(ctx, item); err != nil {
			return nil, err
		}
	}

	// Reload with items
	budget, err = s.budgetRepo.GetByID(ctx, budget.ID)
	if err != nil {
		return nil, err
	}

	return &budgetv1.CreateBudgetResponse{
		Success:   true,
		Message:   "Budget created successfully",
		Data:      s.mapBudgetToProto(budget),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) GetBudget(ctx context.Context, userID, budgetID int32) (*budgetv1.GetBudgetResponse, error) {
	budget, err := s.budgetRepo.GetByID(ctx, budgetID)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	return &budgetv1.GetBudgetResponse{
		Success:   true,
		Message:   "Budget retrieved successfully",
		Data:      s.mapBudgetToProto(budget),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) ListBudgets(ctx context.Context, userID int32, pagination *types.Pagination) (*budgetv1.ListBudgetsResponse, error) {
	budgets, err := s.budgetRepo.ListByUserID(ctx, userID, pagination)
	if err != nil {
		return nil, err
	}

	protoBudgets := make([]*budgetv1.Budget, len(budgets))
	for i, b := range budgets {
		protoBudgets[i] = s.mapBudgetToProto(b)
	}

	return &budgetv1.ListBudgetsResponse{
		Success:   true,
		Message:   "Budgets retrieved successfully",
		Budgets:   protoBudgets,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) UpdateBudget(ctx context.Context, userID int32, req *budgetv1.UpdateBudgetRequest) (*budgetv1.UpdateBudgetResponse, error) {
	budget, err := s.budgetRepo.GetByID(ctx, req.BudgetId)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	budget.Name = req.Name
	budget.Total = req.Total

	if err := s.budgetRepo.Update(ctx, budget); err != nil {
		return nil, err
	}

	return &budgetv1.UpdateBudgetResponse{
		Success:   true,
		Message:   "Budget updated successfully",
		Data:      s.mapBudgetToProto(budget),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) DeleteBudget(ctx context.Context, userID, budgetID int32) (*budgetv1.DeleteBudgetResponse, error) {
	budget, err := s.budgetRepo.GetByID(ctx, budgetID)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	if err := s.budgetRepo.Delete(ctx, budgetID); err != nil {
		return nil, err
	}

	return &budgetv1.DeleteBudgetResponse{
		Success:   true,
		Message:   "Budget deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) CreateBudgetItem(ctx context.Context, userID int32, req *budgetv1.CreateBudgetItemRequest) (*budgetv1.CreateBudgetItemResponse, error) {
	budget, err := s.budgetRepo.GetByID(ctx, req.BudgetId)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	item := &models.BudgetItem{
		BudgetID: req.BudgetId,
		Name:     req.Name,
		Total:    req.Total,
	}

	if err := s.budgetItemRepo.Create(ctx, item); err != nil {
		return nil, err
	}

	return &budgetv1.CreateBudgetItemResponse{
		Success:   true,
		Message:   "Budget item created successfully",
		Data:      s.mapBudgetItemToProto(item),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) UpdateBudgetItem(ctx context.Context, userID int32, req *budgetv1.UpdateBudgetItemRequest) (*budgetv1.UpdateBudgetItemResponse, error) {
	item, err := s.budgetItemRepo.GetByID(ctx, req.ItemId)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget item")
	}

	budget, err := s.budgetRepo.GetByID(ctx, req.BudgetId)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	item.Name = req.Name
	item.Total = req.Total

	if err := s.budgetItemRepo.Update(ctx, item); err != nil {
		return nil, err
	}

	return &budgetv1.UpdateBudgetItemResponse{
		Success:   true,
		Message:   "Budget item updated successfully",
		Data:      s.mapBudgetItemToProto(item),
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) DeleteBudgetItem(ctx context.Context, userID, budgetID, itemID int32) (*budgetv1.DeleteBudgetItemResponse, error) {
	item, err := s.budgetItemRepo.GetByID(ctx, itemID)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget item")
	}

	budget, err := s.budgetRepo.GetByID(ctx, budgetID)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	if err := s.budgetItemRepo.Delete(ctx, itemID); err != nil {
		return nil, err
	}

	return &budgetv1.DeleteBudgetItemResponse{
		Success:   true,
		Message:   "Budget item deleted successfully",
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) GetBudgetItems(ctx context.Context, userID, budgetID int32) (*budgetv1.GetBudgetItemsResponse, error) {
	budget, err := s.budgetRepo.GetByID(ctx, budgetID)
	if err != nil {
		return nil, apperrors.NewNotFoundError("budget")
	}

	if budget.UserID != userID {
		return nil, apperrors.NewForbiddenError()
	}

	items, err := s.budgetItemRepo.ListByBudgetID(ctx, budgetID)
	if err != nil {
		return nil, err
	}

	protoItems := make([]*budgetv1.BudgetItem, len(items))
	for i, item := range items {
		protoItems[i] = s.mapBudgetItemToProto(item)
	}

	return &budgetv1.GetBudgetItemsResponse{
		Success:   true,
		Message:   "Budget items retrieved successfully",
		Items:     protoItems,
		Timestamp: time.Now().Format(time.RFC3339),
	}, nil
}

func (s *budgetService) mapBudgetToProto(budget *models.Budget) *budgetv1.Budget {
	items := make([]*budgetv1.BudgetItem, len(budget.Items))
	for i, item := range budget.Items {
		items[i] = s.mapBudgetItemToProto(&item)
	}

	return &budgetv1.Budget{
		Id:        budget.ID,
		UserId:    budget.UserID,
		Name:      budget.Name,
		Total:     budget.Total,
		CreatedAt: budget.CreatedAt.Unix(),
		UpdatedAt: budget.UpdatedAt.Unix(),
	}
}

func (s *budgetService) mapBudgetItemToProto(item *models.BudgetItem) *budgetv1.BudgetItem {
	return &budgetv1.BudgetItem{
		Id:        item.ID,
		BudgetId:  item.BudgetID,
		Name:      item.Name,
		Total:     item.Total,
		CreatedAt: item.CreatedAt.Unix(),
		UpdatedAt: item.UpdatedAt.Unix(),
	}
}
```

**Step 3: Run Go format check**

```bash
cd src/go-backend && gofmt -l domain/service/budget_service.go
```

Expected: No output

**Step 4: Commit**

```bash
git add src/go-backend/domain/service/budget_service.go src/go-backend/domain/service/interfaces.go
git commit -m "feat(budget): add budget service layer"
```

---

## Task 5: Create Budget HTTP Handlers

**Files:**
- Create: `src/go-backend/api/handlers/budget.go`
- Modify: `src/go-backend/api/handlers/dependencies.go` (add Budget handlers)
- Modify: `src/go-backend/api/handlers/routes.go` (register budget routes)

**Step 1: Write the HTTP handlers**

Create `src/go-backend/api/handlers/budget.go`:

```go
package handlers

import (
	"net/http"
	"strconv"

	budgetv1 "wealthjourney/gen/protobuf/v1"

	"github.com/gin-gonic/gin"
)

type BudgetHandlers struct {
	budgetService service.BudgetService
}

func (h *BudgetHandlers) CreateBudget(c *gin.Context) {
	var req budgetv1.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.CreateBudget(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *BudgetHandlers) GetBudget(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.GetBudget(c.Request.Context(), userID, int32(budgetID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandlers) ListBudgets(c *gin.Context) {
	userID := c.GetInt32("userID")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	orderBy := c.DefaultQuery("orderBy", "created_at")
	order := c.DefaultQuery("order", "desc")

	pagination := &types.Pagination{
		Page:     int32(page),
		PageSize: int32(pageSize),
		OrderBy:  orderBy,
		Order:    order,
	}

	resp, err := h.budgetService.ListBudgets(c.Request.Context(), userID, pagination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandlers) UpdateBudget(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	var req budgetv1.UpdateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.BudgetId = int32(budgetID)

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.UpdateBudget(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandlers) DeleteBudget(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.DeleteBudget(c.Request.Context(), userID, int32(budgetID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandlers) GetBudgetItems(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.GetBudgetItems(c.Request.Context(), userID, int32(budgetID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandlers) CreateBudgetItem(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	var req budgetv1.CreateBudgetItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.BudgetId = int32(budgetID)

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.CreateBudgetItem(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *BudgetHandlers) UpdateBudgetItem(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	itemID, err := strconv.ParseInt(c.Param("itemId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	var req budgetv1.UpdateBudgetItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.BudgetId = int32(budgetID)
	req.ItemId = int32(itemID)

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.UpdateBudgetItem(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandlers) DeleteBudgetItem(c *gin.Context) {
	budgetID, err := strconv.ParseInt(c.Param("budgetId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget ID"})
		return
	}

	itemID, err := strconv.ParseInt(c.Param("itemId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item ID"})
		return
	}

	userID := c.GetInt32("userID")
	resp, err := h.budgetService.DeleteBudgetItem(c.Request.Context(), userID, int32(budgetID), int32(itemID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
```

**Step 2: Update dependencies.go**

Add to `AllHandlers` struct in `src/go-backend/api/handlers/dependencies.go`:

```go
type AllHandlers struct {
    User        *UserHandlers
    Wallet      *WalletHandlers
    Transaction *TransactionHandlers
    Category    *CategoryHandlers
    Budget      *BudgetHandlers  // Add this line
}
```

**Step 3: Register routes in routes.go**

Add to `src/go-backend/api/handlers/routes.go` before the closing brace of `RegisterRoutes`:

```go
// Budget routes (protected)
budgets := v1.Group("/budgets")
if rateLimiter != nil {
    budgets.Use(appmiddleware.RateLimitByUser(rateLimiter))
}
budgets.Use(AuthMiddleware())
{
    budgets.POST("", h.Budget.CreateBudget)
    budgets.GET("", h.Budget.ListBudgets)
    budgets.GET("/:budgetId/items", h.Budget.GetBudgetItems)
    budgets.POST("/:budgetId/items", h.Budget.CreateBudgetItem)
    budgets.PUT("/:budgetId/items/:itemId", h.Budget.UpdateBudgetItem)
    budgets.DELETE("/:budgetId/items/:itemId", h.Budget.DeleteBudgetItem)
    budgets.GET("/:budgetId", h.Budget.GetBudget)
    budgets.PUT("/:budgetId", h.Budget.UpdateBudget)
    budgets.DELETE("/:budgetId", h.Budget.DeleteBudget)
}
```

**Step 4: Run Go format check**

```bash
cd src/go-backend && gofmt -l api/handlers/budget.go api/handlers/dependencies.go api/handlers/routes.go
```

Expected: No output

**Step 5: Commit**

```bash
git add src/go-backend/api/handlers/budget.go src/go-backend/api/handlers/dependencies.go src/go-backend/api/handlers/routes.go
git commit -m "feat(budget): add budget HTTP handlers and routes"
```

---

## Task 6: Generate Frontend API Client Hooks

**Files:**
- Generated: `src/wj-client/utils/generated/hooks.ts` (auto-generated)
- Generated: `src/wj-client/gen/protobuf/v1/budget.ts` (auto-generated)

**Step 1: Regenerate all protobuf code**

```bash
task proto:all
```

Expected: Budget hooks and types generated in `src/wj-client/utils/generated/hooks.ts` and `src/wj-client/gen/protobuf/v1/budget.ts`

**Step 2: Verify generated hooks exist**

```bash
grep -n "useMutationCreateBudget\|useQueryListBudgets" src/wj-client/utils/generated/hooks.ts
```

Expected output shows budget hooks

**Step 3: Commit generated files**

```bash
git add src/wj-client/utils/generated/hooks.ts src/wj-client/gen/protobuf/v1/budget.ts
git commit -m "feat(budget): generate frontend budget API hooks"
```

---

## Task 7: Create Budget Page Component Structure

**Files:**
- Create: `src/wj-client/app/dashboard/budget/page.tsx`
- Create: `src/wj-client/app/dashboard/budget/BudgetSummary.tsx`
- Create: `src/wj-client/app/dashboard/budget/BudgetItems.tsx`
- Create: `src/wj-client/app/dashboard/budget/CircularProgress.tsx`

**Step 1: Create the main Budget page**

```tsx
"use client";

import { BaseCard } from "@/components/BaseCard";
import { useQueryListBudgets } from "@/utils/generated/hooks";
import { BudgetSummary } from "./BudgetSummary";
import { BudgetItems } from "./BudgetItems";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";

export default function BudgetPage() {
  const listBudgets = useQueryListBudgets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } },
    { refetchOnMount: "always" }
  );

  const handleCreateBudget = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CREATE_BUDGET,
        onSuccess: () => {
          listBudgets.refetch();
        },
      })
    );
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Left: Summary and Budget Items */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-[#181c14]">Budget</h1>
          <Button
            type={ButtonType.PRIMARY}
            onClick={handleCreateBudget}
            className="w-fit px-6"
          >
            Create budget
          </Button>
        </div>

        {listBudgets.data?.budgets && listBudgets.data.budgets.length > 0 ? (
          <>
            <BaseCard className="mb-4">
              <BudgetSummary budget={listBudgets.data.budgets[0]} />
            </BaseCard>
            <div className="space-y-3">
              <BudgetItems budget={listBudgets.data.budgets[0]} />
            </div>
          </>
        ) : (
          <BaseCard className="text-center py-12">
            <p className="text-gray-500 mb-4">No budgets yet. Create your first budget!</p>
            <Button type={ButtonType.PRIMARY} onClick={handleCreateBudget}>
              Create budget
            </Button>
          </BaseCard>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create Circular Progress Component**

```tsx
"use client";

import { cn } from "@/lib/utils/cn";

interface CircularProgressProps {
  value: number;       // Current value
  max: number;         // Maximum value
  size?: number;       // Diameter in pixels
  strokeWidth?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  max,
  size = 351,
  strokeWidth = 40,
  className,
  color = "#00a445",
  backgroundColor = "#d9d9d9",
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className={cn("relative inline-block", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
```

**Step 3: Create Budget Summary Component**

```tsx
"use client";

import { CircularProgress } from "./CircularProgress";
import { formatMoney } from "@/lib/utils/format";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";
import type { Budget } from "@/gen/protobuf/v1/budget";

interface BudgetSummaryProps {
  budget: Budget;
}

export function BudgetSummary({ budget }: BudgetSummaryProps) {
  const totalBudget = budget.total;
  const allocated = budget.items?.reduce((sum, item) => sum + item.total, 0) || 0;
  const remaining = totalBudget - allocated;

  const handleEditBudget = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_BUDGET,
        modalData: { budget },
        onSuccess: () => {
          // Refetch handled by parent
        },
      })
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Circular Progress */}
      <div className="relative">
        <CircularProgress
          value={remaining}
          max={totalBudget}
          size={351}
          strokeWidth={40}
        >
          <CircularProgress
            value={totalBudget}
            max={totalBudget}
            size={271}
            strokeWidth={30}
            backgroundColor="transparent"
          />
        </CircularProgress>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[#99a3a5] text-sm font-bold mb-1">Total Budget</div>
          <div className="text-[#008148] text-4xl font-bold mb-2">
            {formatMoney(totalBudget)}
          </div>
          <div className="text-[#99a3a5] text-sm font-bold mb-1">Amount you can spend</div>
          <div className="text-black text-4xl font-bold">
            {formatMoney(remaining)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleEditBudget}
          className="w-[117px]"
        >
          Edit Budget
        </Button>
        <div className="bg-white border border-black/50 rounded-lg px-4 py-2 flex items-center justify-between w-[122px]">
          <span className="text-sm font-bold">Budget 1</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create Budget Items List Component**

```tsx
"use client";

import { BaseCard } from "@/components/BaseCard";
import { formatMoney } from "@/lib/utils/format";
import type { Budget, BudgetItem } from "@/gen/protobuf/v1/budget";
import { store } from "@/redux/store";
import { openModal, closeModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";

interface BudgetItemsProps {
  budget: Budget;
}

export function BudgetItems({ budget }: BudgetItemsProps) {
  const handleEditItem = (item: BudgetItem) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_BUDGET_ITEM,
        modalData: { budget, item },
        onSuccess: () => {
          // Refetch handled by parent
        },
      })
    );
  };

  const handleDeleteItem = (item: BudgetItem) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CONFIRM,
        modalData: {
          title: "Delete Budget Item",
          message: `Are you sure you want to delete "${item.name}"?`,
          onConfirm: async () => {
            // Delete mutation will be handled in confirmation modal
          },
        },
      })
    );
  };

  if (!budget.items || budget.items.length === 0) {
    return (
      <BaseCard className="text-center py-8">
        <p className="text-gray-500">No budget items yet. Add items to track your spending!</p>
      </BaseCard>
    );
  }

  return (
    <div className="space-y-3">
      {budget.items.map((item) => (
        <BudgetItemCard
          key={item.id}
          item={item}
          onEdit={() => handleEditItem(item)}
          onDelete={() => handleDeleteItem(item)}
        />
      ))}
    </div>
  );
}

interface BudgetItemCardProps {
  item: BudgetItem;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetItemCard({ item, onEdit, onDelete }: BudgetItemCardProps) {
  return (
    <BaseCard className="!p-4">
      <div className="flex items-center justify-between">
        {/* Left: Name and Amount */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-[#181c14]">{item.name}</div>
            <div className="font-bold text-[#181c14]">{formatMoney(item.total)}</div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Edit"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Delete"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </BaseCard>
  );
}
```

**Step 5: Check TypeScript compilation**

```bash
cd src/wj-client && npx tsc --noEmit
```

Expected: No errors

**Step 6: Commit**

```bash
git add src/wj-client/app/dashboard/budget/
git commit -m "feat(budget): add budget page components"
```

---

## Task 8: Add ModalType Constants and Format Utility

**Files:**
- Modify: `src/wj-client/app/constants.tsx` (add budget modal types)
- Create: `src/wj-client/lib/utils/format.ts` (money formatting utility)

**Step 1: Add budget modal types to constants**

Add to `ModalType` enum in [`src/wj-client/app/constants.tsx`](../../src/wj-client/app/constants.tsx):

```typescript
export const ModalType = {
  ADD_TRANSACTION: "Add Transaction",
  EDIT_TRANSACTION: "Edit Transaction",
  TRANSFER_MONEY: "Transfer Money",
  CREATE_WALLET: "Create New Wallet",
  SUCCESS: "Success",
  CONFIRM: "Confirm",
  CREATE_BUDGET: "Create Budget",        // Add
  EDIT_BUDGET: "Edit Budget",            // Add
  EDIT_BUDGET_ITEM: "Edit Budget Item",  // Add
};
```

**Step 2: Create money format utility**

Create `src/wj-client/lib/utils/format.ts`:

```typescript
/**
 * Format money amount in VND with proper thousand separators
 * @param amount - Amount in smallest currency unit (e.g., VND * 1000)
 * @returns Formatted string (e.g., "10,000,000")
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Format money amount as currency string
 * @param amount - Amount in smallest currency unit
 * @returns Formatted currency string (e.g., "10.000.000 ₫")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
```

**Step 3: Commit**

```bash
git add src/wj-client/app/constants.tsx src/wj-client/lib/utils/format.ts
git commit -m "feat(budget): add budget modal types and format utilities"
```

---

## Task 9: Create Budget Modals (Create/Edit Budget and Item)

**Files:**
- Create: `src/wj-client/components/modals/forms/CreateBudgetForm.tsx`
- Create: `src/wj-client/components/modals/forms/EditBudgetForm.tsx`
- Create: `src/wj-client/components/modals/forms/CreateBudgetItemForm.tsx`
- Create: `src/wj-client/components/modals/forms/EditBudgetItemForm.tsx`
- Modify: `src/wj-client/components/modals/BaseModal.tsx` (add budget modal types)

**Step 1: Create Budget Form Modal**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { FormInput, FormNumberInput } from "@/components/forms";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { useMutationCreateBudget } from "@/utils/generated/hooks";
import { store } from "@/redux/store";
import { closeModal } from "@/redux/actions";
import type { ModalPayload } from "@/redux/interface";

interface CreateBudgetFormProps {
  modal: ModalPayload;
}

interface BudgetFormData {
  name: string;
  total: number;
}

export function CreateBudgetForm({ modal }: CreateBudgetFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormData>({
    defaultValues: {
      name: "",
      total: 0,
    },
  });

  const createBudgetMutation = useMutationCreateBudget({
    onSuccess: () => {
      modal.onSuccess?.();
      store.dispatch(closeModal());
      // Show success modal
      store.dispatch(
        openModal({
          isOpen: true,
          type: ModalType.SUCCESS,
          modalData: { message: "Budget created successfully!" },
        })
      );
    },
    onError: (error: any) => {
      console.error("Failed to create budget:", error);
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    createBudgetMutation.mutate({
      name: data.name,
      total: data.total,
      items: [], // Items can be added after creation
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Create New Budget</h2>

      <FormInput
        name="name"
        control={control}
        label="Budget Name"
        placeholder="e.g., Monthly Budget"
        required
      />

      <FormNumberInput
        name="total"
        control={control}
        label="Total Budget Amount (VND)"
        placeholder="10000000"
        required
      />

      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={createBudgetMutation.isPending}
      >
        Create Budget
      </Button>
    </form>
  );
}
```

**Step 2: Create Edit Budget Form**

```tsx
"use client";

import { useForm, Controller } from "react-hook-form";
import { FormInput, FormNumberInput } from "@/components/forms";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { useMutationUpdateBudget } from "@/utils/generated/hooks";
import { store } from "@/redux/store";
import { closeModal } from "@/redux/actions";
import type { ModalPayload, Budget } from "@/redux/interface";

interface EditBudgetFormProps {
  modal: ModalPayload;
}

interface BudgetFormData {
  name: string;
  total: number;
}

export function EditBudgetForm({ modal }: EditBudgetFormProps) {
  const budget = modal.modalData?.budget as Budget;

  const { control, handleSubmit } = useForm<BudgetFormData>({
    defaultValues: {
      name: budget?.name || "",
      total: budget?.total || 0,
    },
  });

  const updateBudgetMutation = useMutationUpdateBudget({
    onSuccess: () => {
      modal.onSuccess?.();
      store.dispatch(closeModal());
      store.dispatch(
        openModal({
          isOpen: true,
          type: ModalType.SUCCESS,
          modalData: { message: "Budget updated successfully!" },
        })
      );
    },
    onError: (error: any) => {
      console.error("Failed to update budget:", error);
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    updateBudgetMutation.mutate({
      budgetId: budget.id,
      name: data.name,
      total: data.total,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Edit Budget</h2>

      <FormInput
        name="name"
        control={control}
        label="Budget Name"
        required
      />

      <FormNumberInput
        name="total"
        control={control}
        label="Total Budget Amount (VND)"
        required
      />

      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={updateBudgetMutation.isPending}
      >
        Save Changes
      </Button>
    </form>
  );
}
```

**Step 3: Create Edit Budget Item Form**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { FormInput, FormNumberInput } from "@/components/forms";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { useMutationUpdateBudgetItem } from "@/utils/generated/hooks";
import { store } from "@/redux/store";
import { closeModal } from "@/redux/actions";
import { ModalType, openModal } from "@/redux/actions";
import type { ModalPayload } from "@/redux/interface";

interface EditBudgetItemFormProps {
  modal: ModalPayload;
}

interface BudgetItemFormData {
  name: string;
  total: number;
}

export function EditBudgetItemForm({ modal }: EditBudgetItemFormProps) {
  const { budget, item } = modal.modalData || {};

  const { control, handleSubmit } = useForm<BudgetItemFormData>({
    defaultValues: {
      name: item?.name || "",
      total: item?.total || 0,
    },
  });

  const updateItemMutation = useMutationUpdateBudgetItem({
    onSuccess: () => {
      modal.onSuccess?.();
      store.dispatch(closeModal());
      store.dispatch(
        openModal({
          isOpen: true,
          type: ModalType.SUCCESS,
          modalData: { message: "Budget item updated successfully!" },
        })
      );
    },
    onError: (error: any) => {
      console.error("Failed to update budget item:", error);
    },
  });

  const onSubmit = (data: BudgetItemFormData) => {
    updateItemMutation.mutate({
      budgetId: budget.id,
      itemId: item.id,
      name: data.name,
      total: data.total,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Edit Budget Item</h2>

      <FormInput
        name="name"
        control={control}
        label="Category Name"
        required
      />

      <FormNumberInput
        name="total"
        control={control}
        label="Allocated Amount (VND)"
        required
      />

      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={updateItemMutation.isPending}
      >
        Save Changes
      </Button>
    </form>
  );
}
```

**Step 4: Update BaseModal to handle budget modals**

Modify the modal type switch in [`src/wj-client/components/modals/BaseModal.tsx`](../../src/wj-client/components/modals/BaseModal.tsx) to add:

```tsx
import { CreateBudgetForm } from "./forms/CreateBudgetForm";
import { EditBudgetForm } from "./forms/EditBudgetForm";
import { EditBudgetItemForm } from "./forms/EditBudgetItemForm";
```

And add to the switch statement:

```tsx
case ModalType.CREATE_BUDGET:
  return <CreateBudgetForm modal={modal} />;

case ModalType.EDIT_BUDGET:
  return <EditBudgetForm modal={modal} />;

case ModalType.EDIT_BUDGET_ITEM:
  return <EditBudgetItemForm modal={modal} />;
```

**Step 5: Commit**

```bash
git add src/wj-client/components/modals/forms/CreateBudgetForm.tsx \
        src/wj-client/components/modals/forms/EditBudgetForm.tsx \
        src/wj-client/components/modals/forms/EditBudgetItemForm.tsx \
        src/wj-client/components/modals/BaseModal.tsx
git commit -m "feat(budget): add budget form modals"
```

---

## Task 10: Test Budget Page End-to-End

**Files:**
- Test: Manual browser testing

**Step 1: Start development servers**

```bash
task dev
```

Expected: Backend on port 5000, frontend on port 3000

**Step 2: Test the budget page flow**

1. Navigate to `http://localhost:3000/dashboard/budget`
2. Verify empty state shows "Create budget" button
3. Click "Create budget" button
4. Fill form:
   - Name: "Test Budget"
   - Total: 10000000
5. Submit and verify success modal
6. Verify budget summary shows circular progress
7. Click "Edit Budget" and modify total to 15000000
8. Verify update reflects in UI
9. Refresh page and verify data persists

**Step 3: Test budget items**

1. (Will need CREATE_BUDGET_ITEM modal - add as follow-up)
2. Edit existing budget item
3. Delete budget item with confirmation

**Step 4: Test responsive behavior**

1. Resize browser to <800px width
2. Verify hamburger menu appears
3. Verify cards stack vertically
4. Verify "Create budget" button remains accessible

**Step 5: Check for console errors**

Open browser DevTools Console:
- Verify no React errors
- Verify no API errors
- Verify no TypeScript errors

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(budget): address issues found during testing"
```

---

## Task 11: Add Loading and Error States

**Files:**
- Modify: `src/wj-client/app/dashboard/budget/page.tsx`
- Modify: `src/wj-client/app/dashboard/budget/BudgetSummary.tsx`
- Modify: `src/wj-client/app/dashboard/budget/BudgetItems.tsx`

**Step 1: Add loading state to main page**

Modify [`page.tsx`](../../src/wj-client/app/dashboard/budget/page.tsx):

```tsx
"use client";

import { BaseCard } from "@/components/BaseCard";
import { useQueryListBudgets } from "@/utils/generated/hooks";
import { BudgetSummary } from "./BudgetSummary";
import { BudgetItems } from "./BudgetItems";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";
import { FullPageLoading } from "@/components/loading/FullPageLoading";

export default function BudgetPage() {
  const listBudgets = useQueryListBudgets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } },
    { refetchOnMount: "always" }
  );

  const handleCreateBudget = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CREATE_BUDGET,
        onSuccess: () => {
          listBudgets.refetch();
        },
      })
    );
  };

  if (listBudgets.isLoading) {
    return <FullPageLoading />;
  }

  if (listBudgets.error) {
    return (
      <BaseCard className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load budgets. Please try again.</p>
        <Button type={ButtonType.PRIMARY} onClick={() => listBudgets.refetch()}>
          Retry
        </Button>
      </BaseCard>
    );
  }

  // ... rest of component
}
```

**Step 2: Add loading skeletons to child components**

Add to `BudgetSummary.tsx` and `BudgetItems.tsx` as needed.

**Step 3: Commit**

```bash
git add src/wj-client/app/dashboard/budget/
git commit -m "feat(budget): add loading and error states"
```

---

## Task 12: Add Create Budget Item Quick Action

**Files:**
- Create: `src/wj-client/components/modals/forms/CreateBudgetItemForm.tsx`
- Modify: `src/wj-client/app/dashboard/budget/BudgetItems.tsx` (add "Add Item" button)

**Step 1: Create budget item form modal**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { FormInput, FormNumberInput } from "@/components/forms";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { useMutationCreateBudgetItem } from "@/utils/generated/hooks";
import { store } from "@/redux/store";
import { closeModal, openModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";
import type { ModalPayload } from "@/redux/interface";

interface CreateBudgetItemFormProps {
  modal: ModalPayload;
}

interface BudgetItemFormData {
  name: string;
  total: number;
}

export function CreateBudgetItemForm({ modal }: CreateBudgetItemFormProps) {
  const budget = modal.modalData?.budget;

  const { control, handleSubmit } = useForm<BudgetItemFormData>({
    defaultValues: {
      name: "",
      total: 0,
    },
  });

  const createItemMutation = useMutationCreateBudgetItem({
    onSuccess: () => {
      modal.onSuccess?.();
      store.dispatch(closeModal());
      store.dispatch(
        openModal({
          isOpen: true,
          type: ModalType.SUCCESS,
          modalData: { message: "Budget item added successfully!" },
        })
      );
    },
    onError: (error: any) => {
      console.error("Failed to create budget item:", error);
    },
  });

  const onSubmit = (data: BudgetItemFormData) => {
    createItemMutation.mutate({
      budgetId: budget.id,
      name: data.name,
      total: data.total,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Add Budget Item</h2>

      <FormInput
        name="name"
        control={control}
        label="Category Name"
        placeholder="e.g., Food & Beverage"
        required
      />

      <FormNumberInput
        name="total"
        control={control}
        label="Allocated Amount (VND)"
        placeholder="3000000"
        required
      />

      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={createItemMutation.isPending}
      >
        Add Item
      </Button>
    </form>
  );
}
```

**Step 2: Add "Add Item" button to BudgetItems**

Modify `BudgetItems.tsx`:

```tsx
import { CreateBudgetItemForm } from "@/components/modals/forms/CreateBudgetItemForm";

export function BudgetItems({ budget }: BudgetItemsProps) {
  const handleAddItem = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CREATE_BUDGET_ITEM,
        modalData: { budget },
        onSuccess: () => {
          // Refetch
        },
      })
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Budget Items</h2>
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleAddItem}
          className="w-fit px-4"
        >
          + Add Item
        </Button>
      </div>
      {/* rest of component */}
    </div>
  );
}
```

**Step 3: Update BaseModal and constants**

Add `CREATE_BUDGET_ITEM` to `ModalType` enum in constants.tsx.

Add to BaseModal.tsx:
```tsx
import { CreateBudgetItemForm } from "./forms/CreateBudgetItemForm";

// In switch:
case ModalType.CREATE_BUDGET_ITEM:
  return <CreateBudgetItemForm modal={modal} />;
```

**Step 4: Commit**

```bash
git add src/wj-client/
git commit -m "feat(budget): add create budget item functionality"
```

---

## Task 13: Final Testing and Documentation

**Files:**
- Documentation: Update project README if needed

**Step 1: Run complete test suite**

```bash
# Frontend
cd src/wj-client && npx tsc --noEmit

# Backend
cd src/go-backend && go test ./...
```

Expected: All tests pass

**Step 2: Verify all functionality**

- Create budget with items
- Edit budget total
- Edit budget item
- Delete budget item
- Delete entire budget
- Responsive layouts
- Loading states
- Error states

**Step 3: Check accessibility**

- Keyboard navigation works
- ARIA labels on buttons
- Focus management in modals
- Color contrast meets WCAG standards

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(budget): complete budget page implementation"
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] Budget page renders on desktop (>800px)
- [ ] Budget page renders on mobile (<800px)
- [ ] Create budget modal opens and submits
- [ ] Edit budget modal populates with existing data
- [ ] Budget summary shows correct circular progress
- [ ] Budget items display correctly
- [ ] Add budget item modal works
- [ ] Edit budget item modal works
- [ ] Delete budget item shows confirmation
- [ ] Loading states show during API calls
- [ ] Error states display user-friendly messages
- [ ] Page refreshes maintain state
- [ ] Navigation from sidebar works
- [ ] All modals close with backdrop click
- [ ] TypeScript compilation succeeds
- [ ] No console errors in browser

---

## Known Limitations and Future Work

1. **Budget Categories:** Currently uses free-text for category names. Could integrate with existing Category system.

2. **Budget Periods:** Budgets are not time-bound (no monthly/yearly tracking). Add period tracking in future iteration.

3. **Budget vs Actual:** No comparison between budgeted amounts and actual spending. Add transaction integration.

4. **Budget Templates:** No preset budget templates. Add common templates (50/30/20 rule, etc.).

5. **Budget Alerts:** No alerts when approaching budget limits. Add notification system integration.

6. **Budget Sharing:** No sharing between users. Add collaborative budgets.

---

## Files Changed Summary

### Backend (Go)
- `api/protobuf/v1/budget.proto` - NEW
- `src/go-backend/domain/models/budget.go` - NEW
- `src/go-backend/domain/repository/budget_repository.go` - NEW
- `src/go-backend/domain/repository/interfaces.go` - MODIFIED
- `src/go-backend/domain/service/budget_service.go` - NEW
- `src/go-backend/domain/service/interfaces.go` - MODIFIED
- `src/go-backend/api/handlers/budget.go` - NEW
- `src/go-backend/api/handlers/dependencies.go` - MODIFIED
- `src/go-backend/api/handlers/routes.go` - MODIFIED

### Frontend (TypeScript/React)
- `src/wj-client/app/dashboard/budget/page.tsx` - NEW
- `src/wj-client/app/dashboard/budget/BudgetSummary.tsx` - NEW
- `src/wj-client/app/dashboard/budget/BudgetItems.tsx` - NEW
- `src/wj-client/app/dashboard/budget/CircularProgress.tsx` - NEW
- `src/wj-client/components/modals/forms/CreateBudgetForm.tsx` - NEW
- `src/wj-client/components/modals/forms/EditBudgetForm.tsx` - NEW
- `src/wj-client/components/modals/forms/CreateBudgetItemForm.tsx` - NEW
- `src/wj-client/components/modals/forms/EditBudgetItemForm.tsx` - NEW
- `src/wj-client/components/modals/BaseModal.tsx` - MODIFIED
- `src/wj-client/app/constants.tsx` - MODIFIED
- `src/wj-client/lib/utils/format.ts` - NEW
- `src/wj-client/utils/generated/hooks.ts` - AUTO-GENERATED
- `src/wj-client/gen/protobuf/v1/budget.ts` - AUTO-GENERATED

---

**Plan complete and saved to `docs/plans/2026-01-19-budget-page-implementation.md`.**
