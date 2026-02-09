# Implementation Plan: Investment Portfolio Wallet Selection & Filtering

## Overview

Add wallet selection and type filtering to the investment portfolio page, allowing users to:
1. View investments across "All Investment Wallets" (aggregated view)
2. Filter by investment type (All Types, Crypto, Stock, ETF)
3. Select specific investment wallets
4. See aggregated portfolio summary when viewing all wallets

This follows the established pattern from the Transaction page while adapting to the portfolio page's specific requirements.

---

## Current State Analysis

### Portfolio Page ([portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx))
- Uses native `<select>` dropdown (only shown if >1 investment wallet exists)
- State: `selectedWalletId: number | null`
- Always fetches from a single wallet via `useQueryListInvestments({ walletId: selectedWalletId })`
- `typeFilter` hardcoded to `0` (no filtering)
- Portfolio summary fetched per-wallet only via `useQueryGetPortfolioSummary({ walletId })`
- Auto-selects first investment wallet on mount (lines 476-483)
- Uses `startTransition()` for non-urgent wallet selection updates
- No "All Wallets" aggregation support

### Transaction Page Pattern (Reference - [transaction/page.tsx](src/wj-client/app/dashboard/transaction/page.tsx))
- Uses `SelectDropdown` component
- State: `selectedWallet: string | null`
- Supports "All Wallets" via empty string `""` value (line 198)
- When walletId is undefined, API returns all transactions
- Filter object built with `useMemo` (lines 48-58)
- Wallet options include divider-less "All Wallets" as first option

### Backend Capabilities
- `ListInvestments` API requires `walletId` - single wallet only ([investment.proto:194-198](api/protobuf/v1/investment.proto))
- Repository has `ListByUserID` method (can fetch all user's investments) - not exposed via API
- Portfolio summary is per-wallet only (`GetPortfolioSummary` requires walletId)
- `typeFilter` parameter already supported in proto but unused by frontend
- Wallet type validation enforced at service layer (must be `INVESTMENT` type)

### Investment Types (from [investment.proto:37-46](api/protobuf/v1/investment.proto))
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
}
```

---

## Implementation Plan

### Phase 1: Backend API Enhancement

#### Step 1.1: Extend Protobuf Definition
**File**: [api/protobuf/v1/investment.proto](api/protobuf/v1/investment.proto)

Add new RPC endpoint for listing investments across all wallets:

```protobuf
// Add to InvestmentService (around line 170)
rpc ListUserInvestments(ListUserInvestmentsRequest) returns (ListUserInvestmentsResponse) {
  option (google.api.http) = {
    get: "/api/v1/investments"
  };
}

rpc GetAggregatedPortfolioSummary(GetAggregatedPortfolioSummaryRequest) returns (GetPortfolioSummaryResponse) {
  option (google.api.http) = {
    get: "/api/v1/portfolio-summary"
  };
}

// New messages (add after existing messages)
message ListUserInvestmentsRequest {
  wealthjourney.common.v1.PaginationParams pagination = 1;
  InvestmentType typeFilter = 2 [json_name = "typeFilter"];
  int32 walletId = 3 [json_name = "walletId"];  // Optional: 0 = all investment wallets
}

message ListUserInvestmentsResponse {
  repeated Investment investments = 1;
  int32 totalCount = 2 [json_name = "totalCount"];
}

message GetAggregatedPortfolioSummaryRequest {
  int32 walletId = 1 [json_name = "walletId"];  // Optional: 0 = aggregate all investment wallets
  InvestmentType typeFilter = 2 [json_name = "typeFilter"];
}
```

Also add `walletName` field to `Investment` message for display in "All Wallets" view:

```protobuf
// In Investment message (around line 35), add:
string walletName = 25 [json_name = "walletName"];  // Name of wallet for display
```

#### Step 1.2: Implement Service Methods
**File**: [src/go-backend/domain/service/investment_service.go](src/go-backend/domain/service/investment_service.go)

Add `ListUserInvestments` method:

```go
// ListUserInvestments returns investments across all user's investment wallets or filtered by specific wallet
func (s *investmentService) ListUserInvestments(ctx context.Context, userID int32, req *investmentv1.ListUserInvestmentsRequest) (*investmentv1.ListUserInvestmentsResponse, error) {
    if err := validator.ID(userID); err != nil {
        return nil, err
    }

    // Parse pagination
    opts, err := parseListOptions(req.Pagination)
    if err != nil {
        return nil, err
    }

    var investments []*models.Investment
    var total int

    if req.WalletId != 0 {
        // Specific wallet requested - validate ownership and type
        wallet, err := s.walletRepo.GetByIDForUser(ctx, req.WalletId, userID)
        if err != nil {
            return nil, err
        }
        if wallet == nil {
            return nil, apperrors.NewNotFoundError("wallet")
        }
        if wallet.Type != walletv1.WalletType_INVESTMENT {
            return nil, apperrors.NewValidationError("investments can only be listed in investment wallets")
        }
        investments, total, err = s.investmentRepo.ListByWalletID(ctx, req.WalletId, opts, req.TypeFilter)
    } else {
        // All investment wallets
        investments, total, err = s.investmentRepo.ListByUserID(ctx, userID, opts, req.TypeFilter)
    }

    if err != nil {
        return nil, fmt.Errorf("failed to list investments: %w", err)
    }

    // Build response with wallet names
    protoInvestments := make([]*investmentv1.Investment, 0, len(investments))
    for _, inv := range investments {
        proto := s.mapper.ToProto(inv)
        // Fetch wallet name for display
        wallet, _ := s.walletRepo.GetByID(ctx, inv.WalletID)
        if wallet != nil {
            proto.WalletName = wallet.WalletName
        }
        protoInvestments = append(protoInvestments, proto)
    }

    return &investmentv1.ListUserInvestmentsResponse{
        Investments: protoInvestments,
        TotalCount:  int32(total),
    }, nil
}
```

Add `GetAggregatedPortfolioSummary` method:

```go
// GetAggregatedPortfolioSummary returns portfolio summary aggregated across all investment wallets or for specific wallet
func (s *investmentService) GetAggregatedPortfolioSummary(ctx context.Context, userID int32, req *investmentv1.GetAggregatedPortfolioSummaryRequest) (*investmentv1.GetPortfolioSummaryResponse, error) {
    if err := validator.ID(userID); err != nil {
        return nil, err
    }

    if req.WalletId != 0 {
        // Specific wallet - delegate to existing method
        return s.GetPortfolioSummary(ctx, req.WalletId, userID)
    }

    // Aggregate across all investment wallets
    summary, err := s.investmentRepo.GetAggregatedPortfolioSummary(ctx, userID, req.TypeFilter)
    if err != nil {
        return nil, fmt.Errorf("failed to get aggregated portfolio summary: %w", err)
    }

    // Get user's preferred currency for conversion
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    displayCurrency := "USD"
    if user != nil && user.PreferredCurrency != "" {
        displayCurrency = user.PreferredCurrency
    }

    return &investmentv1.GetPortfolioSummaryResponse{
        TotalValue:           summary.TotalValue,
        TotalCost:            summary.TotalCost,
        TotalUnrealizedPnl:   summary.TotalUnrealizedPnl,
        TotalRealizedPnl:     summary.TotalRealizedPnl,
        TotalDividends:       summary.TotalDividends,
        TotalUnrealizedPnlPercent: summary.TotalUnrealizedPnlPercent,
        DisplayCurrency:      displayCurrency,
        // ... other fields
    }, nil
}
```

#### Step 1.3: Update Service Interface
**File**: [src/go-backend/domain/service/interfaces.go](src/go-backend/domain/service/interfaces.go)

Update `InvestmentService` interface:

```go
type InvestmentService interface {
    // Existing methods...
    ListUserInvestments(ctx context.Context, userID int32, req *investmentv1.ListUserInvestmentsRequest) (*investmentv1.ListUserInvestmentsResponse, error)
    GetAggregatedPortfolioSummary(ctx context.Context, userID int32, req *investmentv1.GetAggregatedPortfolioSummaryRequest) (*investmentv1.GetPortfolioSummaryResponse, error)
}
```

#### Step 1.4: Update Repository Interface
**File**: [src/go-backend/domain/repository/investment_repository.go](src/go-backend/domain/repository/investment_repository.go)

Update interface to include type filter in `ListByUserID` and add aggregation method:

```go
type InvestmentRepository interface {
    // Existing methods...
    ListByUserID(ctx context.Context, userID int32, opts ListOptions, typeFilter v1.InvestmentType) ([]*models.Investment, int, error)
    GetAggregatedPortfolioSummary(ctx context.Context, userID int32, typeFilter v1.InvestmentType) (*PortfolioSummary, error)
}
```

#### Step 1.5: Implement Repository Methods
**File**: [src/go-backend/domain/repository/investment_repository_impl.go](src/go-backend/domain/repository/investment_repository_impl.go)

Update `ListByUserID` to support type filtering:

```go
func (r *investmentRepository) ListByUserID(ctx context.Context, userID int32, opts ListOptions, typeFilter v1.InvestmentType) ([]*models.Investment, int, error) {
    // Get all wallet IDs for user where type is INVESTMENT
    var walletIDs []int32
    if err := r.db.DB.WithContext(ctx).
        Model(&models.Wallet{}).
        Select("id").
        Where("user_id = ? AND status = 1 AND type = ?", userID, walletv1.WalletType_INVESTMENT).
        Find(&walletIDs).Error; err != nil {
        return nil, 0, fmt.Errorf("failed to get wallet IDs: %w", err)
    }

    if len(walletIDs) == 0 {
        return []*models.Investment{}, 0, nil
    }

    // Build query with wallet filter
    query := r.db.DB.WithContext(ctx).Model(&models.Investment{}).Where("wallet_id IN ?", walletIDs)

    // Apply type filter if specified
    if typeFilter != v1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED && typeFilter != 0 {
        query = query.Where("type = ?", typeFilter)
    }

    // Get total count
    var total int64
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, fmt.Errorf("failed to count investments: %w", err)
    }

    // Apply ordering and pagination
    // ... existing pagination logic
}
```

Implement `GetAggregatedPortfolioSummary`:

```go
func (r *investmentRepository) GetAggregatedPortfolioSummary(ctx context.Context, userID int32, typeFilter v1.InvestmentType) (*PortfolioSummary, error) {
    // Get all investment wallet IDs for user
    var walletIDs []int32
    if err := r.db.DB.WithContext(ctx).
        Model(&models.Wallet{}).
        Select("id").
        Where("user_id = ? AND status = 1 AND type = ?", userID, walletv1.WalletType_INVESTMENT).
        Find(&walletIDs).Error; err != nil {
        return nil, fmt.Errorf("failed to get wallet IDs: %w", err)
    }

    if len(walletIDs) == 0 {
        return &PortfolioSummary{}, nil
    }

    // Aggregate query
    query := r.db.DB.WithContext(ctx).
        Model(&models.Investment{}).
        Select(`
            COALESCE(SUM(current_value), 0) as total_value,
            COALESCE(SUM(total_cost), 0) as total_cost,
            COALESCE(SUM(unrealized_pnl), 0) as total_unrealized_pnl,
            COALESCE(SUM(realized_pnl), 0) as total_realized_pnl,
            COALESCE(SUM(total_dividends), 0) as total_dividends
        `).
        Where("wallet_id IN ?", walletIDs)

    if typeFilter != v1.InvestmentType_INVESTMENT_TYPE_UNSPECIFIED && typeFilter != 0 {
        query = query.Where("type = ?", typeFilter)
    }

    var summary PortfolioSummary
    if err := query.Scan(&summary).Error; err != nil {
        return nil, fmt.Errorf("failed to get aggregated portfolio summary: %w", err)
    }

    // Calculate percentage
    if summary.TotalCost > 0 {
        summary.TotalUnrealizedPnlPercent = float64(summary.TotalUnrealizedPnl) / float64(summary.TotalCost) * 100
    }

    return &summary, nil
}
```

#### Step 1.6: Add HTTP Handlers
**File**: [src/go-backend/api/handlers/investment.go](src/go-backend/api/handlers/investment.go)

Add handlers for new endpoints:

```go
// ListUserInvestments handles GET /api/v1/investments
func (h *InvestmentHandlers) ListUserInvestments(c *gin.Context) {
    userID, ok := handler.GetUserID(c)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    var req investmentv1.ListUserInvestmentsRequest

    // Parse optional walletId
    if walletIDStr := c.Query("walletId"); walletIDStr != "" {
        walletID, err := strconv.Atoi(walletIDStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid walletId"})
            return
        }
        req.WalletId = int32(walletID)
    }

    // Parse optional typeFilter
    if typeFilterStr := c.Query("typeFilter"); typeFilterStr != "" {
        typeFilter, err := strconv.Atoi(typeFilterStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid typeFilter"})
            return
        }
        req.TypeFilter = investmentv1.InvestmentType(typeFilter)
    }

    // Parse pagination
    req.Pagination = parsePagination(c)

    resp, err := h.service.ListUserInvestments(c.Request.Context(), userID, &req)
    if err != nil {
        handleError(c, err)
        return
    }

    c.JSON(http.StatusOK, resp)
}

// GetAggregatedPortfolioSummary handles GET /api/v1/portfolio-summary
func (h *InvestmentHandlers) GetAggregatedPortfolioSummary(c *gin.Context) {
    userID, ok := handler.GetUserID(c)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    var req investmentv1.GetAggregatedPortfolioSummaryRequest

    // Parse optional walletId
    if walletIDStr := c.Query("walletId"); walletIDStr != "" {
        walletID, err := strconv.Atoi(walletIDStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid walletId"})
            return
        }
        req.WalletId = int32(walletID)
    }

    // Parse optional typeFilter
    if typeFilterStr := c.Query("typeFilter"); typeFilterStr != "" {
        typeFilter, err := strconv.Atoi(typeFilterStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid typeFilter"})
            return
        }
        req.TypeFilter = investmentv1.InvestmentType(typeFilter)
    }

    resp, err := h.service.GetAggregatedPortfolioSummary(c.Request.Context(), userID, &req)
    if err != nil {
        handleError(c, err)
        return
    }

    c.JSON(http.StatusOK, resp)
}
```

#### Step 1.7: Register Routes
**File**: [src/go-backend/api/handlers/routes.go](src/go-backend/api/handlers/routes.go)

Add routes (note: order matters - specific routes before parameterized):

```go
// Investment routes (around line 139)
investments := v1.Group("/investments")
investments.Use(AuthMiddleware())
{
    investments.GET("", h.Investment.ListUserInvestments)  // NEW: GET /api/v1/investments
    investments.POST("", h.Investment.CreateInvestment)
    investments.GET("/symbols/search", h.Investment.SearchSymbols)
    investments.POST("/update-prices", h.Investment.UpdatePrices)
    investments.GET("/:id/transactions", h.Investment.ListTransactions)
    investments.POST("/:id/transactions", h.Investment.AddTransaction)
    investments.GET("/:id", h.Investment.GetInvestment)
    investments.PUT("/:id", h.Investment.UpdateInvestment)
    investments.DELETE("/:id", h.Investment.DeleteInvestment)
}

// Add aggregated portfolio summary route (at v1 level)
v1.GET("/portfolio-summary", AuthMiddleware(), h.Investment.GetAggregatedPortfolioSummary)  // NEW
```

#### Step 1.8: Generate Code
Run:
```bash
task proto:all
```

This generates:
- Go server code in `src/go-backend/gen/`
- TypeScript types in `src/wj-client/gen/`
- API client hooks in `src/wj-client/utils/generated/hooks.ts`

---

### Phase 2: Frontend Implementation

#### Step 2.1: Update State Management
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Replace current wallet selection with enhanced filter state:

```typescript
// BEFORE (around line 446):
const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

// AFTER:
// "all" = all investment wallets, number = specific wallet ID
const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
const [typeFilter, setTypeFilter] = useState<string>("all");
```

#### Step 2.2: Create Filter Options
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Build wallet selector options:

```typescript
const walletOptions = useMemo(() => {
  const options = [
    { value: "all", label: "All Investment Wallets" },
  ];

  // Add individual wallet options
  investmentWallets.forEach(wallet => {
    options.push({
      value: wallet.id.toString(),
      label: wallet.walletName,
    });
  });

  return options;
}, [investmentWallets]);

const typeFilterOptions = useMemo(() => [
  { value: "all", label: "All Types" },
  { value: String(InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY), label: "Crypto" },
  { value: String(InvestmentType.INVESTMENT_TYPE_STOCK), label: "Stock" },
  { value: String(InvestmentType.INVESTMENT_TYPE_ETF), label: "ETF" },
  { value: String(InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND), label: "Mutual Fund" },
  { value: String(InvestmentType.INVESTMENT_TYPE_BOND), label: "Bond" },
], []);
```

#### Step 2.3: Update Auto-Selection Logic
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Update useEffect to default to "all":

```typescript
// BEFORE (lines 476-483):
React.useEffect(() => {
  setSelectedWalletId((prevId) => {
    if (!prevId && investmentWallets.length > 0) {
      return investmentWallets[0].id;
    }
    return prevId;
  });
}, [investmentWallets]);

// AFTER:
// No auto-selection needed since we default to "all"
// Remove this useEffect or update to handle empty wallets case
```

#### Step 2.4: Replace Wallet Selector UI
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Replace native select (lines 645-661) with SelectDropdown:

```typescript
import { SelectDropdown } from "@/components/select/SelectDropdown";

// In render (replace existing select):
<div className="flex gap-2 items-center">
  <SelectDropdown
    value={selectedWalletId}
    onChange={(val) => startTransition(() => setSelectedWalletId(val || "all"))}
    options={walletOptions}
    aria-label="Select wallet"
  />
  <SelectDropdown
    value={typeFilter}
    onChange={(val) => setTypeFilter(val || "all")}
    options={typeFilterOptions}
    aria-label="Filter by type"
  />
</div>
```

Remove the condition that only shows selector when multiple wallets exist.

#### Step 2.5: Update Data Fetching Logic
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Compute API parameters:

```typescript
// Determine API parameters based on filter
const apiParams = useMemo(() => {
  const walletId = selectedWalletId === "all" ? 0 : parseInt(selectedWalletId);
  const investmentTypeFilter = typeFilter === "all"
    ? InvestmentType.INVESTMENT_TYPE_UNSPECIFIED
    : parseInt(typeFilter) as InvestmentType;
  return { walletId, typeFilter: investmentTypeFilter };
}, [selectedWalletId, typeFilter]);
```

Update investments query to use new endpoint:

```typescript
// BEFORE (lines 486-505):
const getListInvestments = useQueryListInvestments(...)

// AFTER:
const getListInvestments = useQueryListUserInvestments(
  {
    walletId: apiParams.walletId,
    typeFilter: apiParams.typeFilter,
    pagination: { page: 1, pageSize: 100, orderBy: "symbol", order: "asc" },
  },
  {
    refetchOnMount: "always",
  }
);
```

Update portfolio summary query:

```typescript
// BEFORE (around line 507):
const getPortfolioSummary = useQueryGetPortfolioSummary(...)

// AFTER:
const getPortfolioSummary = useQueryGetAggregatedPortfolioSummary(
  {
    walletId: apiParams.walletId,
    typeFilter: apiParams.typeFilter,
  },
  {
    refetchOnMount: "always",
  }
);
```

#### Step 2.6: Add Wallet Column for "All Wallets" View
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Update column definitions (around line 520) to conditionally show wallet name:

```typescript
const columns = useMemo<ColumnDef<Investment>[]>(() => {
  const baseColumns: ColumnDef<Investment>[] = [
    // Existing symbol column...
    columnHelper.accessor("symbol", { ... }),
  ];

  // Add wallet column when viewing all wallets
  if (selectedWalletId === "all") {
    baseColumns.splice(1, 0, columnHelper.accessor("walletName", {
      header: "Wallet",
      cell: (info) => (
        <span className="text-gray-600">{info.getValue() || "Unknown"}</span>
      ),
    }));
  }

  // Add remaining columns...
  return baseColumns;
}, [selectedWalletId, /* other deps */]);
```

#### Step 2.7: Update "Add Investment" Button Logic
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Disable add button when "All Wallets" selected (or show wallet picker):

```typescript
// Option A: Disable button with tooltip
<Button
  type={ButtonType.ICON}
  icon={<PlusIcon className="size-5" />}
  onClick={() => setModalType(ModalType.ADD_INVESTMENT)}
  disabled={selectedWalletId === "all"}
  title={selectedWalletId === "all"
    ? "Select a specific wallet to add investments"
    : "Add Investment"
  }
>
  Add Investment
</Button>

// Option B: Allow click but show wallet picker in modal
// This requires updating AddInvestmentForm to accept optional walletId
// and show a wallet selector if not provided
```

#### Step 2.8: Update Empty States
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Add context-aware empty state messages:

```typescript
const getEmptyMessage = () => {
  if (investmentWallets.length === 0) {
    return "Create an investment wallet to start tracking your portfolio.";
  }
  if (selectedWalletId === "all") {
    if (typeFilter !== "all") {
      const typeName = typeFilterOptions.find(o => o.value === typeFilter)?.label;
      return `No ${typeName?.toLowerCase() || ""} investments found.`;
    }
    return "No investments found. Add your first investment to get started.";
  }
  const walletName = investmentWallets.find(w => w.id.toString() === selectedWalletId)?.walletName;
  return `No investments in ${walletName || "this wallet"}.`;
};
```

#### Step 2.9: Update Query Invalidation
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Update query key invalidation to include new endpoints:

```typescript
const handleModalSuccess = () => {
  queryClient.invalidateQueries({ queryKey: [EVENT_InvestmentListUserInvestments] });
  queryClient.invalidateQueries({ queryKey: [EVENT_InvestmentGetAggregatedPortfolioSummary] });
  // Keep existing invalidations for backwards compatibility
  queryClient.invalidateQueries({ queryKey: [EVENT_InvestmentListInvestments] });
  queryClient.invalidateQueries({ queryKey: [EVENT_InvestmentGetPortfolioSummary] });
  setModalType(null);
};
```

---

### Phase 3: Edge Cases & Refinements

#### Step 3.1: Currency Handling for Aggregation
**File**: [src/go-backend/domain/service/investment_service.go](src/go-backend/domain/service/investment_service.go)

When aggregating portfolio summary across wallets with different currencies:
- Use `displayTotalCost`, `displayCurrentValue` etc. (already converted to user's currency)
- Sum the display values for aggregation
- Return warning in response if multiple currencies detected

```go
// In GetAggregatedPortfolioSummary:
// Track unique currencies
currencySet := make(map[string]bool)
for _, inv := range investments {
    currencySet[inv.Currency] = true
}
if len(currencySet) > 1 {
    resp.CurrencyWarning = "Portfolio contains investments in multiple currencies. Values converted to your default currency."
}
```

#### Step 3.2: Mobile Table Column Handling
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Ensure mobile table (lines 421-437) also shows wallet info when "All Wallets" selected:

```typescript
// Update MobileTable columns definition
const mobileColumns = useMemo(() => {
  const cols = [
    // Symbol column
    { id: "symbol", header: "Symbol", ... },
  ];

  if (selectedWalletId === "all") {
    cols.push({
      id: "walletName",
      header: "Wallet",
      cell: (row) => row.walletName || "Unknown",
    });
  }

  // Value and PnL columns
  // ...
  return cols;
}, [selectedWalletId]);
```

#### Step 3.3: Update Prices for All Wallets
**File**: [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx)

Ensure "Update Prices" works with aggregated view:

```typescript
const handleUpdatePrices = async () => {
  // Use investments from current view (whether all or filtered)
  const investmentIds = (getListInvestments.data?.investments || []).map(i => i.id);
  if (investmentIds.length === 0) return;

  await updatePricesMutation.mutateAsync({ investmentIds });
};
```

---

## Files to Modify Summary

### Backend (Go)
| File | Changes |
|------|---------|
| [api/protobuf/v1/investment.proto](api/protobuf/v1/investment.proto) | Add ListUserInvestments RPC, GetAggregatedPortfolioSummary RPC, walletName field |
| [src/go-backend/domain/service/investment_service.go](src/go-backend/domain/service/investment_service.go) | Implement ListUserInvestments, GetAggregatedPortfolioSummary |
| [src/go-backend/domain/service/interfaces.go](src/go-backend/domain/service/interfaces.go) | Update InvestmentService interface |
| [src/go-backend/domain/repository/investment_repository.go](src/go-backend/domain/repository/investment_repository.go) | Update interface with type filter and aggregation |
| [src/go-backend/domain/repository/investment_repository_impl.go](src/go-backend/domain/repository/investment_repository_impl.go) | Implement updated ListByUserID, GetAggregatedPortfolioSummary |
| [src/go-backend/api/handlers/investment.go](src/go-backend/api/handlers/investment.go) | Add ListUserInvestments, GetAggregatedPortfolioSummary handlers |
| [src/go-backend/api/handlers/routes.go](src/go-backend/api/handlers/routes.go) | Register new routes |

### Frontend (TypeScript/React)
| File | Changes |
|------|---------|
| [src/wj-client/app/dashboard/portfolio/page.tsx](src/wj-client/app/dashboard/portfolio/page.tsx) | State management, filter options, UI updates, query changes |

### Generated (Auto - after `task proto:all`)
| File | Changes |
|------|---------|
| `src/go-backend/gen/` | Go generated code |
| `src/wj-client/gen/protobuf/v1/investment.ts` | TypeScript types |
| `src/wj-client/utils/generated/hooks.ts` | React Query hooks (useQueryListUserInvestments, etc.) |

---

## Execution Order

1. **Phase 1.1**: Update protobuf definition
2. **Phase 1.2-1.5**: Implement backend service and repository
3. **Phase 1.6-1.7**: Add handlers and routes
4. **Phase 1.8**: Generate code (`task proto:all`)
5. **Phase 2.1-2.4**: Frontend state and UI changes
6. **Phase 2.5-2.6**: Data fetching and column updates
7. **Phase 2.7-2.9**: Button logic, empty states, invalidation
8. **Phase 3.1-3.3**: Edge cases and refinements
9. **Testing**: Manual and automated tests

---

## Success Criteria

- [ ] User can select "All Investment Wallets" to see investments across all wallets
- [ ] User can filter by investment type (Crypto, Stock, ETF, etc.)
- [ ] User can select specific wallet (same as before)
- [ ] Wallet name column appears when "All Wallets" selected
- [ ] Portfolio summary aggregates correctly for "All Wallets" view
- [ ] Portfolio summary filters by type correctly
- [ ] Empty states display appropriate context-aware messages
- [ ] Loading states show during data fetch
- [ ] "Update Prices" works correctly with all filter modes
- [ ] "Add Investment" button disabled when "All Wallets" selected (with tooltip)
- [ ] Mobile table shows wallet info when "All Wallets" selected
- [ ] Query invalidation works correctly after mutations
- [ ] No regressions in existing single-wallet functionality

---

## Rollback Plan

If issues arise:
1. Revert protobuf changes
2. Run `task proto:all` to regenerate
3. Revert service/handler/repository changes
4. Revert frontend changes

The existing endpoints (`ListInvestments`, `GetPortfolioSummary`) remain unchanged, so rollback is safe and backward compatible.
