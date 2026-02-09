# Gold Investment Feature - Implementation Plan

**Based on:** [2026-01-31-gold-investment-feature-design.md](./2026-01-31-gold-investment-feature-design.md)
**Created:** 2026-01-31
**Estimated Duration:** 3-5 days

---

## Overview

This plan breaks down the gold investment feature implementation into manageable tasks. Each task includes:
- Clear acceptance criteria
- Files to modify/create
- Dependencies on other tasks
- Testing approach

---

## Phase 1: Protobuf & Code Generation (Day 1)

### Task 1.1: Update Protobuf Definitions

**Priority:** P0 (Blocking)
**Estimated Time:** 30 minutes

**Files to Modify:**
- `api/protobuf/v1/investment.proto`

**Changes:**
```protobuf
// Add to InvestmentType enum (after line 46)
INVESTMENT_TYPE_GOLD_VND = 8;      // Vietnamese gold (SJC) - priced in VND
INVESTMENT_TYPE_GOLD_USD = 9;      // World gold (XAU/USD) - priced in USD

// Add new messages before service definition (after line 101)
message GoldTypeCode {
  string code = 1;
  string name = 2;
  string currency = 3;
  string unit = 4;
  double unitWeight = 5;
  int32 type = 6;
}

message GetGoldTypeCodesRequest {
  string currency = 1;
}

message GetGoldTypeCodesResponse {
  bool success = 1;
  repeated GoldTypeCode data = 2;
  string timestamp = 3;
}
```

**Add to Service:**
```protobuf
// In InvestmentService (after line 191)
rpc GetGoldTypeCodes(GetGoldTypeCodesRequest) returns (GetGoldTypeCodesResponse) {
  option (google.api.http) = {
    get: "/api/v1/investments/gold-types"
  };
}
```

**Acceptance Criteria:**
- [ ] Protobuf file compiles without errors
- [ ] New enum values don't conflict with existing values

---

### Task 1.2: Generate Code from Protobuf

**Priority:** P0 (Blocking)
**Estimated Time:** 5 minutes (automated)

**Command:**
```bash
task proto:all
```

**Acceptance Criteria:**
- [ ] Go code generated in `src/go-backend/protobuf/v1/`
- [ ] TypeScript code generated in `src/wj-client/gen/protobuf/v1/`
- [ ] No generation errors

---

### Task 1.3: Verify Generated Types

**Priority:** P0
**Estimated Time:** 15 minutes

**Files to Check:**
- `src/wj-client/gen/protobuf/v1/investment.ts`
- `src/go-backend/protobuf/v1/investment.pb.go`

**Acceptance Criteria:**
- [ ] `InvestmentType.INVESTMENT_TYPE_GOLD_VND` exists with value 8
- [ ] `InvestmentType.INVESTMENT_TYPE_GOLD_USD` exists with value 9
- [ ] `GoldTypeCode` message type exists
- [ ] `GetGoldTypeCodesRequest` and `GetGoldTypeCodesResponse` exist

---

## Phase 2: Backend - Gold Conversion Package (Day 1)

### Task 2.1: Create Gold Types Registry

**Priority:** P0 (Blocking)
**Estimated Time:** 1 hour

**File to Create:**
- `src/go-backend/pkg/gold/types.go`

**Content:**
```go
package gold

import (
	investmentv1 "wealthjourney/protobuf/v1"
)

const (
	GramsPerTael  = 37.5
	GramsPerOunce = 31.1034768
)

type GoldUnit string

const (
	UnitGram  GoldUnit = "gram"
	UnitTael  GoldUnit = "tael"
	UnitOunce GoldUnit = "oz"
)

type GoldType struct {
	Code       string
	Name       string
	Currency   string
	Unit       GoldUnit
	UnitWeight float64
	Type       investmentv1.InvestmentType
}

var GoldTypes = []GoldType{
	// Vietnamese gold
	{Code: "SJL1L10", Name: "SJC 1L-10L", Currency: "VND", Unit: UnitTael, UnitWeight: 37.5, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJL1L2", Name: "SJC 1L-2L", Currency: "VND", Unit: UnitTael, UnitWeight: 37.5, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJL5C", Name: "SJC 5 chỉ", Currency: "VND", Unit: UnitTael, UnitWeight: 3.75, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJL1C", Name: "SJC 1 chỉ", Currency: "VND", Unit: UnitTael, UnitWeight: 1.875, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJR2", Name: "SJC Nhẫn 2-5 chỉ", Currency: "VND", Unit: UnitGram, UnitWeight: 1.0, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJR1", Name: "SJC Nhẫn 1 chỉ", Currency: "VND", Unit: UnitGram, UnitWeight: 1.0, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJT99", Name: "SJC Trang sức 99.99", Currency: "VND", Unit: UnitGram, UnitWeight: 1.0, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	{Code: "SJT98", Name: "SJC Trang sức 99.98", Currency: "VND", Unit: UnitGram, UnitWeight: 1.0, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_VND},
	// World gold
	{Code: "XAU", Name: "Gold World (XAU/USD)", Currency: "USD", Unit: UnitOunce, UnitWeight: 31.1034768, Type: investmentv1.InvestmentType_INVESTMENT_TYPE_GOLD_USD},
}

func GetGoldTypeByCode(code string) *GoldType {
	for _, gt := range GoldTypes {
		if gt.Code == code {
			return &gt
		}
	}
	return nil
}

func GetGoldTypesByCurrency(currency string) []GoldType {
	var result []GoldType
	for _, gt := range GoldTypes {
		if gt.Currency == currency {
			result = append(result, gt)
		}
	}
	return result
}
```

**Acceptance Criteria:**
- [ ] File compiles without errors
- [ ] All gold types are defined correctly
- [ ] `GetGoldTypeByCode` returns correct type
- [ ] `GetGoldTypesByCurrency` filters correctly

---

### Task 2.2: Create Gold Converter

**Priority:** P0 (Blocking)
**Estimated Time:** 3 hours

**File to Create:**
- `src/go-backend/pkg/gold/converter.go`

**Key Functions:**
1. `ConvertQuantity(quantity, fromUnit, toUnit)` - Unit conversion
2. `ConvertPricePerUnit(price, fromUnit, toUnit)` - Price unit conversion
3. `NormalizeQuantityForStorage(quantity, inputUnit, investmentType)` - For storage
4. `DenormalizeQuantityForDisplay(storedQuantity, investmentType, displayUnit)` - For display
5. `CalculateTotalCostFromUserInput(...)` - Full calculation with dual conversion
6. `ProcessMarketPrice(marketPrice, currency, investmentType)` - Market data processing
7. `CalculateDisplayValue(...)` - Display calculation

**Acceptance Criteria:**
- [ ] All unit conversions work correctly
- [ ] Currency integration with FXRateService works
- [ ] Storage format is correct (base unit × 10000)
- [ ] Unit tests pass (Task 2.3)

---

### Task 2.3: Unit Tests for Gold Converter

**Priority:** P1
**Estimated Time:** 2 hours

**File to Create:**
- `src/go-backend/pkg/gold/converter_test.go`

**Test Cases:**
1. Unit conversions (tael ↔ gram, gram ↔ ounce)
2. Price per unit conversions
3. Storage normalization (VND gold, USD gold)
4. Display denormalization
5. Total cost calculation with FX conversion
6. Market price processing
7. Edge cases (zero quantity, negative values)

**Acceptance Criteria:**
- [ ] All unit conversion tests pass
- [ ] All currency conversion tests pass
- [ ] Edge cases handled correctly
- [ ] Test coverage > 80%

---

## Phase 3: Backend - Market Data Integration (Day 2)

### Task 3.1: Create Gold Price Client

**Priority:** P0
**Estimated Time:** 1.5 hours

**File to Create:**
- `src/go-backend/pkg/gold/client.go`

**Content:**
```go
package gold

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	httpClient *http.Client
	baseURL    string
}

func NewClient(timeout time.Duration) *Client {
	return &Client{
		httpClient: &http.Client{Timeout: timeout},
		baseURL:    "https://www.vang.today/api/prices",
	}
}

type GoldPriceResponse struct {
	Success     bool        `json:"success"`
	CurrentTime int64       `json:"current_time"`
	Data        []GoldPrice `json:"data"`
}

type GoldPrice struct {
	TypeCode   string `json:"type_code"`
	Buy        int64  `json:"buy"`
	Sell       int64  `json:"sell"`
	ChangeBuy  int64  `json:"change_buy"`
	ChangeSell int64  `json:"change_sell"`
	UpdateTime int64  `json:"update_time"`
}

func (c *Client) FetchPrices(ctx context.Context) (*GoldPriceResponse, error)
func (c *Client) FetchPriceByType(ctx context.Context, typeCode string) (*GoldPrice, error)
```

**Acceptance Criteria:**
- [ ] Successfully fetches from vang.today API
- [ ] Handles errors gracefully
- [ ] Respects context timeout
- [ ] Response parsing works correctly

---

### Task 3.2: Create Gold Price Cache

**Priority:** P1
**Estimated Time:** 1 hour

**File to Create:**
- `src/go-backend/pkg/cache/gold_price_cache.go`

**Content:**
```go
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

type GoldPriceCache struct {
	client *redis.Client
}

func NewGoldPriceCache(client *redis.Client) *GoldPriceCache

func (c *GoldPriceCache) Set(ctx context.Context, symbol string, price interface{}, ttl time.Duration) error
func (c *GoldPriceCache) Get(ctx context.Context, symbol string) (interface{}, error)
func (c *GoldPriceCache) Delete(ctx context.Context, symbol string) error
```

**Acceptance Criteria:**
- [ ] Redis operations work correctly
- [ ] TTL is respected (15 minutes default)
- [ ] JSON serialization/deserialization works

---

### Task 3.3: Create Gold Price Service

**Priority:** P0
**Estimated Time:** 2 hours

**File to Create:**
- `src/go-backend/domain/service/gold_price_service.go`

**Content:**
```go
package service

type GoldPriceService interface {
	FetchPriceForSymbol(ctx context.Context, symbol string) (*models.GoldPrice, error)
	FetchAllPrices(ctx context.Context) ([]models.GoldPrice, error)
}

type goldPriceService struct {
	client *gold.Client
	cache  *cache.GoldPriceCache
}

func NewGoldPriceService(redisClient *redis.Client) GoldPriceService
```

**Acceptance Criteria:**
- [ ] Fetches from vang.today API
- [ ] Caches results in Redis
- [ ] Returns cached data if fresh
- [ ] Handles API failures gracefully

---

### Task 3.4: Update Market Data Service

**Priority:** P0
**Estimated Time:** 2 hours

**File to Modify:**
- `src/go-backend/domain/service/market_data_service.go`

**Changes:**
1. Add `goldPriceService GoldPriceService` to service struct
2. Update `UpdatePricesForInvestments` to handle gold types
3. Call gold price service for gold investments

**Acceptance Criteria:**
- [ ] Gold investments fetch from vang.today
- [ ] Non-gold investments use existing Yahoo Finance
- [ ] Price normalization works correctly
- [ ] Integration tests pass

---

## Phase 4: Backend - API Handlers (Day 2-3)

### Task 4.1: Create Gold Handler

**Priority:** P0
**Estimated Time:** 1 hour

**File to Create:**
- `src/go-backend/api/handlers/gold.go`

**Content:**
```go
package handlers

type GoldHandler struct{}

func NewGoldHandler() *GoldHandler

func (h *GoldHandler) GetGoldTypeCodes(c *gin.Context)
```

**Acceptance Criteria:**
- [ ] Returns all gold types by default
- [ ] Filters by currency query param
- [ ] Response matches protobuf schema
- [ ] Includes all required fields

---

### Task 4.2: Update Routes

**Priority:** P0
**Estimated Time:** 30 minutes

**File to Modify:**
- `src/go-backend/api/handlers/routes.go`

**Changes:**
```go
goldHandler := handlers.NewGoldHandler()
apiV1.GET("/investments/gold-types", goldHandler.GetGoldTypeCodes)
```

**Acceptance Criteria:**
- [ ] Route is registered correctly
- [ ] Accessible without authentication (public endpoint)
- [ ] Returns 404 for invalid routes

---

### Task 4.3: Update Investment Service for Gold

**Priority:** P0
**Estimated Time:** 3 hours

**File to Modify:**
- `src/go-backend/domain/service/investment_service.go`

**Changes:**
1. Add `goldConverter *gold.Converter` to service struct
2. Update `CreateInvestment` to handle gold types with dual conversion
3. Add gold-specific logic in `processBuyTransaction`
4. Update `enrichInvestmentProto` for gold display

**Acceptance Criteria:**
- [ ] Gold investments created with correct storage format
- [ ] Quantity stored in correct units (grams/oz)
- [ ] Currency conversion works for display
- [ ] Wallet balance correctly deducted/credited

---

## Phase 5: Frontend - Utilities (Day 3)

### Task 5.1: Create Gold Calculator

**Priority:** P0
**Estimated Time:** 2 hours

**File to Create:**
- `src/wj-client/lib/utils/gold-calculator.ts`

**Content:**
```typescript
export type GoldUnit = 'tael' | 'gram' | 'oz';

export interface GoldCalculationInput { ... }
export interface GoldCalculationOutput { ... }

export function convertGoldQuantity(quantity: number, from: GoldUnit, to: GoldUnit): number
export function convertGoldPricePerUnit(price: number, from: GoldUnit, to: GoldUnit): number
export function getGoldStorageInfo(investmentType: number): { unit: GoldUnit; currency: string }
export function getGoldMarketPriceUnit(investmentType: number): GoldUnit
export function calculateGoldFromUserInput(input: GoldCalculationInput): GoldCalculationOutput
```

**Acceptance Criteria:**
- [ ] All unit conversions match backend
- [ ] Total cost calculation is accurate
- [ ] TypeScript types are correct
- [ ] No runtime errors

---

### Task 5.2: Create Gold Calculator Tests

**Priority:** P1
**Estimated Time:** 1.5 hours

**File to Create:**
- `src/wj-client/lib/utils/gold-calculator.test.ts`

**Test Cases:**
1. Unit conversions
2. Price per unit conversions
3. Total cost calculations
4. Storage/denormalization
5. Edge cases

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Test coverage > 80%

---

### Task 5.3: Update Investment Type Helpers

**Priority:** P0
**Estimated Time:** 30 minutes

**File to Modify:**
- `src/wj-client/app/dashboard/portfolio/helpers.tsx`

**Changes:**
1. Add `GOLD_VND` and `GOLD_USD` to type filter options
2. Update `getInvestmentTypeLabel` function
3. Add `formatGoldQuantity` function
4. Add `formatGoldPrice` function

**Acceptance Criteria:**
- [ ] New investment types appear in filter
- [ ] Labels display correctly
- [ ] Quantity formatting works

---

## Phase 6: Frontend - Components (Day 4)

### Task 6.1: Update Add Investment Form

**Priority:** P0
**Estimated Time:** 4 hours

**File to Modify:**
- `src/wj-client/components/modals/forms/AddInvestmentForm.tsx`

**Changes:**
1. Import gold calculator utilities
2. Add gold type options
3. Add gold type selection dropdown
4. Add unit selector for VND gold
5. Update form submission logic for gold
6. Add cost summary display

**Acceptance Criteria:**
- [ ] Gold type selection works
- [ ] Unit selector appears for VND gold
- [ ] Form submits correct data
- [ ] Currency is locked correctly
- [ ] Error messages display properly

---

### Task 6.2: Update Portfolio Page

**Priority:** P1
**Estimated Time:** 1 hour

**File to Modify:**
- `src/wj-client/app/dashboard/portfolio/page.tsx`

**Changes:**
1. Add gold types to filter options
2. Update type filter dropdown
3. Ensure gold investments display correctly

**Acceptance Criteria:**
- [ ] Gold investments appear in list
- [ ] Filter by gold type works
- [ ] Display formatting is correct

---

### Task 6.3: Update Investment Detail Modal

**Priority:** P1
**Estimated Time:** 1 hour

**File to Modify:**
- `src/wj-client/components/modals/InvestmentDetailModal.tsx`

**Changes:**
1. Add gold-specific quantity display
2. Add gold-specific price display
3. Show unit information

**Acceptance Criteria:**
- [ ] Quantity shows with correct unit
- [ ] Price shows with correct unit
- [ ] Display is consistent with portfolio page

---

## Phase 7: Testing & Documentation (Day 5)

### Task 7.1: Integration Tests

**Priority:** P1
**Estimated Time:** 3 hours

**Files to Create:**
- `src/go-backend/domain/service/gold_integration_test.go`

**Test Cases:**
1. Create gold investment (VND)
2. Create gold investment (USD)
3. Update gold prices
4. Currency conversion for display
5. Cross-currency wallet operations

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Tests cover happy path
- [ ] Tests cover error cases

---

### Task 7.2: E2E Tests

**Priority:** P2
**Estimated Time:** 2 hours

**File to Create:**
- `tests/e2e/gold_investment_flow_test.ts`

**Test Cases:**
1. User creates VND gold investment
2. User creates USD gold investment
3. User views gold in portfolio
4. User updates gold prices
5. User filters by gold type

**Acceptance Criteria:**
- [ ] All E2E tests pass
- [ ] Tests work with test database

---

### Task 7.3: Update Documentation

**Priority:** P1
**Estimated Time:** 1 hour

**Files to Modify:**
- `CLAUDE.md`

**Changes:**
1. Add gold investment section
2. Document new investment types
3. Add gold examples
4. Update API documentation

**Acceptance Criteria:**
- [ ] Documentation is clear
- [ ] Examples are accurate
- [ ] No broken links

---

## Summary

### Total Estimated Time

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Protobuf & Code Generation | 1 hour |
| Phase 2 | Gold Conversion Package | 6 hours |
| Phase 3 | Market Data Integration | 6.5 hours |
| Phase 4 | API Handlers | 6.5 hours |
| Phase 5 | Frontend Utilities | 3.5 hours |
| Phase 6 | Frontend Components | 6 hours |
| Phase 7 | Testing & Documentation | 6 hours |
| **Total** | **23 tasks** | **35.5 hours** |

### Critical Path

```
Task 1.1 (Protobuf)
  → Task 1.2 (Generate Code)
    → Task 1.3 (Verify Generated)
      → Task 2.1 (Gold Types)
        → Task 2.2 (Gold Converter)
          → Task 4.3 (Update Investment Service)
            → Task 6.1 (Update Add Investment Form)
```

### Dependencies

- Phase 3 depends on Phase 2 (gold converter needed)
- Phase 4 depends on Phase 2 (service needs converter)
- Phase 5 depends on Phase 1 (generated types needed)
- Phase 6 depends on Phase 5 (utilities needed for components)

### Risk Mitigation

1. **vang.today API Reliability**: Implement manual price fallback
2. **FX Rate Accuracy**: Use existing proven FXRateService
3. **Unit Conversion Errors**: Comprehensive unit tests
4. **Performance**: Redis caching for all external API calls

---

**Plan Version:** 1.0
**Last Updated:** 2026-01-31
