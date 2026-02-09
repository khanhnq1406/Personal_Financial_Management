# Fix Gold Investment Quantity Storage Bug

## Overview

Fix a critical bug where gold investment quantities are stored incorrectly. When users input gold quantities in taels (lượng), the frontend sends the raw tael value to the backend instead of the converted gram value, resulting in incorrect quantities being stored (e.g., 2 grams stored instead of 75 grams).

## Current State Analysis

### The Bug

**Location**: [AddInvestmentForm.tsx:310](src/wj-client/components/modals/forms/AddInvestmentForm.tsx:310)

The frontend correctly calculates the storage quantity using `calculateGoldFromUserInput()` but then sends the raw user input to the API instead:

```typescript
// Frontend calculates CORRECT value
const goldCalculation = calculateGoldFromUserInput({
  quantity: data.initialQuantity,      // 2 (tael)
  quantityUnit: goldQuantityUnit,      // "tael"
  // ...
  // Result: storedQuantity = 750000 (75g × 10000) ✓ CORRECT!
});

// But sends WRONG value to API
createInvestmentMutation.mutate({
  initialQuantityDecimal: data.initialQuantity, // 2 ✗ WRONG!
  // Should be: goldCalculation.storedQuantity
});
```

**Backend behavior** ([conversion.go:25-28](src/go-backend/pkg/units/conversion.go:25-28)):

The backend's `QuantityToStorage()` function multiplies by the precision multiplier but does NOT perform unit conversions:

```go
func QuantityToStorage(quantity float64, investmentType v1.InvestmentType) int64 {
    precision := GetPrecisionForInvestmentType(investmentType)
    return int64(quantity * float64(precision))
    // For GOLD_VND: 2 * 10000 = 20000 (2 grams × 10000)
}
```

### Impact

**User example**:
- Input: 2 tael (75 grams) at 60M VND/tael = 120M VND total
- Expected storage: 750000 (75g × 10000)
- Actual storage: 20000 (2g × 10000)
- Current value shown: 8.69M VND (wrong) instead of 326M VND (correct)

### Why This Happens

The frontend's gold calculator correctly handles unit conversions (tael → gram), but the `calculateGoldFromUserInput()` function returns a calculation result object that includes `storedQuantity`, which the form code ignores.

## Desired End State

Gold investments should store quantities correctly:
- Input: 2 tael → Stored: 750000 (75 grams × 10000)
- Input: 100 grams → Stored: 1000000 (100 grams × 10000)
- Input: 1 ounce (USD gold) → Stored: 10000 (1 oz × 10000)

### Success Criteria

#### Automated Verification:
- [ ] Unit tests pass: `npm test` in wj-client
- [ ] Type checking passes: `npm run typecheck`
- [ ] Gold calculator tests pass: Gold calculator unit tests verify correct conversions

#### Manual Verification:
- [ ] Create gold investment with 2 tael quantity
- [ ] Verify stored quantity is 750000 (not 20000)
- [ ] Verify current value calculation is correct
- [ ] Test with gram input (should still work)
- [ ] Test with USD gold (ounce input)

## What We're NOT Doing

- NOT changing the backend `QuantityToStorage()` function (it works correctly for non-gold investments)
- NOT changing how gold prices are stored or calculated (price per gram is correct)
- NOT modifying the gold conversion logic in `gold-calculator.ts`

## Implementation Approach

**Fix the frontend** to use the calculated `storedQuantity` from `goldCalculation` instead of the raw user input.

The `calculateGoldFromUserInput()` function already returns the correct value in `storedQuantity`. We just need to use it.

## Phase 1: Fix Frontend - Use Calculated Quantity

### Overview
Update AddInvestmentForm to send the pre-calculated `storedQuantity` for gold investments.

### Changes Required:

#### 1. Fix AddInvestmentForm.tsx
**File**: `src/wj-client/components/modals/forms/AddInvestmentForm.tsx`
**Changes**: Send `goldCalculation.storedQuantity` instead of `data.initialQuantity`

**Current code (line 310)**:
```typescript
initialQuantityDecimal: data.initialQuantity, // Send decimal value
```

**Fixed code**:
```typescript
initialQuantityDecimal: isGoldInvestment ? goldCalculation.storedQuantity / 10000 : data.initialQuantity,
```

Wait - this won't work because `storedQuantity` is already in the storage format (×10000). The API expects decimal input for `initialQuantityDecimal`.

Let me reconsider the API contract...

Looking at the backend code, `initialQuantityDecimal` is meant to be a decimal value in the "natural" unit for the investment type. For gold, the natural unit should be:
- GOLD_VND: grams
- GOLD_USD: ounces

So the frontend should:
1. Convert user input (tael) to storage unit (gram)
2. Send the gram value as `initialQuantityDecimal`

But wait - the current `goldCalculation.storedQuantity` is already `grams × 10000`. So we need to divide by 10000 to get grams.

Actually, looking more carefully at the code:

```typescript
const goldCalculation = calculateGoldFromUserInput({
  quantity: data.initialQuantity,      // 2 (tael)
  quantityUnit: goldQuantityUnit,      // "tael"
  // ...
});
```

The `goldCalculation.storedQuantity` = 750000 (for 2 tael = 75g)

But `initialQuantityDecimal` should be in the "display unit" for the investment type:
- For GOLD_VND: should be in grams (75)
- For GOLD_USD: should be in ounces

So the fix should be:
```typescript
initialQuantityDecimal: isGoldInvestment
  ? goldCalculation.storedQuantity / 10000  // Convert back to grams/ounces
  : data.initialQuantity,
```

Actually, let me re-read the gold calculator more carefully...

Looking at [gold-calculator.ts:220-254](src/wj-client/lib/utils/gold-calculator.ts:220-254):

```typescript
// LAYER 1: Convert quantity to storage unit
const quantityInStorageUnit = convertGoldQuantity(quantity, quantityUnit, storageUnit);
// For 2 tael: 2 * 37.5 = 75 grams

// Storage quantity (base unit × 10000)
const storedQuantity = Math.round(quantityInStorageUnit * 10000);
// 75 * 10000 = 750000
```

So `storedQuantity` is indeed `750000` for 2 tael.

But the backend expects `initialQuantityDecimal` to be in the storage unit (grams for VND gold), NOT in the user's input unit (tael).

So the fix is to send `quantityInStorageUnit` (75), not `storedQuantity` (750000).

But `calculateGoldFromUserInput()` returns `storedQuantity`, not `quantityInStorageUnit`.

Let me check what the return value contains...

Looking at the return type ([gold-calculator.ts:187-198](src/wj-client/lib/utils/gold-calculator.ts:187-198)):

```typescript
export interface GoldCalculationOutput {
  storedQuantity: number;     // Quantity for API (base unit × 10000)
  totalCostNative: number;    // Total cost in native currency (cents/dong)
  totalCostWallet: number;    // Total cost in wallet currency
  averageCostNative: number;  // Average cost in native currency
  displayInfo: {
    quantity: number;          // Display quantity (user's original input)
    unit: GoldUnit;            // Display unit
    totalCost: number;        // Total cost for display
    currency: string;         // Display currency
  };
}
```

So `storedQuantity` is the only value we have, and it's `750000` for 2 tael.

But `initialQuantityDecimal` should be `75` (grams), not `750000`.

So the fix is:
```typescript
initialQuantityDecimal: isGoldInvestment
  ? goldCalculation.storedQuantity / 10000  // Convert storage format to decimal
  : data.initialQuantity,
```

This will send `75` for 2 tael, which is correct (75 grams).

Hmm, but wait. Let me double-check the backend code again...

Looking at [investment_service.go:98-100](src/go-backend/domain/service/investment_service.go:98-100):

```go
if req.InitialQuantityDecimal > 0 {
    initialQuantity = units.QuantityToStorage(req.InitialQuantityDecimal, req.Type)
}
```

So the backend expects `initialQuantityDecimal` to be the "decimal" value, and it will convert to storage format.

For gold VND:
- Frontend sends: 75 (grams)
- Backend: `QuantityToStorage(75, GOLD_VND)` = 75 * 10000 = 750000 ✓

This is correct!

So the fix is:
```typescript
initialQuantityDecimal: isGoldInvestment
  ? goldCalculation.storedQuantity / 10000  // Convert storage ×10000 back to decimal grams/ounces
  : data.initialQuantity,
```

Wait, but I need to verify that `goldCalculation.storedQuantity` is actually being calculated...

Looking at the form code again (line 294-303):

```typescript
if (isGoldInvestment && selectedGoldType) {
  // Use gold calculator for gold investments
  const goldCalculation = calculateGoldFromUserInput({
    quantity: data.initialQuantity,
    quantityUnit: goldQuantityUnit,
    pricePerUnit: data.initialCost / data.initialQuantity,
    priceCurrency: data.currency,
    priceUnit: goldQuantityUnit,
    investmentType: data.type,
    walletCurrency: walletCurrency,
    fxRate: exchangeRate || 1,
  });
```

Yes, `goldCalculation` is calculated but not used.

So the fix is correct:
```typescript
initialQuantityDecimal: isGoldInvestment
  ? goldCalculation.storedQuantity / 10000
  : data.initialQuantity,
```

This will:
- For 2 tael: send 75 (grams) to backend
- Backend: `QuantityToStorage(75, GOLD_VND)` = 750000 ✓
- Correct!

But wait, there's another issue. The `initialCostDecimal` also needs to be adjusted for gold...

Looking at line 311:
```typescript
initialCostDecimal: data.initialCost, // Send decimal value in the user's input currency
```

For gold, `data.initialCost` is the total cost in VND (e.g., 120,000,000).

The backend's conversion ([investment_service.go:101-104](src/go-backend/domain/service/investment_service.go:101-104)):
```go
if req.InitialCostDecimal > 0 {
    initialCost = yahoo.ToSmallestCurrencyUnitByCurrency(req.InitialCostDecimal, req.Currency)
}
```

For VND, this is a no-op (VND has no decimals), so 120,000,000 stays as 120,000,000.

This is correct!

Actually, I realize there's a potential issue. Let me check if the frontend is sending the correct cost...

For the user's example:
- Input: 2 tael at 60M VND/tael = 120M VND total

The form sends:
- `initialCostDecimal: 120000000` ✓

This is correct.

But wait, there's still an issue. Let me re-read the user's data...

User said: "buy sjc9999 (vn gold) with 2 tael (luong) with 120M VND, avg cost is 120M/luong"

So:
- Quantity: 2 tael
- Total cost: 120M VND
- Price per tael: 60M VND

The stored investment has:
- `totalCost: 120000000` ✓
- `averageCost: 60000000` ✓ (60M VND/tael)
- `quantity: 20000` ✗ (should be 750000)

Wait, `averageCost: 60000000` means 60M VND per... what?

Looking at the backend calculation ([investment_service.go:150-154](src/go-backend/domain/service/investment_service.go:150-154)):

```go
var averageCost int64 = 0
if initialQuantity > 0 {
    averageCost = units.CalculateAverageCost(initialCost, initialQuantity, req.Type)
}
```

And `CalculateAverageCost` ([conversion.go:56-64](src/go-backend/pkg/units/conversion.go:56-64)):

```go
func CalculateAverageCost(totalCostCents int64, quantity int64, investmentType v1.InvestmentType) int64 {
    precision := GetPrecisionForInvestmentType(investmentType)
    return totalCostCents * int64(precision) / quantity
}
```

For the broken case:
- `totalCostCents = 120000000`
- `quantity = 20000` (2 grams × 10000)
- `precision = 10000`
- `averageCost = 120000000 * 10000 / 20000 = 60000000`

So `averageCost = 60M VND` per... gram?

Wait, that doesn't make sense. 60M VND per gram is way too high.

Let me re-check...

Actually, I think the issue is that the `averageCost` is stored as "per storage unit" (per gram for VND gold), but the calculation gives us an incorrect value because the quantity is wrong.

For the correct case (75 grams):
- `totalCostCents = 120000000`
- `quantity = 750000` (75 grams × 10000)
- `precision = 10000`
- `averageCost = 120000000 * 10000 / 750000 = 1600000`

So `averageCost = 1.6M VND per gram`, which is correct!

Because:
- 1.6M VND/gram × 37.5 grams/tael = 60M VND/tael ✓

OK so the fix is definitely to fix the quantity.

Now, the `currentPrice` issue...

The user said `currentPrice: 4346667` which is 4.34M VND.

From the API: `"buy": 163000000` (163M VND/tael)

163M / 37.5 = 4.34M VND/gram ✓

So the `currentPrice` is correct (per gram).

But the `currentValue` calculation:
- `currentValue = quantity × currentPrice`
- `currentValue = 20000 × 4346667 = 86933340000 / 10000 = 8693334`

Wait, let me check the calculation...

Looking at `CalculateCurrentValue` ([conversion.go:94-98](src/go-backend/pkg/units/conversion.go:94-98)):

```go
func CalculateCurrentValue(quantity int64, priceCents int64, investmentType v1.InvestmentType) int64 {
    precision := GetPrecisionForInvestmentType(investmentType)
    quantityWholeUnits := float64(quantity) / float64(precision)
    return int64(quantityWholeUnits * float64(priceCents))
}
```

For the broken case:
- `quantity = 20000`
- `priceCents = 4346667`
- `precision = 10000`
- `quantityWholeUnits = 20000 / 10000 = 2`
- `currentValue = 2 × 4346667 = 8693334`

This matches the user's data. So the calculation is correct, but the quantity is wrong.

For the correct case (75 grams):
- `quantity = 750000`
- `quantityWholeUnits = 750000 / 10000 = 75`
- `currentValue = 75 × 4346667 = 326000025`

Which is approximately 326M VND, which is correct!

So yes, the fix is to fix the quantity.

Now let me finalize the fix...

Actually, I realize there's one more issue. The `goldCalculation` is only calculated inside the `if (isGoldInvestment && selectedGoldType)` block, but we need it for the API call outside that block.

Wait, no. Looking at the code structure:

```typescript
if (isGoldInvestment && selectedGoldType) {
  // Use gold calculator for gold investments
  const goldCalculation = calculateGoldFromUserInput({...});

  createInvestmentMutation.mutate({...});
} else {
  // Convert to API format using utility functions for non-gold
  createInvestmentMutation.mutate({...});
}
```

So `goldCalculation` is in scope for the gold investment API call. Good.

So the fix is straightforward:

```typescript
if (isGoldInvestment && selectedGoldType) {
  const goldCalculation = calculateGoldFromUserInput({
    quantity: data.initialQuantity,
    quantityUnit: goldQuantityUnit,
    pricePerUnit: data.initialCost / data.initialQuantity,
    priceCurrency: data.currency,
    priceUnit: goldQuantityUnit,
    investmentType: data.type,
    walletCurrency: walletCurrency,
    fxRate: exchangeRate || 1,
  });

  createInvestmentMutation.mutate({
    walletId,
    symbol: selectedGoldType.value,
    name: selectedGoldType.label,
    type: data.type,
    initialQuantityDecimal: goldCalculation.storedQuantity / 10000, // FIXED: Send converted quantity
    initialCostDecimal: data.initialCost,
    currency: data.currency,
    initialQuantity: 0,
    initialCost: 0,
  });
}
```

Wait, but I need to double-check if `storedQuantity / 10000` gives us the right value...

From [gold-calculator.ts:254](src/wj-client/lib/utils/gold-calculator.ts:254):

```typescript
const storedQuantity = Math.round(quantityInStorageUnit * 10000);
```

So `storedQuantity = quantityInStorageUnit * 10000`

Therefore, `storedQuantity / 10000 = quantityInStorageUnit`

For 2 tael:
- `quantityInStorageUnit = 2 * 37.5 = 75` grams
- `storedQuantity = 75 * 10000 = 750000`
- `storedQuantity / 10000 = 75` ✓

Great, the fix is correct.

But wait, there's another issue. The `initialCost` calculation might also be wrong...

Let me check the cost calculation.

For gold, the user enters:
- `data.initialCost = 120000000` (total cost in VND)
- `data.initialQuantity = 2` (tael)

The form sends:
- `initialCostDecimal: 120000000`
- `initialQuantityDecimal: 75` (grams, after fix)

Backend:
- `initialCost = ToSmallestCurrencyUnitByCurrency(120000000, "VND") = 120000000`
- `initialQuantity = QuantityToStorage(75, GOLD_VND) = 75 * 10000 = 750000`
- `averageCost = CalculateAverageCost(120000000, 750000, GOLD_VND) = 120000000 * 10000 / 750000 = 1600000`

So `averageCost = 1.6M VND per gram`, which is correct.

But wait, what about the wallet balance deduction?

Looking at the backend ([investment_service.go:125-141](src/go-backend/domain/service/investment_service.go:125-141)):

```go
// 3.5. Convert initial cost to wallet currency for balance check
initialCostInWalletCurrency := initialCost
if req.Currency != wallet.Currency {
    converted, err := s.fxRateSvc.ConvertAmount(ctx, initialCost, req.Currency, wallet.Currency)
    // ...
    initialCostInWalletCurrency = converted
}

// 3.6. Check wallet has sufficient balance for initial investment
if wallet.Balance < initialCostInWalletCurrency {
    return nil, apperrors.NewValidationError(...)
}
```

So the wallet balance is deducted by `initialCostInWalletCurrency`, which is 120M VND.

This is correct because the user actually paid 120M VND.

So the fix is only for the quantity, not the cost.

Actually, wait. I just realized something. The user's investment shows `averageCost: 60000000`, which is 60M VND.

If `averageCost` is per gram, then 60M VND/gram is way too high.

But looking at the user's data again:
- `totalCost: 120000000`
- `quantity: 20000` (2 grams × 10000)
- `averageCost: 60000000`

And `CalculateAverageCost`:
- `averageCost = 120000000 * 10000 / 20000 = 60000000`

So `averageCost = 60M` (in VND, not "per gram" necessarily)

Actually, I think the `averageCost` is stored as "cost per smallest unit", which for VND gold is "cost per 0.0001 gram" (since quantity is stored as grams × 10000).

Wait, that doesn't make sense either...

Let me re-read the `CalculateAverageCost` comment:

```go
// CalculateAverageCost calculates the average cost per unit in cents
//
// For gold investments:
// - GOLD_VND: Returns cost per gram in VND (smallest unit)
```

So `averageCost` is "cost per gram" for VND gold.

For the broken case:
- `averageCost = 60000000` VND/gram

But this is wrong! The user paid 60M VND per tael, which is 1.6M VND per gram.

So yes, the `averageCost` is also wrong because the quantity is wrong.

For the correct case (75 grams):
- `averageCost = 120000000 * 10000 / 750000 = 1600000` VND/gram

Which is correct: 60M VND/tael / 37.5 = 1.6M VND/gram ✓

OK so fixing the quantity will fix both the `quantity` and `averageCost` fields.

Now let me also check if there are other places that need fixing...

Actually, I realize there might be another issue. When adding transactions to gold investments, the same problem might occur.

Let me check if there's a similar form for adding transactions...

Actually, looking at the issue description, the user is talking about creating an investment. So I'll focus on that for now.

If there are similar issues with adding transactions, we can address those separately.

OK, let me finalize the implementation plan.

### Changes Required:

#### 1. Fix AddInvestmentForm.tsx
**File**: `src/wj-client/components/modals/forms/AddInvestmentForm.tsx`
**Line**: 310
**Changes**: Use calculated gold quantity instead of raw user input

**Current code**:
```typescript
initialQuantityDecimal: data.initialQuantity, // Send decimal value
```

**Fixed code**:
```typescript
initialQuantityDecimal: isGoldInvestment
  ? goldCalculation.storedQuantity / 10000  // Convert storage format to decimal (grams/ounces)
  : data.initialQuantity,
```

**Note**: `goldCalculation.storedQuantity` is the quantity in storage format (grams × 10000 for VND gold). Dividing by 10000 gives us the decimal value in grams, which the backend expects for `initialQuantityDecimal`.

### Success Criteria:

#### Automated Verification:
- [ ] Unit tests pass: `npm test` in wj-client
- [ ] Type checking passes: `npm run typecheck`
- [ ] Gold calculator tests pass: Verify gold-calculator.test.ts has correct conversions

#### Manual Verification:
1. [ ] Create gold investment with 2 tael quantity at 60M VND/tael
2. [ ] Verify API receives `initialQuantityDecimal: 75` (not 2)
3. [ ] Verify database stores `quantity: 750000` (not 20000)
4. [ ] Verify `averageCost` is 1600000 VND/gram (not 60000000)
5. [ ] Verify `currentValue` shows ~326M VND (not 8.69M VND)
6. [ ] Test with gram input (e.g., 100 grams) - should work correctly
7. [ ] Test with USD gold (ounce input) - should work correctly

**Implementation Note**: After completing this change and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before considering the task complete.

---

## Testing Strategy

### Unit Tests:
- Add test case for gold investment creation with tael input
- Verify `storedQuantity` calculation is correct
- Verify API receives correct decimal value

### Integration Tests:
- Test full flow: form input → API call → database storage
- Verify quantity and average cost are stored correctly

### Manual Testing Steps:
1. Go to Investment page and click "Add Investment"
2. Select "Gold (Vietnam)" type
3. Select "SJC 9999" gold type
4. Enter quantity: 2 (tael)
5. Enter total cost: 120000000 (VND)
6. Submit form
7. Check the investment details:
   - Quantity should display as "2.0000 lượng" (using gold-calculator display logic)
   - Current value should be ~326M VND (based on market price)

## References

- Related file: [gold-calculator.ts](src/wj-client/lib/utils/gold-calculator.ts)
- Related file: [AddInvestmentForm.tsx](src/wj-client/components/modals/forms/AddInvestmentForm.tsx)
- Backend conversion: [conversion.go](src/go-backend/pkg/units/conversion.go)
- Backend service: [investment_service.go](src/go-backend/domain/service/investment_service.go)
