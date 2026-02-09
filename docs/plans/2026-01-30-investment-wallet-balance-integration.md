# Investment-Wallet Balance Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect investment buy/sell/dividend transactions to wallet balance, ensuring cash flow is tracked between the wallet and investments.

**Architecture:** When users buy investments, funds are deducted from wallet balance. When selling or receiving dividends, funds are credited. All operations maintain atomicity with rollback on failure. A backfill migration will retroactively calculate wallet balances from existing transactions.

**Tech Stack:** Go 1.23, GORM, Protocol Buffers, Next.js 15, React 19, TypeScript 5

---

## Prerequisites

Before starting, ensure you understand:

- [investment_service.go](src/go-backend/domain/service/investment_service.go) - Core investment business logic
- [wallet_repository.go](src/go-backend/domain/repository/wallet_repository.go:83-120) - `UpdateBalance` method with transaction safety
- [investment.proto](api/protobuf/v1/investment.proto) - API definitions
- [units/conversion.go](src/go-backend/pkg/units/conversion.go) - `CalculateTransactionCost` utility

---

## Task 1: Add TotalDividends Field to Investment Model

**Files:**

- Modify: `src/go-backend/domain/models/investment.go:11-33`

**Step 1: Add TotalDividends field to Investment struct**

In `src/go-backend/domain/models/investment.go`, add after line 26 (after `RealizedPNL`):

```go
TotalDividends       int64                        `gorm:"type:bigint;default:0" json:"totalDividends"`
```

The struct should now have fields in this order:

- UnrealizedPNLPercent (line 25)
- RealizedPNL (line 26)
- TotalDividends (NEW - line 27)
- CreatedAt (line 28)

**Step 2: Update ToProto method**

In `src/go-backend/domain/models/investment.go`, update the `ToProto()` method (around line 93-113) to add the new field mapping. Add after `RealizedPnl`:

```go
TotalDividends:       i.TotalDividends,
```

**Step 3: Run database migration**

Run: `cd src/go-backend && go run cmd/main.go`

GORM AutoMigrate will add the column automatically. Verify in MySQL:

```sql
DESCRIBE investment;
-- Should show totalDividends column
```

---

## Task 2: Add totalDividends to Protobuf Definition

**Files:**

- Modify: `api/protobuf/v1/investment.proto:11-34`

**Step 1: Add totalDividends field to Investment message**

In `api/protobuf/v1/investment.proto`, find the `Investment` message (starts around line 11). Add after field 21 (`displayRealizedPnl`):

```protobuf
int64 totalDividends = 22 [json_name = "totalDividends"];
```

The Investment message should now have:

- displayRealizedPnl = 21 (existing)
- totalDividends = 22 (NEW)

**Step 2: Generate protobuf code**

Run: `task proto:all`

This generates:

- Go code in `src/go-backend/protobuf/v1/`
- TypeScript types in `src/wj-client/gen/protobuf/v1/`

**Step 3: Verify generated code**

Check that `totalDividends` field appears in:

- `src/go-backend/protobuf/v1/investment.pb.go`
- `src/wj-client/gen/protobuf/v1/investment.ts`

---

## Task 3: Modify CreateInvestment to Deduct from Wallet Balance

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go:55-183`

**Step 1: Add balance check before creating investment**

In `CreateInvestment` method, after the wallet permission check (around line 89), add:

```go
// Check wallet has sufficient balance for initial investment
if wallet.Balance < req.InitialCost {
    return nil, apperrors.NewValidationError(
        fmt.Sprintf("Insufficient balance: have %d, need %d", wallet.Balance, req.InitialCost))
}
```

**Step 2: Add wallet balance deduction after all DB operations succeed**

After the lot is created and transaction is updated with LotID (around line 165), add wallet balance deduction:

```go
// Deduct initial cost from wallet balance
_, err = s.walletRepo.UpdateBalance(ctx, req.WalletId, -req.InitialCost)
if err != nil {
    // Rollback: delete the investment, transaction, and lot
    _ = s.txRepo.DeleteTransaction(ctx, initialTransaction.ID)
    _ = s.txRepo.DeleteLot(ctx, lot.ID)
    _ = s.investmentRepo.Delete(ctx, investment.ID)
    return nil, apperrors.NewInternalErrorWithCause("failed to deduct from wallet balance", err)
}
```

**Step 3: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 4: Modify processBuyTransaction to Deduct from Wallet Balance

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go:463-546`

**Step 1: Add balance check at start of processBuyTransaction**

At the beginning of `processBuyTransaction` (after line 463), add wallet fetch and balance check:

```go
func (s *investmentService) processBuyTransaction(ctx context.Context, investment *models.Investment, req *investmentv1.AddTransactionRequest, totalCost int64) (*models.Investment, error) {
    // Fetch wallet to check balance
    wallet, err := s.walletRepo.GetByID(ctx, investment.WalletID)
    if err != nil {
        return nil, apperrors.NewInternalErrorWithCause("failed to fetch wallet", err)
    }
    if wallet.Balance < totalCost {
        return nil, apperrors.NewValidationError(
            fmt.Sprintf("Insufficient balance: have %d, need %d", wallet.Balance, totalCost))
    }
```

**Step 2: Store original values for rollback**

Before updating investment (around line 535), store original values:

```go
// Store original values for potential rollback
originalQuantity := investment.Quantity
originalTotalCost := investment.TotalCost
originalAverageCost := investment.AverageCost
```

**Step 3: Add wallet deduction after investment update succeeds**

After `s.investmentRepo.Update(ctx, investment)` succeeds (around line 543), add:

```go
// Deduct from wallet balance
_, err = s.walletRepo.UpdateBalance(ctx, investment.WalletID, -totalCost)
if err != nil {
    // Rollback investment changes
    investment.Quantity = originalQuantity
    investment.TotalCost = originalTotalCost
    investment.AverageCost = originalAverageCost
    _ = s.investmentRepo.Update(ctx, investment)
    return nil, apperrors.NewInternalErrorWithCause("failed to deduct from wallet balance", err)
}
```

**Step 4: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 5: Modify processSellTransaction to Credit Wallet Balance

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go:548-666`

**Step 1: Store original values for rollback**

Before the FIFO consumption loop (around line 575), store original investment values:

```go
// Store original values for potential rollback
originalQuantity := investment.Quantity
originalRealizedPNL := investment.RealizedPNL
```

**Step 2: Calculate proceeds**

The proceeds from selling = cost - fees. In `processSellTransaction`, after the transaction is created (around line 631), note that `tx.Cost` contains the sell value and `tx.Fees` contains fees.

```go
// Calculate net proceeds (sell value minus fees)
proceeds := tx.Cost - tx.Fees
```

**Step 3: Add wallet credit after investment update succeeds**

After `s.investmentRepo.Update(ctx, investment)` succeeds (around line 663), add:

```go
// Credit proceeds to wallet balance
_, err = s.walletRepo.UpdateBalance(ctx, investment.WalletID, proceeds)
if err != nil {
    // Rollback investment changes
    investment.Quantity = originalQuantity
    investment.RealizedPNL = originalRealizedPNL
    _ = s.investmentRepo.Update(ctx, investment)
    return nil, apperrors.NewInternalErrorWithCause("failed to credit wallet balance", err)
}
```

**Step 4: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 6: Add processDividendTransaction Method

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go`

**Step 1: Add the processDividendTransaction method**

Add this new method after `processSellTransaction` (around line 666):

```go
// processDividendTransaction handles dividend transactions
// Dividend calculation: totalDividend = quantity × price
// - quantity = number of shares at dividend date
// - price = dividend per share (e.g., $0.50 per share)
func (s *investmentService) processDividendTransaction(ctx context.Context, investment *models.Investment, req *investmentv1.AddTransactionRequest) (*models.Investment, *models.InvestmentTransaction, error) {
    // Calculate total dividend amount
    totalDividend := units.CalculateTransactionCost(req.Quantity, req.Price, investment.Type)

    // Create dividend transaction record
    tx := &models.InvestmentTransaction{
        InvestmentID:    investment.ID,
        WalletID:        investment.WalletID,
        Type:            investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_DIVIDEND,
        Quantity:        req.Quantity,
        Price:           req.Price,
        Cost:            totalDividend,
        Fees:            0, // Dividends typically have no fees
        TransactionDate: time.Unix(req.TransactionDate, 0),
        Notes:           req.Notes,
    }

    if err := s.txRepo.CreateTransaction(ctx, tx); err != nil {
        return nil, nil, apperrors.NewInternalErrorWithCause("failed to create dividend transaction", err)
    }

    // Store original value for rollback
    originalTotalDividends := investment.TotalDividends

    // Update investment's total dividends
    investment.TotalDividends += totalDividend
    if err := s.investmentRepo.Update(ctx, investment); err != nil {
        // Rollback: delete transaction
        _ = s.txRepo.DeleteTransaction(ctx, tx.ID)
        return nil, nil, apperrors.NewInternalErrorWithCause("failed to update investment dividends", err)
    }

    // Credit dividend amount to wallet balance
    _, err := s.walletRepo.UpdateBalance(ctx, investment.WalletID, totalDividend)
    if err != nil {
        // Rollback: restore investment and delete transaction
        investment.TotalDividends = originalTotalDividends
        _ = s.investmentRepo.Update(ctx, investment)
        _ = s.txRepo.DeleteTransaction(ctx, tx.ID)
        return nil, nil, apperrors.NewInternalErrorWithCause("failed to credit wallet balance", err)
    }

    return investment, tx, nil
}
```

**Step 2: Update AddTransaction to route DIVIDEND type**

In the `AddTransaction` method (around line 408-425), update the switch statement to handle DIVIDEND:

```go
switch req.TransactionType {
case investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY:
    investment, err = s.processBuyTransaction(ctx, investment, req, totalCost)
case investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL:
    investment, err = s.processSellTransaction(ctx, investment, req, totalCost)
case investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_DIVIDEND:
    var tx *models.InvestmentTransaction
    investment, tx, err = s.processDividendTransaction(ctx, investment, req)
    if err != nil {
        return nil, err
    }
    // Return early with the transaction for dividend
    return &investmentv1.AddTransactionResponse{
        Transaction: tx.ToProto(),
        Investment:  investment.ToProto(),
    }, nil
default:
    return nil, apperrors.NewValidationError("invalid transaction type")
}
```

**Step 3: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 7: Update reverseBuyTransaction to Refund Wallet

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go:809-855`

**Step 1: Add wallet refund after investment update**

In `reverseBuyTransaction`, after the investment is updated successfully (around line 852), add:

```go
// Refund the cost back to wallet (cost + fees = totalCost)
refundAmount := tx.Cost + tx.Fees
_, err = s.walletRepo.UpdateBalance(ctx, investment.WalletID, refundAmount)
if err != nil {
    // Log error but don't fail - investment state is already updated
    // This could leave wallet balance inconsistent, but we prefer data consistency
    // for the investment over failing the whole operation
    return apperrors.NewInternalErrorWithCause("failed to refund wallet balance", err)
}
```

**Step 2: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 8: Update reverseSellTransaction to Deduct from Wallet

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go:857-910`

**Step 1: Add wallet deduction after investment update**

In `reverseSellTransaction`, after the investment is updated successfully (around line 903), add:

```go
// Deduct the proceeds from wallet (undo the credit)
proceeds := tx.Cost - tx.Fees
_, err = s.walletRepo.UpdateBalance(ctx, investment.WalletID, -proceeds)
if err != nil {
    // Log error but don't fail - investment state is already updated
    return apperrors.NewInternalErrorWithCause("failed to deduct from wallet balance", err)
}
```

**Step 2: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 9: Add reverseDividendTransaction Method

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go`

**Step 1: Add the reverseDividendTransaction method**

Add this method after `reverseSellTransaction`:

```go
// reverseDividendTransaction reverses a dividend transaction when deleted
func (s *investmentService) reverseDividendTransaction(ctx context.Context, investment *models.Investment, tx *models.InvestmentTransaction) error {
    // Deduct dividend from wallet
    _, err := s.walletRepo.UpdateBalance(ctx, investment.WalletID, -tx.Cost)
    if err != nil {
        return apperrors.NewInternalErrorWithCause("failed to deduct dividend from wallet", err)
    }

    // Reduce investment's total dividends
    investment.TotalDividends -= tx.Cost
    if investment.TotalDividends < 0 {
        investment.TotalDividends = 0 // Safety guard
    }

    if err := s.investmentRepo.Update(ctx, investment); err != nil {
        // Try to restore wallet balance
        _, _ = s.walletRepo.UpdateBalance(ctx, investment.WalletID, tx.Cost)
        return apperrors.NewInternalErrorWithCause("failed to update investment dividends", err)
    }

    return nil
}
```

**Step 2: Update DeleteTransaction to call reverseDividendTransaction**

In the `DeleteTransaction` method, find where it handles different transaction types for reversal. Add handling for DIVIDEND type in the switch statement:

```go
case investmentv1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_DIVIDEND:
    if err := s.reverseDividendTransaction(ctx, investment, tx); err != nil {
        return nil, err
    }
```

**Step 3: Verify the change compiles**

Run: `cd src/go-backend && go build ./...`

Expected: No errors

---

## Task 10: Create Backfill Migration Command

**Files:**

- Create: `src/go-backend/cmd/migrate-investment-wallet-balance/main.go`

**Step 1: Create the migration command file**

Create file `src/go-backend/cmd/migrate-investment-wallet-balance/main.go`:

```go
package main

import (
    "context"
    "flag"
    "fmt"
    "log"

    v1 "wealthjourney/protobuf/v1"

    "wealthjourney/domain/models"
    "wealthjourney/pkg/config"
    "wealthjourney/pkg/database"
)

func main() {
    dryRun := flag.Bool("dry-run", true, "Run without making changes")
    flag.Parse()

    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    db, err := database.NewDB(cfg.Database)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }

    ctx := context.Background()

    // Get all INVESTMENT type wallets
    var wallets []models.Wallet
    if err := db.DB.WithContext(ctx).Where("type = ?", v1.WalletType_WALLET_TYPE_INVESTMENT).Find(&wallets).Error; err != nil {
        log.Fatalf("Failed to fetch investment wallets: %v", err)
    }

    log.Printf("Found %d investment wallets to process", len(wallets))

    for _, wallet := range wallets {
        log.Printf("\nProcessing wallet ID %d (balance: %d)", wallet.ID, wallet.Balance)

        // Get all investments for this wallet
        var investments []models.Investment
        if err := db.DB.WithContext(ctx).Where("wallet_id = ?", wallet.ID).Find(&investments).Error; err != nil {
            log.Printf("  ERROR: Failed to fetch investments: %v", err)
            continue
        }

        var walletBalanceDelta int64 = 0
        var totalDividendsSum int64 = 0

        for _, investment := range investments {
            log.Printf("  Investment: %s (%s)", investment.Symbol, investment.Name)

            // Get all transactions for this investment, ordered by date ASC
            var transactions []models.InvestmentTransaction
            if err := db.DB.WithContext(ctx).
                Where("investment_id = ?", investment.ID).
                Order("transaction_date ASC").
                Find(&transactions).Error; err != nil {
                log.Printf("    ERROR: Failed to fetch transactions: %v", err)
                continue
            }

            var investmentDividends int64 = 0

            for _, tx := range transactions {
                switch tx.Type {
                case v1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_BUY:
                    // BUY: -(cost + fees)
                    delta := -(tx.Cost + tx.Fees)
                    walletBalanceDelta += delta
                    log.Printf("    BUY: %d (delta: %d)", tx.Cost+tx.Fees, delta)

                case v1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_SELL:
                    // SELL: +(cost - fees)
                    delta := tx.Cost - tx.Fees
                    walletBalanceDelta += delta
                    log.Printf("    SELL: %d (delta: %d)", tx.Cost, delta)

                case v1.InvestmentTransactionType_INVESTMENT_TRANSACTION_TYPE_DIVIDEND:
                    // DIVIDEND: +cost
                    walletBalanceDelta += tx.Cost
                    investmentDividends += tx.Cost
                    log.Printf("    DIVIDEND: %d", tx.Cost)
                }
            }

            totalDividendsSum += investmentDividends

            // Update investment.TotalDividends
            if investmentDividends > 0 && !*dryRun {
                if err := db.DB.WithContext(ctx).Model(&investment).Update("total_dividends", investmentDividends).Error; err != nil {
                    log.Printf("    ERROR: Failed to update TotalDividends: %v", err)
                }
            }
            log.Printf("    Total dividends for investment: %d", investmentDividends)
        }

        log.Printf("  Wallet balance delta: %d", walletBalanceDelta)
        log.Printf("  Total dividends sum: %d", totalDividendsSum)

        // Calculate new wallet balance
        // Note: We ADD the delta to current balance (which accounts for manual AddFunds/TransferFunds)
        // This assumes wallet balance was manually funded and transactions should now be reflected
        newBalance := wallet.Balance + walletBalanceDelta

        if *dryRun {
            log.Printf("  [DRY RUN] Would update wallet balance: %d -> %d", wallet.Balance, newBalance)
        } else {
            if err := db.DB.WithContext(ctx).Model(&wallet).Update("balance", newBalance).Error; err != nil {
                log.Printf("  ERROR: Failed to update wallet balance: %v", err)
                continue
            }
            log.Printf("  Updated wallet balance: %d -> %d", wallet.Balance, newBalance)
        }
    }

    if *dryRun {
        log.Println("\n[DRY RUN] No changes were made. Run with -dry-run=false to apply changes.")
    } else {
        log.Println("\nMigration completed successfully.")
    }
}
```

**Step 2: Build and test with dry-run**

Run:

```bash
cd src/go-backend
go build -o migrate-balance cmd/migrate-investment-wallet-balance/main.go
./migrate-balance -dry-run=true
```

Expected: Shows what changes would be made without applying them

---

## Task 11: Add Balance Validation to AddInvestmentTransactionForm

**Files:**

- Modify: `src/wj-client/components/modals/forms/AddInvestmentTransactionForm.tsx`

**Step 1: Add walletBalance prop to component**

Update the Props interface to accept wallet balance:

```typescript
interface AddInvestmentTransactionFormProps {
  investmentId: number;
  investmentType: InvestmentType;
  currency: string;
  walletBalance: number; // NEW: Add this prop
  onSuccess?: () => void;
}
```

**Step 2: Add balance validation state**

Add state for showing insufficient balance error:

```typescript
const [insufficientBalance, setInsufficientBalance] = useState(false);
```

**Step 3: Calculate total cost and validate on BUY**

Add a useEffect or useMemo to calculate total cost and check balance for BUY transactions:

```typescript
// Calculate total cost for BUY transactions
const totalCost = useMemo(() => {
  if (transactionType !== "BUY") return 0;
  const quantityInStorage = quantityToStorage(
    Number(quantity) || 0,
    investmentType,
  );
  const priceInCents = amountToSmallestUnit(Number(price) || 0, currency);
  const feesInCents = amountToSmallestUnit(Number(fees) || 0, currency);
  return (
    calculateTransactionCost(quantityInStorage, priceInCents, investmentType) +
    feesInCents
  );
}, [quantity, price, fees, transactionType, investmentType, currency]);

useEffect(() => {
  setInsufficientBalance(
    transactionType === "BUY" && totalCost > walletBalance,
  );
}, [totalCost, walletBalance, transactionType]);
```

**Step 4: Display remaining balance preview**

Add below the fees input:

```typescript
{transactionType === "BUY" && (
  <div className="mt-4 p-3 bg-gray-50 rounded-md">
    <div className="flex justify-between text-sm">
      <span>Wallet Balance:</span>
      <span>{formatCurrency(walletBalance, currency)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Transaction Cost:</span>
      <span className="text-red-600">-{formatCurrency(totalCost, currency)}</span>
    </div>
    <hr className="my-2" />
    <div className="flex justify-between font-medium">
      <span>Remaining:</span>
      <span className={walletBalance - totalCost < 0 ? "text-red-600" : "text-green-600"}>
        {formatCurrency(walletBalance - totalCost, currency)}
      </span>
    </div>
  </div>
)}
```

**Step 5: Show error message for insufficient balance**

Add error display:

```typescript
{insufficientBalance && (
  <p className="text-red-600 text-sm mt-2">
    Insufficient wallet balance. You need {formatCurrency(totalCost - walletBalance, currency)} more.
  </p>
)}
```

**Step 6: Disable submit button when insufficient balance**

Update the submit button:

```typescript
<Button
  type={ButtonType.PRIMARY}
  onClick={handleSubmit(onSubmit)}
  loading={mutation.isPending}
  disabled={insufficientBalance}
>
  Add Transaction
</Button>
```

---

## Task 12: Display Total Dividends in InvestmentDetailModal

**Files:**

- Modify: `src/wj-client/components/modals/InvestmentDetailModal.tsx`

**Step 1: Add Total Dividends to Overview tab**

In the Overview tab's details section, add a new row for Total Dividends. Find where `Realized PNL` is displayed and add after it:

```typescript
<div className="flex justify-between py-2 border-b border-gray-100">
  <span className="text-gray-600">Total Dividends</span>
  <span className="font-medium text-green-600">
    {formatCurrency(investment.totalDividends || 0, investment.currency)}
  </span>
</div>
```

**Step 2: Pass walletBalance to AddInvestmentTransactionForm**

In the "Add Transaction" tab, update the form component to pass wallet balance:

```typescript
{activeTab === "add" && (
  <AddInvestmentTransactionForm
    investmentId={investment.id}
    investmentType={investment.type}
    currency={investment.currency}
    walletBalance={walletBalance} // Pass the wallet balance
    onSuccess={handleAddSuccess}
  />
)}
```

Note: You'll need to fetch wallet balance. Add a query at the top of the component:

```typescript
const { data: walletData } = useQueryGetWallet(
  { walletId: investment?.walletId || 0 },
  { enabled: !!investment?.walletId },
);
const walletBalance = walletData?.wallet?.balance || 0;
```

---

## Task 13: Add Balance Validation to AddInvestmentForm

**Files:**

- Modify: `src/wj-client/components/modals/forms/AddInvestmentForm.tsx`

**Step 1: Add walletBalance prop**

Update the Props interface:

```typescript
interface AddInvestmentFormProps {
  walletId: number;
  walletBalance: number; // NEW: Add this prop
  walletCurrency?: string;
  onSuccess?: () => void;
}
```

**Step 2: Add balance validation state and calculation**

```typescript
const [insufficientBalance, setInsufficientBalance] = useState(false);

// Calculate initial cost
const initialCostCents = useMemo(() => {
  return amountToSmallestUnit(Number(initialCost) || 0, currency);
}, [initialCost, currency]);

useEffect(() => {
  setInsufficientBalance(initialCostCents > walletBalance);
}, [initialCostCents, walletBalance]);
```

**Step 3: Display balance preview**

Add after the initial cost input:

```typescript
<div className="mt-4 p-3 bg-gray-50 rounded-md">
  <div className="flex justify-between text-sm">
    <span>Wallet Balance:</span>
    <span>{formatCurrency(walletBalance, currency)}</span>
  </div>
  <div className="flex justify-between text-sm">
    <span>Initial Cost:</span>
    <span className="text-red-600">-{formatCurrency(initialCostCents, currency)}</span>
  </div>
  <hr className="my-2" />
  <div className="flex justify-between font-medium">
    <span>Remaining:</span>
    <span className={walletBalance - initialCostCents < 0 ? "text-red-600" : "text-green-600"}>
      {formatCurrency(walletBalance - initialCostCents, currency)}
    </span>
  </div>
</div>
```

**Step 4: Show error and disable submit**

```typescript
{insufficientBalance && (
  <p className="text-red-600 text-sm mt-2">
    Insufficient wallet balance for this investment.
  </p>
)}

<Button
  type={ButtonType.PRIMARY}
  onClick={handleSubmit(onSubmit)}
  loading={mutation.isPending}
  disabled={insufficientBalance}
>
  Create Investment
</Button>
```

---

## Task 14: Update Parent Components to Pass Wallet Balance

**Files:**

- Modify: `src/wj-client/app/dashboard/portfolio/page.tsx`

**Step 1: Pass walletBalance to AddInvestmentForm**

In the portfolio page where `AddInvestmentForm` is rendered, ensure wallet balance is passed:

```typescript
<AddInvestmentForm
  walletId={selectedWallet?.id || 0}
  walletBalance={selectedWallet?.balance || 0}
  walletCurrency={selectedWallet?.currency}
  onSuccess={handleAddSuccess}
/>
```

**Step 2: Verify wallet data includes balance**

Ensure the wallet query returns balance. The existing `useQueryListWallets` should already include balance in the response.

---

## Task 15: Run Full Integration Test

**Step 1: Start backend and frontend**

Run: `task dev`

**Step 2: Test CreateInvestment with balance check**

1. Fund an investment wallet with 1,000,000 VND via TransferFunds
2. Create investment with initial cost 300,000 VND
3. Verify wallet balance = 700,000 VND

**Step 3: Test BUY transaction**

1. Add BUY transaction (5 shares @ 50,000 = 250,000)
2. Verify wallet balance = 450,000 VND

**Step 4: Test SELL transaction**

1. Add SELL transaction (2 shares @ 60,000 = 120,000)
2. Verify wallet balance = 570,000 VND

**Step 5: Test DIVIDEND transaction**

1. Add DIVIDEND transaction (10,000 VND)
2. Verify wallet balance = 580,000 VND
3. Verify investment's Total Dividends = 10,000 VND

**Step 6: Test insufficient balance error**

1. Try BUY transaction exceeding wallet balance
2. Verify error message: "Insufficient balance"

**Step 7: Test transaction deletion**

1. Delete the BUY transaction from step 3
2. Verify wallet balance is restored to 700,000 VND

---

## Task 16: Run Backfill Migration (Production)

**WARNING:** Run this only after all code changes are deployed and tested.

**Step 1: Backup database**

```bash
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql
```

**Step 2: Run migration with dry-run**

```bash
cd src/go-backend
go run cmd/migrate-investment-wallet-balance/main.go -dry-run=true
```

Review output carefully.

**Step 3: Run migration for real**

```bash
go run cmd/migrate-investment-wallet-balance/main.go -dry-run=false
```

**Step 4: Verify results**

Check a few wallets manually to ensure balances are correct.

---

## Verification Checklist

- [x] TotalDividends field added to Investment model
- [x] totalDividends field added to Investment protobuf message
- [x] CreateInvestment deducts from wallet balance
- [x] processBuyTransaction deducts from wallet balance
- [x] processSellTransaction credits wallet balance
- [x] processDividendTransaction credits wallet balance and updates TotalDividends
- [x] reverseBuyTransaction refunds wallet balance
- [x] reverseSellTransaction deducts from wallet balance
- [x] reverseDividendTransaction deducts from wallet balance
- [x] Backfill migration command created and tested
- [x] Frontend forms show balance validation for BUY transactions
- [x] Frontend displays Total Dividends in investment detail
- [x] All code compiles (backend and frontend)
- [ ] Integration tested end-to-end

---

## Rollback Plan

If issues arise after deployment:

1. **Code rollback**: Revert to previous commit
2. **Balance fix**: Run inverse migration (add back what was deducted, subtract what was credited)
3. **Database restore**: Restore from backup if data is corrupted

The migration command can be modified to run in reverse by negating the delta calculations.
