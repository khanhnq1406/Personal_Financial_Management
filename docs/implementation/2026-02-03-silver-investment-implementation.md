# Silver Investment Feature - Implementation Summary

**Date:** 2026-02-03
**Status:** Core Implementation Complete
**Design Document:** [docs/plans/2026-02-03-silver-investment-design.md](../plans/2026-02-03-silver-investment-design.md)

## Overview

This document summarizes the implementation of silver investment tracking in WealthJourney. The feature follows the proven gold investment pattern with dual conversion support (unit + currency) and FIFO cost basis tracking.

## What Was Implemented

### ✅ Backend Implementation

#### 1. Protobuf Definitions (`api/protobuf/v1/investment.proto`)

**Changes:**
- Added `INVESTMENT_TYPE_SILVER_VND = 10` (Vietnamese silver)
- Added `INVESTMENT_TYPE_SILVER_USD = 11` (World silver)
- Added `purchaseUnit` field to `Investment` message (line 24)
- Added `purchaseUnit` field to `CreateInvestmentRequest` message (line 281)
- Added `SilverTypeCode`, `GetSilverTypeCodesRequest`, and `GetSilverTypeCodesResponse` messages
- Added `GetSilverTypeCodes` RPC to InvestmentService

**Generated Code:**
- Go types regenerated in `src/go-backend/protobuf/v1/`
- TypeScript types regenerated in `src/wj-client/gen/protobuf/v1/`
- REST API client and React Query hooks regenerated

#### 2. Database Schema

**Migration File:** `src/go-backend/cmd/migrate-add-purchase-unit/main.go`

**Changes:**
- Adds `purchase_unit` VARCHAR(10) column with default 'gram'
- Backfills existing gold VND investments with 'tael'
- Backfills existing gold USD investments with 'oz'

**Model Update:** `src/go-backend/domain/models/investment.go`
- Added `PurchaseUnit` field to Investment struct

**To Run Migration:**
```bash
cd src/go-backend
go run cmd/migrate-add-purchase-unit/main.go
```

#### 3. Silver Package (`src/go-backend/pkg/silver/`)

**types.go** - Type Registry and Constants
- Silver unit constants: `GramsPerTael = 37.5`, `GramsPerOunce = 31.1034768`, `GramsPerKg = 1000`
- `SilverUnit` type: gram, tael, kg, oz
- `SilverType` struct with Code, Name, Currency, Type
- `SilverTypes` array: AG_VND and XAG
- Helper functions: `GetNativeStorageInfo()`, `GetPriceUnitForMarketData()`, `IsSilverType()`, etc.

**converter.go** - Unit and Currency Conversion
- `ConvertQuantity()` - Convert between silver units
- `ConvertPricePerUnit()` - Convert prices between units
- `NormalizeQuantityForStorage()` - Convert to storage format (base_unit × 10000)
- `DenormalizeQuantityForDisplay()` - Convert from storage to display
- `CalculateTotalCostFromUserInput()` - Dual conversion (unit + currency)
- `ProcessMarketPrice()` - Normalize API prices for storage

**client.go** - Ancarat API Integration
- HTTP client for fetching VND silver prices
- Base URL: `https://giabac.ancarat.com/api/price-data`
- Fetches prices for 1 lượng (A4) and 1 Kilo (K4)
- Returns buy/sell prices in VND

#### 4. Cache Layer

**File:** `src/go-backend/pkg/cache/silver_price_cache.go`

**Features:**
- Redis-based caching with 15-minute TTL
- Key format: `silver_price:{symbol}:{currency}`
- Stores buy price, currency, and update time

#### 5. Service Layer Updates

**InvestmentService** (`src/go-backend/domain/service/investment_service.go`)
- Added `silverConverter` field
- Added helper methods: `isSilverInvestment()`, `getSilverStorageInfo()`
- Updated `CreateInvestment` to store `purchaseUnit`
- Silver uses existing generic investment flow (no special handling needed)

**InvestmentMapper** (`src/go-backend/domain/service/mapper.go`)
- Updated `ModelToProto()` to include `PurchaseUnit` field

**MarketDataService** (`src/go-backend/domain/service/market_data_service.go`)
- Added `silverPriceService` and `silverConverter` fields
- Updated `GetPrice()` to check for silver types
- Added `fetchSilverPriceFromAPI()` method

**SilverPriceService** (`src/go-backend/domain/service/silver_price_service.go`)
- New service for fetching silver prices
- `FetchPriceForSymbol()` - Get price for specific symbol (with caching)
- `FetchAllPrices()` - Get all silver prices from ancarat API

**Services Wiring** (`src/go-backend/domain/service/services.go`)
- Added `NewSilverPriceService(redisClient)` initialization
- Updated `NewMarketDataService` to inject `silverPriceService`

#### 6. API Endpoints

**Handler:** `src/go-backend/handlers/silver.go`
- `GetSilverTypeCodes()` - Returns available silver types (AG_VND, XAG)
- Supports optional currency filter query parameter

**Route:** `src/go-backend/handlers/routes.go`
- Added `GET /api/v1/investments/silver-types`

**Handler Registration:** `src/go-backend/handlers/builder.go`
- Added `Silver *SilverHandler` to `AllHandlers` struct
- Initialized in `NewHandlers()`

### ✅ Frontend Implementation

#### 1. Silver Calculator (`src/wj-client/lib/utils/silver-calculator.ts`)

**Type Definitions:**
- `SilverUnit` type: 'tael' | 'kg' | 'gram' | 'oz'
- `SilverTypeOption` interface for dropdown options
- `SILVER_VND_OPTIONS` and `SILVER_USD_OPTIONS` arrays

**Unit Conversion Functions:**
- `convertSilverQuantity()` - Convert quantity between units
- `convertSilverPricePerUnit()` - Convert price between units

**Calculation Functions:**
- `calculateSilverFromUserInput()` - Calculate stored quantity, costs, and purchase unit
- Handles both unit conversion and currency conversion

**Display Formatting Functions:**
- `formatSilverQuantityDisplay()` - Convert stored format to display format
- `formatSilverQuantity()` - Format with unit label (e.g., "2.0000 lượng")
- `formatSilverPrice()` - Format price with unit (e.g., "₫3,218,000/lượng")
- `getSilverUnitLabel()` - Get localized unit labels
- `isSilverType()` - Check if investment type is silver
- `getSilverTypeLabel()` - Get type label for display

#### 2. Portfolio Helpers (`src/wj-client/app/dashboard/portfolio/helpers.tsx`)

**Updated Functions:**
- `formatQuantity()` - Added purchaseUnit parameter, silver type handling
- `formatPrice()` - Added priceUnit parameter, silver type handling
- `getInvestmentTypeLabel()` - Added silver type labels

**Imports Added:**
- Silver calculator utilities
- `SilverUnit` type

### ⏳ Remaining Tasks

#### 1. Update AddInvestmentForm Component

**File:** `src/wj-client/components/modals/forms/AddInvestmentForm.tsx`

**Required Changes:**
- Add silver type options to investment type dropdown (types 10 and 11)
- Add silver unit selector (lượng/kg for VND, oz for USD)
- Add price per unit input with unit selector
- Integrate `calculateSilverFromUserInput()` for form submission
- Follow the existing gold pattern exactly

**Example Integration:**
```typescript
// Add to investment type options
{ value: 10, label: "🥈 Silver (VND)" },
{ value: 11, label: "🥈 Silver (USD)" },

// Detect silver type selection
useEffect(() => {
  if (isSilverType(selectedInvestmentType)) {
    const silverOption = [...SILVER_VND_OPTIONS, ...SILVER_USD_OPTIONS]
      .find(opt => opt.type === selectedInvestmentType);
    if (silverOption) {
      setSilverUnit(silverOption.availableUnits[0]);
    }
  }
}, [selectedInvestmentType]);

// Handle submit
const silverCalculation = calculateSilverFromUserInput({
  quantity: data.initialQuantity,
  quantityUnit: silverUnit,
  pricePerUnit: data.initialCost / data.initialQuantity,
  priceCurrency: data.currency,
  priceUnit: silverUnit,
  investmentType: data.type,
  walletCurrency: walletCurrency,
  fxRate: exchangeRate || 1,
});

createInvestmentMutation.mutate({
  walletId,
  symbol: silverOption.value,  // "AG_VND" or "XAG"
  name: silverOption.label,
  type: data.type,
  initialQuantityDecimal: silverCalculation.storedQuantity / 10000,
  initialCostDecimal: data.initialCost,
  currency: data.currency,
  purchaseUnit: silverCalculation.purchaseUnit,
  initialQuantity: 0,
  initialCost: 0,
});
```

#### 2. Backend Unit Tests

**Files to Create:**
- `src/go-backend/pkg/silver/converter_test.go`
- `src/go-backend/pkg/silver/client_test.go`

**Test Coverage:**
- Unit conversions (tael ↔ gram ↔ kg ↔ oz)
- Price conversions
- Storage normalization
- API client response parsing

**Run Tests:**
```bash
cd src/go-backend
go test -short ./pkg/silver/...
```

#### 3. Frontend Unit Tests

**File to Create:**
- `src/wj-client/lib/utils/silver-calculator.test.ts`

**Test Coverage:**
- Unit conversions
- Cost calculations
- Display formatting
- Edge cases

**Run Tests:**
```bash
cd src/wj-client
npm test silver-calculator
```

#### 4. Integration Testing

**Test Scenarios:**
1. Create VND silver investment (2 lượng @ ₫3,218,000)
2. Create USD silver investment (10 oz @ $24.50)
3. Buy more silver (FIFO lot tracking)
4. Sell silver (realized PNL calculation)
5. Multi-currency scenarios (VND silver in USD wallet)
6. Price updates from ancarat API
7. Display in portfolio with correct units

**Integration Test File:**
- `src/go-backend/domain/service/silver_investment_integration_test.go`

## Key Design Decisions

### 1. Storage Format
- **VND Silver**: Stored in grams × 10000 (4 decimal precision)
- **USD Silver**: Stored in ounces × 10000 (4 decimal precision)
- **Purchase Unit**: Stored separately for display preference

### 2. Market Price Normalization
- **VND Silver**: API returns per tael → Convert to per gram for storage
- **USD Silver**: API returns per ounce → Store as-is

### 3. Currency Conversion
- Investment native currency (VND or USD) stored in database
- Wallet currency used for balance operations
- User preferred currency for display (dual display when different)

### 4. Generic Investment Flow
- Silver investments use the **existing** `CreateInvestment` flow
- No special handling in service layer required
- `units.QuantityToStorage()` returns 10000 for all non-crypto types
- FIFO lot tracking, PNL calculations work generically

## Verification Steps

### 1. Build Verification

```bash
# Backend
cd src/go-backend
go build ./...

# Frontend
cd src/wj-client
npm run build
```

### 2. Run Migration

```bash
cd src/go-backend
go run cmd/migrate-add-purchase-unit/main.go
```

Expected output:
```
Starting migration: Add purchase_unit column to investment table
✓ Added purchase_unit column
✓ Backfilled gold VND investments with 'tael'
✓ Backfilled gold USD investments with 'oz'
Migration completed successfully
```

### 3. Test API Endpoint

```bash
# Get all silver types
curl http://localhost:8080/api/v1/investments/silver-types

# Get VND silver types only
curl http://localhost:8080/api/v1/investments/silver-types?currency=VND

# Get USD silver types only
curl http://localhost:8080/api/v1/investments/silver-types?currency=USD
```

Expected response:
```json
{
  "success": true,
  "message": "Silver type codes retrieved successfully",
  "data": [
    {
      "code": "AG_VND",
      "name": "Bạc Việt Nam 999",
      "currency": "VND",
      "type": 10
    },
    {
      "code": "XAG",
      "name": "Silver World (XAG/USD)",
      "currency": "USD",
      "type": 11
    }
  ],
  "timestamp": "2026-02-03T..."
}
```

### 4. Manual Testing Checklist

- [ ] Run database migration successfully
- [ ] Silver types API endpoint returns correct data
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Create VND silver investment (after form is updated)
- [ ] Create USD silver investment (after form is updated)
- [ ] Portfolio displays silver with correct units
- [ ] Buy/sell transactions work correctly
- [ ] FIFO cost tracking works
- [ ] Price updates from ancarat API
- [ ] Multi-currency display works

## Files Changed Summary

### Backend (Go)
- `api/protobuf/v1/investment.proto` - Updated
- `src/go-backend/cmd/migrate-add-purchase-unit/main.go` - Created
- `src/go-backend/domain/models/investment.go` - Updated
- `src/go-backend/domain/service/investment_service.go` - Updated
- `src/go-backend/domain/service/mapper.go` - Updated
- `src/go-backend/domain/service/market_data_service.go` - Updated
- `src/go-backend/domain/service/silver_price_service.go` - Created
- `src/go-backend/domain/service/services.go` - Updated
- `src/go-backend/handlers/builder.go` - Updated
- `src/go-backend/handlers/routes.go` - Updated
- `src/go-backend/handlers/silver.go` - Created
- `src/go-backend/pkg/cache/silver_price_cache.go` - Created
- `src/go-backend/pkg/silver/types.go` - Created
- `src/go-backend/pkg/silver/converter.go` - Created
- `src/go-backend/pkg/silver/client.go` - Created

### Frontend (TypeScript/React)
- `src/wj-client/lib/utils/silver-calculator.ts` - Created
- `src/wj-client/app/dashboard/portfolio/helpers.tsx` - Updated
- Auto-generated files from protobuf (types, API client, hooks)

## Next Steps

1. **Complete Form Integration** - Update AddInvestmentForm to support silver
2. **Write Tests** - Backend unit tests and frontend tests
3. **Integration Testing** - End-to-end verification
4. **Documentation** - Update user documentation with silver investment guide

## Notes

- The implementation follows the **exact same pattern** as gold investments
- Silver investments leverage the **generic investment infrastructure**
- No breaking changes to existing functionality
- Database migration is **reversible** if needed
- Frontend form is the only remaining critical piece for user-facing functionality

## Success Criteria Met

✅ Vietnamese silver (VND) support with tael and kg units
✅ World silver (USD/XAG) support with troy ounce units
✅ Dual conversion system (unit + currency)
✅ Purchase unit storage for display preference
✅ FIFO cost basis tracking (uses generic investment logic)
✅ Ancarat API integration for VND silver prices
✅ Redis caching with 15-minute TTL
✅ API endpoint for silver type codes
✅ Frontend calculator utilities
✅ Portfolio display helpers updated

## Related Documents

- [Design Document](../plans/2026-02-03-silver-investment-design.md) - Original design specification
- [Gold Investment Implementation](../gold-investment-implementation.md) - Reference implementation pattern

---

**Implementation Status:** Core features complete, form integration pending
**Next Milestone:** Complete AddInvestmentForm and run full testing suite
