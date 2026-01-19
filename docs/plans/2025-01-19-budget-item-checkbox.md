# Budget Item Checkbox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interactive checkboxes beside budget items that persist the checked state to the database.

**Architecture:** Protocol Buffer first - update the API definition, generate code, then implement backend and frontend changes following the existing clean architecture patterns.

**Tech Stack:**
- Backend: Go 1.23, GORM, Protocol Buffers
- Frontend: Next.js 15, React 19, TypeScript, React Query, Tailwind CSS

---

## Overview

This feature adds a `checked` boolean field to budget items, allowing users to mark items as complete. The checkbox state will be persisted in the database and synced between backend and frontend.

**Current State:**
- Budget items display a static `check.png` icon (decorative only)
- No checkbox field in protobuf, database models, or API

**Changes Required:**
1. Add `checked` field to `BudgetItem` protobuf message
2. Update GORM model with `Checked` bool field
3. Update backend service to handle checkbox state
4. Update backend mapper to include `checked` field
5. Create interactive checkbox component in frontend
6. Update BudgetItemCard to use new checkbox

---

## Task 1: Update Protobuf Definition

**Files:**
- Modify: `api/protobuf/v1/budget.proto`

**Step 1: Add `checked` field to BudgetItem message**

Edit the `BudgetItem` message in `api/protobuf/v1/budget.proto` (around line 90-98):

```protobuf
// BudgetItem message
message BudgetItem {
  int32 id = 1 [json_name = "id"];
  int32 budgetId = 2 [json_name = "budgetId"];
  string name = 3 [json_name = "name"];
  wealthjourney.common.v1.Money total = 4 [json_name = "total"];
  bool checked = 7 [json_name = "checked"];  // NEW FIELD
  int64 createdAt = 5 [json_name = "createdAt"];
  int64 updatedAt = 6 [json_name = "updatedAt"];
}
```

Note: Field number 7 is used to maintain backward compatibility (new fields should use higher numbers).

**Step 2: Add `checked` to UpdateBudgetItem request**

Edit the `UpdateBudgetItemRequest` message (around line 141-147):

```protobuf
// UpdateBudgetItem request
message UpdateBudgetItemRequest {
  int32 budgetId = 1 [json_name = "budgetId"];
  int32 itemId = 2 [json_name = "itemId"];
  string name = 3 [json_name = "name"];
  wealthjourney.common.v1.Money total = 4 [json_name = "total"];
  bool checked = 5 [json_name = "checked"];  // NEW FIELD
}
```

**Step 3: Generate code from protobuf**

Run: `task proto:all`

Expected: TypeScript types and Go code regenerated with new `checked` field

---

## Task 2: Update Backend Database Model

**Files:**
- Modify: `src/go-backend/domain/models/budget.go`

**Step 1: Add Checked field to BudgetItem model**

Edit the `BudgetItem` struct in `src/go-backend/domain/models/budget.go` (around line 27-37):

```go
// BudgetItem represents a single budget item (category allocation)
type BudgetItem struct {
	ID        int32          `gorm:"primaryKey;autoIncrement" json:"id"`
	BudgetID  int32          `gorm:"not null;index" json:"budgetId"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	Total     int64          `gorm:"type:bigint;default:0;not null" json:"total"` // Stored in smallest currency unit
	Checked   bool           `gorm:"type:bool;default:false;not null" json:"checked"` // NEW FIELD
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Budget    *Budget        `gorm:"foreignKey:BudgetID" json:"budget,omitempty"`
}
```

---

## Task 3: Update Backend Service Layer

**Files:**
- Modify: `src/go-backend/domain/service/budget_service.go`

**Step 1: Update UpdateBudgetItem to handle checked field**

Edit the `UpdateBudgetItem` function (around line 339-390) to handle the checked field:

```go
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

	// Validate item name if provided
	if req.Name != "" {
		if err := validateBudgetItemName(req.Name); err != nil {
			return nil, err
		}
	}

	// Validate total amount if provided
	if req.Total != nil {
		if err := validateMoneyAmount(req.Total); err != nil {
			return nil, err
		}
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

	// Update fields if provided
	if req.Total != nil {
		item.Total = req.Total.Amount
	}
	if req.Name != "" {
		item.Name = req.Name
	}
	// Handle checked field - protobuf provides default false for bool
	item.Checked = req.Checked

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
```

---

## Task 4: Update Backend Mapper

**Files:**
- Modify: `src/go-backend/domain/service/budget_mapper.go` (or similar mapper file)

**Step 1: Find and read the mapper file**

Run: `find src/go-backend -name "*mapper*" -type f`

Read the budget mapper file to understand the mapping pattern.

**Step 2: Update mapper to include Checked field**

Edit the mapper to include the `Checked` field in the proto conversion.

Based on existing pattern, update `ModelItemToProto` method to map:
```go
func (m *BudgetMapper) ModelItemToProto(model *models.BudgetItem) *budgetv1.BudgetItem {
	if model == nil {
		return nil
	}

	return &budgetv1.BudgetItem{
		Id:        model.ID,
		BudgetId:  model.BudgetID,
		Name:      model.Name,
		Total:     m.moneyToProto(model.Total),
		Checked:   model.Checked,  // NEW FIELD
		CreatedAt: model.CreatedAt.Unix(),
		UpdatedAt: model.UpdatedAt.Unix(),
	}
}
```

---

## Task 5: Create Checkbox Component

**Files:**
- Create: `src/wj-client/components/Checkbox.tsx`

**Step 1: Write the Checkbox component**

Create file: `src/wj-client/components/Checkbox.tsx`

```typescript
"use client";

import { ChangeEvent } from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  className = "",
  id,
}: CheckboxProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={`w-5 h-5 rounded border-gray-300 text-bg focus:ring-bg focus:ring-2 focus:ring-offset-0 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    />
  );
}
```

---

## Task 6: Update BudgetItemCard to Use Checkbox

**Files:**
- Modify: `src/wj-client/app/dashboard/budget/BudgetItemCard.tsx`

**Step 1: Replace static check image with interactive checkbox**

Edit `src/wj-client/app/dashboard/budget/BudgetItemCard.tsx` (around line 60-90):

```typescript
"use client";

import { BudgetItem } from "@/gen/protobuf/v1/budget";
import { currencyFormatter } from "@/utils/currency-formatter";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType, ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { useMutationUpdateBudgetItem } from "@/utils/generated/hooks";
import { EVENT_BudgetUpdateBudgetItem } from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";

interface BudgetItemCardProps {
  item: BudgetItem;
  budgetId: number;
  onRefresh: () => void;
}

export function BudgetItemCard({
  item,
  budgetId,
  onRefresh,
}: BudgetItemCardProps) {
  const queryClient = useQueryClient();

  const updateBudgetItemMutation = useMutationUpdateBudgetItem({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_BudgetGetBudgetItems] });
      onRefresh();
    },
  });

  const handleEditItem = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_BUDGET_ITEM,
        onSuccess: () => {
          onRefresh();
        },
        data: { budgetId, item },
      }),
    );
  };

  const handleDeleteItem = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CONFIRM,
        onSuccess: () => {
          onRefresh();
        },
        confirmConfig: {
          title: "Delete Budget Item",
          message: `Are you sure you want to delete "${item.name}"?`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "danger",
          action: {
            type: "deleteBudgetItem",
            payload: {
              budgetId,
              itemId: item.id,
            },
          },
        },
      }),
    );
  };

  const handleCheckedChange = (checked: boolean) => {
    updateBudgetItemMutation.mutate({
      budgetId,
      itemId: item.id,
      name: item.name,
      total: item.total,
      checked: checked,
    });
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={item.checked ?? false}
          onChange={handleCheckedChange}
          disabled={updateBudgetItemMutation.isPending}
        />
        <div className="flex flex-col">
          <span className={`font-semibold text-sm ${item.checked ? "line-through text-gray-400" : ""}`}>
            {item.name}
          </span>
          <span className="text-xs text-gray-500">
            {currencyFormatter.format(item.total?.amount ?? 0)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type={ButtonType.IMG}
          src={`${resources}/editing.png`}
          onClick={handleEditItem}
        />
        <Button
          type={ButtonType.IMG}
          src={`${resources}/remove.png`}
          onClick={handleDeleteItem}
        />
      </div>
    </div>
  );
}
```

---

## Task 7: Run Database Migration

**Files:**
- N/A (database operation)

**Step 1: Run the migration**

If there's a migrate command:
Run: `task backend:migrate` or similar command

If running migration manually:
Run the Go migrate command to add the `checked` column to the `budget_item` table.

**Step 2: Verify the schema**

Run: Check the database schema to confirm `checked` column exists in `budget_item` table

Expected: `budget_item` table has `checked` boolean column with default false

---

## Task 8: Test the Feature

**Files:**
- N/A (testing)

**Step 1: Start the development servers**

Run: `task dev`

Expected: Both backend and frontend start successfully

**Step 2: Manual testing checklist**

1. Navigate to `/dashboard/budget`
2. Click on a budget to see its items
3. Click the checkbox next to a budget item
4. Verify:
   - Checkbox state toggles visually
   - Item name gets strikethrough when checked
   - State persists after page refresh
   - State persists after logout/login

**Step 3: Verify API calls**

Open browser DevTools Network tab:
- Checkbox toggle should call `PUT /api/v1/budgets/{budgetId}/items/{itemId}`
- Request body should include `checked: true/false`

**Step 4: Verify database**

Check the `budget_item` table:
- `checked` column should reflect the checkbox state

**Step 5: Edge cases to test**

- Create new budget item - should default to unchecked
- Edit budget item - checkbox state should persist
- Delete and recreate budget item - should reset to unchecked
- Multiple budget items - each should have independent state

**Step 6: Fix any issues found**

If bugs are found, create additional tasks to fix them.

---

## Summary

This plan implements a fully functional checkbox feature for budget items:

1. **API Layer**: Protocol Buffer definition updated with `checked` field
2. **Backend**: GORM model, service, and mapper updated to handle checkbox state
3. **Frontend**: New reusable Checkbox component and updated BudgetItemCard
4. **Database**: GORM AutoMigrate will add `checked` column to `budget_item` table

**Testing**: Verify checkbox state persists across page refreshes, logout/login, and API calls.

**Files Modified:**
- `api/protobuf/v1/budget.proto`
- `src/go-backend/domain/models/budget.go`
- `src/go-backend/domain/service/budget_service.go`
- `src/go-backend/domain/service/budget_mapper.go`
- `src/wj-client/components/Checkbox.tsx` (new)
- `src/wj-client/app/dashboard/budget/BudgetItemCard.tsx`

**Estimated Implementation Time:** 1-2 hours
