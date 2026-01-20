# Edit Wallet Balance Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ability to edit wallet balance in the edit wallet form with proper data integrity protections.

**Architecture:** BEFORE implementing, read the "Critical Risk Assessment" section below. This feature requires balancing user convenience with financial data integrity. The implementation creates an "adjustment" transaction (like accountants do) rather than directly modifying the balance field.

**Tech Stack:**

- Frontend: Next.js 15, React Hook Form, Zod validation, TypeScript
- Backend: Go 1.23, GORM, Protocol Buffers
- API: Protocol Buffers (single source of truth)

---

## CRITICAL RISK ASSESSMENT - READ BEFORE IMPLEMENTING

### Current System Design (Why Balance Cannot Be Directly Edited)

The current WealthJourney system deliberately **does not allow** direct balance editing. Here's why:

1. **Transaction-Based Balance**: Wallet balance is the calculated sum of all transactions. Each income/expense transaction updates the balance.
   - See: [wallet_service.go:84-120](src/go-backend/domain/service/wallet_service.go#L84-L120) - `UpdateBalance` uses delta operations only
   - See: [wallet_repository.go:86-120](src/go-backend/domain/repository/wallet_repository.go#L86-L120) - Atomic balance updates with negative balance prevention

2. **Audit Trail**: Every balance change creates a transaction record showing who, what, when, and why.
   - See: [transaction.go](src/go-backend/domain/models/transaction.go) - Transaction model with category, amount, date, note
   - Transfers create TWO transactions (outgoing + incoming) - see [wallet_service.go:334-360](src/go-backend/domain/service/wallet_service.go#L334-L360)

3. **Data Integrity Risks of Direct Balance Editing**:
   - **Balance Mismatch**: Wallet balance ≠ Sum of all transactions
   - **Lost Audit Trail**: No record of who changed the balance or when
   - **Broken History**: Balance history charts become incorrect
   - **Accounting Violation**: Violates double-entry bookkeeping principles
   - **Cannot Undo**: No mechanism to reverse incorrect adjustments

### Existing Safe Operations

The system already provides safe balance adjustment methods:

- `AddFunds` - Add money (creates income transaction)
- `WithdrawFunds` - Remove money (creates expense transaction)
- `TransferFunds` - Move between wallets (creates two transactions)

See: [wallet.proto:49-71](api/protobuf/v1/wallet.proto#L49-L71)

### Recommended Implementation: "Balance Adjustment" Transaction

**Instead of directly editing balance, create an "Adjustment" transaction:**

1. **New Category**: "Balance Adjustment" (type can be INCOME or EXPENSE)
2. **Transaction Record**: Creates audit trail showing the adjustment
3. **Note Field**: User can explain why adjustment was made (e.g., "Bank fee", "Found cash")
4. **Preserves Integrity**: Balance remains sum of all transactions

**Alternative: If you MUST allow direct balance editing:**

1. Add a prominent warning about data integrity risks
2. Create a "Balance Adjustment" transaction behind the scenes
3. Show the adjustment in transaction history
4. Allow users to see/edit the adjustment transaction

---

## Decision Point: WHICH APPROACH?

**Before starting implementation, you MUST decide:**

### Option A: Safe "Adjustment Transaction" Approach (RECOMMENDED)

- User enters "adjustment amount" (positive or negative)
- System creates a transaction in "Balance Adjustment" category
- Full audit trail maintained
- User can edit/delete the adjustment transaction later

### Option B: Direct Edit with Hidden Transaction

- User directly edits balance field
- System creates adjustment transaction transparently
- Simpler UI but less transparent

**This plan implements Option A (Recommended).**

If you want Option B, modify Task 1 and skip the category selection UI.

---

## Task 1: Add Balance Adjustment Category Logic

**Goal:** Ensure "Balance Adjustment" category exists for users when making balance adjustments.

**Files:**

- Modify: `src/go-backend/domain/service/category_service.go` (create helper method)
- Reference: `src/go-backend/domain/service/wallet_service.go:322-331` (existing pattern for Transfer categories)

**Step 1: Add GetOrCreateBalanceAdjustmentCategory method**

In `category_service.go`, add a method similar to `GetByNameAndType`:

```go
// GetOrCreateBalanceAdjustmentCategory gets or creates a balance adjustment category
// Based on whether the adjustment is positive (income) or negative (expense)
func (s *categoryService) GetOrCreateBalanceAdjustmentCategory(ctx context.Context, userID int32, isPositiveAdjustment bool) (*models.Category, error) {
    categoryType := v1.CategoryType_CATEGORY_TYPE_EXPENSE
    if isPositiveAdjustment {
        categoryType = v1.CategoryType_CATEGORY_TYPE_INCOME
    }

    categoryName := "Balance Adjustment"

    // Try to get existing category
    category, err := s.categoryRepo.GetByNameAndType(ctx, userID, categoryName, categoryType)
    if err == nil && category != nil {
        return category, nil
    }

    // Create new category if it doesn't exist
    newCategory := &models.Category{
        UserID: userID,
        Name:   categoryName,
        Type:   categoryType,
        Icon:   "⚖️", // Balance scale icon
        Color:  "#FFA500", // Orange for adjustments
    }

    if err := s.categoryRepo.Create(ctx, newCategory); err != nil {
        return nil, apperrors.NewInternalErrorWithCause("failed to create balance adjustment category", err)
    }

    return newCategory, nil
}
```

**Step 2: Update service interface**

Add to `interfaces.go` in service package:

```go
type CategoryService interface {
    // ... existing methods
    GetOrCreateBalanceAdjustmentCategory(ctx context.Context, userID int32, isPositiveAdjustment bool) (*models.Category, error)
}
```

---

## Task 2: Add AdjustBalance RPC to Wallet Service

**Goal:** Create new API endpoint for balance adjustments that creates a transaction.

**Files:**

- Modify: `api/protobuf/v1/wallet.proto`
- Modify: `src/go-backend/domain/service/interfaces.go`
- Modify: `src/go-backend/domain/service/wallet_service.go`
- Modify: `src/go-backend/api/handlers/wallet_v2.go`
- Test: Manual testing via API

**Step 1: Add protobuf definition**

In `wallet.proto`, add after `TransferFunds` (around line 71):

```protobuf
// Adjust wallet balance with audit trail
rpc AdjustBalance(AdjustBalanceRequest) returns (AdjustBalanceResponse) {
  option (google.api.http) = {
    post: "/api/v1/wallets/{walletId}/adjust"
    body: "*"
  };
}
```

Add request message after `TransferFundsRequest`:

```protobuf
// AdjustBalance request
message AdjustBalanceRequest {
  int32 walletId = 1 [json_name = "walletId"];
  wealthjourney.common.v1.Money amount = 2 [json_name = "amount"];  // Can be positive or negative
  string reason = 3 [json_name = "reason"];  // Optional: why adjustment was made
}
```

Add response message after `TransferFundsResponse`:

```protobuf
// AdjustBalance response
message AdjustBalanceResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  Wallet data = 3 [json_name = "data"];  // Updated wallet
  string timestamp = 4 [json_name = "timestamp"];
}
```

**Step 2: Generate code**

```bash
task proto:all
```

Expected: No errors, new types generated in Go and TypeScript

**Step 3: Add to service interface**

In `interfaces.go`, add to `WalletService` interface:

```go
AdjustBalance(ctx context.Context, walletID int32, userID int32, req *walletv1.AdjustBalanceRequest) (*walletv1.AdjustBalanceResponse, error)
```

**Step 4: Implement service method**

In `wallet_service.go`, add after `TransferFunds`:

```go
// AdjustBalance adjusts a wallet's balance and creates a transaction for audit trail.
// Positive amounts increase balance (income adjustment), negative decrease (expense adjustment).
func (s *walletService) AdjustBalance(ctx context.Context, walletID int32, userID int32, req *walletv1.AdjustBalanceRequest) (*walletv1.AdjustBalanceResponse, error) {
    if err := validator.ID(walletID); err != nil {
        return nil, err
    }
    if err := validator.ID(userID); err != nil {
        return nil, err
    }

    // Verify wallet ownership
    wallet, err := s.walletRepo.GetByIDForUser(ctx, walletID, userID)
    if err != nil {
        return nil, err
    }

    // Validate amount
    if req.Amount == nil || req.Amount.Amount == 0 {
        return nil, apperrors.NewValidationError("adjustment amount cannot be zero")
    }
    if req.Amount.Currency != wallet.Currency {
        return nil, apperrors.NewValidationError("currency mismatch")
    }

    // Determine if adjustment is positive (income) or negative (expense)
    isPositiveAdjustment := req.Amount.Amount > 0

    // Check sufficient balance for negative adjustments
    if !isPositiveAdjustment && wallet.Balance < -req.Amount.Amount {
        return nil, apperrors.NewValidationError("Insufficient balance for this adjustment")
    }

    // Get or create balance adjustment category
    category, err := s.categoryRepo.GetOrCreateBalanceAdjustmentCategory(ctx, userID, isPositiveAdjustment)
    if err != nil {
        return nil, apperrors.NewInternalErrorWithCause("failed to get balance adjustment category", err)
    }

    // Create adjustment transaction
    adjustmentTx := &models.Transaction{
        WalletID:   walletID,
        CategoryID: &category.ID,
        Amount:     req.Amount.Amount, // Store signed amount
        Date:       time.Now(),
        Note:       req.Reason,
    }

    if err := s.txRepo.Create(ctx, adjustmentTx); err != nil {
        return nil, apperrors.NewInternalErrorWithCause("failed to create adjustment transaction", err)
    }

    // Update wallet balance
    updatedWallet, err := s.walletRepo.UpdateBalance(ctx, walletID, req.Amount.Amount)
    if err != nil {
        // Rollback: delete transaction if balance update fails
        _ = s.txRepo.Delete(ctx, adjustmentTx.ID)
        return nil, err
    }

    return &walletv1.AdjustBalanceResponse{
        Success:   true,
        Message:   "Balance adjusted successfully",
        Data:      s.mapper.ModelToProto(updatedWallet),
        Timestamp: time.Now().Format(time.RFC3339),
    }, nil
}
```

**Step 5: Add REST handler**

In `wallet_v2.go`, add handler:

```go
// AdjustBalance handles balance adjustment requests
func (h *WalletHandler) AdjustBalance(c *gin.Context) {
    var req walletv1.AdjustBalanceRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    walletIDStr := c.Param("walletId")
    walletID, err := strconv.ParseInt(walletIDStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wallet ID"})
        return
    }

    userID := middleware.GetUserID(c)

    resp, err := h.service.AdjustBalance(c.Request.Context(), int32(walletID), userID, &req)
    if err != nil {
        handleError(c, err)
        return
    }

    c.JSON(http.StatusOK, resp)
}
```

**Step 6: Add route**

In `routes.go`, add to wallet routes:

```go
walletRoutes.POST("/wallets/:walletId/adjust", walletHandler.AdjustBalance)
```

---

## Task 3: Update Frontend Validation Schema

**Goal:** Add validation for balance adjustment amount.

**Files:**

- Modify: `src/wj-client/lib/validation/wallet.schema.ts`
- Reference: Existing `amountSchema` validation

**Step 1: Add adjustment schema**

In `wallet.schema.ts`, add after `updateWalletSchema`:

```typescript
/**
 * Zod schema for wallet balance adjustment
 * Validates that amount is non-zero and creates proper adjustment
 */
export const adjustBalanceSchema = z.object({
  adjustmentAmount: amountSchema.refine((amount) => amount !== 0, {
    message: "Adjustment amount cannot be zero",
  }),
  reason: z
    .string()
    .max(200, "Reason must be less than 200 characters")
    .optional(),
});

// Infer the form type from the schema
export type AdjustBalanceFormOutput = z.infer<typeof adjustBalanceSchema>;
```

---

## Task 4: Add Adjustment Input to Edit Wallet Form

**Goal:** Add balance adjustment UI to the edit wallet modal.

**Files:**

- Modify: `src/wj-client/components/modals/forms/EditWalletForm.tsx`
- Reference: Existing wallet name input
- Reference: `CreateWalletForm.tsx` for amount input pattern

**Step 1: Update form component**

Replace the entire `EditWalletForm.tsx` content:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import {
  updateWalletSchema,
  UpdateWalletFormOutput,
  adjustBalanceSchema,
  AdjustBalanceFormOutput,
} from "@/lib/validation/wallet.schema";

interface EditWalletFormProps {
  wallet: Wallet;
  onSubmit: (data: UpdateWalletFormOutput, adjustment?: AdjustBalanceFormOutput) => void;
  isPending?: boolean;
}

export const EditWalletForm = ({ wallet, onSubmit, isPending }: EditWalletFormProps) => {
  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  // Filter out current wallet from the list when checking for name conflicts
  const existingWalletNames =
    walletsData?.wallets
      ?.filter((w) => w.id !== wallet.id)
      .map((w) => w.walletName) || [];

  // State for balance adjustment section
  const [showAdjustment, setShowAdjustment] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm<{
    walletName: string;
    adjustmentAmount?: number;
    reason?: string;
  }>({
    resolver: zodResolver(
      // We'll validate manually based on showAdjustment state
      updateWalletSchema(existingWalletNames, wallet.walletName)
    ),
    defaultValues: {
      walletName: "",
      adjustmentAmount: 0,
      reason: "",
    },
    mode: "onSubmit",
  });

  // Populate form with existing wallet data
  useEffect(() => {
    reset({
      walletName: wallet.walletName,
      adjustmentAmount: 0,
      reason: "",
    });
  }, [wallet, reset]);

  const watchAdjustmentAmount = watch("adjustmentAmount");

  const onFormSubmit = (data: typeof control._defaultValues) => {
    const walletData: UpdateWalletFormOutput = {
      walletName: data.walletName,
    };

    let adjustment: AdjustBalanceFormOutput | undefined;

    if (showAdjustment && data.adjustmentAmount && data.adjustmentAmount !== 0) {
      // Validate adjustment amount
      const result = adjustBalanceSchema.safeParse({
        adjustmentAmount: data.adjustmentAmount,
        reason: data.reason,
      });

      if (!result.success) {
        // Handle validation error - set errors on form
        result.error.errors.forEach((error) => {
          if (error.path[0] === "adjustmentAmount") {
            // You'll need to use setError from useForm
            console.error("Adjustment amount error:", error.message);
          }
        });
        return;
      }

      adjustment = result.data;
    }

    onSubmit(walletData, adjustment);
  };

  // Calculate projected balance
  const currentBalance = wallet.balance?.amount || 0;
  const adjustmentAmount = watchAdjustmentAmount || 0;
  const projectedBalance = currentBalance + adjustmentAmount;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} id="edit-wallet-form" className="space-y-4">
      {/* Wallet Name Section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Wallet Information</h3>
        <FormInput
          name="walletName"
          control={control}
          label="Name"
          placeholder="Enter wallet's name"
          required
          disabled={isPending}
        />
      </div>

      {/* Balance Adjustment Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Balance Adjustment</h3>
          <button
            type="button"
            onClick={() => setShowAdjustment(!showAdjustment)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdjustment ? "Cancel" : "Adjust Balance"}
          </button>
        </div>

        {showAdjustment && (
          <div className="space-y-3 bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600 mb-2">
              Current Balance: {(currentBalance / 100).toLocaleString()} VND
            </div>

            <FormInput
              name="adjustmentAmount"
              control={control}
              label="Adjustment Amount (VND)"
              placeholder="Enter amount (positive to add, negative to subtract)"
              type="number"
              step="0.01"
              disabled={isPending}
              helperText="Positive numbers add funds, negative numbers remove funds"
            />

            {adjustmentAmount !== 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Projected Balance: </span>
                <span className={`font-medium ${projectedBalance < 0 ? "text-red-600" : "text-green-600"}`}>
                  {(projectedBalance / 100).toLocaleString()} VND
                </span>
              </div>
            )}

            <FormInput
              name="reason"
              control={control}
              label="Reason (Optional)"
              placeholder="Why are you adjusting this balance?"
              disabled={isPending}
            />

            <div className="text-xs text-gray-500 mt-2">
              This will create a transaction record for audit purposes.
            </div>
          </div>
        )}
      </div>
    </form>
  );
};
```

---

## Task 5: Update BaseModal to Handle Adjustment

**Goal:** Update the modal that uses EditWalletForm to call the AdjustBalance API when needed.

**Files:**

- Modify: `src/wj-client/components/modals/baseModal.tsx`
- Reference: Existing mutation pattern for UpdateWallet

**Step 1: Add AdjustBalance mutation**

In `baseModal.tsx`, locate the EditWallet section and add the adjustment mutation.

First, import the hook:

```typescript
import {
  useMutationUpdateWallet,
  useMutationAdjustBalance,
} from "@/utils/generated/hooks";
```

Then, in the EditWallet modal case, modify to handle adjustment:

```typescript
case ModalType.EDIT_WALLET: {
  const updateWalletMutation = useMutationUpdateWallet({
    onSuccess: () => {
      modal.onSuccess?.();
      store.dispatch(closeModal());
      setSuccessMessage("Wallet has been updated successfully");
      store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
    },
    onError: (error: any) => {
      setError(error.message || "Failed to update wallet. Please try again");
    },
  });

  const adjustBalanceMutation = useMutationAdjustBalance({
    onSuccess: () => {
      // Balance adjusted successfully, now update wallet name if needed
    },
    onError: (error: any) => {
      setError(error.message || "Failed to adjust balance. Please try again");
    },
  });

  const handleEditWallet = async (walletData: UpdateWalletFormOutput, adjustment?: AdjustBalanceFormOutput) => {
    try {
      // First, adjust balance if provided
      if (adjustment && modal.wallet && adjustment.adjustmentAmount !== 0) {
        await adjustBalanceMutation.mutateAsync({
          walletId: modal.wallet.id,
          amount: {
            amount: Math.round(adjustment.adjustmentAmount * 100), // Convert to cents
            currency: modal.wallet.balance?.currency || "VND",
          },
          reason: adjustment.reason,
        });
      }

      // Then update wallet name
      if (modal.wallet && walletData.walletName !== modal.wallet.walletName) {
        await updateWalletMutation.mutateAsync({
          walletId: modal.wallet.id,
          walletName: walletData.walletName,
        });
      } else if (!adjustment) {
        // No changes at all
        store.dispatch(closeModal());
      } else {
        // Only balance was changed
        modal.onSuccess?.();
        store.dispatch(closeModal());
        setSuccessMessage("Wallet has been updated successfully");
        store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
      }
    } catch (error) {
      // Error handling is done by mutation onError
    }
  };

  return (
    <BaseModal
      isOpen={modal.isOpen}
      onClose={() => store.dispatch(closeModal())}
      title="Edit Wallet"
    >
      <EditWalletForm
        wallet={modal.wallet!}
        onSubmit={handleEditWallet}
        isPending={updateWalletMutation.isPending || adjustBalanceMutation.isPending}
      />
    </BaseModal>
  );
}
```

---

## Task 6: Test the Implementation

**Goal:** Verify the complete flow works correctly.

**Files:**

- Test: Manual testing in browser
- Test: Backend API testing

**Step 1: Start development servers**

```bash
task dev
```

Expected: Both backend and frontend start successfully

**Step 2: Test positive balance adjustment**

1. Open the app and navigate to dashboard
2. Click edit on a wallet
3. Click "Adjust Balance"
4. Enter positive amount (e.g., 100000 for 100,000 VND)
5. Enter a reason (e.g., "Found cash")
6. Submit

Expected:

- Success modal appears
- Wallet balance increases by amount
- New "Balance Adjustment" transaction appears in transaction history
- Transaction has correct category (income)

**Step 3: Test negative balance adjustment**

1. Edit same wallet
2. Click "Adjust Balance"
3. Enter negative amount (e.g., -50000 for -50,000 VND)
4. Enter reason (e.g., "Bank fee")
5. Submit

Expected:

- Success modal appears
- Wallet balance decreases by amount
- New "Balance Adjustment" transaction appears
- Transaction has correct category (expense)

**Step 4: Test negative balance prevention**

1. Edit wallet with low balance
2. Try to adjust with large negative amount (more than current balance)

Expected:

- Error message about insufficient balance
- No transaction created
- Balance unchanged

**Step 5: Test name-only update (no adjustment)**

1. Edit wallet
2. Change only the name
3. Don't click "Adjust Balance"
4. Submit

Expected:

- Wallet name updates
- Balance unchanged
- No transaction created

**Step 6: Verify transaction history**

1. Go to transaction history page
2. Filter by "Balance Adjustment" category

Expected:

- All adjustment transactions appear
- Each shows the amount, date, and reason

**Step 7: Test backend API directly (optional)**

```bash
# Get your auth token from browser localStorage
curl -X POST http://localhost:8080/api/v1/wallets/1/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": {"amount": 10000, "currency": "VND"},
    "reason": "API test adjustment"
  }'
```

Expected:

```json
{
  "success": true,
  "message": "Balance adjusted successfully",
  "data": {
    "id": 1,
    "walletName": "My Wallet",
    "balance": {"amount": NEW_BALANCE, "currency": "VND"}
  }
}
```

---

## Task 7: Add Documentation

**Goal:** Document the new feature for developers.

**Files:**

- Create: `docs/features/balance-adjustment.md`

**Step 1: Create feature documentation**

```bash
mkdir -p docs/features
```

Create `docs/features/balance-adjustment.md`:

````markdown
# Balance Adjustment Feature

## Overview

The balance adjustment feature allows users to correct wallet balances while maintaining data integrity through transaction audit trails.

## Architecture

### Design Decision: Transaction-Based Adjustments

**Why not directly edit balance?**

Direct balance editing violates accounting principles and creates data integrity issues:

- Balance would no longer equal sum of transactions
- No audit trail for changes
- Cannot undo incorrect adjustments
- Breaks balance history calculations

**Our Solution: Adjustment Transactions**

Every balance adjustment creates a transaction record:

- Positive adjustments → Income transaction in "Balance Adjustment" category
- Negative adjustments → Expense transaction in "Balance Adjustment" category
- Full audit trail maintained
- User can edit/delete adjustment transactions

## API

### AdjustBalance RPC

**Endpoint:** `POST /api/v1/wallets/{walletId}/adjust`

**Request:**

```json
{
  "walletId": 1,
  "amount": {
    "amount": 10000, // In cents (100.00 VND)
    "currency": "VND"
  },
  "reason": "Bank fee correction" // Optional
}
```
````

**Response:**

```json
{
  "success": true,
  "message": "Balance adjusted successfully",
  "data": {
    "id": 1,
    "walletName": "My Wallet",
    "balance": {
      "amount": 110000,
      "currency": "VND"
    }
  },
  "timestamp": "2026-01-20T10:30:00Z"
}
```

## Frontend Usage

### Edit Wallet Form

The edit wallet form now includes an optional "Balance Adjustment" section:

```typescript
<EditWalletForm
  wallet={wallet}
  onSubmit={(walletData, adjustment) => {
    // walletData: { walletName: string }
    // adjustment: { adjustmentAmount: number, reason?: string }
  }}
/>
```

### React Query Hook

```typescript
import { useMutationAdjustBalance } from "@/utils/generated/hooks";

const adjustBalanceMutation = useMutationAdjustBalance({
  onSuccess: () => {
    // Refetch wallet list
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
  },
});

adjustBalanceMutation.mutate({
  walletId: 1,
  amount: { amount: 10000, currency: "VND" },
  reason: "Optional reason",
});
```

## Backend Implementation

### Service Layer

File: `src/go-backend/domain/service/wallet_service.go`

```go
func (s *walletService) AdjustBalance(
    ctx context.Context,
    walletID int32,
    userID int32,
    req *walletv1.AdjustBalanceRequest,
) (*walletv1.AdjustBalanceResponse, error)
```

**Process:**

1. Validate wallet ownership
2. Determine if adjustment is positive (income) or negative (expense)
3. Check sufficient balance for negative adjustments
4. Get or create "Balance Adjustment" category
5. Create transaction record
6. Update wallet balance atomically
7. Rollback transaction if balance update fails

### Category Management

File: `src/go-backend/domain/service/category_service.go`

```go
func (s *categoryService) GetOrCreateBalanceAdjustmentCategory(
    ctx context.Context,
    userID int32,
    isPositiveAdjustment bool,
) (*models.Category, error)
```

Creates/returns:

- Income category for positive adjustments
- Expense category for negative adjustments
- Icon: ⚖️ (balance scale)
- Color: #FFA500 (orange)

## Testing

### Manual Testing Checklist

- [ ] Positive adjustment creates income transaction
- [ ] Negative adjustment creates expense transaction
- [ ] Insufficient balance prevented for negative adjustments
- [ ] Transaction appears in history with correct category
- [ ] Reason note saved to transaction
- [ ] Wallet name can be edited without adjustment
- [ ] Both name and adjustment can be changed together
- [ ] Projected balance displays correctly
- [ ] Success/error messages display appropriately

### API Testing

```bash
# Positive adjustment
curl -X POST http://localhost:8080/api/v1/wallets/1/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": {"amount": 10000, "currency": "VND"}, "reason": "Test"}'

# Negative adjustment
curl -X POST http://localhost:8080/api/v1/wallets/1/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": {"amount": -5000, "currency": "VND"}, "reason": "Fee"}'
```

## Future Enhancements

Possible improvements:

1. Require approval for adjustments above certain threshold
2. Adjustment history report
3. Automatic reconciliation suggestions
4. Bulk adjustment import
5. Adjustment reason templates

## Related Files

- Protobuf: `api/protobuf/v1/wallet.proto`
- Service: `src/go-backend/domain/service/wallet_service.go`
- Handler: `src/go-backend/api/handlers/wallet_v2.go`
- Form: `src/wj-client/components/modals/forms/EditWalletForm.tsx`
- Validation: `src/wj-client/lib/validation/wallet.schema.ts`

---

## Summary

This implementation adds balance adjustment capability while maintaining financial data integrity by:

1. **Creating audit trails** - Every adjustment creates a transaction
2. **Preserving accounting principles** - Balance = sum of transactions
3. **User-friendly UI** - Collapsible adjustment section with projected balance
4. **Proper validation** - Prevents negative balances, validates amounts
5. **Flexible usage** - Can adjust name, balance, or both independently

### Files Modified

- `api/protobuf/v1/wallet.proto` - New AdjustBalance RPC
- `src/go-backend/domain/service/wallet_service.go` - Implementation
- `src/go-backend/domain/service/category_service.go` - Category helper
- `src/go-backend/domain/service/interfaces.go` - Interface updates
- `src/go-backend/api/handlers/wallet_v2.go` - REST handler
- `src/go-backend/api/handlers/routes.go` - Route registration
- `src/wj-client/lib/validation/wallet.schema.ts` - Validation schema
- `src/wj-client/components/modals/forms/EditWalletForm.tsx` - Form UI
- `src/wj-client/components/modals/baseModal.tsx` - Modal handler
- `docs/features/balance-adjustment.md` - Documentation

### Estimated Complexity

- Backend: Medium (new RPC, transaction handling, category management)
- Frontend: Medium (UI updates, validation, mutation handling)
- Testing: 30-45 minutes for full manual test suite

```

```
