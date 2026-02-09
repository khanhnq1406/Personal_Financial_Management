# Wallet Total Value Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display wallet balance as "Total Value" (cash + investments) with smart context switching across the application.

**Architecture:** Extend Wallet protobuf message and backend services to aggregate and return investment values alongside cash balance. The Investment model already stores `current_value` (auto-calculated by GORM hooks on create/update), so we simply SUM these stored values per wallet. Frontend implements context-aware display: "Total Value" with breakdown on dashboards/wallet pages, "Available Cash" only in transaction/investment forms. Cache investment values per wallet with 5-minute TTL for performance optimization (reduces repeated SUM queries on frequent page loads).

**Tech Stack:** Go 1.23, GORM, Protocol Buffers, Redis, Next.js 15, React 19, TypeScript 5, Tailwind CSS 3.4

---

## Key Architecture Notes

**Investment Value Calculation:**
- ✅ **Already stored in database**: `investment.current_value` field is auto-maintained by GORM hooks
- ✅ **Auto-updated**: `BeforeCreate` and `BeforeUpdate` hooks call `recalculate()` which updates `CurrentValue = (Quantity / divisor) * CurrentPrice`
- ✅ **No complex calculation needed**: We simply `SUM(current_value)` from the investment table
- ✅ **Market price updates**: When `UpdateMarketPrice` is called, GORM hook automatically recalculates `current_value`

**Why Cache if Values Are Stored?**
- **Frequent queries**: Dashboard loads trigger `GetTotalBalance` + `ListWallets` on every page refresh
- **Multiple wallets**: User with 10 investment wallets = 10 SUM queries per page load
- **Performance**: Even simple SUM queries add latency; caching reduces load from ~1s to <1ms
- **Refresh rate**: Prices update every 15 minutes, but users refresh pages more frequently
- **5-minute TTL**: Good balance between data freshness and performance

## Prerequisites

Before starting, ensure you understand:

- [investment.go](src/go-backend/domain/models/investment.go:23-92) - Investment model with `current_value` field and `recalculate()` hook
- [wallet.proto](api/protobuf/v1/wallet.proto:134-147) - Wallet message structure with displayBalance pattern
- [wallet_service.go](src/go-backend/domain/service/wallet_service.go) - Wallet business logic and currency conversion
- [investment_repository.go](src/go-backend/domain/repository/investment_repository.go) - Investment data access interface
- [TotalBalance.tsx](src/wj-client/app/dashboard/home/TotalBalance.tsx) - Current total balance component
- [WalletCard.tsx](src/wj-client/app/dashboard/wallets/WalletCard.tsx) - Wallet card component for /wallets page
- [Walllets.tsx](src/wj-client/app/dashboard/home/Walllets.tsx) - Wallet list on home dashboard

---

## Task 1: Add Investment Value Fields to Wallet Protobuf

**Files:**

- Modify: `api/protobuf/v1/wallet.proto:134-147`

**Step 1: Add investment value fields to Wallet message**

In `api/protobuf/v1/wallet.proto`, find the `Wallet` message (starts around line 134). Add after field 11 (`displayCurrency`):

```protobuf
// Investment-related fields (only populated for INVESTMENT type wallets)
wealthjourney.common.v1.Money investmentValue = 12 [json_name = "investmentValue"];         // Current value of all holdings (native currency)
wealthjourney.common.v1.Money displayInvestmentValue = 13 [json_name = "displayInvestmentValue"]; // Investment value (user's preferred currency)
wealthjourney.common.v1.Money totalValue = 14 [json_name = "totalValue"];                   // balance + investmentValue (native currency)
wealthjourney.common.v1.Money displayTotalValue = 15 [json_name = "displayTotalValue"];     // Total value (user's preferred currency)
```

The Wallet message should now have fields 1-15.

**Step 2: Verify protobuf syntax**

Run: `buf lint api/protobuf/v1/wallet.proto`

Expected: No errors

**Step 3: Generate protobuf code**

Run: `task proto:all`

This generates:
- Go code in `src/go-backend/protobuf/v1/`
- TypeScript types in `src/wj-client/gen/protobuf/v1/`

**Step 4: Verify generated code**

Check that new fields appear in:
- `src/go-backend/protobuf/v1/wallet.pb.go`
- `src/wj-client/gen/protobuf/v1/wallet.ts`

---

## Task 2: Add Net Worth Fields to GetTotalBalanceResponse

**Files:**

- Modify: `api/protobuf/v1/wallet.proto:287-297`

**Step 1: Add net worth fields to GetTotalBalanceResponse**

In `api/protobuf/v1/wallet.proto`, find `GetTotalBalanceResponse` (starts around line 288). Add after field 7 (`displayCurrency`):

```protobuf
// Investment aggregation fields
wealthjourney.common.v1.Money totalInvestments = 8 [json_name = "totalInvestments"];           // Sum of all investment values (base currency)
wealthjourney.common.v1.Money displayTotalInvestments = 9 [json_name = "displayTotalInvestments"]; // Converted investments
wealthjourney.common.v1.Money netWorth = 10 [json_name = "netWorth"];                         // data + totalInvestments (base currency)
wealthjourney.common.v1.Money displayNetWorth = 11 [json_name = "displayNetWorth"];           // Converted net worth
```

The GetTotalBalanceResponse message should now have fields 1-11.

**Step 2: Verify protobuf syntax**

Run: `buf lint api/protobuf/v1/wallet.proto`

Expected: No errors

**Step 3: Generate protobuf code**

Run: `task proto:all`

**Step 4: Verify generated code**

Check that new fields appear in:
- `src/go-backend/protobuf/v1/wallet.pb.go`
- `src/wj-client/gen/protobuf/v1/wallet.ts`

---

## Task 3: Add Cache Keys for Investment Values

**Files:**

- Modify: `src/go-backend/pkg/cache/keys.go`

**Step 1: Add cache key constants**

In `src/go-backend/pkg/cache/keys.go`, add constants for investment value caching:

```go
const (
    // Existing keys...

    // Investment value cache keys
    CacheKeyInvestmentValue = "wallet:%d:investment_value"  // Cache key format: wallet:{walletID}:investment_value
    InvestmentValueCacheTTL = 5 * time.Minute              // 5-minute TTL for investment value cache
)
```

**Step 2: Add cache key helper function**

Add helper function to generate cache keys:

```go
// GetInvestmentValueCacheKey returns the Redis cache key for wallet investment value
func GetInvestmentValueCacheKey(walletID int32) string {
    return fmt.Sprintf(CacheKeyInvestmentValue, walletID)
}
```

**Step 3: Verify compilation**

Run: `cd src/go-backend && go build ./pkg/cache`

Expected: No errors

---

## Task 4: Add GetInvestmentValue Method to InvestmentRepository

**Files:**

- Modify: `src/go-backend/domain/repository/investment_repository.go:10-44`

**Step 1: Add GetInvestmentValue method to interface**

In `src/go-backend/domain/repository/investment_repository.go`, add to the `InvestmentRepository` interface after `GetAggregatedPortfolioSummary`:

```go
// GetInvestmentValue aggregates total current value of all investments in a wallet
// Note: current_value is already calculated and stored by GORM hooks (BeforeCreate/BeforeUpdate)
GetInvestmentValue(ctx context.Context, walletID int32) (int64, error)

// GetInvestmentValuesByWalletIDs batch fetches investment values for multiple wallets
GetInvestmentValuesByWalletIDs(ctx context.Context, walletIDs []int32) (map[int32]int64, error)
```

**Step 2: Implement GetInvestmentValue in investment_repository_impl.go**

In `src/go-backend/domain/repository/investment_repository_impl.go`, add the implementation:

```go
// GetInvestmentValue aggregates total current value of all investments in a wallet.
//
// IMPORTANT: We simply SUM the stored current_value field, which is auto-maintained by GORM hooks.
// The Investment model's BeforeCreate and BeforeUpdate hooks call recalculate() which updates:
//   CurrentValue = (Quantity / divisor) * CurrentPrice
//
// This means we don't need to recalculate on every query - just SUM the pre-calculated values.
func (r *investmentRepositoryImpl) GetInvestmentValue(ctx context.Context, walletID int32) (int64, error) {
    var totalValue int64

    // Simple SUM query - current_value is already calculated and stored
    err := r.db.WithContext(ctx).
        Model(&models.Investment{}).
        Where("wallet_id = ? AND deleted_at IS NULL", walletID).
        Select("COALESCE(SUM(current_value), 0)").
        Scan(&totalValue).Error

    if err != nil {
        return 0, err
    }

    return totalValue, nil
}

// GetInvestmentValuesByWalletIDs batch fetches investment values for multiple wallets.
// Uses a single GROUP BY query for efficiency.
func (r *investmentRepositoryImpl) GetInvestmentValuesByWalletIDs(ctx context.Context, walletIDs []int32) (map[int32]int64, error) {
    if len(walletIDs) == 0 {
        return make(map[int32]int64), nil
    }

    type Result struct {
        WalletID int32
        Total    int64
    }

    var results []Result
    err := r.db.WithContext(ctx).
        Model(&models.Investment{}).
        Where("wallet_id IN ? AND deleted_at IS NULL", walletIDs).
        Select("wallet_id, COALESCE(SUM(current_value), 0) as total").
        Group("wallet_id").
        Scan(&results).Error

    if err != nil {
        return nil, err
    }

    // Convert to map
    valueMap := make(map[int32]int64, len(walletIDs))
    for _, r := range results {
        valueMap[r.WalletID] = r.Total
    }

    // Ensure all requested wallets have an entry (0 if no investments)
    for _, walletID := range walletIDs {
        if _, exists := valueMap[walletID]; !exists {
            valueMap[walletID] = 0
        }
    }

    return valueMap, nil
}
```

**Step 3: Verify compilation**

Run: `cd src/go-backend && go build ./domain/repository`

Expected: No errors

---

## Task 5: Add Investment Value Caching to WalletService

**Files:**

- Modify: `src/go-backend/domain/service/wallet_service.go:17-48`

**Step 1: Add investmentRepo to walletService struct**

In `src/go-backend/domain/service/wallet_service.go`, update the `walletService` struct (around line 18) to include investment repository:

```go
type walletService struct {
    walletRepo       repository.WalletRepository
    userRepo         repository.UserRepository
    txRepo           repository.TransactionRepository
    categoryRepo     repository.CategoryRepository
    categoryService  CategoryService
    fxRateSvc        FXRateService
    currencyCache    *cache.CurrencyCache
    investmentRepo   repository.InvestmentRepository  // NEW
    redisCache       *redis.Client                    // NEW: for investment value caching
    mapper           *WalletMapper
}
```

**Step 2: Update NewWalletService constructor**

Update the constructor (around line 30):

```go
func NewWalletService(
    walletRepo repository.WalletRepository,
    userRepo repository.UserRepository,
    txRepo repository.TransactionRepository,
    categoryRepo repository.CategoryRepository,
    categoryService CategoryService,
    fxRateSvc FXRateService,
    currencyCache *cache.CurrencyCache,
    investmentRepo repository.InvestmentRepository,  // NEW
    redisCache *redis.Client,                        // NEW
) WalletService {
    return &walletService{
        walletRepo:       walletRepo,
        userRepo:         userRepo,
        txRepo:           txRepo,
        categoryRepo:     categoryRepo,
        categoryService:  categoryService,
        fxRateSvc:        fxRateSvc,
        currencyCache:    currencyCache,
        investmentRepo:   investmentRepo,  // NEW
        redisCache:       redisCache,      // NEW
        mapper:           NewWalletMapper(),
    }
}
```

**Step 3: Add cache helper methods**

Add these helper methods to `wallet_service.go`:

```go
// getInvestmentValueWithCache retrieves investment value from cache or database
func (s *walletService) getInvestmentValueWithCache(ctx context.Context, walletID int32) (int64, error) {
    // Try cache first
    cacheKey := cache.GetInvestmentValueCacheKey(walletID)
    cachedValue, err := s.redisCache.Get(ctx, cacheKey).Int64()
    if err == nil {
        return cachedValue, nil
    }

    // Cache miss - fetch from database
    value, err := s.investmentRepo.GetInvestmentValue(ctx, walletID)
    if err != nil {
        return 0, err
    }

    // Store in cache
    s.redisCache.Set(ctx, cacheKey, value, cache.InvestmentValueCacheTTL)

    return value, nil
}

// invalidateInvestmentValueCache clears the cached investment value for a wallet
func (s *walletService) invalidateInvestmentValueCache(ctx context.Context, walletID int32) {
    cacheKey := cache.GetInvestmentValueCacheKey(walletID)
    s.redisCache.Del(ctx, cacheKey)
}

// getInvestmentValuesForWallets batch fetches investment values for multiple wallets (with caching)
func (s *walletService) getInvestmentValuesForWallets(ctx context.Context, walletIDs []int32) (map[int32]int64, error) {
    if len(walletIDs) == 0 {
        return make(map[int32]int64), nil
    }

    valueMap := make(map[int32]int64, len(walletIDs))
    uncachedIDs := []int32{}

    // Try to get values from cache
    for _, walletID := range walletIDs {
        cacheKey := cache.GetInvestmentValueCacheKey(walletID)
        cachedValue, err := s.redisCache.Get(ctx, cacheKey).Int64()
        if err == nil {
            valueMap[walletID] = cachedValue
        } else {
            uncachedIDs = append(uncachedIDs, walletID)
        }
    }

    // Fetch uncached values from database
    if len(uncachedIDs) > 0 {
        dbValues, err := s.investmentRepo.GetInvestmentValuesByWalletIDs(ctx, uncachedIDs)
        if err != nil {
            return nil, err
        }

        // Merge and cache
        for walletID, value := range dbValues {
            valueMap[walletID] = value
            cacheKey := cache.GetInvestmentValueCacheKey(walletID)
            s.redisCache.Set(ctx, cacheKey, value, cache.InvestmentValueCacheTTL)
        }
    }

    return valueMap, nil
}
```

**Step 4: Verify compilation**

Run: `cd src/go-backend && go build ./domain/service`

Expected: No errors

---

## Task 6: Update GetWallet to Include Investment Values

**Files:**

- Modify: `src/go-backend/domain/service/wallet_service.go` (GetWallet method)

**Step 1: Locate and update GetWallet method**

Find the `GetWallet` method in `wallet_service.go`. After fetching the wallet from repository and before building the response, add investment value calculation:

```go
func (s *walletService) GetWallet(ctx context.Context, walletID int32, userID int32) (*walletv1.GetWalletResponse, error) {
    // Existing validation and wallet fetch...
    wallet, err := s.walletRepo.GetByID(ctx, walletID)
    if err != nil {
        return nil, err
    }

    // Verify ownership
    if wallet.UserID != userID {
        return nil, apperrors.NewForbiddenError("you do not have access to this wallet")
    }

    // Get user for currency conversion
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }

    // NEW: Calculate investment value for INVESTMENT wallets
    var investmentValue int64 = 0
    if wallet.Type == walletv1.WalletType_WALLET_TYPE_INVESTMENT {
        investmentValue, err = s.getInvestmentValueWithCache(ctx, walletID)
        if err != nil {
            // Log error but don't fail the request
            // Return wallet with 0 investment value
            investmentValue = 0
        }
    }

    // Calculate total value
    totalValue := wallet.Balance + investmentValue

    // Convert values to user's preferred currency
    userCurrency := user.Currency

    // Balance conversion (existing)
    displayBalance := s.convertToUserCurrency(wallet.Balance, wallet.Currency, userCurrency)

    // NEW: Investment value conversion
    displayInvestmentValue := s.convertToUserCurrency(investmentValue, wallet.Currency, userCurrency)

    // NEW: Total value conversion
    displayTotalValue := s.convertToUserCurrency(totalValue, wallet.Currency, userCurrency)

    // Build response
    walletProto := &walletv1.Wallet{
        Id:                     wallet.ID,
        UserId:                 wallet.UserID,
        WalletName:             wallet.WalletName,
        Balance:                &commonv1.Money{Amount: wallet.Balance, Currency: wallet.Currency},
        Currency:               wallet.Currency,
        Type:                   wallet.Type,
        Status:                 wallet.Status,
        CreatedAt:              wallet.CreatedAt.Unix(),
        UpdatedAt:              wallet.UpdatedAt.Unix(),
        DisplayBalance:         displayBalance,
        DisplayCurrency:        userCurrency,
        InvestmentValue:        &commonv1.Money{Amount: investmentValue, Currency: wallet.Currency},
        DisplayInvestmentValue: displayInvestmentValue,
        TotalValue:             &commonv1.Money{Amount: totalValue, Currency: wallet.Currency},
        DisplayTotalValue:      displayTotalValue,
    }

    return &walletv1.GetWalletResponse{
        Success: true,
        Message: "Wallet retrieved successfully",
        Data:    walletProto,
    }, nil
}
```

**Step 2: Add convertToUserCurrency helper if not exists**

If `convertToUserCurrency` helper doesn't exist, add it:

```go
// convertToUserCurrency converts an amount from wallet currency to user's preferred currency
func (s *walletService) convertToUserCurrency(amount int64, fromCurrency, toCurrency string) *commonv1.Money {
    if fromCurrency == toCurrency {
        return &commonv1.Money{Amount: amount, Currency: toCurrency}
    }

    // Use existing FX rate service
    rate, err := s.fxRateSvc.GetRate(context.Background(), fromCurrency, toCurrency)
    if err != nil {
        // Return original amount if conversion fails
        return &commonv1.Money{Amount: amount, Currency: fromCurrency}
    }

    convertedAmount := int64(float64(amount) * rate)
    return &commonv1.Money{Amount: convertedAmount, Currency: toCurrency}
}
```

**Step 3: Verify compilation**

Run: `cd src/go-backend && go build ./domain/service`

Expected: No errors

---

## Task 7: Update ListWallets to Include Investment Values

**Files:**

- Modify: `src/go-backend/domain/service/wallet_service.go` (ListWallets method)

**Step 1: Update ListWallets to batch fetch investment values**

Find the `ListWallets` method and update it:

```go
func (s *walletService) ListWallets(ctx context.Context, userID int32, pagination *types.Pagination) (*walletv1.ListWalletsResponse, error) {
    // Existing validation and wallet fetch...
    wallets, err := s.walletRepo.ListByUserID(ctx, userID, pagination)
    if err != nil {
        return nil, err
    }

    // Get user for currency conversion
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    userCurrency := user.Currency

    // NEW: Collect investment wallet IDs
    investmentWalletIDs := []int32{}
    for _, wallet := range wallets {
        if wallet.Type == walletv1.WalletType_WALLET_TYPE_INVESTMENT {
            investmentWalletIDs = append(investmentWalletIDs, wallet.ID)
        }
    }

    // NEW: Batch fetch investment values
    investmentValueMap := make(map[int32]int64)
    if len(investmentWalletIDs) > 0 {
        investmentValueMap, err = s.getInvestmentValuesForWallets(ctx, investmentWalletIDs)
        if err != nil {
            // Log error but continue with 0 values
            investmentValueMap = make(map[int32]int64)
        }
    }

    // Build response with investment values
    walletProtos := make([]*walletv1.Wallet, len(wallets))
    for i, wallet := range wallets {
        investmentValue := investmentValueMap[wallet.ID]
        totalValue := wallet.Balance + investmentValue

        // Convert values
        displayBalance := s.convertToUserCurrency(wallet.Balance, wallet.Currency, userCurrency)
        displayInvestmentValue := s.convertToUserCurrency(investmentValue, wallet.Currency, userCurrency)
        displayTotalValue := s.convertToUserCurrency(totalValue, wallet.Currency, userCurrency)

        walletProtos[i] = &walletv1.Wallet{
            Id:                     wallet.ID,
            UserId:                 wallet.UserID,
            WalletName:             wallet.WalletName,
            Balance:                &commonv1.Money{Amount: wallet.Balance, Currency: wallet.Currency},
            Currency:               wallet.Currency,
            Type:                   wallet.Type,
            Status:                 wallet.Status,
            CreatedAt:              wallet.CreatedAt.Unix(),
            UpdatedAt:              wallet.UpdatedAt.Unix(),
            DisplayBalance:         displayBalance,
            DisplayCurrency:        userCurrency,
            InvestmentValue:        &commonv1.Money{Amount: investmentValue, Currency: wallet.Currency},
            DisplayInvestmentValue: displayInvestmentValue,
            TotalValue:             &commonv1.Money{Amount: totalValue, Currency: wallet.Currency},
            DisplayTotalValue:      displayTotalValue,
        }
    }

    return &walletv1.ListWalletsResponse{
        Success:  true,
        Message:  "Wallets retrieved successfully",
        Wallets:  walletProtos,
        // ... pagination fields
    }, nil
}
```

**Step 2: Verify compilation**

Run: `cd src/go-backend && go build ./domain/service`

Expected: No errors

---

## Task 8: Update GetTotalBalance to Include Net Worth

**Files:**

- Modify: `src/go-backend/domain/service/wallet_service.go` (GetTotalBalance method)

**Step 1: Update GetTotalBalance to aggregate investments**

Find the `GetTotalBalance` method and update it:

```go
func (s *walletService) GetTotalBalance(ctx context.Context, userID int32) (*walletv1.GetTotalBalanceResponse, error) {
    // Existing validation and wallet fetch...
    wallets, err := s.walletRepo.ListByUserID(ctx, userID, nil)
    if err != nil {
        return nil, err
    }

    // Get user for currency conversion
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    userCurrency := user.Currency

    var totalCash int64 = 0
    var totalInvestments int64 = 0
    baseCurrency := "VND" // Default base currency

    // Collect investment wallet IDs
    investmentWalletIDs := []int32{}
    for _, wallet := range wallets {
        totalCash += wallet.Balance
        if wallet.Currency != baseCurrency {
            // Convert to base currency if needed
            converted := s.convertToUserCurrency(wallet.Balance, wallet.Currency, baseCurrency)
            totalCash += converted.Amount - wallet.Balance
        }

        if wallet.Type == walletv1.WalletType_WALLET_TYPE_INVESTMENT {
            investmentWalletIDs = append(investmentWalletIDs, wallet.ID)
        }
    }

    // NEW: Fetch and aggregate investment values
    if len(investmentWalletIDs) > 0 {
        investmentValueMap, err := s.getInvestmentValuesForWallets(ctx, investmentWalletIDs)
        if err != nil {
            // Log error but continue
            totalInvestments = 0
        } else {
            for _, value := range investmentValueMap {
                totalInvestments += value
            }
        }
    }

    // Calculate net worth
    netWorth := totalCash + totalInvestments

    // Convert to user's preferred currency
    displayCash := s.convertToUserCurrency(totalCash, baseCurrency, userCurrency)
    displayInvestments := s.convertToUserCurrency(totalInvestments, baseCurrency, userCurrency)
    displayNetWorth := s.convertToUserCurrency(netWorth, baseCurrency, userCurrency)

    return &walletv1.GetTotalBalanceResponse{
        Success:                 true,
        Message:                 "Total balance retrieved successfully",
        Data:                    &commonv1.Money{Amount: totalCash, Currency: baseCurrency},
        Currency:                baseCurrency,
        DisplayValue:            displayCash,
        DisplayCurrency:         userCurrency,
        TotalInvestments:        &commonv1.Money{Amount: totalInvestments, Currency: baseCurrency},
        DisplayTotalInvestments: displayInvestments,
        NetWorth:                &commonv1.Money{Amount: netWorth, Currency: baseCurrency},
        DisplayNetWorth:         displayNetWorth,
    }, nil
}
```

**Step 2: Verify compilation**

Run: `cd src/go-backend && go build ./domain/service`

Expected: No errors

---

## Task 9: Update Service Initialization to Include InvestmentRepo

**Files:**

- Modify: `src/go-backend/cmd/main.go` (or wherever WalletService is initialized)

**Step 1: Locate WalletService initialization**

Find where `NewWalletService` is called (typically in `main.go` or a service initialization file).

**Step 2: Pass investmentRepo and redisCache**

Update the call to include the new dependencies:

```go
walletService := service.NewWalletService(
    walletRepo,
    userRepo,
    txRepo,
    categoryRepo,
    categoryService,
    fxRateService,
    currencyCache,
    investmentRepo,  // NEW
    redisClient,     // NEW
)
```

**Step 3: Verify compilation**

Run: `cd src/go-backend && go build ./cmd`

Expected: No errors

---

## Task 10: Update InvestmentService to Invalidate Cache

**Files:**

- Modify: `src/go-backend/domain/service/investment_service.go`

**Important Note:** Cache invalidation is CRITICAL because:
- Investment `current_value` is auto-updated by GORM hooks when market prices change
- Our cache stores the SUM of these values, which becomes stale when ANY investment in the wallet changes
- Without invalidation, users see outdated wallet balances after buying/selling/price updates

**Step 1: Add walletService dependency to investmentService**

In `investment_service.go`, update the struct to include wallet service:

```go
type investmentService struct {
    investmentRepo    repository.InvestmentRepository
    txRepo            repository.InvestmentTransactionRepository
    lotRepo           repository.InvestmentLotRepository
    walletRepo        repository.WalletRepository
    walletService     WalletService  // NEW: for cache invalidation
    marketDataService MarketDataService
}
```

**Step 2: Update constructor**

```go
func NewInvestmentService(
    investmentRepo repository.InvestmentRepository,
    txRepo repository.InvestmentTransactionRepository,
    lotRepo repository.InvestmentLotRepository,
    walletRepo repository.WalletRepository,
    walletService WalletService,  // NEW
    marketDataService MarketDataService,
) InvestmentService {
    return &investmentService{
        investmentRepo:    investmentRepo,
        txRepo:            txRepo,
        lotRepo:           lotRepo,
        walletRepo:        walletRepo,
        walletService:     walletService,  // NEW
        marketDataService: marketDataService,
    }
}
```

**Step 3: Add cache invalidation after investment changes**

In the following methods, add cache invalidation AFTER successful operations:

**Locations to invalidate:**
1. `CreateInvestment` - After investment is created
2. `AddTransaction` - After BUY/SELL/DIVIDEND transaction is added
3. `UpdateMarketPrice` - After price update (this triggers GORM hook to recalculate current_value)
4. `DeleteInvestment` - After investment is deleted
5. `DeleteTransaction` - After transaction reversal changes quantities

Example implementation at the end of each method:

```go
// Invalidate wallet investment value cache since current_value has changed
if ws, ok := s.walletService.(*walletService); ok {
    ws.invalidateInvestmentValueCache(ctx, investment.WalletID)
}
```

**Complete example for CreateInvestment:**

```go
func (s *investmentService) CreateInvestment(ctx context.Context, userID int32, req *investmentv1.CreateInvestmentRequest) (*investmentv1.CreateInvestmentResponse, error) {
    // ... existing logic ...

    // Invalidate wallet investment value cache
    // (current_value was set by GORM BeforeCreate hook)
    if ws, ok := s.walletService.(*walletService); ok {
        ws.invalidateInvestmentValueCache(ctx, req.WalletId)
    }

    return &investmentv1.CreateInvestmentResponse{
        Investment: investment.ToProto(),
    }, nil
}
```

**Step 4: Verify compilation**

Run: `cd src/go-backend && go build ./domain/service`

Expected: No errors

---

## Task 11: Update Frontend TotalBalance Component for Net Worth

**Files:**

- Modify: `src/wj-client/app/dashboard/home/TotalBalance.tsx`

**Step 1: Update TotalBalance to show net worth**

Replace the component with:

```typescript
import { ButtonType, resources } from "@/app/constants";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { TotalBalanceSkeleton } from "@/components/loading/Skeleton";
import { formatCurrency, getCurrencySymbol } from "@/utils/currency-formatter";
import { useQueryGetTotalBalance } from "@/utils/generated/hooks";
import { memo, useMemo, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

const displayImgList = [`${resources}/unhide.png`, `${resources}/hide.png`];

export const TotalBalance = memo(function TotalBalance() {
  const [isHide, setHide] = useState(false);
  const [displayImg, setDisplayImg] = useState(displayImgList[0]);
  const { currency } = useCurrency();

  const getTotalBalance = useQueryGetTotalBalance({});

  const balanceData = useMemo(() => {
    const netWorth = getTotalBalance.data?.displayNetWorth?.amount ||
                     getTotalBalance.data?.netWorth?.amount || 0;
    const totalCash = getTotalBalance.data?.displayValue?.amount ||
                      getTotalBalance.data?.data?.amount || 0;
    const totalInvestments = getTotalBalance.data?.displayTotalInvestments?.amount || 0;
    const displayCurrency = getTotalBalance.data?.displayCurrency || currency;

    return {
      netWorth: formatCurrency(netWorth, displayCurrency),
      totalCash: formatCurrency(totalCash, displayCurrency),
      totalInvestments: formatCurrency(totalInvestments, displayCurrency),
      displayCurrency,
    };
  }, [getTotalBalance.data, currency]);

  const handleHideBalance = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setHide(!isHide);
    setDisplayImg(displayImgList[Number(!isHide)]);
  };

  if (getTotalBalance.isLoading) {
    return (
      <div className="py-5 hidden sm:block">
        <BaseCard>
          <TotalBalanceSkeleton />
        </BaseCard>
      </div>
    );
  }

  const displayBalance = getTotalBalance.error
    ? `0 ${getCurrencySymbol(currency)}`
    : balanceData.netWorth;

  return (
    <div className="py-5 hidden sm:block">
      <BaseCard>
        <div className="flex items-center justify-between py-5 flex-wrap px-5">
          <div className="flex-1">
            <div className="text-[#99A3A5] font-semibold mb-2">
              Total Net Worth
            </div>
            <div className="font-bold text-2xl break-all mb-3">
              {isHide ? "*****" : displayBalance}
            </div>
            {!isHide && (
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Cash: {balanceData.totalCash}</span>
                <span>Investments: {balanceData.totalInvestments}</span>
              </div>
            )}
          </div>
          <div>
            <Button
              type={ButtonType.IMG}
              src={displayImg}
              onClick={handleHideBalance}
            />
          </div>
        </div>
      </BaseCard>
    </div>
  );
});
```

**Step 2: Verify component renders**

Run: `cd src/wj-client && npm run build`

Expected: No TypeScript errors

---

## Task 12: Update Home Dashboard Wallets List

**Files:**

- Modify: `src/wj-client/app/dashboard/home/Walllets.tsx`

**Step 1: Update WalletItem to show total value for investment wallets**

Replace the `WalletItem` component:

```typescript
const WalletItem = memo(function WalletItem({
  wallet,
  currency,
}: {
  wallet: any; // Use proper Wallet type
  currency: string;
}) {
  const isInvestmentWallet = wallet.type === 1; // WALLET_TYPE_INVESTMENT

  // For investment wallets, show total value; for basic wallets, show balance
  const displayValue = isInvestmentWallet
    ? wallet.displayTotalValue?.amount ?? wallet.totalValue?.amount ?? 0
    : wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0;

  const cashBalance = wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0;

  return (
    <div className="flex flex-nowrap justify-between m-3">
      <div className="flex flex-nowrap gap-3">
        <Image
          width={25}
          height={25}
          alt="wallet-icon"
          src={`${resources}wallet.png`}
        />
        <div className="font-semibold">{wallet.walletName}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{formatCurrency(displayValue, currency)}</div>
        {isInvestmentWallet && (
          <div className="text-xs text-gray-500">
            Cash: {formatCurrency(cashBalance, currency)}
          </div>
        )}
      </div>
    </div>
  );
});
```

**Step 2: Update Wallets component to pass full wallet object**

```typescript
const Wallets: React.FC<WalletsProps> = memo(function Wallets({
  getListWallets,
}) {
  const { isLoading, data } = getListWallets;
  const { currency } = useCurrency();

  const walletList = useMemo(() => {
    if (!data?.wallets || data.wallets.length === 0) {
      return <EmptyWalletsState />;
    }

    return data.wallets.map((wallet) => (
      <WalletItem
        key={wallet.id}
        wallet={wallet}
        currency={currency}
      />
    ));
  }, [data, currency]);

  if (isLoading) {
    return <WalletListSkeleton />;
  }

  return <div className="px-2 py-1">{walletList}</div>;
});
```

**Step 3: Verify component renders**

Run: `cd src/wj-client && npm run build`

Expected: No TypeScript errors

---

## Task 13: Create ProgressBar Component for WalletCard

**Files:**

- Create: `src/wj-client/components/ProgressBar.tsx`

**Step 1: Create ProgressBar component**

```typescript
import { memo } from "react";

interface ProgressBarProps {
  percentage: number; // 0-100
  label?: string;
  color?: string;
}

export const ProgressBar = memo(function ProgressBar({
  percentage,
  label,
  color = "#008148", // Default to theme green
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {label && (
        <div className="text-xs text-gray-600 mb-1 text-right">{label}</div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
});
```

**Step 2: Verify component compiles**

Run: `cd src/wj-client && npm run build`

Expected: No TypeScript errors

---

## Task 14: Update WalletCard with Visual Progress Bar

**Files:**

- Modify: `src/wj-client/app/dashboard/wallets/WalletCard.tsx`

**Step 1: Update WalletCard to show Option 3 (visual progress bar)**

Replace the component:

```typescript
import { memo } from "react";
import Image from "next/image";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { ButtonType, resources } from "@/app/constants";
import { formatCurrency } from "@/utils/currency-formatter";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProgressBar } from "@/components/ProgressBar";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}

export const WalletCard = memo(function WalletCard({
  wallet,
  onEdit,
  onDelete,
}: WalletCardProps) {
  const { currency } = useCurrency();
  const isInvestmentWallet = wallet.type === 1; // WALLET_TYPE_INVESTMENT

  // Use displayBalance/displayTotalValue if available (converted), otherwise use original
  const balance = wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0;
  const displayCurrency = wallet.displayCurrency || currency;

  // For investment wallets, calculate total value and breakdown
  let totalValue = balance;
  let investmentValue = 0;
  let cashPercentage = 100;

  if (isInvestmentWallet) {
    totalValue = wallet.displayTotalValue?.amount ?? wallet.totalValue?.amount ?? balance;
    investmentValue = wallet.displayInvestmentValue?.amount ?? wallet.investmentValue?.amount ?? 0;

    // Calculate percentage of cash vs investments
    if (totalValue > 0) {
      cashPercentage = Math.round((balance / totalValue) * 100);
    }
  }

  return (
    <BaseCard className="p-4">
      <div className="flex flex-col gap-3">
        {/* Header with wallet icon, name and actions */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Image
              src={`${resources}wallet.png`}
              alt="Wallet"
              width={32}
              height={32}
            />
            <h3 className="text-lg font-semibold">{wallet.walletName}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              type={ButtonType.IMG}
              src={`${resources}/editing.png`}
              onClick={() => onEdit(wallet)}
            />
            <Button
              type={ButtonType.IMG}
              src={`${resources}/remove.png`}
              onClick={() => onDelete(wallet)}
            />
          </div>
        </div>

        {/* Balance display */}
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {isInvestmentWallet ? "Total Value" : "Balance"}
          </div>
          <div className="text-2xl font-bold text-bg">
            {formatCurrency(totalValue, displayCurrency)}
          </div>
        </div>

        {/* Investment wallet breakdown with progress bar */}
        {isInvestmentWallet && totalValue > 0 && (
          <div className="mt-2">
            <ProgressBar
              percentage={cashPercentage}
              label={`${cashPercentage}% cash`}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Cash: {formatCurrency(balance, displayCurrency)}</span>
              <span>Investments: {formatCurrency(investmentValue, displayCurrency)}</span>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
});
```

**Step 2: Verify component renders**

Run: `cd src/wj-client && npm run build`

Expected: No TypeScript errors

---

## Task 15: Ensure Transaction Forms Show Available Cash Only

**Files:**

- Verify: `src/wj-client/components/modals/forms/AddTransactionForm.tsx`
- Verify: `src/wj-client/components/modals/forms/AddInvestmentForm.tsx`
- Verify: `src/wj-client/components/modals/forms/TransferMoneyForm.tsx`

**Step 1: Check AddTransactionForm wallet display**

In `AddTransactionForm.tsx`, locate where wallets are displayed in the select dropdown. Ensure it shows `wallet.displayBalance` (not `displayTotalValue`):

```typescript
// Around line 90-100
const walletOptions: SelectOption[] = useMemo(() => {
  if (!walletsData?.wallets) return [];
  return walletsData.wallets.map((wallet) => ({
    value: String(wallet.id),
    label: `${wallet.walletName} - ${formatCurrency(
      wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0,
      wallet.displayCurrency || currency
    )} available`,
  }));
}, [walletsData, currency]);
```

**Step 2: Check AddInvestmentForm wallet display**

In `AddInvestmentForm.tsx`, verify wallet selection shows available cash:

```typescript
// Around line 100-120
const walletOptions: SelectOption[] = useMemo(() => {
  if (!walletsData?.wallets) return [];
  return walletsData.wallets
    .filter((w) => w.type === WalletType.WALLET_TYPE_INVESTMENT)
    .map((wallet) => ({
      value: String(wallet.id),
      label: `${wallet.walletName} - ${formatCurrency(
        wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0,
        wallet.displayCurrency || currency
      )} available`,
    }));
}, [walletsData, currency]);
```

**Step 3: Check TransferMoneyForm**

Verify both "From Wallet" and "To Wallet" dropdowns show available cash:

```typescript
const walletOptions: SelectOption[] = useMemo(() => {
  if (!walletsData?.wallets) return [];
  return walletsData.wallets.map((wallet) => ({
    value: String(wallet.id),
    label: `${wallet.walletName} - ${formatCurrency(
      wallet.displayBalance?.amount ?? wallet.balance?.amount ?? 0,
      wallet.displayCurrency || currency
    )}`,
  }));
}, [walletsData, currency]);
```

**Step 4: No changes needed if already correct**

If the forms already use `wallet.displayBalance` or `wallet.balance` (not `totalValue`), no changes are needed.

---

## Task 16: Update Portfolio Page to Show Wallet Cash Balance

**Files:**

- Modify: `src/wj-client/app/dashboard/portfolio/page.tsx`

**Step 1: Add wallet cash balance card**

In the portfolio page, after the wallet selector and before the portfolio summary cards, add a cash balance card:

```typescript
{/* Wallet Cash Balance */}
{selectedWallet && (
  <BaseCard className="p-4 mb-4">
    <div className="flex justify-between items-center">
      <div>
        <div className="text-sm text-gray-600">Available Cash</div>
        <div className="text-xl font-bold text-bg">
          {formatCurrency(
            selectedWallet.displayBalance?.amount ?? selectedWallet.balance?.amount ?? 0,
            selectedWallet.displayCurrency || selectedWallet.currency
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">Ready to invest</div>
      </div>
      <div>
        <div className="text-sm text-gray-600">Total Wallet Value</div>
        <div className="text-xl font-bold">
          {formatCurrency(
            selectedWallet.displayTotalValue?.amount ?? selectedWallet.totalValue?.amount ?? 0,
            selectedWallet.displayCurrency || selectedWallet.currency
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">Cash + Investments</div>
      </div>
    </div>
  </BaseCard>
)}
```

**Step 2: Verify page renders**

Run: `cd src/wj-client && npm run build`

Expected: No TypeScript errors

---

## Task 17: Backend Integration Test

**Files:**

- Test: Manual testing with backend running

**Step 1: Start backend and frontend**

Run: `task dev`

**Step 2: Create test wallets**

1. Create a BASIC wallet with 5,000,000 VND
2. Create an INVESTMENT wallet with 10,000,000 VND

**Step 3: Add investment to INVESTMENT wallet**

1. Create investment: 10 shares @ 500,000 VND = 5,000,000 VND initial cost
2. Verify wallet balance: 5,000,000 VND remaining

**Step 4: Verify home dashboard**

1. Navigate to `/dashboard/home`
2. Verify "Total Net Worth" shows: 10,000,000 VND (5M cash + 5M investments from basic + 5M cash + 5M investments)
3. Verify breakdown shows: "Cash: 10,000,000 VND" and "Investments: 5,000,000 VND"
4. Verify wallet list shows:
   - BASIC wallet: 5,000,000 VND
   - INVESTMENT wallet: 10,000,000 VND (total value) with "Cash: 5,000,000 VND" below

**Step 5: Verify wallets page**

1. Navigate to `/dashboard/wallets`
2. Verify INVESTMENT wallet card shows:
   - Total Value: 10,000,000 VND
   - Progress bar showing 50% cash
   - "Cash: 5,000,000 VND | Investments: 5,000,000 VND"

**Step 6: Verify transaction forms**

1. Open "Add Transaction" modal
2. Select INVESTMENT wallet
3. Verify it shows "5,000,000 VND available" (not 10,000,000)

**Step 7: Verify cache invalidation**

1. Update investment market price to 600,000 VND
2. Investment value should change to: 10 shares × 600,000 = 6,000,000 VND
3. Verify wallet total value updates to: 11,000,000 VND (5M cash + 6M investments)
4. Verify cache is used (no delay on page refresh within 5 minutes)

---

## Task 18: Performance Testing

**Files:**

- Test: Load testing with multiple wallets

**Step 1: Create test scenario**

1. Create user with 10 INVESTMENT wallets
2. Add 5 investments to each wallet (50 total investments)

**Step 2: Test ListWallets performance**

1. Navigate to `/dashboard/home`
2. Open browser DevTools → Network tab
3. Verify `GET /api/v1/wallets` completes in < 500ms
4. Check backend logs for SQL queries
5. Verify only 2 queries:
   - `SELECT * FROM wallet WHERE user_id = ?`
   - `SELECT wallet_id, SUM(current_value) FROM investment WHERE wallet_id IN (...) GROUP BY wallet_id`

**Step 3: Test cache effectiveness**

1. Refresh page 5 times within 1 minute
2. Verify investment values are cached (no DB queries for investment values)
3. Wait 6 minutes
4. Refresh page
5. Verify cache expired (investment values fetched from DB again)

**Step 4: Test cache invalidation**

1. Add new investment to wallet
2. Verify investment value cache is invalidated
3. Verify next page load fetches fresh investment values

---

## Task 19: Error Handling Test

**Files:**

- Test: Error scenarios

**Step 1: Test investment repository failure**

1. Temporarily break investment value query (e.g., wrong table name)
2. Verify wallets still load with investment value = 0
3. Verify no 500 errors
4. Check logs for error message

**Step 2: Test Redis cache failure**

1. Stop Redis server
2. Verify wallets still load (falls back to DB)
3. Verify no 500 errors
4. Restart Redis

**Step 3: Test currency conversion failure**

1. Use wallet with unsupported currency (e.g., "XXX")
2. Verify values display in original currency
3. Verify no 500 errors

---

## Task 20: Update Documentation

**Files:**

- Create: `docs/architecture/wallet-total-value.md`

**Step 1: Create architecture documentation**

Create file `docs/architecture/wallet-total-value.md`:

```markdown
# Wallet Total Value Display

## Overview

The wallet balance system displays different values based on context:
- **Total Value** = Available Cash + Current Investment Value (for INVESTMENT wallets)
- **Available Cash** = Spendable balance (used in transaction forms)

## Backend Architecture

### Protobuf Fields

**Wallet message:**
- `balance`: Available cash in smallest currency unit
- `investmentValue`: Current value of all holdings
- `totalValue`: balance + investmentValue
- `displayBalance`, `displayInvestmentValue`, `displayTotalValue`: Converted to user's preferred currency

**GetTotalBalanceResponse:**
- `data`: Total cash across all wallets
- `totalInvestments`: Sum of all investment values
- `netWorth`: data + totalInvestments
- `displayValue`, `displayTotalInvestments`, `displayNetWorth`: Converted values

### Caching Strategy

- Investment values cached in Redis with 5-minute TTL
- Cache key: `wallet:{walletID}:investment_value`
- Invalidated on: CreateInvestment, AddTransaction, UpdateMarketPrice, DeleteInvestment

### Performance

- Batch fetching: `GetInvestmentValuesByWalletIDs` for multiple wallets
- Single query: `SELECT wallet_id, SUM(current_value) FROM investment WHERE wallet_id IN (...) GROUP BY wallet_id`

## Frontend Display Rules

| Context | Display | Component |
|---------|---------|-----------|
| Home Dashboard - Total Balance | Net Worth (cash + investments) | TotalBalance.tsx |
| Home Dashboard - Wallet List | Total Value for INVESTMENT, Balance for BASIC | Walllets.tsx |
| Wallets Page - Wallet Cards | Total Value with progress bar (INVESTMENT only) | WalletCard.tsx |
| Transaction Forms | Available Cash only | AddTransactionForm.tsx |
| Investment Forms | Available Cash only | AddInvestmentForm.tsx |
| Portfolio Page | Both values side-by-side | portfolio/page.tsx |

## Implementation Details

See [2026-01-30-wallet-total-value-display.md](../../plans/2026-01-30-wallet-total-value-display.md) for detailed implementation steps.
```

**Step 2: Update main README**

Add link to architecture doc in project README.

---

## Verification Checklist

- [ ] Protobuf fields added to Wallet and GetTotalBalanceResponse
- [ ] Protobuf code generated (Go + TypeScript)
- [ ] Cache keys defined for investment values
- [ ] InvestmentRepository has GetInvestmentValue methods
- [ ] WalletService updated to calculate and cache investment values
- [ ] GetWallet includes investment value, total value, display fields
- [ ] ListWallets batch fetches investment values
- [ ] GetTotalBalance includes net worth calculation
- [ ] InvestmentService invalidates cache on changes
- [ ] TotalBalance component shows net worth with breakdown
- [ ] Home wallet list shows total value for INVESTMENT wallets
- [ ] WalletCard shows visual progress bar (Option 3)
- [ ] Transaction forms show available cash only
- [ ] Portfolio page shows both cash and total value
- [ ] Backend integration tested (basic + investment wallets)
- [ ] Cache invalidation works
- [ ] Performance acceptable (< 500ms for ListWallets)
- [ ] Error handling works (no 500 errors on failures)
- [ ] Documentation updated

---

## Rollback Plan

If issues arise after deployment:

1. **Protobuf rollback**: Revert to previous .proto files and regenerate code
2. **Backend rollback**: Deploy previous version of wallet_service.go
3. **Frontend rollback**: Revert frontend components to show balance only
4. **Cache clear**: Flush Redis investment value cache: `redis-cli KEYS "wallet:*:investment_value" | xargs redis-cli DEL`

The feature is backward compatible - old frontend will ignore new protobuf fields.

---

## Related Plans

- [2026-01-30-investment-wallet-balance-integration.md](2026-01-30-investment-wallet-balance-integration.md) - Investment transaction wallet balance integration
