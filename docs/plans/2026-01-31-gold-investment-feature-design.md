# Gold Investment Feature Design

**Date:** 2026-01-31
**Status:** Design Approved
**Author:** Design Session with User

## Overview

Add support for gold investments in the WealthJourney application, supporting both Vietnamese physical gold (priced in VND) and world gold spot price (priced in USD). The feature implements a dual conversion system handling both unit conversions (tael/gram/ounce) and currency conversions (VND/USD/user-preferred).

## Table of Contents

1. [Requirements](#requirements)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [API Design](#api-design)
5. [Dual Conversion System](#dual-conversion-system)
6. [Frontend Components](#frontend-components)
7. [Implementation Checklist](#implementation-checklist)

---

## Requirements

### Functional Requirements

1. **Vietnamese Gold (GOLD_VND)**
   - Support SJC gold types (1L-10L, 1L-2L, 5 chỉ, 1 chỉ, nhẫn, trang sức)
   - Pricing in VND per tael (market standard)
   - User can input quantity in taels or grams
   - Store quantity in grams internally

2. **World Gold (GOLD_USD)**
   - Support XAU/USD spot price
   - Pricing in USD per ounce
   - Store quantity in ounces internally

3. **Multi-Currency Support**
   - Vietnamese gold stored in VND, converted to user's preferred currency for display
   - World gold stored in USD, converted to user's preferred currency for display
   - Use existing `FXRateService` for currency conversions

4. **Market Data**
   - Fetch prices from vang.today API
   - Automatic price updates with 15-minute cache
   - Manual price override fallback

### Non-Functional Requirements

1. **Performance**: Price updates should complete within 5 seconds
2. **Reliability**: Graceful fallback to manual entry if API fails
3. **Accuracy**: Proper handling of decimal differences (VND=0, USD=2)
4. **Caching**: Redis cache for FX rates and gold prices

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    GOLD INVESTMENT FEATURE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Frontend (React/Next.js)                               │    │
│  │  • AddInvestmentForm - gold type selection              │    │
│  │  • gold-calculator.ts - dual conversion utilities       │    │
│  │  • Portfolio display with gold units                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API Layer (Go Handlers)                                │    │
│  │  • gold.go - GetGoldTypeCodes endpoint                  │    │
│  │  • investment.go - updated for gold types               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Service Layer (Go)                                     │    │
│  │  • GoldConverter - unit + currency conversion           │    │
│  │  • GoldPriceService - vang.today API client             │    │
│  │  • InvestmentService - enriched for gold                │    │
│  │  • FXRateService - existing currency conversion          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  External APIs                                          │    │
│  │  • vang.today - Vietnamese gold prices                  │    │
│  │  • Yahoo Finance - FX rates (existing)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Protobuf Changes

**File:** `api/protobuf/v1/investment.proto`

```protobuf
enum InvestmentType {
  INVESTMENT_TYPE_UNSPECIFIED = 0;
  INVESTMENT_TYPE_CRYPTOCURRENCY = 1;
  INVESTMENT_TYPE_STOCK = 2;
  INVESTMENT_TYPE_ETF = 3;
  INVESTMENT_TYPE_MUTUAL_FUND = 4;
  INVESTMENT_TYPE_BOND = 5;
  INVESTMENT_TYPE_COMMODITY = 6;
  INVESTMENT_TYPE_OTHER = 7;

  // NEW: Gold-specific types
  INVESTMENT_TYPE_GOLD_VND = 8;      // Vietnamese gold (SJC) - priced in VND
  INVESTMENT_TYPE_GOLD_USD = 9;      // World gold (XAU/USD) - priced in USD
}

// Gold type codes for frontend selection
message GoldTypeCode {
  string code = 1;           // e.g., "SJL1L10", "XAU"
  string name = 2;           // Display name
  string currency = 3;       // "VND" or "USD"
  string unit = 4;           // "tael", "gram", or "oz"
  double unitWeight = 5;     // Weight in grams
  int32 type = 6;            // InvestmentType enum value
}

// Request/Response for gold type codes
message GetGoldTypeCodesRequest {
  string currency = 1;  // Optional filter: "VND", "USD", or empty for all
}

message GetGoldTypeCodesResponse {
  bool success = 1;
  repeated GoldTypeCode data = 2;
  string timestamp = 3;
}

// Add to InvestmentService
service InvestmentService {
  // ... existing methods

  // Get available gold type codes for creating investments
  rpc GetGoldTypeCodes(GetGoldTypeCodesRequest) returns (GetGoldTypeCodesResponse) {
    option (google.api.http) = {
      get: "/api/v1/investments/gold-types"
    };
  }
}
```

### Database Schema

**No new tables required** - using existing `investment` table.

Storage format:
- **Vietnamese Gold**: Quantity stored in grams × 10000, Currency = VND
- **World Gold**: Quantity stored in ounces × 10000, Currency = USD

---

## API Design

### Endpoints

#### GET /api/v1/investments/gold-types

Returns available gold types for investment creation.

**Request:**
```
GET /api/v1/investments/gold-types?currency=VND
```

**Response:**
```json
{
  "success": true,
  "message": "Gold type codes retrieved successfully",
  "data": [
    {
      "code": "SJL1L10",
      "name": "SJC 1L-10L",
      "currency": "VND",
      "unit": "tael",
      "unitWeight": 37.5,
      "type": 8
    },
    {
      "code": "SJT99",
      "name": "SJC Trang sức 99.99",
      "currency": "VND",
      "unit": "gram",
      "unitWeight": 1.0,
      "type": 8
    }
  ],
  "timestamp": "2026-01-31T10:00:00Z"
}
```

#### vang.today API Integration

**Base URL:** `https://www.vang.today/api/prices`

**GET /api/prices**
- Returns all gold prices

**GET /api/prices?type={code}**
- Returns price for specific gold type

**Response Format:**
```json
{
  "success": true,
  "current_time": 1732456789,
  "data": [
    {
      "type_code": "SJL1L10",
      "buy": 85500000,
      "sell": 88000000,
      "change_buy": 100000,
      "change_sell": 100000,
      "update_time": 1732456789
    }
  ]
}
```

---

## Dual Conversion System

Gold investments require **TWO independent conversion layers**:

### Layer 1: Unit Conversion (Physical Units)

| From | To | Conversion Factor |
|------|-----|-------------------|
| Tael | Gram | × 37.5 |
| Gram | Tael | ÷ 37.5 |
| Ounce | Gram | × 31.1034768 |
| Gram | Ounce | ÷ 31.1034768 |

### Layer 2: Currency Conversion (FX Rates)

| From | To | handled by |
|------|-----|------------|
| VND | USD | FXRateService (Yahoo Finance) |
| USD | VND | FXRateService (Yahoo Finance) |
| Any | User Preferred | FXRateService |

### Example Calculation

**Scenario:** User with USD preference buying 2 taels of SJC gold

```
User Input: 2 taels @ 85,000,000 VND/tael

Layer 1: Unit Conversion
├─ 2 taels → 75 grams (2 × 37.5)
└─ 85,000,000 VND/tael → 2,266,667 VND/gram

Layer 2: Currency Conversion
├─ 75g × 2,266,667 VND/g = 170,000,000 VND total
└─ 170,000,000 VND → $6,590 USD (at 25,800 rate)

Storage:
├─ Quantity: 750,000 (75g × 10000)
├─ Currency: VND (native)
├─ TotalCost: 17,000,000,000 (170B VND dong)
└─ Display to user: $6,590 USD
```

---

## Frontend Components

### Gold Type Selection

**Component:** `AddInvestmentForm.tsx` (updated)

**Features:**
- Gold type dropdown with predefined SJC and world gold options
- Unit selector for VND gold (tael/gram)
- Auto-fill symbol and name based on selection
- Currency locked to VND or USD based on gold type

### Quantity and Price Inputs

**For VND Gold:**
- Quantity unit: tael or gram (user selectable)
- Price unit: per tael (market standard)
- Display: shows conversion to grams for storage

**For World Gold:**
- Quantity unit: ounces
- Price unit: per ounce
- Display: standard format

### Display Formatting

**Component:** `portfolio/helpers.tsx` (updated)

**Functions:**
```typescript
formatGoldQuantity(quantity, currency, type): string
// VND: "2.0000 lượng", "75.0000 gram"
// USD: "1.5000 oz"

formatGoldPrice(price, currency): string
// VND: "85,000,000 ₫/lượng"
// USD: "$2,700.00/oz"
```

---

## Implementation Checklist

### Phase 1: Protobuf & Backend Foundation

- [ ] Update `investment.proto` with new investment types
- [ ] Add `GetGoldTypeCodes` RPC method
- [ ] Generate Go and TypeScript code from protobuf
- [ ] Create `pkg/gold/converter.go` with dual conversion logic
- [ ] Create `pkg/gold/types.go` with gold type definitions

### Phase 2: Market Data Integration

- [ ] Create `domain/service/gold_price_service.go`
- [ ] Create `pkg/cache/gold_price_cache.go`
- [ ] Create `pkg/gold/client.go` (vang.today API client)
- [ ] Update `market_data_service.go` to handle gold prices
- [ ] Add gold price update logic to `investment_service.go`

### Phase 3: API Handlers

- [ ] Create `api/handlers/gold.go`
- [ ] Add `GetGoldTypeCodes` endpoint
- [ ] Update `routes.go` with new routes
- [ ] Update investment handlers for gold types

### Phase 4: Frontend Components

- [ ] Create `lib/utils/gold-calculator.ts`
- [ ] Update `AddInvestmentForm.tsx` with gold support
- [ ] Update `portfolio/helpers.tsx` with gold formatting
- [ ] Add gold type to investment type filter options
- [ ] Update investment type labels

### Phase 5: Testing & Documentation

- [ ] Unit tests for unit conversions
- [ ] Unit tests for currency conversions
- [ ] Integration tests for vang.today API
- [ ] E2E tests for gold investment creation
- [ ] Update CLAUDE.md with gold investment documentation

---

## Design Decisions

### 1. Why Two Investment Types?

**Decision:** Separate `GOLD_VND` and `GOLD_USD` types

**Rationale:**
- Vietnamese gold and world gold have fundamentally different pricing
- Unit conventions differ (tael vs ounce)
- Market data sources differ (vang.today vs Yahoo Finance)
- Clear separation simplifies conversion logic

### 2. Why Store in Grams for VND Gold?

**Decision:** Store Vietnamese gold quantity in grams, not taels

**Rationale:**
- Grams are the base SI unit
- Smaller gold items (nhẫn, trang sức) are priced in grams
- Avoids precision loss with fractional taels
- Consistent with international standards

### 3. Why Use Existing FXRateService?

**Decision:** Leverage existing currency conversion infrastructure

**Rationale:**
- Already handles decimal differences (VND=0, USD=2)
- Has caching (Redis + database)
- Proven reliability with Yahoo Finance
- Consistent FX rates across the application

### 4. Why Dual Conversion Layers?

**Decision:** Separate unit conversion from currency conversion

**Rationale:**
- Separation of concerns
- Easier to test and maintain
- Unit conversions are fixed (1 tael = 37.5g)
- Currency conversions are variable (FX rates)
- Allows independent optimization of each layer

---

## Future Enhancements

1. **More Gold Types:** Support for additional Vietnamese gold types as they become available
2. **Historical Prices:** Track gold price history for performance charts
3. **Price Alerts:** Notify users when gold prices reach target levels
4. **Gold ETFs:** Support for gold ETFs alongside physical gold
5. **Multiple Sources:** Add fallback price sources for reliability

---

**Document Version:** 1.0
**Last Updated:** 2026-01-31
