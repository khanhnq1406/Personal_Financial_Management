# Silver Investment Feature Design

**Date:** 2026-02-03
**Status:** Design Complete - Ready for Implementation
**Author:** Claude Code + User

## Overview

This document outlines the design for implementing silver investment tracking in WealthJourney, following the proven gold investment pattern. The feature will support both Vietnamese silver (VND, priced per lượng/kg) and world silver (USD, priced per troy ounce) with automatic unit and currency conversions.

## Goals

1. Enable users to track silver investments alongside stocks, crypto, and gold
2. Support Vietnamese silver (VND) with lượng and kg units
3. Support world silver (USD/XAG) with troy ounce units
4. Maintain display in user's purchase unit (remembering their input preference)
5. Integrate with existing multi-currency support and FIFO cost basis tracking
6. Fetch prices automatically from ancarat API (VND) and Yahoo Finance (USD)

## Architecture Overview

The silver feature mirrors the gold implementation with three key layers:

### Layer 1: Unit Conversion System
- **Vietnamese Silver (VND)**: Users input in lượng or kg, stored in grams × 10000
- **World Silver (USD)**: Users input in troy ounces, stored in ounces × 10000
- Conversion constants:
  - 1 lượng (tael) = 37.5 grams
  - 1 kg = 1000 grams
  - 1 troy ounce = 31.1034768 grams

### Layer 2: Currency Conversion System
- Investment native currency (VND or USD)
- Wallet currency (for balance deduction/addition)
- User preferred currency (for display)
- Uses existing FX rate service with caching

### Layer 3: Display Preference System
- Store user's purchase unit in database (`purchase_unit` column)
- Display quantity in the unit user originally purchased in
- Examples:
  - Bought 2 lượng → Display "2.0000 lượng"
  - Bought 0.5 kg → Display "0.5000 kg"
  - Bought 10 oz → Display "10.0000 oz"

### User Preferred Currency Display

The system displays silver investments with **dual currency support** when user's preferred currency differs from the investment's native currency:

**Display Pattern (Following Gold/Stock/Crypto Pattern):**

```
Primary Display:   ₫6,436,000 (native currency - bold)
Secondary Display: ≈ $257.44 (user preference - gray, smaller)
```

**Key Rules:**
1. **Always show native currency first** (investment's original currency)
2. **Show converted amount below** if user's preferred currency differs
3. **Never change stored values** - conversions are display-only
4. **Quantity unit unchanged** - still shows in original purchase unit

**Example Scenario - VND Silver with USD Preference:**

**Investment Data (stored in database):**
- Type: SILVER_VND
- Symbol: AG_VND
- Quantity: 750000 (75g × 10000)
- Purchase Unit: "tael"
- Total Cost: 6436000 (VND - native currency)
- Currency: "VND"

**User Settings:**
- Preferred Currency: "USD"

**Display in Portfolio:**

| Symbol | Quantity | Current Value | PNL |
|--------|----------|---------------|-----|
| AG_VND | 2.0000 lượng | **₫6,436,000**<br>≈ $257.44 | **₫100,000**<br>≈ $4.00 |

**Frontend Implementation:**

```typescript
// Portfolio table cell rendering
<div>
  {/* Primary: Native currency (bold) */}
  <span className="font-medium">
    {formatCurrency(investment.currentValue, investment.currency)}
  </span>

  {/* Secondary: Converted to user preference (if different) */}
  {investment.displayCurrentValue && investment.displayCurrency && (
    <span className="text-xs text-gray-500 block">
      ≈ {formatCurrency(
        investment.displayCurrentValue.amount,
        investment.displayCurrency
      )}
    </span>
  )}
</div>
```

**Backend Enrichment (domain/service/investment_service.go):**

```go
// enrichInvestmentProto adds display conversion fields
func (s *investmentService) enrichInvestmentProto(ctx context.Context, userID int32, invProto *investmentv1.Investment, invModel *models.Investment) {
    user, _ := s.userRepo.GetByID(ctx, userID)

    // If same currency, no conversion needed
    if invModel.Currency == user.PreferredCurrency {
        return
    }

    // Convert values for display (NEVER changes stored data)
    convertedTotalCost, _ := s.fxRateSvc.ConvertAmount(
        ctx,
        invModel.TotalCost,
        invModel.Currency,       // VND (native)
        user.PreferredCurrency   // USD (user preference)
    )

    // Populate display fields
    invProto.DisplayTotalCost = &investmentv1.Money{
        Amount:   convertedTotalCost,
        Currency: user.PreferredCurrency,
    }
    invProto.DisplayCurrency = user.PreferredCurrency
}
```

**Key Benefits:**
- **Data integrity**: Native currency never changes in database
- **Transparency**: Users always see original currency first
- **Flexibility**: Converted values update automatically when preference changes
- **Consistency**: Same pattern as gold, stocks, crypto
- **No confusion**: "≈" symbol indicates approximate conversion

**Currency Cache Integration:**
- Total cost conversions cached (15-minute TTL) via `CurrencyCache`
- Current value, PNL converted on-the-fly (market prices change frequently)
- Cache key format: `currency:{userID}:investment:{investmentID}:{targetCurrency}`

**Important Notes:**
- Silver will work exactly like gold investments for currency display
- VND silver stays in VND storage, USD silver stays in USD storage
- Only the display layer adds converted values (if user preference differs)
- Quantity display unit (lượng/kg/oz) is independent of currency conversion

## Data Model

### Protobuf Updates (`api/protobuf/v1/investment.proto`)

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
  INVESTMENT_TYPE_GOLD_VND = 8;
  INVESTMENT_TYPE_GOLD_USD = 9;
  INVESTMENT_TYPE_SILVER_VND = 10;  // NEW: Vietnamese silver
  INVESTMENT_TYPE_SILVER_USD = 11;  // NEW: World silver
}

message Investment {
  // ... existing fields (id, walletId, symbol, name, type, etc.)
  string purchaseUnit = 24 [json_name = "purchaseUnit"];  // NEW: "tael", "kg", "oz"
}

message CreateInvestmentRequest {
  // ... existing fields
  string purchaseUnit = 13 [json_name = "purchaseUnit"];  // NEW: User's input unit
}
```

### Database Schema

**Add column to `investment` table:**

```sql
ALTER TABLE investment
ADD COLUMN purchase_unit VARCHAR(10) DEFAULT 'gram';
```

**Backfill existing records:**
```sql
-- Gold VND: default to tael display
UPDATE investment SET purchase_unit = 'tael' WHERE type = 8;

-- Gold USD: default to oz display
UPDATE investment SET purchase_unit = 'oz' WHERE type = 9;
```

### Silver Type Registry

Two silver types supported:

| Type Code | Name | Currency | Storage Unit | Market Price Unit | Investment Type |
|-----------|------|----------|--------------|-------------------|-----------------|
| AG_VND | Bạc Việt Nam 999 | VND | gram | tael | 10 (SILVER_VND) |
| XAG | Silver World (XAG/USD) | USD | ounce | ounce | 11 (SILVER_USD) |

## Backend Implementation

### Package Structure (`pkg/silver/`)

Mirror the gold package structure:

#### 1. `types.go` - Type Registry and Constants

```go
package silver

import investmentv1 "wealthjourney/protobuf/v1"

const (
    GramsPerTael  = 37.5
    GramsPerOunce = 31.1034768
    GramsPerKg    = 1000.0
)

type SilverUnit string

const (
    UnitGram  SilverUnit = "gram"
    UnitTael  SilverUnit = "tael"  // lượng
    UnitKg    SilverUnit = "kg"
    UnitOunce SilverUnit = "oz"
)

type SilverType struct {
    Code       string                      // "AG_VND", "XAG"
    Name       string                      // Display name
    Currency   string                      // "VND" or "USD"
    Type       investmentv1.InvestmentType // Enum value
}

var SilverTypes = []SilverType{
    {
        Code:     "AG_VND",
        Name:     "Bạc Việt Nam 999",
        Currency: "VND",
        Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
    },
    {
        Code:     "XAG",
        Name:     "Silver World (XAG/USD)",
        Currency: "USD",
        Type:     investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD,
    },
}

// GetNativeStorageInfo returns storage unit and native currency
func GetNativeStorageInfo(investmentType investmentv1.InvestmentType) (SilverUnit, string) {
    switch investmentType {
    case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND:
        return UnitGram, "VND" // Store VND silver in grams
    case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD:
        return UnitOunce, "USD" // Store USD silver in ounces
    default:
        return UnitGram, "USD"
    }
}

// GetPriceUnitForMarketData returns what unit market prices are in
func GetPriceUnitForMarketData(investmentType investmentv1.InvestmentType) SilverUnit {
    switch investmentType {
    case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND:
        return UnitTael // ancarat API price is per tael
    case investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD:
        return UnitOunce // Yahoo Finance XAG is per ounce
    default:
        return UnitOunce
    }
}

func IsSilverType(t investmentv1.InvestmentType) bool {
    return t == investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND ||
        t == investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD
}

func GetSilverTypeByCode(code string) *SilverType {
    for _, st := range SilverTypes {
        if st.Code == code {
            return &st
        }
    }
    return nil
}

func GetSilverTypesByCurrency(currency string) []SilverType {
    var result []SilverType
    for _, st := range SilverTypes {
        if st.Currency == currency {
            result = append(result, st)
        }
    }
    return result
}
```

#### 2. `converter.go` - Unit and Currency Conversion Logic

```go
package silver

import (
    "context"
    "fmt"
    "math"

    "wealthjourney/pkg/fx"
    investmentv1 "wealthjourney/protobuf/v1"
)

// Converter handles BOTH unit and currency conversions for silver
type Converter struct {
    fxService fx.Service
}

func NewSilverConverter(fxService fx.Service) *Converter {
    return &Converter{fxService: fxService}
}

// ===== LAYER 1: UNIT CONVERSION =====

// ConvertQuantity converts quantity between units (no currency involved)
func ConvertQuantity(quantity float64, fromUnit, toUnit SilverUnit) float64 {
    // Convert everything to grams first, then to target
    var inGrams float64

    switch fromUnit {
    case UnitTael:
        inGrams = quantity * GramsPerTael
    case UnitKg:
        inGrams = quantity * GramsPerKg
    case UnitOunce:
        inGrams = quantity * GramsPerOunce
    case UnitGram:
        inGrams = quantity
    }

    switch toUnit {
    case UnitTael:
        return inGrams / GramsPerTael
    case UnitKg:
        return inGrams / GramsPerKg
    case UnitOunce:
        return inGrams / GramsPerOunce
    case UnitGram:
        return inGrams
    }

    return inGrams
}

// ConvertPricePerUnit converts price between units (no currency involved)
// Price is inversely proportional to quantity
func ConvertPricePerUnit(price float64, fromUnit, toUnit SilverUnit) float64 {
    var quantityRatio float64

    switch fromUnit {
    case UnitTael:
        quantityRatio = GramsPerTael
    case UnitKg:
        quantityRatio = GramsPerKg
    case UnitOunce:
        quantityRatio = GramsPerOunce
    case UnitGram:
        quantityRatio = 1
    }

    pricePerGram := price / quantityRatio

    switch toUnit {
    case UnitTael:
        return pricePerGram * GramsPerTael
    case UnitKg:
        return pricePerGram * GramsPerKg
    case UnitOunce:
        return pricePerGram * GramsPerOunce
    case UnitGram:
        return pricePerGram
    }

    return pricePerGram
}

// ===== STORAGE NORMALIZATION =====

// NormalizeQuantityForStorage converts user input to storage format
// Storage format: base_unit × 10000 (4 decimal precision)
func (c *Converter) NormalizeQuantityForStorage(
    quantity float64,
    inputUnit SilverUnit,
    investmentType investmentv1.InvestmentType,
) (int64, error) {
    storageUnit, _ := GetNativeStorageInfo(investmentType)

    // Convert input unit to storage unit
    inStorageUnits := ConvertQuantity(quantity, inputUnit, storageUnit)

    // Store with 4 decimal precision
    return int64(math.Round(inStorageUnits * 10000)), nil
}

// DenormalizeQuantityForDisplay converts stored quantity to display unit
func (c *Converter) DenormalizeQuantityForDisplay(
    storedQuantity int64,
    investmentType investmentv1.InvestmentType,
    displayUnit SilverUnit,
) float64 {
    storageUnit, _ := GetNativeStorageInfo(investmentType)
    inStorageUnits := float64(storedQuantity) / 10000

    return ConvertQuantity(inStorageUnits, storageUnit, displayUnit)
}

// ===== COST CALCULATIONS (Unit + Currency) =====

// CalculateTotalCostFromUserInput calculates total cost from user-entered data
// Handles BOTH unit conversion AND currency conversion
func (c *Converter) CalculateTotalCostFromUserInput(
    ctx context.Context,
    userQuantity float64,
    userQuantityUnit SilverUnit,
    userPricePerUnit float64,
    userPriceCurrency string,
    userPriceUnit SilverUnit,
    investmentType investmentv1.InvestmentType,
    walletCurrency string,
) (totalCostNative int64, totalCostWallet int64, averageCostNative int64, err error) {
    storageUnit, nativeCurrency := GetNativeStorageInfo(investmentType)

    // LAYER 1: Convert quantity to storage unit
    quantityInStorageUnit := ConvertQuantity(userQuantity, userQuantityUnit, storageUnit)

    // LAYER 1: Convert price to storage unit price
    priceInStorageUnitCurrency := ConvertPricePerUnit(userPricePerUnit, userPriceUnit, storageUnit)

    // Calculate total cost in price's currency
    totalCostInPriceCurrency := priceInStorageUnitCurrency * quantityInStorageUnit
    averageCostInPriceCurrency := priceInStorageUnitCurrency

    // LAYER 2: Convert to native currency if needed
    totalCostInNativeCurrency := totalCostInPriceCurrency
    averageCostInNativeCurrency := averageCostInPriceCurrency

    if userPriceCurrency != nativeCurrency {
        rate, err := c.fxService.GetRate(ctx, userPriceCurrency, nativeCurrency)
        if err != nil {
            return 0, 0, 0, fmt.Errorf("get FX rate %s->%s: %w", userPriceCurrency, nativeCurrency, err)
        }

        multiplierFrom := fx.GetDecimalMultiplier(userPriceCurrency)
        multiplierTo := fx.GetDecimalMultiplier(nativeCurrency)

        totalCostInSmallestFrom := int64(math.Round(totalCostInPriceCurrency * float64(multiplierFrom)))
        totalCostInSmallestTo, _ := c.fxService.ConvertAmountWithRate(
            ctx,
            totalCostInSmallestFrom,
            rate,
            userPriceCurrency,
            nativeCurrency,
        )

        totalCostInNativeCurrency = float64(totalCostInSmallestTo) / float64(multiplierTo)

        avgCostInSmallestFrom := int64(math.Round(priceInStorageUnitCurrency * float64(multiplierFrom)))
        avgCostInSmallestTo, _ := c.fxService.ConvertAmountWithRate(
            ctx,
            avgCostInSmallestFrom,
            rate,
            userPriceCurrency,
            nativeCurrency,
        )
        averageCostInNativeCurrency = float64(avgCostInSmallestTo) / float64(multiplierTo)
    }

    // Convert to smallest currency units for storage
    multiplierNative := fx.GetDecimalMultiplier(nativeCurrency)
    totalCostNative = int64(math.Round(totalCostInNativeCurrency * float64(multiplierNative)))
    averageCostNative = int64(math.Round(averageCostInNativeCurrency * float64(multiplierNative)))

    // LAYER 2: Convert to wallet currency for balance operations
    totalCostWallet = totalCostNative
    if nativeCurrency != walletCurrency {
        converted, err := c.fxService.ConvertAmount(
            ctx,
            totalCostNative,
            nativeCurrency,
            walletCurrency,
        )
        if err != nil {
            return 0, 0, 0, fmt.Errorf("convert to wallet currency: %w", err)
        }
        totalCostWallet = converted
    }

    return totalCostNative, totalCostWallet, averageCostNative, nil
}

// ProcessMarketPrice processes market price from API
// Market prices: VND silver = per tael, USD silver = per ounce
// Storage needs: VND silver = per gram, USD silver = per ounce
func (c *Converter) ProcessMarketPrice(
    marketPrice int64,
    marketCurrency string,
    investmentType investmentv1.InvestmentType,
) int64 {
    priceUnit := GetPriceUnitForMarketData(investmentType)
    storageUnit, _ := GetNativeStorageInfo(investmentType)

    // If market price unit equals storage unit, no conversion needed
    if priceUnit == storageUnit {
        return marketPrice
    }

    // Need unit conversion (VND: per tael → per gram)
    priceInBaseUnits := float64(marketPrice) / float64(fx.GetDecimalMultiplier(marketCurrency))
    pricePerStorageUnit := ConvertPricePerUnit(priceInBaseUnits, priceUnit, storageUnit)

    return int64(math.Round(pricePerStorageUnit * float64(fx.GetDecimalMultiplier(marketCurrency))))
}

// CalculateDisplayQuantity formats quantity for display with unit
func (c *Converter) CalculateDisplayQuantity(
    storedQuantity int64,
    investmentType investmentv1.InvestmentType,
    purchaseUnit SilverUnit,
) (value float64, unit SilverUnit) {
    // Display in user's purchase unit
    value = c.DenormalizeQuantityForDisplay(storedQuantity, investmentType, purchaseUnit)
    return value, purchaseUnit
}
```

#### 3. `client.go` - Ancarat API Integration

```go
package silver

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strconv"
    "strings"
    "time"
)

const (
    DefaultTimeout = 10 * time.Second
    BaseURL = "https://giabac.ancarat.com/api/price-data"
)

type Client struct {
    httpClient *http.Client
    baseURL    string
}

func NewClient(timeout time.Duration) *Client {
    if timeout <= 0 {
        timeout = DefaultTimeout
    }

    return &Client{
        httpClient: &http.Client{
            Timeout: timeout,
        },
        baseURL: BaseURL,
    }
}

// SilverPrice represents a single silver type price
type SilverPrice struct {
    TypeCode   string  // "A4" (1 lượng), "K4" (1 Kilo)
    Name       string  // "Ngân Long Quảng Tiến 999 - 1 lượng"
    Buy        float64 // Buy price in VND
    Sell       float64 // Sell price in VND
    Currency   string  // "VND"
}

// FetchPrices fetches all silver prices from ancarat API
func (c *Client) FetchPrices(ctx context.Context) (map[string]SilverPrice, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("fetch prices: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(body))
    }

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("read response: %w", err)
    }

    // Parse JSON array response
    var result [][]string
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("parse response: %w", err)
    }

    // Extract silver prices (filter for A4 and K4)
    prices := make(map[string]SilverPrice)

    for _, row := range result {
        if len(row) < 4 {
            continue
        }

        name := row[0]
        buyStr := row[1]
        sellStr := row[2]
        typeCode := row[3]

        // Filter for supported types
        if typeCode != "A4" && typeCode != "K4" {
            continue
        }

        // Parse prices (remove commas)
        buyStr = strings.ReplaceAll(buyStr, ",", "")
        sellStr = strings.ReplaceAll(sellStr, ",", "")

        buy, _ := strconv.ParseFloat(buyStr, 64)
        sell, _ := strconv.ParseFloat(sellStr, 64)

        prices[typeCode] = SilverPrice{
            TypeCode: typeCode,
            Name:     name,
            Buy:      buy,
            Sell:     sell,
            Currency: "VND",
        }
    }

    return prices, nil
}

// FetchPriceByType fetches price for specific silver type
func (c *Client) FetchPriceByType(ctx context.Context, typeCode string) (*SilverPrice, error) {
    prices, err := c.FetchPrices(ctx)
    if err != nil {
        return nil, err
    }

    price, ok := prices[typeCode]
    if !ok {
        return nil, fmt.Errorf("no data found for type: %s", typeCode)
    }

    return &price, nil
}
```

### Service Layer Integration

#### Update `InvestmentService` (`domain/service/investment_service.go`)

Add silver converter to service:

```go
type investmentService struct {
    // ... existing fields
    goldConverter   *gold.Converter
    silverConverter *silver.Converter  // NEW
}

func NewInvestmentService(...) InvestmentService {
    return &investmentService{
        // ... existing fields
        goldConverter:   gold.NewGoldConverter(fxRateSvc),
        silverConverter: silver.NewSilverConverter(fxRateSvc),  // NEW
    }
}

// Add helper methods
func (s *investmentService) isSilverInvestment(invType investmentv1.InvestmentType) bool {
    return silver.IsSilverType(invType)
}

func (s *investmentService) getSilverStorageInfo(invType investmentv1.InvestmentType) (silver.SilverUnit, string) {
    return silver.GetNativeStorageInfo(invType)
}
```

#### How Silver Integrates with Existing CreateInvestment Flow

Silver investments work **exactly like gold** - they leverage the existing generic `CreateInvestment` flow without requiring special handling in the service layer.

**Key Design Principle:** The `pkg/units` package is investment-type agnostic. It uses a `GetPrecisionForInvestmentType()` function that returns `Precision4Decimals (10000)` for all non-crypto investments, including gold and silver.

**CreateInvestment Flow (Already Supports Silver):**

```go
// domain/service/investment_service.go - CreateInvestment()

// Step 1: Convert decimal inputs using units package (works for ALL types)
if req.InitialQuantityDecimal > 0 {
    initialQuantity = units.QuantityToStorage(req.InitialQuantityDecimal, req.Type)
    // For SILVER_VND: 75.0 grams → 750000 (75 × 10000)
    // For SILVER_USD: 10.0 oz → 100000 (10 × 10000)
}

if req.InitialCostDecimal > 0 {
    initialCost = yahoo.ToSmallestCurrencyUnitByCurrency(req.InitialCostDecimal, req.Currency)
    // VND: 6436000 → 6436000 (no decimal places)
    // USD: 245.00 → 24500 (cents)
}

// Step 2: Currency conversion (if investment currency ≠ wallet currency)
initialCostInWalletCurrency := initialCost
if req.Currency != wallet.Currency {
    converted, err := s.fxRateSvc.ConvertAmount(ctx, initialCost, req.Currency, wallet.Currency)
    // Works for silver just like stocks/gold/crypto
    initialCostInWalletCurrency = converted
}

// Step 3: Calculate average cost (works for ALL types)
averageCost := units.CalculateAverageCost(initialCost, initialQuantity, req.Type)
// For SILVER_VND: (6436000 × 10000) / 750000 = 85813 VND per gram
// For SILVER_USD: (24500 × 10000) / 100000 = 2450 cents per oz

// Step 4: Create investment (generic, works for all types)
investment := &models.Investment{
    WalletID:     req.WalletId,
    Symbol:       req.Symbol,        // "AG_VND" or "XAG"
    Name:         req.Name,
    Type:         int32(req.Type),   // 10 or 11
    Quantity:     initialQuantity,   // 750000 or 100000
    AverageCost:  averageCost,       // 85813 or 2450
    TotalCost:    initialCost,       // 6436000 or 24500
    Currency:     req.Currency,      // "VND" or "USD"
    PurchaseUnit: req.PurchaseUnit,  // "tael", "kg", or "oz" (NEW field)
}

// Step 5: Create FIFO lot (generic, works for all types)
lot := &models.InvestmentLot{
    InvestmentID:      investment.ID,
    Quantity:          initialQuantity,
    RemainingQuantity: initialQuantity,
    AverageCost:       averageCost,
    TotalCost:         initialCost,
    PurchasedAt:       time.Now(),
}

// Step 6: Deduct from wallet balance (using wallet currency)
s.walletRepo.UpdateBalance(ctx, req.WalletId, -initialCostInWalletCurrency)

// No silver-specific logic needed!
```

**Why This Works:**

1. **Generic precision**: `units.GetPrecisionForInvestmentType()` returns 10000 for silver (4 decimals)
2. **Generic calculations**: `CalculateAverageCost()`, `CalculateTransactionCost()` work for all types
3. **Generic storage**: Quantity stored as `base_unit × 10000` (grams×10000 or oz×10000)
4. **Currency agnostic**: FX conversions handled generically by `fxRateSvc`
5. **Display separation**: `purchase_unit` stored for display, doesn't affect calculations

**Only Silver-Specific Parts:**

1. **Frontend**: User selects silver type (AG_VND/XAG) and unit (lượng/kg/oz)
2. **Frontend**: `calculateSilverFromUserInput()` converts to storage format
3. **Frontend**: Display helpers format with correct unit labels
4. **Backend**: Market price fetching from ancarat/Yahoo (in `MarketDataService`)

**The Big Win:** By following the gold pattern, silver requires ZERO changes to:
- ✅ Investment creation logic
- ✅ Transaction processing (buy/sell)
- ✅ FIFO lot tracking
- ✅ PNL calculations
- ✅ Balance deductions
- ✅ Multi-currency conversions
- ✅ Display enrichment

#### Update `MarketDataService` (`domain/service/market_data_service.go`)

Add silver price fetching:

```go
type marketDataService struct {
    // ... existing fields
    silverClient *silver.Client  // NEW
    silverPriceCache *cache.SilverPriceCache  // NEW
}

func (s *marketDataService) UpdateMarketPrice(ctx context.Context, symbol string, investmentType investmentv1.InvestmentType) error {
    // Check if silver type
    if silver.IsSilverType(investmentType) {
        return s.updateSilverPrice(ctx, symbol, investmentType)
    }

    // Check if gold type
    if gold.IsGoldType(investmentType) {
        return s.updateGoldPrice(ctx, symbol, investmentType)
    }

    // Existing logic for stocks/crypto
    return s.updateYahooPrice(ctx, symbol, investmentType)
}

func (s *marketDataService) updateSilverPrice(ctx context.Context, symbol string, investmentType investmentv1.InvestmentType) error {
    if investmentType == investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND {
        // Fetch from ancarat API (use A4 as reference price for 1 lượng)
        price, err := s.silverClient.FetchPriceByType(ctx, "A4")
        if err != nil {
            // Try to use cached stale data
            if cached, cacheErr := s.silverPriceCache.GetPrice(ctx, "AG_VND", "VND"); cacheErr == nil {
                return nil  // Use stale cache
            }
            return fmt.Errorf("fetch silver VND price: %w", err)
        }

        // Convert from per-tael to per-gram for storage
        converter := silver.NewSilverConverter(s.fxService)
        pricePerGram := converter.ProcessMarketPrice(
            int64(price.Buy),
            "VND",
            investmentType,
        )

        // Cache the price
        s.silverPriceCache.SetPrice(ctx, "AG_VND", pricePerGram, "VND")

        return nil
    } else {
        // Fetch from Yahoo Finance (SI=F for silver futures or XAG=F)
        yahooPrice, err := s.yahooClient.GetQuote(ctx, "SI=F")
        if err != nil {
            return fmt.Errorf("fetch silver USD price: %w", err)
        }

        // Store as cents per oz
        priceInCents := int64(yahooPrice.RegularMarketPrice * 100)
        s.silverPriceCache.SetPrice(ctx, "XAG", priceInCents, "USD")

        return nil
    }
}
```

### Caching Layer

#### Silver Price Cache (`pkg/cache/silver_price_cache.go`)

```go
package cache

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

const (
    silverPriceCacheTTL = 15 * time.Minute
    silverPriceCacheKeyPrefix = "silver:price:"
)

type SilverPriceCache struct {
    client *redis.Client
}

func NewSilverPriceCache(client *redis.Client) *SilverPriceCache {
    return &SilverPriceCache{client: client}
}

func (c *SilverPriceCache) SetPrice(ctx context.Context, typeCode string, price int64, currency string) error {
    key := fmt.Sprintf("%s%s:%s", silverPriceCacheKeyPrefix, typeCode, currency)

    data := map[string]interface{}{
        "price":    price,
        "currency": currency,
        "updated":  time.Now().Unix(),
    }

    jsonData, _ := json.Marshal(data)
    return c.client.Set(ctx, key, jsonData, silverPriceCacheTTL).Err()
}

func (c *SilverPriceCache) GetPrice(ctx context.Context, typeCode string, currency string) (int64, error) {
    key := fmt.Sprintf("%s%s:%s", silverPriceCacheKeyPrefix, typeCode, currency)

    val, err := c.client.Get(ctx, key).Result()
    if err != nil {
        return 0, err
    }

    var data map[string]interface{}
    if err := json.Unmarshal([]byte(val), &data); err != nil {
        return 0, err
    }

    return int64(data["price"].(float64)), nil
}

func (c *SilverPriceCache) Invalidate(ctx context.Context, typeCode string, currency string) error {
    key := fmt.Sprintf("%s%s:%s", silverPriceCacheKeyPrefix, typeCode, currency)
    return c.client.Del(ctx, key).Err()
}
```

### API Endpoints

#### New Handler (`api/handlers/silver.go`)

```go
package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "wealthjourney/pkg/silver"
)

// ListSilverTypes returns available silver types, optionally filtered by currency
func (h *Handler) ListSilverTypes(c *gin.Context) {
    currency := c.Query("currency")

    var silverTypes []silver.SilverType
    if currency != "" {
        silverTypes = silver.GetSilverTypesByCurrency(currency)
    } else {
        silverTypes = silver.SilverTypes
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    silverTypes,
    })
}
```

#### Update Routes (`api/handlers/routes.go`)

```go
// Investment routes
investmentGroup := v1.Group("/investments")
{
    // ... existing routes
    investmentGroup.GET("/gold-types", handler.ListGoldTypes)
    investmentGroup.GET("/silver-types", handler.ListSilverTypes)  // NEW
}
```

## Frontend Implementation

### Type Registry (`lib/utils/silver-calculator.ts`)

```typescript
/**
 * Silver Calculator - Dual Conversion System for Silver Investments
 *
 * Handles BOTH unit conversions (tael/kg/gram/oz) AND currency conversions (VND/USD)
 * for silver investment tracking.
 *
 * LAYER 1: Unit Conversion
 *   - Tael/lượng (37.5g) ↔ Kg (1000g) ↔ Gram (1g) ↔ Ounce (31.1034768g)
 *
 * LAYER 2: Currency Conversion (via FX rates)
 *   - VND ↔ USD (using existing FX rate service)
 */

import { InvestmentType } from "@/gen/protobuf/v1/investment";

export type SilverUnit = 'tael' | 'kg' | 'gram' | 'oz';

// Constants for unit conversions
const GRAMS_PER_TAEL = 37.5;
const GRAMS_PER_OUNCE = 31.1034768;
const GRAMS_PER_KG = 1000.0;

/**
 * Silver type options for frontend dropdown
 */
export interface SilverTypeOption {
  value: string;      // "AG_VND", "XAG"
  label: string;      // Display name
  currency: string;   // "VND" or "USD"
  type: number;       // InvestmentType enum value (10, 11)
  availableUnits: SilverUnit[];  // Units user can input
}

// Vietnamese silver type options
export const SILVER_VND_OPTIONS: SilverTypeOption[] = [
  {
    value: "AG_VND",
    label: "Bạc Việt Nam (VND)",
    currency: "VND",
    type: 10,
    availableUnits: ['tael', 'kg']  // User can input in lượng or kg
  },
];

// World silver type options
export const SILVER_USD_OPTIONS: SilverTypeOption[] = [
  {
    value: "XAG",
    label: "Bạc Thế Giới (XAG/USD)",
    currency: "USD",
    type: 11,
    availableUnits: ['oz']  // Only troy ounces for USD
  },
];

/**
 * LAYER 1: Unit Conversion Functions
 */

/**
 * Convert silver quantity between units
 */
export function convertSilverQuantity(
  quantity: number,
  from: SilverUnit,
  to: SilverUnit
): number {
  // Convert to grams first (common base unit)
  let inGrams: number;

  switch (from) {
    case 'tael':
      inGrams = quantity * GRAMS_PER_TAEL;
      break;
    case 'kg':
      inGrams = quantity * GRAMS_PER_KG;
      break;
    case 'oz':
      inGrams = quantity * GRAMS_PER_OUNCE;
      break;
    case 'gram':
    default:
      inGrams = quantity;
      break;
  }

  // Convert from grams to target unit
  switch (to) {
    case 'tael':
      return inGrams / GRAMS_PER_TAEL;
    case 'kg':
      return inGrams / GRAMS_PER_KG;
    case 'oz':
      return inGrams / GRAMS_PER_OUNCE;
    case 'gram':
    default:
      return inGrams;
  }
}

/**
 * Convert price per unit between silver units
 * Price is inversely proportional to quantity
 */
export function convertSilverPricePerUnit(
  price: number,
  from: SilverUnit,
  to: SilverUnit
): number {
  let quantityRatio: number;

  switch (from) {
    case 'tael':
      quantityRatio = GRAMS_PER_TAEL;
      break;
    case 'kg':
      quantityRatio = GRAMS_PER_KG;
      break;
    case 'oz':
      quantityRatio = GRAMS_PER_OUNCE;
      break;
    case 'gram':
    default:
      quantityRatio = 1;
      break;
  }

  const pricePerGram = price / quantityRatio;

  switch (to) {
    case 'tael':
      return pricePerGram * GRAMS_PER_TAEL;
    case 'kg':
      return pricePerGram * GRAMS_PER_KG;
    case 'oz':
      return pricePerGram * GRAMS_PER_OUNCE;
    case 'gram':
    default:
      return pricePerGram;
  }
}

/**
 * LAYER 2: Calculate Total from User Input
 */

interface CalculateSilverParams {
  quantity: number;
  quantityUnit: SilverUnit;
  pricePerUnit: number;
  priceCurrency: string;
  priceUnit: SilverUnit;
  investmentType: number;
  walletCurrency: string;
  fxRate?: number;
}

interface CalculateSilverResult {
  storedQuantity: number;       // Quantity in storage format (base unit × 10000)
  totalCostNative: number;       // Total cost in investment's native currency
  totalCostWallet: number;       // Total cost in wallet currency
  averageCostNative: number;     // Average cost per base unit in native currency
  purchaseUnit: SilverUnit;      // Remember user's input unit
}

export function calculateSilverFromUserInput(params: CalculateSilverParams): CalculateSilverResult {
  // Determine storage unit based on investment type
  const storageUnit: SilverUnit = params.investmentType === 10 ? 'gram' : 'oz';
  const nativeCurrency = params.investmentType === 10 ? 'VND' : 'USD';

  // LAYER 1: Unit conversion
  // Convert quantity to storage unit
  const quantityInStorage = convertSilverQuantity(
    params.quantity,
    params.quantityUnit,
    storageUnit
  );

  // Convert price to per-storage-unit
  const priceInStorage = convertSilverPricePerUnit(
    params.pricePerUnit,
    params.priceUnit,
    storageUnit
  );

  // Calculate total cost
  const totalCostInPriceCurrency = quantityInStorage * priceInStorage;

  // LAYER 2: Currency conversion (if needed)
  let totalCostInNativeCurrency = totalCostInPriceCurrency;
  if (params.priceCurrency !== nativeCurrency && params.fxRate) {
    totalCostInNativeCurrency = totalCostInPriceCurrency * params.fxRate;
  }

  let totalCostInWalletCurrency = totalCostInNativeCurrency;
  if (nativeCurrency !== params.walletCurrency && params.fxRate) {
    // Apply conversion (simplified - in real implementation, need proper FX rate)
    totalCostInWalletCurrency = totalCostInNativeCurrency * (params.fxRate || 1);
  }

  // Get currency multiplier (VND: 1, USD: 100)
  const getCurrencyMultiplier = (currency: string) => {
    return currency === 'VND' ? 1 : 100;
  };

  return {
    storedQuantity: Math.round(quantityInStorage * 10000),  // 4 decimal precision
    totalCostNative: Math.round(totalCostInNativeCurrency * getCurrencyMultiplier(nativeCurrency)),
    totalCostWallet: Math.round(totalCostInWalletCurrency * getCurrencyMultiplier(params.walletCurrency)),
    averageCostNative: Math.round(priceInStorage * getCurrencyMultiplier(nativeCurrency)),
    purchaseUnit: params.quantityUnit,  // Remember user's input unit
  };
}

/**
 * Display Formatting Functions
 */

export function formatSilverQuantityDisplay(
  storedQuantity: number,
  investmentType: InvestmentType,
  purchaseUnit: SilverUnit
): { value: number; unit: SilverUnit } {
  const storageUnit: SilverUnit = investmentType === 10 ? 'gram' : 'oz';
  const quantityInStorage = storedQuantity / 10000;

  // Convert from storage unit to purchase unit for display
  const displayValue = convertSilverQuantity(
    quantityInStorage,
    storageUnit,
    purchaseUnit
  );

  return { value: displayValue, unit: purchaseUnit };
}

export function getSilverUnitLabel(unit: SilverUnit): string {
  switch (unit) {
    case 'tael': return 'lượng';
    case 'kg': return 'kg';
    case 'oz': return 'oz';
    case 'gram': return 'g';
    default: return unit;
  }
}

export function isSilverType(type: InvestmentType): boolean {
  return type === InvestmentType.INVESTMENT_TYPE_SILVER_VND ||
         type === InvestmentType.INVESTMENT_TYPE_SILVER_USD;
}

export function getSilverTypeLabel(type: InvestmentType): string {
  switch (type) {
    case InvestmentType.INVESTMENT_TYPE_SILVER_VND:
      return 'Silver (VND)';
    case InvestmentType.INVESTMENT_TYPE_SILVER_USD:
      return 'Silver (USD)';
    default:
      return 'Unknown';
  }
}

/**
 * Format silver quantity for display with unit label
 */
export function formatSilverQuantity(
  storedQuantity: number,
  investmentType: InvestmentType,
  purchaseUnit: SilverUnit
): string {
  const { value, unit } = formatSilverQuantityDisplay(storedQuantity, investmentType, purchaseUnit);
  const unitLabel = getSilverUnitLabel(unit);

  return `${value.toFixed(4)} ${unitLabel}`;
}

/**
 * Format silver price for display with unit label
 */
export function formatSilverPrice(
  price: number,
  currency: string,
  priceUnit: SilverUnit,
  investmentType?: InvestmentType
): string {
  const storageUnit: SilverUnit = investmentType === 10 ? 'gram' : 'oz';

  // Convert from storage format to display format
  let priceForDisplay: number;

  if (currency === 'VND') {
    // VND silver: Backend stores price per gram in VND
    // Convert to price per priceUnit (tael or kg)
    const pricePerGram = price;
    priceForDisplay = convertSilverPricePerUnit(pricePerGram, 'gram', priceUnit);
  } else {
    // USD silver: Backend stores price per ounce in USD cents
    // Display as price per ounce in dollars
    priceForDisplay = price / 100;
  }

  const unitLabel = getSilverUnitLabel(priceUnit);

  // Format price with currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceForDisplay);

  return `${formattedPrice}/${unitLabel}`;
}
```

### Portfolio Helpers Integration (`app/dashboard/portfolio/helpers.tsx`)

Update existing helpers to include silver:

```typescript
import {
  isSilverType,
  getSilverTypeLabel,
  formatSilverQuantity as formatSilverQuantityUtil,
  formatSilverPrice as formatSilverPriceUtil,
} from "@/lib/utils/silver-calculator";

export const formatQuantity = (
  quantity: number,
  type: InvestmentType,
  purchaseUnit?: string
): string => {
  // Gold types have special formatting
  if (isGoldType(type)) {
    return formatGoldQuantity(quantity, type);
  }

  // Silver types have special formatting (NEW)
  if (isSilverType(type) && purchaseUnit) {
    return formatSilverQuantityUtil(quantity, type, purchaseUnit as any);
  }

  // Crypto: 8 decimals, Stocks/ETFs/Mutual Funds: 4 decimals, Bonds/Commodities: 2 decimals
  let decimals = 2;
  if (type === InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY) {
    decimals = 8;
  } else if (
    type === InvestmentType.INVESTMENT_TYPE_STOCK ||
    type === InvestmentType.INVESTMENT_TYPE_ETF ||
    type === InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND
  ) {
    decimals = 4;
  }
  return (quantity / Math.pow(10, decimals)).toFixed(decimals);
};

export const formatPrice = (
  price: number,
  type: InvestmentType,
  currency: string = "VND",
  priceUnit?: string
): string => {
  // Gold types: show price per unit
  if (isGoldType(type)) {
    return formatGoldPrice(price, currency, priceUnit, type);
  }

  // Silver types: show price per unit (NEW)
  if (isSilverType(type) && priceUnit) {
    return formatSilverPriceUtil(price, currency, priceUnit as any, type);
  }

  // Use the multi-currency formatter for other types
  return formatCurrencyUtil(price, currency);
};

export const getInvestmentTypeLabel = (type: InvestmentType): string => {
  // Use gold calculator utility for gold types
  if (isGoldType(type)) {
    return getGoldTypeLabelUtil(type);
  }

  // Use silver calculator utility for silver types (NEW)
  if (isSilverType(type)) {
    return getSilverTypeLabel(type);
  }

  switch (type) {
    case InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY:
      return "Crypto";
    case InvestmentType.INVESTMENT_TYPE_STOCK:
      return "Stock";
    case InvestmentType.INVESTMENT_TYPE_ETF:
      return "ETF";
    case InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND:
      return "Mutual Fund";
    case InvestmentType.INVESTMENT_TYPE_BOND:
      return "Bond";
    case InvestmentType.INVESTMENT_TYPE_COMMODITY:
      return "Commodity";
    case InvestmentType.INVESTMENT_TYPE_OTHER:
      return "Other";
    default:
      return "Unknown";
  }
};
```

### AddInvestmentForm Component Updates

Extend the form to support silver (in `components/modals/forms/AddInvestmentForm.tsx`):

```typescript
import {
  SILVER_VND_OPTIONS,
  SILVER_USD_OPTIONS,
  SilverUnit,
  calculateSilverFromUserInput,
  getSilverUnitLabel,
  isSilverType,
} from "@/lib/utils/silver-calculator";

// Add state for silver-specific fields
const [silverUnit, setSilverUnit] = useState<SilverUnit>('tael');
const [silverPriceUnit, setSilverPriceUnit] = useState<SilverUnit>('tael');

// Update investment type options to include silver
const investmentTypeOptions = [
  { value: 1, label: "Cryptocurrency" },
  { value: 2, label: "Stock" },
  { value: 3, label: "ETF" },
  { value: 4, label: "Mutual Fund" },
  { value: 5, label: "Bond" },
  { value: 6, label: "Commodity" },
  { value: 7, label: "Other" },
  { value: 8, label: "🥇 Gold (VND)" },
  { value: 9, label: "🥇 Gold (USD)" },
  { value: 10, label: "🥈 Silver (VND)" },  // NEW
  { value: 11, label: "🥈 Silver (USD)" },  // NEW
];

// Detect when silver type is selected
useEffect(() => {
  if (isSilverType(selectedInvestmentType)) {
    const silverOption = [...SILVER_VND_OPTIONS, ...SILVER_USD_OPTIONS]
      .find(opt => opt.type === selectedInvestmentType);

    if (silverOption) {
      // Set default unit to first available
      setSilverUnit(silverOption.availableUnits[0]);
      setSilverPriceUnit(silverOption.availableUnits[0]);
    }
  }
}, [selectedInvestmentType]);

// Helper to get available units for dropdown
const getAvailableUnits = (investmentType: number) => {
  const silverOption = [...SILVER_VND_OPTIONS, ...SILVER_USD_OPTIONS]
    .find(opt => opt.type === investmentType);

  if (!silverOption) return [];

  return silverOption.availableUnits.map(unit => ({
    value: unit,
    label: getSilverUnitLabel(unit),
  }));
};

// Render silver-specific inputs
{isSilverType(selectedInvestmentType) && (
  <>
    {/* Quantity input with unit selector */}
    <div className="flex gap-2">
      <FormInput
        label="Quantity"
        type="number"
        step="0.0001"
        value={quantity}
        onChange={(e) => setQuantity(parseFloat(e.target.value))}
      />
      <Select
        options={getAvailableUnits(selectedInvestmentType)}
        value={silverUnit}
        onChange={(value) => setSilverUnit(value as SilverUnit)}
      />
    </div>

    {/* Price per unit input */}
    <div className="flex gap-2">
      <FormInput
        label={`Price per ${getSilverUnitLabel(silverPriceUnit)}`}
        type="number"
        value={pricePerUnit}
        onChange={(e) => setPricePerUnit(parseFloat(e.target.value))}
      />
      <Select
        options={getAvailableUnits(selectedInvestmentType)}
        value={silverPriceUnit}
        onChange={(value) => setSilverPriceUnit(value as SilverUnit)}
      />
    </div>
  </>
)}

// Handle submit for silver (matches gold pattern exactly)
const handleSubmit = () => {
  if (isSilverType(selectedInvestmentType)) {
    const silverOption = [...SILVER_VND_OPTIONS, ...SILVER_USD_OPTIONS]
      .find(opt => opt.type === selectedInvestmentType);

    if (!silverOption) return;

    // Calculate using silver calculator (like gold calculator)
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

    // Send to API using decimal fields (backend handles conversion)
    createInvestmentMutation.mutate({
      walletId,
      symbol: silverOption.value,  // "AG_VND" or "XAG"
      name: silverOption.label,
      type: data.type,
      initialQuantityDecimal: silverCalculation.storedQuantity / 10000, // Convert storage format (grams×10000 or oz×10000) to decimal
      initialCostDecimal: data.initialCost, // Send decimal value in user's input currency
      currency: data.currency, // Send the currency user paid in (NOT wallet currency)
      purchaseUnit: silverCalculation.purchaseUnit, // NEW: "tael", "kg", or "oz"
      // Set int64 fields to 0 (decimal fields take precedence)
      initialQuantity: 0,
      initialCost: 0,
    });
  } else {
    // Non-silver investments (stocks, crypto, etc.) - existing logic unchanged
    createInvestmentMutation.mutate({
      walletId,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      type: data.type,
      initialQuantityDecimal: data.initialQuantity,
      initialCostDecimal: data.initialCost,
      currency: data.currency,
      initialQuantity: 0,
      initialCost: 0,
    });
  }
};
```

**Key Points About Form Integration:**

1. **Matches Gold Pattern**: Silver form handling is identical to gold
2. **Dual Input System**: Backend accepts both `initialQuantityDecimal` AND `initialQuantity` (decimal takes precedence)
3. **Currency Handling**: Always send investment's native currency, backend handles wallet conversion
4. **Purchase Unit Storage**: New `purchaseUnit` field stores user's display preference
5. **No Backend Changes Needed**: Existing `CreateInvestment` endpoint works as-is

## Testing Strategy

### Backend Unit Tests

**1. Silver Unit Conversion Tests (`pkg/silver/converter_test.go`):**

```go
package silver

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestConvertQuantity(t *testing.T) {
    tests := []struct {
        name     string
        quantity float64
        from     SilverUnit
        to       SilverUnit
        expected float64
    }{
        {"Tael to Gram", 2.0, UnitTael, UnitGram, 75.0},
        {"Kg to Gram", 1.0, UnitKg, UnitGram, 1000.0},
        {"Oz to Gram", 1.0, UnitOunce, UnitGram, 31.1034768},
        {"Gram to Tael", 37.5, UnitGram, UnitTael, 1.0},
        {"Kg to Tael", 1.0, UnitKg, UnitTael, 26.6667},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := ConvertQuantity(tt.quantity, tt.from, tt.to)
            assert.InDelta(t, tt.expected, result, 0.0001)
        })
    }
}

func TestConvertPricePerUnit(t *testing.T) {
    // Test price conversions (inverse of quantity)
    // Price per tael = 3,218,000 VND
    // Price per gram = 3,218,000 / 37.5 = 85,813.33 VND
    pricePerTael := 3218000.0
    pricePerGram := ConvertPricePerUnit(pricePerTael, UnitTael, UnitGram)
    assert.InDelta(t, 85813.33, pricePerGram, 0.01)

    // Price per kg = 85,813,000 VND
    // Price per gram = 85,813,000 / 1000 = 85,813 VND
    pricePerKg := 85813000.0
    pricePerGram2 := ConvertPricePerUnit(pricePerKg, UnitKg, UnitGram)
    assert.InDelta(t, 85813.0, pricePerGram2, 0.01)
}
```

**2. Silver API Client Tests (`pkg/silver/client_test.go`):**

```go
package silver

import (
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
)

func TestFetchPrices(t *testing.T) {
    // Mock HTTP server returning ancarat API response
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        response := [][]string{
            {"NHÓM BẠC TÍCH TRỮ ĐANG PHÁT HÀNH", "", "", "Mã Tham Chiếu", "URL"},
            {"Ngân Long Quảng Tiến 999 - 1 lượng", "3,218,000", "3,121,000", "A4", "url"},
            {"Ngân Long Quảng Tiến 999 - 5 lượng", "16,090,000", "15,605,000", "B4", "url"},
            {"Ngân Long Quảng Tiến 999 - 1 Kilo", "85,813,000", "83,227,000", "K4"},
        }
        json.NewEncoder(w).Encode(response)
    }))
    defer server.Close()

    client := NewClient(10 * time.Second)
    client.baseURL = server.URL

    prices, err := client.FetchPrices(context.Background())
    assert.NoError(t, err)
    assert.Len(t, prices, 2) // Only A4 and K4 are extracted
    assert.Equal(t, 3218000.0, prices["A4"].Buy)
    assert.Equal(t, 3121000.0, prices["A4"].Sell)
    assert.Equal(t, "VND", prices["A4"].Currency)
    assert.Equal(t, 85813000.0, prices["K4"].Buy)
}

func TestFetchPriceByType(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        response := [][]string{
            {"NHÓM BẠC TÍCH TRỮ ĐANG PHÁT HÀNH", "", "", "Mã Tham Chiếu", "URL"},
            {"Ngân Long Quảng Tiến 999 - 1 lượng", "3,218,000", "3,121,000", "A4", "url"},
        }
        json.NewEncoder(w).Encode(response)
    }))
    defer server.Close()

    client := NewClient(10 * time.Second)
    client.baseURL = server.URL

    price, err := client.FetchPriceByType(context.Background(), "A4")
    assert.NoError(t, err)
    assert.Equal(t, "A4", price.TypeCode)
    assert.Equal(t, 3218000.0, price.Buy)
}
```

**3. Integration Tests (`domain/service/silver_investment_integration_test.go`):**

```go
// +build integration

package service

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    investmentv1 "wealthjourney/protobuf/v1"
)

func TestCreateSilverInvestment_VND(t *testing.T) {
    // Setup test environment
    ctx := context.Background()

    // Test creating VND silver investment
    // Input: 2 lượng @ ₫3,218,000/lượng
    req := &investmentv1.CreateInvestmentRequest{
        WalletId:             testWalletID,
        Symbol:               "AG_VND",
        Name:                 "Bạc Việt Nam 999",
        Type:                 investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
        Currency:             "VND",
        InitialQuantityDecimal: 2.0,      // 2 lượng
        InitialCostDecimal:   6436000.0,  // 2 × 3,218,000
        PurchaseUnit:         "tael",
    }

    resp, err := investmentService.CreateInvestment(ctx, testUserID, req)
    assert.NoError(t, err)
    assert.NotNil(t, resp)

    // Verify stored values
    // Expected storage: 750000 (75g × 10000)
    investment := resp.Data
    assert.Equal(t, int64(750000), investment.Quantity)
    assert.Equal(t, "tael", investment.PurchaseUnit)
}

func TestCreateSilverInvestment_USD(t *testing.T) {
    ctx := context.Background()

    // Test creating USD silver investment
    // Input: 10 oz @ $24.50/oz
    req := &investmentv1.CreateInvestmentRequest{
        WalletId:             testWalletID,
        Symbol:               "XAG",
        Name:                 "Silver World (XAG/USD)",
        Type:                 investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_USD,
        Currency:             "USD",
        InitialQuantityDecimal: 10.0,   // 10 oz
        InitialCostDecimal:   245.0,    // 10 × 24.50
        PurchaseUnit:         "oz",
    }

    resp, err := investmentService.CreateInvestment(ctx, testUserID, req)
    assert.NoError(t, err)

    // Expected storage: 100000 (10 oz × 10000)
    investment := resp.Data
    assert.Equal(t, int64(100000), investment.Quantity)
    assert.Equal(t, int64(24500), investment.TotalCost) // 245 USD = 24500 cents
    assert.Equal(t, "oz", investment.PurchaseUnit)
}

func TestSilverWithCurrencyConversion(t *testing.T) {
    // Test VND silver in USD wallet
    // Verify FX conversion applied correctly
    ctx := context.Background()

    // Create USD wallet
    usdWallet := createTestWallet(t, testUserID, "USD", 10000) // $100

    // Buy VND silver in USD wallet
    // 2 lượng @ ₫3,218,000/lượng = ₫6,436,000
    // Assuming FX rate: 1 USD = 25,000 VND
    // Expected wallet deduction: $257.44 (6,436,000 / 25,000)

    req := &investmentv1.CreateInvestmentRequest{
        WalletId:             usdWallet.Id,
        Symbol:               "AG_VND",
        Name:                 "Bạc Việt Nam 999",
        Type:                 investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND,
        Currency:             "VND",
        InitialQuantityDecimal: 2.0,
        InitialCostDecimal:   6436000.0,
        PurchaseUnit:         "tael",
    }

    resp, err := investmentService.CreateInvestment(ctx, testUserID, req)
    assert.NoError(t, err)

    // Verify wallet balance decreased by converted amount
    updatedWallet, _ := walletRepo.GetByID(ctx, usdWallet.Id)
    // Check that balance decreased (exact amount depends on FX rate)
    assert.Less(t, updatedWallet.Balance, usdWallet.Balance)
}

func TestSilverPriceUpdate(t *testing.T) {
    // Test fetching silver price from ancarat API
    ctx := context.Background()

    err := marketDataService.UpdateMarketPrice(ctx, "AG_VND", investmentv1.InvestmentType_INVESTMENT_TYPE_SILVER_VND)
    assert.NoError(t, err)

    // Verify price cached correctly
    cachedPrice, err := silverPriceCache.GetPrice(ctx, "AG_VND", "VND")
    assert.NoError(t, err)
    assert.Greater(t, cachedPrice, int64(0))
}
```

### Frontend Tests (`lib/utils/silver-calculator.test.ts`)

```typescript
import {
  convertSilverQuantity,
  convertSilverPricePerUnit,
  calculateSilverFromUserInput,
  formatSilverQuantityDisplay,
  formatSilverQuantity,
  formatSilverPrice,
  getSilverUnitLabel,
} from './silver-calculator';
import { InvestmentType } from '@/gen/protobuf/v1/investment';

describe('Silver Calculator - Unit Conversions', () => {
  test('converts tael to gram correctly', () => {
    expect(convertSilverQuantity(2, 'tael', 'gram')).toBeCloseTo(75, 2);
    expect(convertSilverQuantity(1, 'tael', 'gram')).toBeCloseTo(37.5, 2);
  });

  test('converts kg to gram correctly', () => {
    expect(convertSilverQuantity(1, 'kg', 'gram')).toBe(1000);
    expect(convertSilverQuantity(0.5, 'kg', 'gram')).toBe(500);
  });

  test('converts oz to gram correctly', () => {
    expect(convertSilverQuantity(1, 'oz', 'gram')).toBeCloseTo(31.1034768, 4);
  });

  test('converts price per tael to price per gram', () => {
    const pricePerTael = 3218000;
    const pricePerGram = convertSilverPricePerUnit(pricePerTael, 'tael', 'gram');
    expect(pricePerGram).toBeCloseTo(85813.33, 2);
  });

  test('converts price per kg to price per gram', () => {
    const pricePerKg = 85813000;
    const pricePerGram = convertSilverPricePerUnit(pricePerKg, 'kg', 'gram');
    expect(pricePerGram).toBeCloseTo(85813, 2);
  });
});

describe('Silver Calculator - Cost Calculations', () => {
  test('calculates total cost from user input - VND silver in taels', () => {
    const result = calculateSilverFromUserInput({
      quantity: 2,
      quantityUnit: 'tael',
      pricePerUnit: 3218000,
      priceCurrency: 'VND',
      priceUnit: 'tael',
      investmentType: 10, // SILVER_VND
      walletCurrency: 'VND',
    });

    expect(result.storedQuantity).toBe(750000); // 75g × 10000
    expect(result.totalCostNative).toBe(6436000); // 2 × 3,218,000 VND
    expect(result.purchaseUnit).toBe('tael');
  });

  test('calculates total cost from user input - VND silver in kg', () => {
    const result = calculateSilverFromUserInput({
      quantity: 1,
      quantityUnit: 'kg',
      pricePerUnit: 85813000,
      priceCurrency: 'VND',
      priceUnit: 'kg',
      investmentType: 10,
      walletCurrency: 'VND',
    });

    expect(result.storedQuantity).toBe(10000000); // 1000g × 10000
    expect(result.totalCostNative).toBe(85813000);
    expect(result.purchaseUnit).toBe('kg');
  });

  test('calculates total cost from user input - USD silver', () => {
    const result = calculateSilverFromUserInput({
      quantity: 10,
      quantityUnit: 'oz',
      pricePerUnit: 24.50,
      priceCurrency: 'USD',
      priceUnit: 'oz',
      investmentType: 11, // SILVER_USD
      walletCurrency: 'USD',
    });

    expect(result.storedQuantity).toBe(100000); // 10 oz × 10000
    expect(result.totalCostWallet).toBe(24500); // 245 USD in cents
    expect(result.purchaseUnit).toBe('oz');
  });
});

describe('Silver Calculator - Display Formatting', () => {
  test('formats silver quantity display - taels', () => {
    const formatted = formatSilverQuantity(750000, InvestmentType.INVESTMENT_TYPE_SILVER_VND, 'tael');
    expect(formatted).toBe('2.0000 lượng');
  });

  test('formats silver quantity display - kg', () => {
    const formatted = formatSilverQuantity(10000000, InvestmentType.INVESTMENT_TYPE_SILVER_VND, 'kg');
    expect(formatted).toBe('1.0000 kg');
  });

  test('formats silver quantity display - oz', () => {
    const formatted = formatSilverQuantity(100000, InvestmentType.INVESTMENT_TYPE_SILVER_USD, 'oz');
    expect(formatted).toBe('10.0000 oz');
  });

  test('formats silver price display - VND per tael', () => {
    const formatted = formatSilverPrice(85813, 'VND', 'tael', InvestmentType.INVESTMENT_TYPE_SILVER_VND);
    expect(formatted).toContain('3,218,000');
    expect(formatted).toContain('/lượng');
  });

  test('formats silver price display - VND per kg', () => {
    const formatted = formatSilverPrice(85813, 'VND', 'kg', InvestmentType.INVESTMENT_TYPE_SILVER_VND);
    expect(formatted).toContain('85,813,000');
    expect(formatted).toContain('/kg');
  });

  test('formats silver price display - USD per oz', () => {
    const formatted = formatSilverPrice(2450, 'USD', 'oz', InvestmentType.INVESTMENT_TYPE_SILVER_USD);
    expect(formatted).toContain('24.50');
    expect(formatted).toContain('/oz');
  });

  test('gets correct unit labels', () => {
    expect(getSilverUnitLabel('tael')).toBe('lượng');
    expect(getSilverUnitLabel('kg')).toBe('kg');
    expect(getSilverUnitLabel('oz')).toBe('oz');
    expect(getSilverUnitLabel('gram')).toBe('g');
  });
});
```

### Test Running Commands

```bash
# Backend unit tests (fast, no external APIs)
go test -short ./pkg/silver/...

# Backend integration tests (requires APIs and database)
go test -tags=integration ./domain/service/...

# Frontend tests
cd src/wj-client
npm test silver-calculator

# Run all tests
task test:all
```

## Database Migration

### Migration Command

Create migration command to add `purchase_unit` column:

```bash
mkdir -p src/go-backend/cmd/migrate-add-purchase-unit
```

**File: `cmd/migrate-add-purchase-unit/main.go`**

```go
package main

import (
    "log"

    "wealthjourney/pkg/database"
)

func main() {
    db := database.Connect()

    log.Println("Starting migration: Add purchase_unit column to investment table")

    // Add purchase_unit column
    err := db.Exec(`
        ALTER TABLE investment
        ADD COLUMN purchase_unit VARCHAR(10) DEFAULT 'gram'
    `).Error

    if err != nil {
        log.Fatalf("Failed to add purchase_unit column: %v", err)
    }

    log.Println("✓ Added purchase_unit column")

    // Backfill existing gold investments
    // Gold VND: default to tael display
    err = db.Exec(`
        UPDATE investment
        SET purchase_unit = 'tael'
        WHERE type = 8
    `).Error

    if err != nil {
        log.Fatalf("Failed to backfill gold VND: %v", err)
    }

    log.Println("✓ Backfilled gold VND investments with 'tael'")

    // Gold USD: default to oz display
    err = db.Exec(`
        UPDATE investment
        SET purchase_unit = 'oz'
        WHERE type = 9
    `).Error

    if err != nil {
        log.Fatalf("Failed to backfill gold USD: %v", err)
    }

    log.Println("✓ Backfilled gold USD investments with 'oz'")

    log.Println("Migration completed successfully")
}
```

**Run migration:**

```bash
go run src/go-backend/cmd/migrate-add-purchase-unit/main.go
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Silver Investment Configuration
SILVER_PRICE_ENABLED=true
SILVER_PRICE_TIMEOUT=10s
SILVER_PRICE_CACHE_MAX_AGE=15m
ANCARAT_API_URL=https://giabac.ancarat.com/api/price-data
```

### Config Structure (`pkg/config/config.go`)

```go
type Config struct {
    // ... existing fields

    // Silver configuration
    SilverPriceEnabled   bool          `env:"SILVER_PRICE_ENABLED" envDefault:"true"`
    SilverPriceTimeout   time.Duration `env:"SILVER_PRICE_TIMEOUT" envDefault:"10s"`
    SilverPriceCacheMaxAge time.Duration `env:"SILVER_PRICE_CACHE_MAX_AGE" envDefault:"15m"`
    AncaratAPIURL        string        `env:"ANCARAT_API_URL" envDefault:"https://giabac.ancarat.com/api/price-data"`
}
```

## Deployment Plan

### Phase 1: Backend Deployment

1. **Update Protobuf & Generate Code**
   ```bash
   # Edit api/protobuf/v1/investment.proto
   # Add INVESTMENT_TYPE_SILVER_VND = 10
   # Add INVESTMENT_TYPE_SILVER_USD = 11
   # Add purchaseUnit field to Investment and CreateInvestmentRequest

   task proto:all
   ```

2. **Create Silver Package**
   ```bash
   mkdir -p src/go-backend/pkg/silver
   # Create types.go, converter.go, client.go
   ```

3. **Run Database Migration**
   ```bash
   go run src/go-backend/cmd/migrate-add-purchase-unit/main.go
   ```

4. **Update Services**
   - Extend `InvestmentService.CreateInvestment()` to handle silver
   - Update `MarketDataService` to fetch silver prices
   - Add silver price cache

5. **Add API Endpoint**
   ```bash
   # Create api/handlers/silver.go
   # Add /api/v1/investments/silver-types endpoint
   ```

6. **Test Backend**
   ```bash
   go test -short ./pkg/silver/...
   go test -tags=integration ./domain/service/...
   ```

7. **Deploy to Vercel**
   ```bash
   task deploy:backend
   ```

### Phase 2: Frontend Deployment

1. **Create Silver Calculator**
   ```bash
   # Create src/wj-client/lib/utils/silver-calculator.ts
   ```

2. **Update Portfolio Helpers**
   ```typescript
   // Add silver formatting to helpers.tsx
   // Update formatQuantity, formatPrice, getInvestmentTypeLabel
   ```

3. **Update AddInvestmentForm**
   ```typescript
   // Add silver type options
   // Add unit selectors for quantity and price
   // Integrate calculateSilverFromUserInput
   ```

4. **Update Portfolio Display**
   ```typescript
   // Ensure portfolio page displays silver with correct units
   ```

5. **Test Frontend**
   ```bash
   cd src/wj-client
   npm test silver-calculator
   npm run build  # Verify no build errors
   ```

6. **Deploy to Vercel**
   ```bash
   task deploy:frontend
   ```

### Rollback Plan

If issues are discovered post-deployment:

1. **Disable silver creation via feature flag:**
   ```bash
   SILVER_PRICE_ENABLED=false
   ```

2. **Existing silver investments will continue to work** (display only, no new creations)

3. **Database rollback** (if needed):
   ```sql
   -- Remove purchase_unit column
   ALTER TABLE investment DROP COLUMN purchase_unit;

   -- Delete silver investments (if necessary)
   DELETE FROM investment WHERE type IN (10, 11);
   ```

## Monitoring & Metrics

### Prometheus Metrics

Add metrics for silver operations (`pkg/metrics/silver.go`):

```go
package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
    SilverPriceFetchTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "silver_price_fetch_total",
            Help: "Total number of silver price fetches",
        },
        []string{"type", "status"},
    )

    SilverPriceFetchDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "silver_price_fetch_duration_seconds",
            Help: "Duration of silver price fetches",
            Buckets: prometheus.DefBuckets,
        },
        []string{"type"},
    )

    SilverInvestmentCreatedTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "silver_investment_created_total",
            Help: "Total number of silver investments created",
        },
        []string{"type", "currency"},
    )
)

func init() {
    prometheus.MustRegister(SilverPriceFetchTotal)
    prometheus.MustRegister(SilverPriceFetchDuration)
    prometheus.MustRegister(SilverInvestmentCreatedTotal)
}
```

### Monitoring Checklist

Monitor the following metrics:

- **Silver price fetch success/failure rates** - Track ancarat API and Yahoo Finance reliability
- **Cache hit rates for silver prices** - Ensure 15-minute caching works effectively
- **Silver investment creation counts** - Track adoption by type (VND vs USD)
- **Currency conversion errors for silver** - Monitor FX rate failures
- **Silver transaction processing times** - Ensure FIFO calculations perform well

## Pre-Production Testing Checklist

Before deploying to production, verify:

### Backend
- [ ] Unit tests pass (`go test -short ./pkg/silver/...`)
- [ ] Integration tests pass (`go test -tags=integration ./domain/service/...`)
- [ ] Database migration runs successfully
- [ ] Protobuf generates without errors (`task proto:all`)
- [ ] VND silver creation works (2 lượng → stored as 750000)
- [ ] VND silver creation works (1 kg → stored as 10000000)
- [ ] USD silver creation works (10 oz → stored as 100000)
- [ ] Silver prices fetch from ancarat API
- [ ] Silver prices fetch from Yahoo Finance (XAG)
- [ ] Price caching works (15-minute TTL)
- [ ] Stale cache fallback works when API fails
- [ ] Multi-currency display works (VND silver shown in USD wallet)
- [ ] Buy transaction updates FIFO lots correctly
- [ ] Sell transaction calculates realized PNL correctly
- [ ] Dividend transaction (if applicable) works

### Frontend
- [ ] Frontend tests pass (`npm test silver-calculator`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] Silver type selector shows VND and USD options
- [ ] Unit selectors work (lượng/kg for VND, oz for USD)
- [ ] Quantity input accepts decimal values
- [ ] Price per unit input updates label dynamically
- [ ] Form validation prevents invalid inputs
- [ ] Portfolio displays silver with correct units (matches purchase unit)
- [ ] Silver quantity format: "2.0000 lượng" or "1.0000 kg" or "10.0000 oz"
- [ ] Silver price format: "₫3,218,000/lượng" or "$24.50/oz"
- [ ] Portfolio summary includes silver in breakdown by type
- [ ] Multi-currency conversion displays correctly

### Integration
- [ ] End-to-end flow: Create VND silver → Display in portfolio → Buy more → Sell some
- [ ] End-to-end flow: Create USD silver → Display in portfolio → Price updates
- [ ] Cross-currency: VND silver in USD wallet shows correct conversions
- [ ] Price updates reflect in PNL calculations
- [ ] FIFO lots track correctly across multiple buy/sell transactions

### Dual Currency Display Scenarios (Native + User Preference)

- [ ] **Scenario 1: VND silver, VND user preference (same currency)**
  - Create VND silver investment (2 lượng @ ₫3,218,000)
  - User preference currency: VND
  - Display: **₫6,436,000** (no secondary display)
  - Verify NO "≈" conversion shown (same currency)

- [ ] **Scenario 2: VND silver, USD user preference (different currency)**
  - Create VND silver investment (2 lượng @ ₫3,218,000)
  - User preference currency: USD
  - Display: **₫6,436,000** (primary, bold)
            ≈ $257.44 (secondary, gray, smaller)
  - Verify native VND shown first (always primary)
  - Verify converted USD shown below with "≈" symbol
  - Verify stored value still VND in database

- [ ] **Scenario 3: USD silver, VND user preference (different currency)**
  - Create USD silver investment (10 oz @ $24.50)
  - User preference currency: VND
  - Display: **$245.00** (primary, bold)
            ≈ ₫6,125,000 (secondary, gray, smaller)
  - Verify native USD shown first
  - Verify converted VND shown below
  - Verify stored value still USD in database

- [ ] **Scenario 4: USD silver, USD user preference (same currency)**
  - Create USD silver investment (10 oz @ $24.50)
  - User preference currency: USD
  - Display: **$245.00** (no secondary display)
  - Verify NO "≈" conversion shown

- [ ] **Scenario 5: User changes preference VND → USD**
  - Create VND silver (initially user preference VND)
  - Display shows: **₫6,436,000** only
  - Change user preference to USD
  - Display updates to: **₫6,436,000** (primary)
                         ≈ $257.44 (secondary appears)
  - Verify database value unchanged (still VND)
  - Verify quantity still "2.0000 lượng" (unit unchanged)

- [ ] **Scenario 6: User changes preference USD → VND**
  - Create USD silver (initially user preference USD)
  - Display shows: **$245.00** only
  - Change user preference to VND
  - Display updates to: **$245.00** (primary)
                         ≈ ₫6,125,000 (secondary appears)
  - Verify database value unchanged (still USD)
  - Verify quantity still "10.0000 oz" (unit unchanged)

- [ ] **Scenario 7: Mixed portfolio display**
  - Create VND silver (AG_VND) and USD silver (XAG)
  - User preference: USD
  - VND silver shows: **₫6,436,000** / ≈ $257.44
  - USD silver shows: **$245.00** (no conversion)
  - Verify portfolio total sums correctly in USD (user preference)

- [ ] **Scenario 8: Portfolio summary aggregation**
  - Multiple investments in different currencies
  - Portfolio summary shows totals in user's preferred currency
  - Drill down to individual investments shows native + converted

- [ ] **Scenario 9: Currency cache efficiency**
  - Create silver investment, user preference differs from native
  - First load: Cache miss, conversion happens
  - Refresh within 15 minutes: Cache hit, no redundant conversion
  - After 15+ minutes: Cache expired, reconverts with latest FX rate

## Future Enhancements

Potential improvements for future iterations:

1. **Additional Silver Types**
   - Support more vendors from ancarat API
   - Add purity variants (999, 995, etc.)

2. **Enhanced Price Tracking**
   - Historical price charts for silver
   - Price alerts when silver reaches target price

3. **Batch Operations**
   - Bulk create silver investments from CSV
   - Bulk price updates across all silver holdings

4. **Advanced Analytics**
   - Silver vs gold performance comparison
   - Precious metals allocation percentage
   - Cost basis analysis by purchase date

5. **Mobile App Support**
   - Dedicated silver investment UI for mobile
   - QR code scanning for silver bar certificates

## Summary

### Silver Investment Complete Flow

**User Action → Frontend → Backend → Database → Display**

#### Example: Create 2 lượng VND Silver @ ₫3,218,000/lượng in USD Wallet

1. **User Input (Frontend)**:
   - Select: "Silver (VND)"
   - Quantity: 2 lượng
   - Price: ₫3,218,000/lượng
   - Total cost: ₫6,436,000

2. **Frontend Processing**:
   ```typescript
   calculateSilverFromUserInput({
     quantity: 2,
     quantityUnit: 'tael',
     pricePerUnit: 3218000,
     priceCurrency: 'VND',
     priceUnit: 'tael',
     investmentType: 10, // SILVER_VND
     walletCurrency: 'USD'
   })
   // Returns:
   // - storedQuantity: 750000 (75g × 10000)
   // - totalCostNative: 6436000 VND
   // - purchaseUnit: 'tael'
   ```

3. **API Request**:
   ```json
   {
     "walletId": 123,
     "symbol": "AG_VND",
     "name": "Bạc Việt Nam (VND)",
     "type": 10,
     "initialQuantityDecimal": 75.0,
     "initialCostDecimal": 6436000,
     "currency": "VND",
     "purchaseUnit": "tael"
   }
   ```

4. **Backend Processing** (Generic, works for all types):
   ```go
   // Convert to storage format
   initialQuantity = units.QuantityToStorage(75.0, SILVER_VND) // 750000
   initialCost = 6436000 // VND (no decimal places)

   // Convert VND to USD for wallet balance check
   initialCostInWalletCurrency = fxRateSvc.ConvertAmount(6436000, "VND", "USD")
   // = $257.44 (assuming rate 25,000)

   // Calculate average cost
   averageCost = (6436000 × 10000) / 750000 = 85813 VND per gram

   // Check wallet balance
   if wallet.Balance < $257.44 {
       return error
   }

   // Create investment
   investment = {
       Symbol: "AG_VND",
       Quantity: 750000,
       AverageCost: 85813,
       TotalCost: 6436000,
       Currency: "VND",
       PurchaseUnit: "tael"
   }

   // Deduct from wallet
   wallet.Balance -= $257.44 (converted from VND)
   ```

5. **Database Storage**:
   ```sql
   INSERT INTO investment (
       symbol, quantity, average_cost, total_cost,
       currency, purchase_unit
   ) VALUES (
       'AG_VND', 750000, 85813, 6436000,
       'VND', 'tael'
   )
   ```

6. **Display (User preference: USD)**:
   ```
   Portfolio Table:
   Symbol: AG_VND
   Quantity: 2.0000 lượng (from purchase_unit)
   Total Cost: ₫6,436,000 (native, bold)
               ≈ $257.44 (converted, gray)
   Current Value: ₫6,500,000
                  ≈ $260.00
   PNL: +₫64,000
        ≈ +$2.56
   ```

### Key Features

The silver investment feature provides comprehensive tracking for both Vietnamese and world silver investments with:

- **Dual unit system**: Support for lượng, kg (VND) and troy ounces (USD)
- **Flexible display**: Show quantities in user's original purchase unit
- **Multi-currency support**: Automatic conversions between investment, wallet, and display currencies
- **FIFO cost tracking**: Accurate realized/unrealized PNL calculations
- **Automatic pricing**: Integration with ancarat API (VND) and Yahoo Finance (USD)
- **Robust caching**: 15-minute TTL with stale cache fallback
- **Mirrored architecture**: Follows proven gold investment patterns
- **Generic integration**: Uses existing `CreateInvestment` flow, no special handling needed
- **Transparent display**: Always shows native currency first, converted amount second

### Implementation Advantages

✅ **Zero backend changes** to core investment logic (CreateInvestment, AddTransaction, FIFO, PNL)
✅ **Reuses existing** FX conversion, caching, and enrichment infrastructure
✅ **Type-safe** protobuf definitions ensure consistency
✅ **Tested pattern** - following gold's proven implementation
✅ **Scalable** - easy to add more silver types or precious metals later

The design is production-ready and can be implemented following the phased deployment plan.

---

**Design Status:** Complete - Ready for Implementation
**Next Steps:** Begin Phase 1 (Backend Deployment)
