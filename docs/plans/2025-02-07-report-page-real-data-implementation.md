# Report Page Real Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect real backend data to the report page, implement PDF/Excel exports, and complete all data visualization features.

**Architecture:**
- Use existing `GetFinancialReport` API for monthly summary data
- Create new `GetCategoryBreakdown` API for category-wise expense/income breakdown
- Process API responses to match chart component data structures
- Implement PDF and Excel exports using existing utility functions

**Tech Stack:**
- Frontend: React 19, Next.js 15, TypeScript, Recharts
- Backend: Go 1.23, GORM, Protocol Buffers
- Export Libraries: jsPDF, ExcelJS (already installed)

---

## Task 1: Add Category Breakdown API in Protobuf

**Files:**
- Modify: `api/protobuf/v1/transaction.proto`

**Step 1: Add protobuf message definitions**

Add to `api/protobuf/v1/transaction.proto` after line 354 (after `GetFinancialReportResponse`):

```protobuf
// GetCategoryBreakdown request
message GetCategoryBreakdownRequest {
  int64 startDate = 1 [json_name = "startDate"];  // Unix timestamp
  int64 endDate = 2 [json_name = "endDate"];      // Unix timestamp
  repeated int32 walletIds = 3 [json_name = "walletIds"];  // Optional: filter by wallets
  optional CategoryType categoryType = 4 [json_name = "categoryType"];  // Optional: filter by type
}

// Category breakdown data
message CategoryBreakdownItem {
  int32 categoryId = 1 [json_name = "categoryId"];
  string categoryName = 2 [json_name = "categoryName"];
  CategoryType type = 3 [json_name = "type"];
  wealthjourney.common.v1.Money totalAmount = 4 [json_name = "totalAmount"];
  wealthjourney.common.v1.Money displayAmount = 5 [json_name = "displayAmount"];  // In user's preferred currency
  int32 transactionCount = 6 [json_name = "transactionCount"];
}

// GetCategoryBreakdown response
message GetCategoryBreakdownResponse {
  bool success = 1 [json_name = "success"];
  string message = 2 [json_name = "message"];
  repeated CategoryBreakdownItem categories = 3 [json_name = "categories"];
  string currency = 4 [json_name = "currency"];  // User's preferred currency
  string timestamp = 5 [json_name = "timestamp"];
}
```

**Step 2: Add RPC method to TransactionService**

Add to `TransactionService` in `api/protobuf/v1/transaction.proto` after line 61 (after `GetFinancialReport`):

```protobuf
// Get category breakdown for a date range
rpc GetCategoryBreakdown(GetCategoryBreakdownRequest) returns (GetCategoryBreakdownResponse) {
  option (google.api.http) = {
    get: "/api/v1/transactions/category-breakdown"
  };
}
```

**Step 3: Generate code**

Run: `task proto:all`
Expected: Go and TypeScript code generated successfully

---

## Task 2: Implement Category Breakdown Backend Service

**Files:**
- Create: `src/go-backend/domain/repository/transaction_repository.go` (add method if not exists)
- Modify: `src/go-backend/domain/service/transaction_service.go`
- Modify: `src/go-backend/domain/service/interfaces.go`
- Modify: `src/go-backend/handlers/transaction.go`
- Modify: `src/go-backend/handlers/routes.go`

**Step 1: Add repository method**

Add to `src/go-backend/domain/repository/transaction_repository.go`:

```go
// GetCategoryBreakdown retrieves category-wise transaction summary
func (r *transactionRepository) GetCategoryBreakdown(ctx context.Context, userID int32, filter TransactionFilter) ([]*CategoryBreakdownItem, error) {
    query := r.db.WithContext(ctx).Table("transaction t").
        Select(
            "t.category_id as category_id",
            "c.name as category_name",
            "c.type as type",
            "COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as income",
            "COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total",
            "COUNT(t.id) as transaction_count",
        ).
        Joins("JOIN category c ON t.category_id = c.id").
        Where("t.user_id = ? AND t.deleted_at IS NULL", userID)

    // Apply filters
    if filter.WalletIDs != nil && len(filter.WalletIDs) > 0 {
        query = query.Where("t.wallet_id IN ?", filter.WalletIDs)
    }
    if filter.StartDate != nil {
        query = query.Where("t.date >= ?", *filter.StartDate)
    }
    if filter.EndDate != nil {
        query = query.Where("t.date <= ?", *filter.EndDate)
    }

    rows, err := query.Rows()
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var results []*CategoryBreakdownItem
    for rows.Next() {
        var item CategoryBreakdownItem
        var income, total int64
        if err := rows.Scan(&item.CategoryID, &item.CategoryName, &item.Type, &income, &total, &item.TransactionCount); err != nil {
            return nil, err
        }
        // Set total amount based on type
        if item.Type == 1 { // Income
            item.TotalAmount = income
        } else {
            item.TotalAmount = total
        }
        results = append(results, &item)
    }

    return results, nil
}
```

**Step 2: Add service interface method**

Add to `TransactionServiceInterface` in `src/go-backend/domain/service/interfaces.go`:

```go
GetCategoryBreakdown(ctx context.Context, userID int32, req *v1.GetCategoryBreakdownRequest) (*v1.GetCategoryBreakdownResponse, error)
```

**Step 3: Implement service method**

Add to `src/go-backend/domain/service/transaction_service.go`:

```go
func (s *transactionService) GetCategoryBreakdown(ctx context.Context, userID int32, req *v1.GetCategoryBreakdownRequest) (*v1.GetCategoryBreakdownResponse, error) {
    // Validate date range
    if req.StartDate <= 0 || req.EndDate <= 0 {
        return nil, apperrors.NewValidationError("valid date range is required")
    }
    if req.StartDate >= req.EndDate {
        return nil, apperrors.NewValidationError("start date must be before end date")
    }

    startDate := time.Unix(req.StartDate, 0)
    endDate := time.Unix(req.EndDate, 0)

    // Get user's preferred currency
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    preferredCurrency := user.PreferredCurrency
    if preferredCurrency == "" {
        preferredCurrency = types.VND
    }

    // Build filter
    filter := repository.TransactionFilter{
        StartDate: &startDate,
        EndDate:   &endDate,
    }
    if len(req.WalletIds) > 0 {
        filter.WalletIDs = req.WalletIds
    }

    // Get transactions for category processing
    transactions, _, err := s.txRepo.List(ctx, userID, filter, repository.ListOptions{
        Limit:   100000,
        Offset: 0,
    })
    if err != nil {
        return nil, err
    }

    // Group by category
    categoryMap := make(map[int32]*v1.CategoryBreakdownItem)
    categoryNames := make(map[int32]string)

    // First pass: collect all transactions and get category names
    for _, tx := range transactions {
        if tx.CategoryID == nil {
            continue
        }

        categoryNames[*tx.CategoryID] = "" // Will be filled later

        amount := tx.Amount
        if amount < 0 {
            amount = -amount // Convert to positive for expense
        }

        if _, exists := categoryMap[*tx.CategoryID]; !exists {
            categoryMap[*tx.CategoryID] = &v1.CategoryBreakdownItem{
                CategoryId:      *tx.CategoryID,
                CategoryName:    "", // Will be filled
                Type:            tx.Type,
                TotalAmount:     &v1.Money{Amount: 0, Currency: tx.Currency},
                DisplayAmount:   &v1.Money{Amount: 0, Currency: preferredCurrency},
                TransactionCount: 0,
            }
        }

        item := categoryMap[*tx.CategoryID]
        item.TotalAmount.Amount += amount
        item.TransactionCount += 1
    }

    // Get category details
    for catID := range categoryNames {
        cat, err := s.categoryRepo.GetByID(ctx, catID)
        if err == nil && cat != nil {
            categoryNames[catID] = cat.Name
            if item, ok := categoryMap[catID]; ok {
                item.CategoryName = cat.Name
                item.Type = cat.Type
            }
        }
    }

    // Convert display amounts
    for _, item := range categoryMap {
        convertedAmount := item.TotalAmount.Amount
        if item.TotalAmount.Currency != preferredCurrency {
            // Get FX rate and convert (simplified - use existing conversion logic)
            convertedAmount = s.fxService.Convert(item.TotalAmount.Amount, item.TotalAmount.Currency, preferredCurrency)
        }
        item.DisplayAmount.Amount = convertedAmount
        item.DisplayAmount.Currency = preferredCurrency
    }

    // Convert map to slice
    categories := make([]*v1.CategoryBreakdownItem, 0, len(categoryMap))
    for _, item := range categoryMap {
        categories = append(categories, item)
    }

    return &v1.GetCategoryBreakdownResponse{
        Success:   true,
        Message:   "Category breakdown retrieved successfully",
        Categories: categories,
        Currency:  preferredCurrency,
        Timestamp: time.Now().Format(time.RFC3339),
    }, nil
}
```

**Step 4: Add HTTP handler**

Add to `src/go-backend/handlers/transaction.go`:

```go
// GetCategoryBreakdown retrieves category-wise expense/income breakdown
// @Summary Get category breakdown
// @Tags transactions
// @Produce json
// @Param start_date query int true "Start date as Unix timestamp"
// @Param end_date query int true "End date as Unix timestamp"
// @Param wallet_ids query string false "Comma-separated wallet IDs"
// @Param category_type query int false "Category type filter (1=income, 2=expense)"
// @Success 200 {object} types.APIResponse{data=transactionv1.GetCategoryBreakdownResponse}
// @Failure 400 {object} types.APIResponse
// @Failure 401 {object} types.APIResponse
// @Failure 500 {object} types.APIResponse
// @Router /api/v1/transactions/category-breakdown [get]
func (h *TransactionHandlers) GetCategoryBreakdown(c *gin.Context) {
    userID, ok := handler.GetUserID(c)
    if !ok {
        handler.Unauthorized(c, "User not authenticated")
        return
    }

    // Parse dates
    startDateStr := c.Query("start_date")
    endDateStr := c.Query("end_date")
    if startDateStr == "" || endDateStr == "" {
        handler.BadRequest(c, apperrors.NewValidationError("start_date and end_date are required"))
        return
    }

    startDate, err := strconv.ParseInt(startDateStr, 10, 64)
    if err != nil {
        handler.BadRequest(c, apperrors.NewValidationError("invalid start_date format"))
        return
    }

    endDate, err := strconv.ParseInt(endDateStr, 10, 64)
    if err != nil {
        handler.BadRequest(c, apperrors.NewValidationError("invalid end_date format"))
        return
    }

    req := &transactionv1.GetCategoryBreakdownRequest{
        StartDate: startDate,
        EndDate:   endDate,
    }

    // Parse optional wallet_ids
    if walletIDsStr := c.Query("wallet_ids"); walletIDsStr != "" {
        walletIDs, err := parseCommaSeparatedInt32(walletIDsStr)
        if err != nil {
            handler.BadRequest(c, apperrors.NewValidationError("invalid wallet_ids format"))
            return
        }
        req.WalletIds = walletIDs
    }

    // Parse optional category_type
    if categoryTypeStr := c.Query("category_type"); categoryTypeStr != "" {
        categoryType, err := strconv.ParseInt(categoryTypeStr, 10, 32)
        if err == nil && categoryType >= 1 && categoryType <= 2 {
            ct := transactionv1.CategoryType(categoryType)
            req.CategoryType = &ct
        }
    }

    result, err := h.transactionService.GetCategoryBreakdown(c.Request.Context(), userID, req)
    if err != nil {
        handler.HandleError(c, err)
        return
    }

    handler.Success(c, result)
}
```

**Step 5: Add route**

Add to `src/go-backend/handlers/routes.go` in the transaction routes group:

```go
transactionRoutes.GET("/category-breakdown", transactionHandlers.GetCategoryBreakdown)
```

---

## Task 3: Create Report Data Utilities in Frontend

**Files:**
- Create: `src/wj-client/app/dashboard/report/data-utils.ts`

**Step 1: Write data transformation utilities**

Create `src/wj-client/app/dashboard/report/data-utils.ts`:

```typescript
import { GetFinancialReportResponse, MonthlyFinancialData } from "@/gen/protobuf/v1/transaction";
import { formatCurrency } from "@/utils/currency-formatter";
import { PeriodType, DateRange } from "./PeriodSelector";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  topExpenseCategory: { name: string; amount: number } | null;
  currency: string;
  incomeHistory: Array<{ value: number; date: string }>;
  expenseHistory: Array<{ value: number; date: string }>;
}

export interface ExpenseCategoryData {
  name: string;
  value: number;
  color: string;
}

export interface CategoryComparisonData {
  category: string;
  thisMonth: number;
  lastMonth: number;
}

export interface TrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

const GREEN_COLORS = [
  "#008148", // Brand primary
  "#22C55E", // Green 500
  "#14B8A6", // Teal 500
  "#06B6D4", // Cyan 500
  "#84CC16", // Lime 500
  "#10B981", // Emerald 500
  "#34D399", // Emerald 400
  "#6EE7B7", // Emerald 300
  "#94A3B8", // Slate 400 (for "others")
];

/**
 * Get date range for selected period
 */
export function getDateRangeForPeriod(period: PeriodType, customRange?: DateRange): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "this-month":
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    case "last-month":
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
    case "this-quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        startDate: new Date(now.getFullYear(), quarter * 3, 1),
        endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59),
      };
    case "last-quarter":
      const lastQuarter = Math.floor((now.getMonth() - 3) / 3);
      return {
        startDate: new Date(now.getFullYear(), lastQuarter * 3, 1),
        endDate: new Date(now.getFullYear(), lastQuarter * 3 + 3, 0, 23, 59, 59),
      };
    case "this-year":
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
    case "last-year":
      return {
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
      };
    case "custom":
      if (customRange?.startDate && customRange.endDate) {
        return {
          startDate: customRange.startDate,
          endDate: customRange.endDate,
        };
      }
      // Fallback to this month
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
  }
}

/**
 * Convert date to Unix timestamp (seconds)
 */
export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Calculate summary data from financial report
 */
export function calculateSummaryData(
  reportData: GetFinancialReportResponse | undefined,
  period: PeriodType,
  customRange?: DateRange,
): SummaryData {
  if (!reportData?.totals || reportData.totals.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
      topExpenseCategory: null,
      currency: "USD",
      incomeHistory: [],
      expenseHistory: [],
    };
  }

  const range = getDateRangeForPeriod(period, customRange);
  const currency = reportData.totals[0]?.displayIncome?.currency || "USD";

  // Filter totals by date range
  const filteredTotals = reportData.totals.filter((month) => {
    const monthDate = new Date(reportData.year, month.month, 1);
    return monthDate >= range.startDate && monthDate <= range.endDate;
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const incomeHistory: Array<{ value: number; date: string }> = [];
  const expenseHistory: Array<{ value: number; date: string }> = [];

  filteredTotals.forEach((month) => {
    const income = month.displayIncome?.amount ?? 0;
    const expense = month.displayExpense?.amount ?? 0;
    totalIncome += income;
    totalExpenses += expense;

    incomeHistory.push({
      value: income,
      date: MONTH_NAMES[month.month],
    });
    expenseHistory.push({
      value: expense,
      date: MONTH_NAMES[month.month],
    });
  });

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    topExpenseCategory: null, // Will be populated from category breakdown
    currency,
    incomeHistory,
    expenseHistory,
  };
}

/**
 * Calculate trend data for line chart
 */
export function calculateTrendData(
  reportData: GetFinancialReportResponse | undefined,
  period: PeriodType,
  customRange?: DateRange,
): TrendData[] {
  if (!reportData?.totals || reportData.totals.length === 0) {
    return [];
  }

  const range = getDateRangeForPeriod(period, customRange);

  const filteredTotals = reportData.totals
    .filter((month) => {
      const monthDate = new Date(reportData.year, month.month, 1);
      return monthDate >= range.startDate && monthDate <= range.endDate;
    })
    .map((month) => {
      const income = month.displayIncome?.amount ?? 0;
      const expenses = month.displayExpense?.amount ?? 0;
      return {
        month: MONTH_NAMES[month.month],
        income,
        expenses,
        net: income - expenses,
      };
    });

  return filteredTotals;
}

/**
 * Calculate savings rate for a month
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0;
  return ((income - expenses) / income) * 100;
}

/**
 * Get color for category index
 */
export function getCategoryColor(index: number): string {
  return GREEN_COLORS[index % GREEN_COLORS.length];
}
```

---

## Task 4: Update Report Page with Real Data

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`

**Step 1: Update imports and state**

Replace the top of the file (lines 1-51) with:

```typescript
"use client";

import { useState, useMemo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { formatCurrency } from "@/utils/currency-formatter";
import { useQueryGetFinancialReport, useQueryGetCategoryBreakdown } from "@/utils/generated/hooks";
import { exportFinancialReportToCSV } from "@/utils/csv-export";
import { generateReportPDF, downloadPDF } from "@/utils/export/report-pdf-export";
import { generateReportExcel, downloadExcel } from "@/utils/export/report-excel-export";
import { PeriodSelector, PeriodType, DateRange } from "./PeriodSelector";
import { SummaryCards, FinancialSummaryData } from "./SummaryCards";
import { LineChart, BarChart, DonutChart } from "@/components/charts";
import { motion } from "framer-motion";
import { ExportOptions, ExportButton } from "@/components/export/ExportDialog";
import {
  calculateSummaryData,
  calculateTrendData,
  getDateRangeForPeriod,
  toUnixTimestamp,
  getCategoryColor,
  calculateSavingsRate,
} from "./data-utils";
import { FullPageLoading } from "@/components/loading/FullPageLoading";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function ReportPageEnhanced() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("this-month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [selectedWalletIds, setSelectedWalletIds] = useState<number[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Calculate date range for API calls
  const dateRange = useMemo(
    () => getDateRangeForPeriod(selectedPeriod, customRange),
    [selectedPeriod, customRange],
  );

  // Fetch financial report data
  const {
    data: reportData,
    isLoading: isReportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useQueryGetFinancialReport(
    {
      year: dateRange.endDate.getFullYear(),
      walletIds: selectedWalletIds.length > 0 ? selectedWalletIds : undefined,
    },
    {
      refetchOnMount: "always",
      enabled: !!selectedPeriod,
    },
  );

  // Fetch category breakdown data
  const {
    data: categoryBreakdown,
    isLoading: isCategoryLoading,
    error: categoryError,
  } = useQueryGetCategoryBreakdown(
    {
      startDate: toUnixTimestamp(dateRange.startDate),
      endDate: toUnixTimestamp(dateRange.endDate),
      walletIds: selectedWalletIds.length > 0 ? selectedWalletIds : undefined,
    },
    {
      refetchOnMount: "always",
      enabled: !!selectedPeriod,
    },
  );

  const isLoading = isReportLoading || isCategoryLoading;
```

**Step 2: Update data processing logic**

Replace lines 87-150 with:

```typescript
  // Calculate summary data from real API
  const summaryData: FinancialSummaryData = useMemo(() => {
    const baseSummary = calculateSummaryData(reportData, selectedPeriod, customRange);

    // Add top expense category from breakdown
    let topExpenseCategory = null;
    if (categoryBreakdown?.categories) {
      const expenseCategories = categoryBreakdown.categories
        .filter((c) => c.type === 2) // Expense only
        .sort((a, b) => (b.displayAmount?.amount || 0) - (a.displayAmount?.amount || 0));

      if (expenseCategories.length > 0) {
        topExpenseCategory = {
          name: expenseCategories[0].categoryName || "Uncategorized",
          amount: expenseCategories[0].displayAmount?.amount || 0,
        };
      }
    }

    return {
      ...baseSummary,
      topExpenseCategory,
    };
  }, [reportData, categoryBreakdown, selectedPeriod, customRange]);

  // Calculate expense category breakdown for donut chart
  const expenseCategories = useMemo(() => {
    if (!categoryBreakdown?.categories) return [];

    return categoryBreakdown.categories
      .filter((c) => c.type === 2) // Expense categories only
      .sort((a, b) => (b.displayAmount?.amount || 0) - (a.displayAmount?.amount || 0))
      .map((cat, index) => ({
        name: cat.categoryName || "Uncategorized",
        value: cat.displayAmount?.amount || 0,
        color: getCategoryColor(index),
      }));
  }, [categoryBreakdown]);

  // Calculate category comparison data
  const categoryComparisonData = useMemo(() => {
    if (!compareWithPrevious || !categoryBreakdown?.categories) return [];

    // Get current period categories
    const currentCategories = categoryBreakdown.categories.filter((c) => c.type === 2);

    // For comparison, we need to fetch previous period data
    // This is a placeholder - implement previous period API call
    return currentCategories.map((cat) => ({
      category: cat.categoryName || "Uncategorized",
      thisMonth: cat.displayAmount?.amount || 0,
      lastMonth: 0, // TODO: Implement previous period fetch
    }));
  }, [categoryBreakdown, compareWithPrevious]);

  // Calculate trend data
  const trendData = useMemo(() => {
    return calculateTrendData(reportData, selectedPeriod, customRange);
  }, [reportData, selectedPeriod, customRange]);

  const currency = categoryBreakdown?.currency || reportData?.totals?.[0]?.displayIncome?.currency || "USD";
```

**Step 3: Update export handler**

Replace lines 61-85 with:

```typescript
  // Handle export with dialog options
  const handleExport = async (options: ExportOptions) => {
    try {
      const reportExportData = {
        summaryData,
        trendData,
        expenseCategories,
        categoryComparisonData,
        period: selectedPeriod,
        dateRange,
        currency,
      };

      switch (options.format) {
        case "csv":
          exportFinancialReportToCSV(reportData, dateRange.endDate.getFullYear(), currency);
          break;
        case "pdf":
          const pdf = await generateReportPDF(reportExportData, {
            includeCharts: options.includeCharts,
          });
          const pdfFilename = generateReportPDFFilename(selectedPeriod, dateRange.startDate, dateRange.endDate, options.fileName);
          downloadPDF(pdf, pdfFilename);
          break;
        case "excel":
          const workbook = await generateReportExcel(reportExportData);
          const excelFilename = generateReportExcelFilename(selectedPeriod, dateRange.startDate, dateRange.endDate, options.fileName);
          await downloadExcel(workbook, excelFilename);
          break;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export");
    }
  };
```

**Step 4: Update JSX to use real currency and data**

Replace lines 196-223 with:

```typescript
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              Expense Breakdown
            </h3>
            {expenseCategories.length > 0 ? (
              <div className="h-72">
                <DonutChart
                  data={expenseCategories}
                  innerRadius="50%"
                  outerRadius="75%"
                  height={288}
                  showLegend={true}
                  legendPosition="right"
                  tooltipFormatter={(value) => [
                    formatCurrency(value, currency),
                    "Amount",
                  ]}
                />
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-neutral-500">
                No expense data for this period
              </div>
            )}
```

Replace lines 250-256 with:

```typescript
                height={288}
                showLegend={true}
                yAxisFormatter={(value) => formatCurrency(value, currency)}
                xAxisFormatter={(label) => label}
              />
```

Replace lines 300-303 with:

```typescript
              showTooltip={true}
              showLegend={true}
              yAxisFormatter={(value) => formatCurrency(value, currency)}
            />
```

Replace lines 344-360 with:

```typescript
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      {row.month}
                    </td>
                    <td className="py-3 px-4 text-right text-success-600 font-medium">
                      {formatCurrency(row.income, currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-danger-600 font-medium">
                      {formatCurrency(row.expenses, currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-primary-900 font-medium">
                      {formatCurrency(row.net, currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-600">
                      {calculateSavingsRate(row.income, row.expenses).toFixed(1)}%
                    </td>
```

**Step 5: Add loading state**

Replace return statement opening with:

```typescript
  if (isLoading) {
    return <FullPageLoading />;
  }

  return (
    <div className="flex flex-col gap-4 px-3 sm:px-6 py-3 sm:py-4">
```

---

## Task 5: Implement PDF Export for Reports

**Files:**
- Create: `src/wj-client/utils/export/report-pdf-export.ts`

**Step 1: Create PDF export utility**

Create `src/wj-client/utils/export/report-pdf-export.ts`:

```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportExportData {
  summaryData: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    topExpenseCategory: { name: string; amount: number } | null;
    currency: string;
  };
  trendData: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  expenseCategories: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  categoryComparisonData: Array<{
    category: string;
    thisMonth: number;
    lastMonth: number;
  }>;
  period: string;
  dateRange: { startDate: Date; endDate: Date };
  currency: string;
}

export interface ReportPDFExportOptions {
  includeCharts: boolean;
}

/**
 * Generate PDF document for financial report
 */
export async function generateReportPDF(
  data: ReportExportData,
  options: ReportPDFExportOptions = { includeCharts: false },
): Promise<jsPDF> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;

  let yPosition = margin;

  // Add title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 129, 72); // Brand green
  pdf.text("Financial Report", margin, yPosition);
  yPosition += 10;

  // Add date range
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const startDateStr = data.dateRange.startDate.toLocaleDateString();
  const endDateStr = data.dateRange.endDate.toLocaleDateString();
  pdf.text(`Period: ${startDateStr} - ${endDateStr}`, margin, yPosition);
  yPosition += 10;

  // Add summary section
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text("Summary", margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);

  const summaryItems = [
    [`Total Income:`, formatCurrency(data.summaryData.totalIncome, data.currency)],
    [`Total Expenses:`, formatCurrency(data.summaryData.totalExpenses, data.currency)],
    [`Net Savings:`, formatCurrency(data.summaryData.netSavings, data.currency)],
    [`Savings Rate:`, `${data.summaryData.savingsRate.toFixed(1)}%`],
  ];

  if (data.summaryData.topExpenseCategory) {
    summaryItems.push([
      `Top Expense Category:`,
      `${data.summaryData.topExpenseCategory.name} (${formatCurrency(data.summaryData.topExpenseCategory.amount, data.currency)})`,
    ]);
  }

  summaryItems.forEach(([label, value]) => {
    pdf.text(label, margin, yPosition);
    pdf.text(value, margin + 60, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Add monthly breakdown table
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text("Monthly Breakdown", margin, yPosition);
  yPosition += 8;

  const tableData = data.trendData.map((row) => [
    row.month,
    formatCurrency(row.income, data.currency),
    formatCurrency(row.expenses, data.currency),
    formatCurrency(row.net, data.currency),
    `${((row.net / row.income) * 100).toFixed(1)}%`,
  ]);

  autoTable(pdf, {
    startY: yPosition,
    head: [["Month", "Income", "Expenses", "Net", "Savings Rate"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 129, 72],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: margin, left: margin, right: margin, bottom: margin },
  });

  return pdf;
}

/**
 * Generate export filename
 */
export function generateReportPDFFilename(
  period: string,
  startDate: Date,
  endDate: Date,
  customFileName?: string,
): string {
  if (customFileName) {
    return `${customFileName}.pdf`;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  return `financial_report_${startStr}_to_${endStr}_${dateStr}.pdf`;
}

/**
 * Download PDF
 */
export function downloadPDF(pdf: jsPDF, filename: string): void {
  pdf.save(filename);
}

// Helper function to format currency (reuse from utils)
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100); // Assuming amount is in cents
}
```

---

## Task 6: Implement Excel Export for Reports

**Files:**
- Create: `src/wj-client/utils/export/report-excel-export.ts`

**Step 1: Create Excel export utility**

Create `src/wj-client/utils/export/report-excel-export.ts`:

```typescript
import * as ExcelJS from "exceljs";
import { ReportExportData } from "./report-pdf-export";

/**
 * Generate Excel workbook for financial report
 */
export async function generateReportExcel(data: ReportExportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const workbookCreator = "WealthJourney Financial Reports";

  // Create summary sheet
  const summarySheet = workbook.addWorksheet("Summary");

  // Add title
  summarySheet.mergeCells("A1:B1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = "Financial Report";
  titleCell.font = { bold: true, size: 16, color: { argb: "FF008148" } };

  // Add date range
  summarySheet.getCell("A3").value = "Period:";
  summarySheet.getCell("B3").value = `${data.dateRange.startDate.toLocaleDateString()} - ${data.dateRange.endDate.toLocaleDateString()}`;

  // Add summary metrics
  let row = 5;
  const metrics = [
    ["Total Income", data.summaryData.totalIncome],
    ["Total Expenses", data.summaryData.totalExpenses],
    ["Net Savings", data.summaryData.netSavings],
    ["Savings Rate", `${data.summaryData.savingsRate.toFixed(1)}%`],
  ];

  if (data.summaryData.topExpenseCategory) {
    metrics.push([
      "Top Expense Category",
      `${data.summaryData.topExpenseCategory.name} (${formatCurrency(data.summaryData.topExpenseCategory.amount, data.currency)})`,
    ]);
  }

  metrics.forEach(([label, value]) => {
    summarySheet.getCell(`A${row}`).value = label;
    summarySheet.getCell(`B${row}`).value = value;
    summarySheet.getCell(`A${row}`).font = { bold: true };
    row++;
  });

  // Style the summary section
  summarySheet.columns = [
    { width: 30 },
    { width: 25 },
  ];

  // Create monthly breakdown sheet
  const monthlySheet = workbook.addWorksheet("Monthly Breakdown");

  // Add headers
  monthlySheet.columns = [
    { header: "Month", key: "month", width: 15 },
    { header: "Income", key: "income", width: 20 },
    { header: "Expenses", key: "expenses", width: 20 },
    { header: "Net Savings", key: "net", width: 20 },
    { header: "Savings Rate", key: "rate", width: 15 },
  ];

  // Style header row
  const headerRow = monthlySheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF008148" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Add data
  data.trendData.forEach((row) => {
    monthlySheet.addRow({
      month: row.month,
      income: formatCurrency(row.income, data.currency),
      expenses: formatCurrency(row.expenses, data.currency),
      net: formatCurrency(row.net, data.currency),
      rate: `${((row.net / row.income) * 100).toFixed(1)}%`,
    });
  });

  // Style data rows
  monthlySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("month").alignment = { horizontal: "left" };

      // Add alternate row color
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    }
  });

  // Create category breakdown sheet
  const categorySheet = workbook.addWorksheet("Category Breakdown");

  categorySheet.columns = [
    { header: "Category", key: "category", width: 30 },
    { header: "Amount", key: "amount", width: 25 },
    { header: "Percentage", key: "percentage", width: 15 },
  ];

  // Style header
  const categoryHeaderRow = categorySheet.getRow(1);
  categoryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  categoryHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF008148" },
  };
  categoryHeaderRow.alignment = { vertical: "middle", horizontal: "center" };
  categoryHeaderRow.height = 25;

  // Add category data
  const totalExpenses = data.summaryData.totalExpenses;
  data.expenseCategories.forEach((cat) => {
    const percentage = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
    categorySheet.addRow({
      category: cat.name,
      amount: formatCurrency(cat.value, data.currency),
      percentage: `${percentage.toFixed(1)}%`,
    });
  });

  // Style category rows
  categorySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("category").alignment = { horizontal: "left" };

      if (rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }
    }
  });

  return workbook;
}

/**
 * Generate export filename
 */
export function generateReportExcelFilename(
  period: string,
  startDate: Date,
  endDate: Date,
  customFileName?: string,
): string {
  if (customFileName) {
    return `${customFileName}.xlsx`;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  return `financial_report_${startStr}_to_${endStr}_${dateStr}.xlsx`;
}

/**
 * Download Excel file
 */
export async function downloadExcel(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
}
```

---

## Task 7: Update Export Index

**Files:**
- Modify: `src/wj-client/utils/export/index.ts`

**Step 1: Add new exports**

Add to `src/wj-client/utils/export/index.ts`:

```typescript
// =============================================================================
// Report Exports
// =============================================================================
export {
  generateReportPDF,
  generateReportPDFFilename,
  downloadPDF as downloadReportPDF,
} from "./report-pdf-export";

export {
  generateReportExcel,
  generateReportExcelFilename,
  downloadExcel as downloadReportExcel,
  type ReportExportData,
} from "./report-excel-export";
```

---

## Task 8: Implement Previous Period Comparison

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`
- Modify: `src/wj-client/app/dashboard/report/data-utils.ts`

**Step 1: Add previous period calculation**

Add to `src/wj-client/app/dashboard/report/data-utils.ts`:

```typescript
/**
 * Get previous period date range for comparison
 */
export function getPreviousPeriodRange(period: PeriodType, customRange?: DateRange): { startDate: Date; endDate: Date } {
  const currentRange = getDateRangeForPeriod(period, customRange);
  const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();

  return {
    startDate: new Date(currentRange.startDate.getTime() - duration),
    endDate: new Date(currentRange.endDate.getTime() - duration),
  };
}
```

**Step 2: Update report page to fetch previous period data**

Add to `src/wj-client/app/dashboard/report/page.tsx`:

```typescript
  // Calculate previous period for comparison
  const previousPeriodRange = useMemo(
    () => getPreviousPeriodRange(selectedPeriod, customRange),
    [selectedPeriod, customRange],
  );

  // Fetch previous period category breakdown for comparison
  const {
    data: previousCategoryBreakdown,
  } = useQueryGetCategoryBreakdown(
    {
      startDate: toUnixTimestamp(previousPeriodRange.startDate),
      endDate: toUnixTimestamp(previousPeriodRange.endDate),
      walletIds: selectedWalletIds.length > 0 ? selectedWalletIds : undefined,
    },
    {
      refetchOnMount: "always",
      enabled: compareWithPrevious, // Only fetch when comparison is enabled
    },
  );
```

**Step 3: Update category comparison data calculation**

Replace the `categoryComparisonData` useMemo with:

```typescript
  // Calculate category comparison data
  const categoryComparisonData = useMemo(() => {
    if (!compareWithPrevious || !categoryBreakdown?.categories || !previousCategoryBreakdown?.categories) {
      return [];
    }

    // Create map of current period expenses by category
    const currentMap = new Map<string, number>();
    categoryBreakdown.categories
      .filter((c) => c.type === 2)
      .forEach((cat) => {
        currentMap.set(cat.categoryName || "Uncategorized", cat.displayAmount?.amount || 0);
      });

    // Create map of previous period expenses by category
    const previousMap = new Map<string, number>();
    previousCategoryBreakdown.categories
      .filter((c) => c.type === 2)
      .forEach((cat) => {
        previousMap.set(cat.categoryName || "Uncategorized", cat.displayAmount?.amount || 0);
      });

    // Get all unique categories
    const allCategories = new Set([...currentMap.keys(), ...previousMap.keys()]);

    return Array.from(allCategories).map((category) => ({
      category,
      thisMonth: currentMap.get(category) || 0,
      lastMonth: previousMap.get(category) || 0,
    })).sort((a, b) => b.thisMonth - a.thisMonth);
  }, [categoryBreakdown, previousCategoryBreakdown, compareWithPrevious]);
```

---

## Task 9: Add Category Selection Filter

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`
- Create: `src/wj-client/components/report/WalletSelector.tsx` (if needed)
- Modify: `src/wj-client/components/report/CategorySelector.tsx` (if needed)

**Step 1: Add wallet and category selection UI**

Add after the PeriodSelector:

```typescript
      {/* Wallet Selector - Optional */}
      {/* TODO: Implement multi-select wallet filter */}
```

**Step 2: Fetch categories for export dialog**

Add to the component:

```typescript
  // Fetch categories for export
  const { data: categoriesData } = useQueryListCategories(
    { pagination: { page: 1, pageSize: 100, orderBy: "", order: "" } },
    { refetchOnMount: "always" },
  );

  const categoriesForExport = useMemo(() => {
    return categoriesData?.categories?.map((cat) => ({
      id: cat.id?.toString() || "",
      name: cat.name || "Uncategorized",
    })) || [];
  }, [categoriesData]);
```

**Step 3: Update ExportButton categories prop**

Replace:

```typescript
        <ExportButton
          onExport={handleExport}
          categories={categoriesForExport}
        />
```

---

## Task 10: Add Error Handling and Empty States

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`

**Step 1: Add error display**

Add before the return statement:

```typescript
  // Handle errors
  if (reportError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <BaseCard className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold text-danger-600 mb-4">Error Loading Report</h2>
            <p className="text-neutral-600 mb-6">
              {reportError.message || "Failed to load financial data. Please try again."}
            </p>
            <button
              onClick={() => refetchReport()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Retry
            </button>
          </div>
        </BaseCard>
      </div>
    );
  }
```

**Step 2: Add empty state**

Add after the summary cards if no data:

```typescript
      {/* No Data State */}
      {(!reportData?.walletData || reportData.walletData.length === 0) && !isLoading && (
        <BaseCard className="p-8">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Data Available</h3>
            <p className="text-neutral-600">
              No transactions found for the selected period. Try selecting a different time range.
            </p>
          </div>
        </BaseCard>
      )}
```

---

## Task 11: Fix Icon Paths

**Files:**
- Modify: `src/wj-client/app/dashboard/report/SummaryCards.tsx`

**Step 1: Update icon paths**

Check if icons exist and update paths if needed. If icons don't exist, use inline SVGs or remove icon references.

---

## Task 12: Write Tests

**Files:**
- Create: `src/wj-client/app/dashboard/report/data-utils.test.ts`
- Create: `src/wj-client/utils/export/report-pdf-export.test.ts`
- Create: `src/wj-client/utils/export/report-excel-export.test.ts`

**Step 1: Write data utils tests**

Create `src/wj-client/app/dashboard/report/data-utils.test.ts`:

```typescript
import { describe, it, expect } from "@jest/globals";
import {
  getDateRangeForPeriod,
  toUnixTimestamp,
  calculateSummaryData,
  calculateTrendData,
  getCategoryColor,
  calculateSavingsRate,
} from "./data-utils";
import { GetFinancialReportResponse } from "@/gen/protobuf/v1/transaction";

describe("Report Data Utils", () => {
  describe("getDateRangeForPeriod", () => {
    it("should return correct range for this-month", () => {
      const result = getDateRangeForPeriod("this-month");
      expect(result.startDate.getMonth()).toBe(new Date().getMonth());
      expect(result.endDate.getDate()).toBe(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
      );
    });

    it("should return correct range for custom", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      const result = getDateRangeForPeriod("custom", { startDate: start, endDate: end });
      expect(result.startDate).toEqual(start);
      expect(result.endDate).toEqual(end);
    });
  });

  describe("toUnixTimestamp", () => {
    it("should convert date to unix timestamp", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const result = toUnixTimestamp(date);
      expect(result).toBe(1704067200);
    });
  });

  describe("calculateSavingsRate", () => {
    it("should calculate savings rate correctly", () => {
      expect(calculateSavingsRate(5000, 3000)).toBe(40);
      expect(calculateSavingsRate(1000, 1000)).toBe(0);
      expect(calculateSavingsRate(0, 100)).toBe(0);
    });
  });

  describe("getCategoryColor", () => {
    it("should return colors from the palette", () => {
      expect(getCategoryColor(0)).toBe("#008148");
      expect(getCategoryColor(10)).toBe(getCategoryColor(10 % 8)); // Should wrap around
    });
  });

  describe("calculateSummaryData", () => {
    it("should return zero values for empty report", () => {
      const result = calculateSummaryData(undefined, "this-month");
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netSavings).toBe(0);
    });

    it("should calculate summary from report data", () => {
      const mockReport: GetFinancialReportResponse = {
        success: true,
        message: "test",
        year: 2024,
        totals: [
          {
            month: 0,
            income: { amount: 500000, currency: "VND" },
            expense: { amount: 300000, currency: "VND" },
            displayIncome: { amount: 500000, currency: "VND" },
            displayExpense: { amount: 300000, currency: "VND" },
          },
        ],
        timestamp: "",
      };

      const result = calculateSummaryData(mockReport, "this-month");
      expect(result.totalIncome).toBe(500000);
      expect(result.totalExpenses).toBe(300000);
      expect(result.netSavings).toBe(200000);
    });
  });
});
```

**Step 2: Run tests**

Run: `npm test -- data-utils.test.ts`
Expected: All tests pass

---

## Task 13: End-to-End Testing

**Files:**
- Create: `src/wj-client/app/dashboard/report/report.test.tsx`

**Step 1: Write component tests**

Create `src/wj-client/app/dashboard/report/report.test.tsx`:

```typescript
import { describe, it, expect } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import ReportPageEnhanced from "./page";

// Mock hooks
jest.mock("@/utils/generated/hooks", () => ({
  useQueryGetFinancialReport: jest.fn(),
  useQueryGetCategoryBreakdown: jest.fn(),
  useQueryListCategories: jest.fn(),
}));

describe("ReportPage", () => {
  it("should render loading state initially", () => {
    (require("@/utils/generated/hooks").useQueryGetFinancialReport as jest.Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    render(<ReportPageEnhanced />);
    expect(screen.getByText(/financial report/i)).toBeInTheDocument();
  });

  it("should render summary cards with data", async () => {
    const mockData = {
      success: true,
      year: 2024,
      totals: [
        {
          month: 0,
          displayIncome: { amount: 5000, currency: "USD" },
          displayExpense: { amount: 3000, currency: "USD" },
        },
      ],
    };

    (require("@/utils/generated/hooks").useQueryGetFinancialReport as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockData,
    });

    (require("@/utils/generated/hooks").useQueryGetCategoryBreakdown as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        categories: [
          { categoryId: 1, categoryName: "Food", type: 2, displayAmount: { amount: 500, currency: "USD" } },
        ],
        currency: "USD",
      },
    });

    render(<ReportPageEnhanced />);

    await waitFor(() => {
      expect(screen.getByText(/Financial Report/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run tests**

Run: `npm test -- report.test.tsx`
Expected: All tests pass

---

## Task 14: Generate API Client Code

**Files:**
- None (generated)

**Step 1: Regenerate protobuf code**

Run: `task proto:all`
Expected: TypeScript and Go code generated for new API

---

## Task 15: Final Testing and Verification

**Files:**
- All modified files

**Step 1: Manual testing checklist**

- [ ] Report page loads without errors
- [ ] Period selector changes update all data
- [ ] Custom date range works correctly
- [ ] Compare with previous period toggle works
- [ ] Summary cards show correct data
- [ ] Expense breakdown donut chart displays
- [ ] Category comparison bar chart displays
- [ ] Income vs expense trend line chart displays
- [ ] Monthly summary table shows correct data
- [ ] CSV export downloads file
- [ ] PDF export downloads file
- [ ] Excel export downloads file
- [ ] Empty state displays when no data
- [ ] Error handling works correctly
- [ ] Responsive design works on mobile

**Step 2: Performance check**

- [ ] API calls are efficient
- [ ] No unnecessary re-renders
- [ ] Charts render smoothly

---

## Summary

This plan implements:

1. **New API**: Category breakdown endpoint for detailed expense/income analysis
2. **Data Processing**: Transformation utilities to convert API responses to chart-ready formats
3. **Real Data Integration**: All components now use live backend data
4. **Export Functionality**: Complete PDF and Excel export support
5. **Period Comparison**: Previous period comparison for category trends
6. **Error Handling**: Proper loading, error, and empty states
7. **Tests**: Unit tests for data utilities and components

### Dependencies
- jsPDF (already installed)
- ExcelJS (already installed)
- Recharts (already used)
- Existing protobuf infrastructure

### Migration Notes
- No database migrations required
- Frontend is backward compatible (uses existing APIs)
- New API is additive (doesn't break existing functionality)
