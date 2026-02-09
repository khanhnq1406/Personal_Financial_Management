# Fix Multi-Currency Display Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three multi-currency display bugs in the transaction and report pages where amounts show incorrect values and currencies.

**Architecture:**
- **Frontend fixes** for transaction page (2 issues): use existing backend fields correctly
- **Backend + protobuf changes** for report page (1 issue): add currency conversion fields to financial report API

**Tech Stack:**
- Frontend: Next.js 15, React 19, TypeScript
- Backend: Go 1.23, GORM, Protocol Buffers
- Task automation: Taskfile

---

## Issue Summary

### Issue 1: Transaction Page - Total Balance Missing Investments
**Problem:** Balance header shows only cash (₫6,903 or $6,903) instead of net worth (cash + investments).

**Root Cause:** Line 178 in `src/wj-client/app/dashboard/transaction/page.tsx` uses `displayValue` (cash only) instead of `displayNetWorth` (cash + investments).

**Impact:** Users with investment wallets see incorrect total balance.

### Issue 2: Transaction Page - Wrong Currency for Transaction Amounts
**Problem:** Transactions display as $1,000,000 when original amount is ₫100,000,000 (100 million VND).

**Root Cause:** Line 245 in `page.tsx` and line 245 in mobile columns fallback to native `amount` but format with user's preferred `currency` instead of transaction's original currency.

**Impact:** When backend doesn't provide `displayAmount` (conversion fails or disabled), amounts show wildly incorrect values.

### Issue 3: Report Page - No Currency Conversion in API
**Problem:** Financial report shows $1,000,000 when amounts are ₫100,000,000 VND.

**Root Cause:**
1. Protobuf `MonthlyFinancialData` (line 324-328 in `transaction.proto`) lacks `displayIncome`/`displayExpense` fields
2. Backend `GetFinancialReport` (line 538-560 in `transaction_service.go`) has TODO noting it doesn't convert currencies
3. Frontend (line 80-111 in `FinancialTable.tsx`) formats native amounts with user's preferred currency

**Impact:** Multi-currency users see incorrect financial report values.

---

## Task 1: Fix Transaction Page - Use Net Worth for Total Balance

**Files:**
- Modify: `src/wj-client/app/dashboard/transaction/page.tsx:178`

**Step 1: Update totalBalance calculation to use displayNetWorth**

Change line 178 from:
```typescript
const totalBalance = totalBalanceData?.displayValue?.amount ?? totalBalanceData?.data?.amount ?? 0;
```

To:
```typescript
const totalBalance = totalBalanceData?.displayNetWorth?.amount ?? totalBalanceData?.displayValue?.amount ?? totalBalanceData?.data?.amount ?? 0;
```

**Rationale:**
- `displayNetWorth` includes both cash balance AND investment values
- Falls back to `displayValue` (cash only) if investments not available
- Falls back to `data.amount` (native currency) as final fallback

**Step 2: Verify the fix locally**

Run: `npm run dev` (in `src/wj-client` directory)

Expected: Transaction page balance header now shows total net worth including investments

**Step 3: Commit the change**

```bash
git add src/wj-client/app/dashboard/transaction/page.tsx
git commit -m "fix(transaction): display net worth instead of cash-only balance

- Use displayNetWorth field which includes cash + investments
- Fixes issue where balance header excluded investment wallet values
- Maintains fallback chain for backwards compatibility"
```

---

## Task 2: Fix Transaction Page - Use Original Currency for Fallback

**Files:**
- Modify: `src/wj-client/app/dashboard/transaction/page.tsx:245` (mobile columns)

**Step 1: Read the Transaction interface to confirm currency field exists**

```bash
cat src/wj-client/gen/protobuf/v1/transaction.ts | grep -A 5 "interface Transaction"
```

Expected: Should see `currency?: string` field in Transaction interface

**Step 2: Update mobile columns amount formatter**

Change line 245 from:
```typescript
formatCurrency(row.displayAmount?.amount ?? row.amount?.amount ?? 0, currency),
```

To:
```typescript
formatCurrency(
  row.displayAmount?.amount ?? row.amount?.amount ?? 0,
  row.displayAmount ? currency : row.currency
),
```

**Rationale:**
- When `displayAmount` exists, use user's preferred `currency` (converted amount)
- When falling back to native `amount`, use transaction's original `currency`
- Prevents showing 100,000,000 VND cents as $1,000,000 USD

**Step 3: Check if TransactionTable has the same issue**

```bash
grep -n "formatCurrency.*displayAmount" src/wj-client/app/dashboard/transaction/TransactionTable.tsx
```

Expected: May find similar pattern that needs fixing

**Step 4: If TransactionTable needs fixing, update it**

If the grep finds a similar pattern, apply the same fix:
- Use transaction's `row.currency` when falling back from `displayAmount` to `amount`

**Step 5: Test the fix**

Run: `npm run dev`

Test scenario:
1. Create transaction in VND wallet
2. Switch user preference to USD
3. Verify transaction shows correct VND amount (not converted incorrectly)

Expected: Transaction amounts display with correct currency symbol and value

**Step 6: Commit the change**

```bash
git add src/wj-client/app/dashboard/transaction/page.tsx src/wj-client/app/dashboard/transaction/TransactionTable.tsx
git commit -m "fix(transaction): use original currency for fallback display

- When displayAmount unavailable, format amount with transaction's original currency
- Prevents incorrect currency conversion (e.g., 100M VND shown as $1M USD)
- Applies to both mobile and desktop transaction tables"
```

---

## Task 3: Add Currency Conversion to Financial Report API - Protobuf Changes

**Files:**
- Modify: `api/protobuf/v1/transaction.proto:324-328`

**Step 1: Update MonthlyFinancialData message with display fields**

Change lines 324-328 from:
```protobuf
message MonthlyFinancialData {
  int32 month = 1 [json_name = "month"]; // 0-11 (Jan-Dec)
  wealthjourney.common.v1.Money income = 2 [json_name = "income"];
  wealthjourney.common.v1.Money expense = 3 [json_name = "expense"];
}
```

To:
```protobuf
message MonthlyFinancialData {
  int32 month = 1 [json_name = "month"]; // 0-11 (Jan-Dec)
  wealthjourney.common.v1.Money income = 2 [json_name = "income"];
  wealthjourney.common.v1.Money expense = 3 [json_name = "expense"];
  // Display fields for user's preferred currency
  wealthjourney.common.v1.Money displayIncome = 4 [json_name = "displayIncome"];
  wealthjourney.common.v1.Money displayExpense = 5 [json_name = "displayExpense"];
}
```

**Rationale:**
- Follows existing pattern from Transaction message (line 138-139)
- Allows backend to provide converted amounts
- Frontend can display user's preferred currency

**Step 2: Generate protobuf code**

```bash
task proto:all
```

Expected output:
- Generates Go code in `src/go-backend/gen/protobuf/v1/`
- Generates TypeScript types in `src/wj-client/gen/protobuf/v1/`
- Generates API client hooks in `src/wj-client/utils/generated/`

**Step 3: Verify generated code**

```bash
# Check Go code
grep -A 3 "DisplayIncome" src/go-backend/gen/protobuf/v1/transaction.pb.go

# Check TypeScript code
grep -A 3 "displayIncome" src/wj-client/gen/protobuf/v1/transaction.ts
```

Expected: Both should have `displayIncome` and `displayExpense` fields

**Step 4: Commit protobuf changes**

```bash
git add api/protobuf/v1/transaction.proto src/go-backend/gen/ src/wj-client/gen/ src/wj-client/utils/generated/
git commit -m "feat(proto): add display currency fields to MonthlyFinancialData

- Add displayIncome and displayExpense for user's preferred currency
- Follows existing pattern from Transaction message
- Enables multi-currency support in financial reports

Part of multi-currency display fixes"
```

---

## Task 4: Add Currency Conversion to Financial Report API - Backend Service

**Files:**
- Modify: `src/go-backend/domain/service/transaction_service.go:538-560`

**Step 1: Read the existing transaction conversion logic**

Find how ListTransactions converts currencies:

```bash
grep -A 20 "func.*ListTransactions" src/go-backend/domain/service/transaction_service.go | grep -B 5 -A 15 "displayAmount"
```

Expected: Should find currency conversion logic that we can reuse

**Step 2: Locate the currency service interface**

```bash
grep -n "ConvertCurrency\|CurrencyService" src/go-backend/domain/service/interfaces.go
```

Expected: Should find the service method for currency conversion

**Step 3: Update GetFinancialReport to convert monthly amounts**

Replace the section at lines 538-560 with:

```go
// Get user's preferred currency for conversion
user, _ := s.userRepo.GetByID(ctx, userID)
preferredCurrency := types.VND // Default
if user != nil && user.PreferredCurrency != "" {
	preferredCurrency = user.PreferredCurrency
}

// Calculate totals across all wallets for each month with currency conversion
totals := make([]*v1.MonthlyFinancialData, 12)
for month := 0; month < 12; month++ {
	var totalIncome, totalExpense int64
	var displayTotalIncome, displayTotalExpense int64

	for _, walletData := range walletDataList {
		if len(walletData.MonthlyData) > month {
			monthlyData := walletData.MonthlyData[month]
			nativeIncome := monthlyData.Income.Amount
			nativeExpense := monthlyData.Expense.Amount
			nativeCurrency := monthlyData.Income.Currency

			// Sum native amounts (assuming single base currency, typically VND)
			totalIncome += nativeIncome
			totalExpense += nativeExpense

			// Convert to preferred currency if different
			if nativeCurrency != preferredCurrency {
				// Convert income
				if nativeIncome > 0 {
					convertedIncome, err := s.currencyService.ConvertCurrency(
						ctx,
						nativeIncome,
						nativeCurrency,
						preferredCurrency,
					)
					if err == nil {
						displayTotalIncome += convertedIncome
					} else {
						// Fallback: use native amount if conversion fails
						displayTotalIncome += nativeIncome
					}
				}

				// Convert expense
				if nativeExpense > 0 {
					convertedExpense, err := s.currencyService.ConvertCurrency(
						ctx,
						nativeExpense,
						nativeCurrency,
						preferredCurrency,
					)
					if err == nil {
						displayTotalExpense += convertedExpense
					} else {
						// Fallback: use native amount if conversion fails
						displayTotalExpense += nativeExpense
					}
				}
			} else {
				// Same currency, no conversion needed
				displayTotalIncome += nativeIncome
				displayTotalExpense += nativeExpense
			}
		}
	}

	totals[month] = &v1.MonthlyFinancialData{
		Month:   int32(month),
		Income:  &v1.Money{Amount: totalIncome, Currency: types.VND}, // Base currency
		Expense: &v1.Money{Amount: totalExpense, Currency: types.VND},
		DisplayIncome: &v1.Money{Amount: displayTotalIncome, Currency: preferredCurrency},
		DisplayExpense: &v1.Money{Amount: displayTotalExpense, Currency: preferredCurrency},
	}
}
```

**Rationale:**
- Converts each wallet's monthly amounts to user's preferred currency
- Maintains native amounts in `income`/`expense` fields for historical data
- Provides converted amounts in `displayIncome`/`displayExpense` fields
- Handles conversion errors gracefully with fallback

**Step 4: Update wallet monthly data to include display fields**

Find where `walletDataList` is built and add display fields to each wallet's monthly data.

Look for the loop that creates monthly data:

```bash
grep -B 10 -A 10 "MonthlyData.*append" src/go-backend/domain/service/transaction_service.go | head -30
```

Add conversion logic there as well (similar pattern to totals).

**Step 5: Build backend to check for compilation errors**

```bash
task backend:build
```

Expected: Should compile successfully without errors

If there are errors related to missing methods:
- Check if `currencyService` is available in `transactionService` struct
- May need to add it if not present

**Step 6: Test the backend changes**

```bash
# Start backend
task dev:backend

# In another terminal, test the API
curl -H "Authorization: Bearer <token>" "http://localhost:8080/api/v1/transactions/financial-report?year=2026"
```

Expected: Response should include `displayIncome` and `displayExpense` fields

**Step 7: Commit backend changes**

```bash
git add src/go-backend/domain/service/transaction_service.go
git commit -m "feat(report): add currency conversion to financial report API

- Convert monthly income/expense to user's preferred currency
- Populate displayIncome and displayExpense fields
- Handles multi-currency wallets correctly
- Graceful fallback if conversion fails

Resolves TODO comment about multi-currency aggregation"
```

---

## Task 5: Update Frontend to Use Display Fields - Financial Report

**Files:**
- Modify: `src/wj-client/app/dashboard/report/FinancialTable.tsx:80-111`

**Step 1: Update monthly data processing to use display fields**

Change lines 80-111 to use `displayIncome` and `displayExpense`:

```typescript
// Transform wallet data from API to display format
const wallets = reportData.walletData.map((wallet) => {
  let runningBalance = 0;
  const monthlyDataWithBalance = wallet.monthlyData.map((monthData) => {
    // Use display amounts (in user's preferred currency) if available
    const income = monthData.displayIncome?.amount ?? monthData.income?.amount ?? 0;
    const expense = monthData.displayExpense?.amount ?? monthData.expense?.amount ?? 0;
    runningBalance += income - expense;
    return {
      income,
      expense,
      balance: runningBalance,
    };
  });

  return {
    id: wallet.walletId,
    walletName: wallet.walletName,
    balance: {
      amount: runningBalance,
    },
    isExpanded: expandedWallets.has(wallet.walletId),
    monthlyData: monthlyDataWithBalance,
  };
});

// Transform totals from API to display format and calculate balance
let runningTotalBalance = 0;
const totals = reportData.totals.map((monthData) => {
  // Use display amounts (in user's preferred currency) if available
  const income = monthData.displayIncome?.amount ?? monthData.income?.amount ?? 0;
  const expense = monthData.displayExpense?.amount ?? monthData.expense?.amount ?? 0;
  runningTotalBalance += income - expense;
  return {
    income,
    expense,
    balance: runningTotalBalance,
  };
});
```

**Rationale:**
- Prefers `displayIncome`/`displayExpense` (user's preferred currency)
- Falls back to `income`/`expense` (native currency) for backward compatibility
- Ensures amounts are formatted correctly with user's currency preference

**Step 2: Test the frontend changes**

```bash
task dev:frontend
```

Test scenario:
1. Navigate to Report page
2. Select a year with transactions
3. Verify amounts display in user's preferred currency
4. Switch currency preference in settings
5. Verify report updates to new currency

Expected: All amounts should display correctly in user's preferred currency

**Step 3: Test edge cases**

Test with:
- User with VND preference viewing USD transactions
- User with USD preference viewing VND transactions
- Wallet with mixed currencies
- Year with no transactions

Expected: All cases handle gracefully, no crashes or incorrect displays

**Step 4: Commit frontend changes**

```bash
git add src/wj-client/app/dashboard/report/FinancialTable.tsx
git commit -m "fix(report): use display fields for multi-currency amounts

- Use displayIncome/displayExpense fields from API
- Falls back to native amounts for backward compatibility
- Fixes incorrect currency display in financial reports
- Amounts now show in user's preferred currency correctly"
```

---

## Task 6: Integration Testing

**Files:**
- None (testing only)

**Step 1: Create test data with multiple currencies**

Manually create:
1. VND wallet with transactions
2. USD wallet with transactions
3. Investment wallet with holdings

**Step 2: Test Transaction Page**

Test checklist:
- [ ] Balance header shows net worth (cash + investments)
- [ ] VND transactions display with ₫ symbol
- [ ] USD transactions display with $ symbol
- [ ] Fallback amounts use correct currency
- [ ] Mobile and desktop views both work

**Step 3: Test Report Page**

Test checklist:
- [ ] Monthly amounts display in user's preferred currency
- [ ] Totals row calculates correctly across currencies
- [ ] Expanded wallet details show correct currency
- [ ] Switching currency preference updates display

**Step 4: Test currency preference changes**

Test flow:
1. Set preference to VND
2. Verify all pages show VND (₫)
3. Switch to USD
4. Verify all pages show USD ($)
5. Verify conversion rates are reasonable

**Step 5: Document any issues found**

If issues found:
- Create detailed bug report
- Link to specific line numbers
- Suggest fixes if obvious

**Step 6: Final verification**

```bash
# Check all changes compile
task build:all

# Run any existing tests
task test:all
```

Expected: All builds and tests pass

---

## Task 7: Update Documentation

**Files:**
- Create: `docs/multi-currency-fixes.md` (optional, for historical record)

**Step 1: Document the fixes**

Create summary document:

```markdown
# Multi-Currency Display Fixes - 2026-02-02

## Issues Fixed

### 1. Transaction Page - Net Worth Display
- **Problem:** Balance showed only cash, excluded investments
- **Fix:** Use `displayNetWorth` instead of `displayValue`
- **File:** `src/wj-client/app/dashboard/transaction/page.tsx:178`

### 2. Transaction Page - Currency Fallback
- **Problem:** Fallback amounts formatted with wrong currency
- **Fix:** Use transaction's original currency when `displayAmount` unavailable
- **File:** `src/wj-client/app/dashboard/transaction/page.tsx:245`

### 3. Report Page - API Conversion
- **Problem:** Backend didn't convert currencies in financial reports
- **Fix:** Added `displayIncome`/`displayExpense` fields with conversion
- **Files:**
  - `api/protobuf/v1/transaction.proto:324-328`
  - `src/go-backend/domain/service/transaction_service.go:538-560`
  - `src/wj-client/app/dashboard/report/FinancialTable.tsx:80-111`

## Testing Performed
- Multi-currency transaction display
- Report with mixed currencies
- Currency preference switching
- Investment wallet integration

## Related PRs
- Link to PR once created
```

**Step 2: Update CLAUDE.md if needed**

Check if any architectural notes need updating:

```bash
grep -n "multi-currency\|currency conversion" .claude/CLAUDE.md
```

If the document mentions currency handling, update with lessons learned.

**Step 3: Commit documentation**

```bash
git add docs/multi-currency-fixes.md
git commit -m "docs: document multi-currency display fixes

- Summary of three issues fixed
- Technical details for each fix
- Testing performed
- Reference for future developers"
```

---

## Task 8: Create Pull Request

**Files:**
- None (Git operations only)

**Step 1: Review all commits**

```bash
git log --oneline origin/main..HEAD
```

Expected: Should see 7 commits (or 6 if skipped docs):
1. Fix transaction page net worth
2. Fix transaction page currency fallback
3. Add protobuf display fields
4. Backend currency conversion
5. Frontend use display fields
6. Documentation (optional)

**Step 2: Run final checks**

```bash
# Ensure everything compiles
task build:all

# Check for any lint errors
cd src/wj-client && npm run lint
cd ../go-backend && go vet ./...
```

Expected: No errors

**Step 3: Push branch**

```bash
git push origin HEAD
```

**Step 4: Create pull request**

Use the PR template:

```markdown
## Summary
Fixes three multi-currency display bugs in transaction and report pages.

## Changes
1. **Transaction Page - Net Worth**: Use `displayNetWorth` to include investments
2. **Transaction Page - Currency**: Use original currency for fallback amounts
3. **Report Page - Conversion**: Add currency conversion to financial report API

## Issues Fixed
- Balance header excluded investment values
- Transactions showed wrong currency (e.g., ₫100M as $1M)
- Financial reports didn't convert currencies

## Testing
- [x] Transaction page with mixed currencies
- [x] Report page with multiple wallets
- [x] Currency preference switching
- [x] Investment wallet integration
- [x] All builds pass

## Screenshots
[Add before/after screenshots showing correct currency display]

## Deployment Notes
- Protobuf changes require code regeneration
- No database migrations needed
- Backward compatible (falls back to native amounts)
```

**Step 5: Request review**

Tag appropriate reviewers based on changes:
- Frontend reviewer for React/TypeScript changes
- Backend reviewer for Go changes
- Tech lead for protobuf API changes

---

## Success Criteria

All three issues must be resolved:

✅ **Issue 1 Fixed:** Transaction page balance header shows net worth (cash + investments)

✅ **Issue 2 Fixed:** Transaction amounts display with correct currency symbol and value

✅ **Issue 3 Fixed:** Financial report amounts convert to user's preferred currency

Additional criteria:

✅ All code compiles without errors

✅ Generated code (protobuf) is committed

✅ Changes are backward compatible

✅ Manual testing confirms fixes work

✅ Documentation is updated

---

## Rollback Plan

If issues found after deployment:

1. **Frontend issues only:** Revert frontend commits, backend remains
2. **Backend issues:** Revert all changes as protobuf changed
3. **Performance issues:** Add caching to currency conversion service

## Notes

- **Currency Service:** Assumes `currencyService` exists in transaction service. If not, may need to add it.
- **Conversion Rates:** Uses existing currency conversion logic from transaction listing.
- **Caching:** Backend may want to cache conversion rates to reduce API calls.
- **Future Enhancement:** Consider pre-calculating converted amounts in database for performance.

---

**Estimated Implementation Time:** 2-3 hours
**Complexity:** Medium (requires backend + frontend + protobuf changes)
**Risk Level:** Low (backward compatible, has fallbacks)
