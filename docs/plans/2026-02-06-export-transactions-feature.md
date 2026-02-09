# Export Transactions Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement complete export functionality for transactions based on user selections from the export dialog, supporting CSV format with date range filtering, category filtering, and proper data formatting using real backend API data.

**Architecture:**

1. **Backend API Integration** - Use existing `ListTransactions` API with `TransactionFilter` for server-side filtering
2. **Frontend utility functions** - Convert API response to CSV format with proper escaping
3. **File generation** - Create properly formatted CSV files with UTF-8 encoding
4. **Testing** - Integration tests with real API calls

**Tech Stack:**

- Frontend: Next.js 15, React 19, TypeScript 5, React Query
- Backend API: Protocol Buffers (ListTransactions with TransactionFilter)
- Export Format: CSV (initially), extensible to PDF/Excel later
- Testing: Jest, React Testing Library, MSW (Mock Service Worker) for API mocking

**Key API Endpoints:**

- `GET /api/v1/transactions` - List transactions with filtering support
- `GET /api/v1/categories` - Get categories for name mapping
- `GET /api/v1/wallets` - Get wallets for name mapping

---

## Task 1: Create Export Utility Functions Module

**Files:**

- Create: `src/wj-client/utils/export/transaction-export.ts`
- Create: `src/wj-client/utils/export/index.ts`

**Step 1: Create base types and interfaces**

```typescript
// src/wj-client/utils/export/transaction-export.ts
import { Transaction } from "@/gen/protobuf/v1/transaction";
import { ExportOptions, DateRange } from "@/components/export/ExportDialog";

export interface TransactionExportData {
  transactions: Transaction[];
  categoryNames: Map<number, string>;
  walletNames: Map<number, string>;
  currency: string;
}

/**
 * Get date range timestamps based on preset
 */
export function getDateRangeTimestamps(range: DateRange): {
  startDate?: number;
  endDate?: number;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (range) {
    case "last7days":
      return {
        startDate: Math.floor(
          new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).getTime() / 1000,
        ),
        endDate: Math.floor(endOfDay.getTime() / 1000),
      };
    case "last30days":
      return {
        startDate: Math.floor(
          new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000,
        ),
        endDate: Math.floor(endOfDay.getTime() / 1000),
      };
    case "last90days":
      return {
        startDate: Math.floor(
          new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).getTime() / 1000,
        ),
        endDate: Math.floor(endOfDay.getTime() / 1000),
      };
    case "ytd":
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: Math.floor(startOfYear.getTime() / 1000),
        endDate: Math.floor(endOfDay.getTime() / 1000),
      };
    case "all":
      return {};
    case "custom":
      // Handled separately via customStartDate/customEndDate
      return {};
    default:
      return {};
  }
}

/**
 * Escape CSV value by wrapping in quotes if needed
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV content from transactions
 */
export function generateTransactionCSV(data: TransactionExportData): string {
  const { transactions, categoryNames, walletNames, currency } = data;

  // Define CSV headers
  const headers = ["Date", "Category", "Wallet", "Note", "Amount", "Type"];

  // Generate rows
  const rows = transactions.map((t) => {
    // Safely extract amount value
    const amountValue = t.displayAmount?.amount ?? t.amount?.amount ?? 0;
    const numericAmount =
      typeof amountValue === "number" ? amountValue : Number(amountValue) || 0;

    return [
      new Date(t.date * 1000).toLocaleDateString(),
      escapeCSV(categoryNames.get(t.categoryId) || "Uncategorized"),
      escapeCSV(walletNames.get(t.walletId) || "Unknown Wallet"),
      escapeCSV(t.note || ""),
      formatCurrency(numericAmount, currency),
      t.type === 1 ? "Expense" : "Income",
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Generate default filename based on date range
 */
export function generateExportFilename(
  baseName: string = "transactions",
  dateRange: DateRange,
  customStartDate?: Date,
  customEndDate?: Date,
  customFileName?: string,
): string {
  if (customFileName) {
    return `${customFileName}.csv`;
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  let rangeStr = "";
  if (dateRange === "custom" && customStartDate && customEndDate) {
    rangeStr = `_${customStartDate.toISOString().split("T")[0]}_to_${customEndDate.toISOString().split("T")[0]}`;
  } else if (dateRange !== "all") {
    rangeStr = `_${dateRange}`;
  }

  return `${baseName}${rangeStr}_${dateStr}.csv`;
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(
  csvContent: string,
  fileName: string,
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Import formatCurrency utility
import { formatCurrency } from "@/utils/currency-formatter";
```

**Step 2: Create index file**

```typescript
// src/wj-client/utils/export/index.ts
export {
  getDateRangeTimestamps,
  generateTransactionCSV,
  generateExportFilename,
  downloadCSV,
  type TransactionExportData,
} from "./transaction-export";

// Re-export existing financial report export
export { exportFinancialReportToCSV } from "@/utils/csv-export";
```

**Step 3: Check for TypeScript errors**

Run: `cd src/wj-client && npx tsc --noEmit`

Expected: No type errors

**Step 4: Commit**

```bash
git add src/wj-client/utils/export/
git commit -m "feat(export): create transaction export utility module"
```

---

## Task 2: Create Export Hook with API Integration

**Files:**

- Create: `src/wj-client/hooks/useExportTransactions.ts`

**Step 1: Create the export hook**

```typescript
// src/wj-client/hooks/useExportTransactions.ts
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryListTransactions, useQueryListCategories, useQueryListWallets } from "@/utils/generated/hooks";
import { ExportOptions } from "@/components/export/ExportDialog";
import { Transaction } from "@/gen/protobuf/v1/transaction";
import {
  getDateRangeTimestamps,
  generateTransactionCSV,
  generateExportFilename,
  downloadCSV,
  type TransactionExportData,
} from "@/utils/export";
import { formatCurrency } from "@/utils/currency-formatter";

interface UseExportTransactionsOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function useExportTransactions(options?: UseExportTransactionsOptions) {
  const queryClient = useQueryClient();

  return useCallback(
    async (exportOptions: ExportOptions) => {
      try {
        // Build filter for API call
        const { startDate, endDate } = getDateRangeTimestamps(exportOptions.dateRange);

        // Use custom dates if provided
        const apiStartDate =
          exportOptions.customStartDate !== undefined
            ? Math.floor(exportOptions.customStartDate.getTime() / 1000)
            : startDate;
        const apiEndDate =
          exportOptions.customEndDate !== undefined
            ? Math.floor(exportOptions.customEndDate.getTime() / 1000)
            : endDate;

        // Build filter object for API
        // Note: For category filtering, we'll fetch all and filter client-side
        // since the API filter only supports single categoryId
        const filter = {
          startDate: apiStartDate,
          endDate: apiEndDate,
        };

        // Fetch all transactions matching date range
        // Use a large page size to get all data
        const { data: transactionsData } = await queryClient.fetchQuery({
          queryKey: ["ListTransactions", "export", filter],
          queryFn: () =>
            fetch("/api/v1/transactions?" + new URLSearchParams({
              pagination: JSON.stringify({ page: 1, pageSize: 10000, orderBy: "date", order: "desc" }),
              filter: JSON.stringify(filter),
              sortField: "1", // DATE
              sortOrder: "desc",
            })).then(res => res.json()),
        });

        const transactions: Transaction[] = transactionsData?.transactions || [];

        if (transactions.length === 0) {
          throw new Error("No transactions to export with the selected filters");
        }

        // Apply category filter client-side if specified
        let filteredTransactions = transactions;
        if (exportOptions.includeCategories.length > 0) {
          const categoryIds = new Set(
            exportOptions.includeCategories.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id)),
          );
          filteredTransactions = transactions.filter((t) => categoryIds.has(t.categoryId));
        }

        if (filteredTransactions.length === 0) {
          throw new Error("No transactions match the selected filters");
        }

        // Get categories and wallets for name mapping
        const [categoriesData, walletsData] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: ["ListCategories"],
            queryFn: () => fetch("/api/v1/categories?pagination=" + JSON.stringify({ page: 1, pageSize: 100, orderBy: "id", order: "asc" }))
              .then(res => res.json()),
          }),
          queryClient.fetchQuery({
            queryKey: ["ListWallets"],
            queryFn: () => fetch("/api/v1/wallets?pagination=" + JSON.stringify({ page: 1, pageSize: 100, orderBy: "id", order: "asc" }))
              .then(res => res.json()),
          }),
        ]);

        // Create lookup maps
        const categoryNames = new Map<number, string>();
        categoriesData?.categories?.forEach((cat: any) => {
          categoryNames.set(cat.id, cat.name);
        });

        const walletNames = new Map<number, string>();
        walletsData?.wallets?.forEach((wallet: any) => {
          walletNames.set(wallet.id, wallet.walletName);
        });

        // Get currency from first transaction or default
        const currency = filteredTransactions[0]?.displayCurrency || "VND";

        // Generate CSV
        const exportData: TransactionExportData = {
          transactions: filteredTransactions,
          categoryNames,
          walletNames,
          currency,
        };

        const csvContent = generateTransactionCSV(exportData);
        const fileName = generateExportFilename(
          "transactions",
          exportOptions.dateRange,
          exportOptions.customStartDate,
          exportOptions.customEndDate,
          exportOptions.fileName,
        );

        // Download file
        downloadCSV(csvContent, fileName);

        options?.onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Export failed");
        options?.onError?.(err);
        throw error;
      }
    },
    [queryClient, options],
  );
}
```

**Step 2: Check for TypeScript errors**

Run: `cd src/wj-client && npx tsc --noEmit`

Expected: No type errors

**Step 3: Commit**

```bash
git add src/wj-client/hooks/useExportTransactions.ts
git commit -m "feat(export): create useExportTransactions hook with API integration"
```

---

## Task 3: Update Transaction Page to Use Export Hook

**Files:**

- Modify: `src/wj-client/app/dashboard/transaction/page.tsx:396-462`

**Step 1: Update imports**

Add to imports in `page.tsx`:

```typescript
import { useExportTransactions } from "@/hooks/useExportTransactions";
```

**Step 2: Replace the handleExportTransactions implementation**

Replace the existing `handleExportTransactions` function (lines 396-462) with:

```typescript
// Export transactions hook
const exportTransactions = useExportTransactions({
  onError: (error) => {
    alert(error.message);
  },
  onSuccess: () => {
    // Optional: show success notification
    console.log("Transactions exported successfully");
  },
});

// Handle export transactions - now uses the hook
const handleExportTransactions = useCallback(
  async (options: ExportOptions) => {
    await exportTransactions(options);
  },
  [exportTransactions],
);
```

**Step 3: Remove the old implementation**

Remove the old inline export code that's no longer needed (lines 400-461 approximately).

**Step 4: Test manually**

Run: `cd src/wj-client && npm run dev`

Navigate to `/dashboard/transaction` and:
1. Click the Export button
2. Select different date ranges
3. Select specific categories
4. Click Export and verify the CSV file downloads with real data

**Step 5: Commit**

```bash
git add src/wj-client/app/dashboard/transaction/page.tsx
git commit -m "feat(transaction): integrate useExportTransactions hook"
```

---

## Task 4: Add MSW Handlers for Testing with Real API Structure

**Files:**

- Create: `src/wj-client/mocks/handlers.ts`
- Create: `src/wj-client/mocks/server.ts`

**Step 1: Create MSW handlers**

```typescript
// src/wj-client/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import { Transaction } from "@/gen/protobuf/v1/transaction";

const mockTransactions: Transaction[] = [
  {
    id: 1,
    walletId: 1,
    categoryId: 1,
    type: 2, // EXPENSE
    amount: { amount: 150000, currency: "VND" },
    displayAmount: { amount: 150000, currency: "VND" },
    date: Math.floor(new Date("2024-02-01").getTime() / 1000),
    note: "Lunch at restaurant",
    currency: "VND",
    displayCurrency: "VND",
    createdAt: Math.floor(new Date("2024-02-01").getTime() / 1000),
    updatedAt: Math.floor(new Date("2024-02-01").getTime() / 1000),
  },
  {
    id: 2,
    walletId: 1,
    categoryId: 2,
    type: 1, // INCOME
    amount: { amount: 5000000, currency: "VND" },
    displayAmount: { amount: 5000000, currency: "VND" },
    date: Math.floor(new Date("2024-02-05").getTime() / 1000),
    note: "Salary",
    currency: "VND",
    displayCurrency: "VND",
    createdAt: Math.floor(new Date("2024-02-05").getTime() / 1000),
    updatedAt: Math.floor(new Date("2024-02-05").getTime() / 1000),
  },
  {
    id: 3,
    walletId: 2,
    categoryId: 3,
    type: 2, // EXPENSE
    amount: { amount: 50000, currency: "VND" },
    displayAmount: { amount: 50000, currency: "VND" },
    date: Math.floor(new Date("2024-01-15").getTime() / 1000),
    note: "Coffee",
    currency: "VND",
    displayCurrency: "VND",
    createdAt: Math.floor(new Date("2024-01-15").getTime() / 1000),
    updatedAt: Math.floor(new Date("2024-01-15").getTime() / 1000),
  },
];

export const handlers = [
  // List transactions endpoint
  http.get("/api/v1/transactions", ({ request }) => {
    const url = new URL(request.url);
    const filterParam = url.searchParams.get("filter");

    let filteredTransactions = [...mockTransactions];

    // Apply date range filter if provided
    if (filterParam) {
      try {
        const filter = JSON.parse(filterParam);
        if (filter.startDate) {
          filteredTransactions = filteredTransactions.filter(
            (t) => t.date >= filter.startDate
          );
        }
        if (filter.endDate) {
          filteredTransactions = filteredTransactions.filter(
            (t) => t.date <= filter.endDate
          );
        }
      } catch (e) {
        console.error("Failed to parse filter:", e);
      }
    }

    return HttpResponse.json({
      success: true,
      message: "Transactions retrieved successfully",
      transactions: filteredTransactions,
      pagination: {
        page: 1,
        pageSize: 10000,
        totalCount: filteredTransactions.length,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // List categories endpoint
  http.get("/api/v1/categories", () => {
    return HttpResponse.json({
      success: true,
      message: "Categories retrieved successfully",
      categories: [
        { id: 1, userId: 1, name: "Food", type: 2, createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000 },
        { id: 2, userId: 1, name: "Salary", type: 1, createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000 },
        { id: 3, userId: 1, name: "Transport", type: 2, createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000 },
      ],
      pagination: {
        page: 1,
        pageSize: 100,
        totalCount: 3,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // List wallets endpoint
  http.get("/api/v1/wallets", () => {
    return HttpResponse.json({
      success: true,
      message: "Wallets retrieved successfully",
      wallets: [
        { id: 1, userId: 1, walletName: "Cash", balance: 1000000, currency: "VND", type: 0, createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000 },
        { id: 2, userId: 1, walletName: "Bank Account", balance: 5000000, currency: "VND", type: 0, createdAt: Date.now() / 1000, updatedAt: Date.now() / 1000 },
      ],
      pagination: {
        page: 1,
        pageSize: 100,
        totalCount: 2,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
```

**Step 2: Create MSW server setup**

```typescript
// src/wj-client/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

**Step 3: Update test setup**

```typescript
// src/wj-client/test/setup.ts
import { server } from "../mocks/server";

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());
```

**Step 4: Commit**

```bash
git add src/wj-client/mocks/
git commit -m "test(export): add MSW handlers for export testing"
```

---

## Task 5: Write Integration Tests for Export Functionality

**Files:**

- Create: `src/wj-client/utils/export/transaction-export.test.ts`
- Create: `src/wj-client/hooks/useExportTransactions.test.ts`

**Step 1: Test export utility functions**

```typescript
// src/wj-client/utils/export/transaction-export.test.ts
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import {
  getDateRangeTimestamps,
  generateTransactionCSV,
  generateExportFilename,
  downloadCSV,
  type TransactionExportData,
} from "./transaction-export";
import { Transaction } from "@/gen/protobuf/v1/transaction";

describe("getDateRangeTimestamps", () => {
  it("should return correct timestamps for last7days", () => {
    const result = getDateRangeTimestamps("last7days");
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();

    // Verify start date is approximately 7 days ago
    expect(Math.abs(result.startDate! - Math.floor(sevenDaysAgo.getTime() / 1000))).toBeLessThan(60);
  });

  it("should return no timestamps for 'all' range", () => {
    const result = getDateRangeTimestamps("all");
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it("should return correct timestamps for ytd", () => {
    const result = getDateRangeTimestamps("ytd");
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    expect(result.startDate).toBe(Math.floor(startOfYear.getTime() / 1000));
    expect(result.endDate).toBeDefined();
  });
});

describe("generateTransactionCSV", () => {
  const mockCategoryNames = new Map([[1, "Food"], [2, "Salary"]]);
  const mockWalletNames = new Map([[1, "Cash"], [2, "Bank"]]);

  it("should generate CSV with proper headers", () => {
    const data: TransactionExportData = {
      transactions: [],
      categoryNames: mockCategoryNames,
      walletNames: mockWalletNames,
      currency: "VND",
    };

    const csv = generateTransactionCSV(data);

    expect(csv).toContain("Date,Category,Wallet,Note,Amount,Type");
  });

  it("should format transaction data correctly", () => {
    const transaction: Transaction = {
      id: 1,
      walletId: 1,
      categoryId: 1,
      type: 2,
      amount: { amount: 150000, currency: "VND" },
      displayAmount: { amount: 150000, currency: "VND" },
      date: Math.floor(new Date("2024-02-01").getTime() / 1000),
      note: "Lunch",
      currency: "VND",
      displayCurrency: "VND",
      createdAt: Date.now() / 1000,
      updatedAt: Date.now() / 1000,
    };

    const data: TransactionExportData = {
      transactions: [transaction],
      categoryNames: mockCategoryNames,
      walletNames: mockWalletNames,
      currency: "VND",
    };

    const csv = generateTransactionCSV(data);

    expect(csv).toContain("Food");
    expect(csv).toContain("Cash");
    expect(csv).toContain("Lunch");
    expect(csv).toContain("150,000");
    expect(csv).toContain("Expense");
  });

  it("should escape special characters in CSV", () => {
    const transaction: Transaction = {
      id: 1,
      walletId: 1,
      categoryId: 1,
      type: 2,
      amount: { amount: 150000, currency: "VND" },
      displayAmount: { amount: 150000, currency: "VND" },
      date: Math.floor(new Date("2024-02-01").getTime() / 1000),
      note: 'Lunch, "special" offer',
      currency: "VND",
      displayCurrency: "VND",
      createdAt: Date.now() / 1000,
      updatedAt: Date.now() / 1000,
    };

    const data: TransactionExportData = {
      transactions: [transaction],
      categoryNames: new Map([[1, 'Food & Drink']]),
      walletNames: mockWalletNames,
      currency: "VND",
    };

    const csv = generateTransactionCSV(data);

    // Note with comma should be quoted
    expect(csv).toContain('"Lunch, ""special"" offer"');
    // Category with special character should be quoted
    expect(csv).toContain('"Food & Drink"');
  });
});

describe("generateExportFilename", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-02-06"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should generate filename for preset date range", () => {
    const filename = generateExportFilename("transactions", "last30days");
    expect(filename).toBe("transactions_last30days_2024-02-06.csv");
  });

  it("should generate filename for custom date range", () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");
    const filename = generateExportFilename("transactions", "custom", startDate, endDate);
    expect(filename).toBe("transactions_2024-01-01_to_2024-01-31_2024-02-06.csv");
  });

  it("should use custom filename if provided", () => {
    const filename = generateExportFilename("transactions", "all", undefined, undefined, "my_export");
    expect(filename).toBe("my_export.csv");
  });

  it("should generate filename for all time range", () => {
    const filename = generateExportFilename("transactions", "all");
    expect(filename).toBe("transactions_all_2024-02-06.csv");
  });
});

describe("downloadCSV", () => {
  beforeEach(() => {
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();
  });

  it("should create download link and trigger click", () => {
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };
    jest.spyOn(document, "createElement").mockReturnValue(mockLink as any);

    downloadCSV("test,content", "test.csv");

    expect(mockLink.setAttribute).toHaveBeenCalledWith("href", "blob:mock-url");
    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test.csv");
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });
});
```

**Step 2: Test the export hook**

```typescript
// src/wj-client/hooks/useExportTransactions.test.ts
import { describe, it, expect, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useExportTransactions } from "./useExportTransactions";
import { ExportOptions } from "@/components/export/ExportDialog";
import { server } from "../mocks/server";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("useExportTransactions", () => {
  beforeEach(() => {
    // Mock DOM methods for download
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();

    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };
    jest.spyOn(document, "createElement").mockReturnValue(mockLink as any);
  });

  it("should fetch transactions and export to CSV", async () => {
    const onError = jest.fn();
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useExportTransactions({ onError, onSuccess }), {
      wrapper: createWrapper(),
    });

    const options: ExportOptions = {
      format: "csv",
      dateRange: "all",
      includeCharts: false,
      includeCategories: [],
      customBranding: false,
    };

    await result.current(options);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it("should filter by date range", async () => {
    const onError = jest.fn();

    const { result } = renderHook(() => useExportTransactions({ onError }), {
      wrapper: createWrapper(),
    });

    const options: ExportOptions = {
      format: "csv",
      dateRange: "last30days",
      includeCharts: false,
      includeCategories: [],
      customBranding: false,
    };

    await result.current(options);

    await waitFor(() => {
      // Should only export recent transactions
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it("should filter by categories", async () => {
    const onError = jest.fn();

    const { result } = renderHook(() => useExportTransactions({ onError }), {
      wrapper: createWrapper(),
    });

    const options: ExportOptions = {
      format: "csv",
      dateRange: "all",
      includeCharts: false,
      includeCategories: ["1"], // Only Food category
      customBranding: false,
    };

    await result.current(options);

    await waitFor(() => {
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it("should handle empty results", async () => {
    // Mock empty response
    server.use(
      http.get("/api/v1/transactions", () => {
        return HttpResponse.json({
          success: true,
          message: "No transactions found",
          transactions: [],
          pagination: { page: 1, pageSize: 10000, totalCount: 0, totalPages: 0 },
          timestamp: new Date().toISOString(),
        });
      })
    );

    const onError = jest.fn();

    const { result } = renderHook(() => useExportTransactions({ onError }), {
      wrapper: createWrapper(),
    });

    const options: ExportOptions = {
      format: "csv",
      dateRange: "last7days",
      includeCharts: false,
      includeCategories: [],
      customBranding: false,
    };

    await expect(result.current(options)).rejects.toThrow("No transactions to export");

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "No transactions to export with the selected filters",
      })
    );
  });
});
```

**Step 3: Run tests**

Run: `cd src/wj-client && npm test -- --testPathPattern="export|useExportTransactions"`

Expected: All tests pass

**Step 4: Commit**

```bash
git add src/wj-client/utils/export/transaction-export.test.ts src/wj-client/hooks/useExportTransactions.test.ts
git commit -m "test(export): add integration tests for export functionality"
```

---

## Task 6: Add Error Handling and Loading States

**Files:**

- Modify: `src/wj-client/hooks/useExportTransactions.ts`

**Step 1: Add loading and error states to the hook**

```typescript
// Update src/wj-client/hooks/useExportTransactions.ts

import { useState, useCallback } from "react";

export function useExportTransactions(options?: UseExportTransactionsOptions) {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const exportTransactions = useCallback(
    async (exportOptions: ExportOptions) => {
      setIsExporting(true);
      setExportProgress({ current: 0, total: 3 }); // 3 steps: fetch, filter, generate

      try {
        // Step 1: Fetch transactions
        setExportProgress({ current: 1, total: 3 });
        const { startDate, endDate } = getDateRangeTimestamps(exportOptions.dateRange);

        const apiStartDate =
          exportOptions.customStartDate !== undefined
            ? Math.floor(exportOptions.customStartDate.getTime() / 1000)
            : startDate;
        const apiEndDate =
          exportOptions.customEndDate !== undefined
            ? Math.floor(exportOptions.customEndDate.getTime() / 1000)
            : endDate;

        const filter = { startDate: apiStartDate, endDate: apiEndDate };

        const { data: transactionsData } = await queryClient.fetchQuery({
          queryKey: ["ListTransactions", "export", filter],
          queryFn: () =>
            fetch("/api/v1/transactions?" + new URLSearchParams({
              pagination: JSON.stringify({ page: 1, pageSize: 10000, orderBy: "date", order: "desc" }),
              filter: JSON.stringify(filter),
              sortField: "1",
              sortOrder: "desc",
            })).then(res => res.json()),
        });

        const transactions: Transaction[] = transactionsData?.transactions || [];

        if (transactions.length === 0) {
          throw new Error("No transactions to export with the selected filters");
        }

        // Step 2: Apply filters and fetch lookup data
        setExportProgress({ current: 2, total: 3 });

        let filteredTransactions = transactions;
        if (exportOptions.includeCategories.length > 0) {
          const categoryIds = new Set(
            exportOptions.includeCategories.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id)),
          );
          filteredTransactions = transactions.filter((t) => categoryIds.has(t.categoryId));
        }

        if (filteredTransactions.length === 0) {
          throw new Error("No transactions match the selected filters");
        }

        const [categoriesData, walletsData] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: ["ListCategories"],
            queryFn: () => fetch("/api/v1/categories?pagination=" + JSON.stringify({ page: 1, pageSize: 100, orderBy: "id", order: "asc" }))
              .then(res => res.json()),
          }),
          queryClient.fetchQuery({
            queryKey: ["ListWallets"],
            queryFn: () => fetch("/api/v1/wallets?pagination=" + JSON.stringify({ page: 1, pageSize: 100, orderBy: "id", order: "asc" }))
              .then(res => res.json()),
          }),
        ]);

        // Step 3: Generate and download
        setExportProgress({ current: 3, total: 3 });

        const categoryNames = new Map<number, string>();
        categoriesData?.categories?.forEach((cat: any) => {
          categoryNames.set(cat.id, cat.name);
        });

        const walletNames = new Map<number, string>();
        walletsData?.wallets?.forEach((wallet: any) => {
          walletNames.set(wallet.id, wallet.walletName);
        });

        const currency = filteredTransactions[0]?.displayCurrency || "VND";

        const exportData: TransactionExportData = {
          transactions: filteredTransactions,
          categoryNames,
          walletNames,
          currency,
        };

        const csvContent = generateTransactionCSV(exportData);
        const fileName = generateExportFilename(
          "transactions",
          exportOptions.dateRange,
          exportOptions.customStartDate,
          exportOptions.customEndDate,
          exportOptions.fileName,
        );

        downloadCSV(csvContent, fileName);

        options?.onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Export failed");
        options?.onError?.(err);
        throw error;
      } finally {
        setIsExporting(false);
        setExportProgress({ current: 0, total: 0 });
      }
    },
    [queryClient, options],
  );

  return { exportTransactions, isExporting, exportProgress };
}
```

**Step 2: Update ExportDialog to show loading state**

```typescript
// Modify src/wj-client/components/export/ExportDialog.tsx

// Update ExportButton component interface and implementation

export function ExportButton({
  onExport,
  categories,
  isExporting = false,
}: {
  onExport: (options: ExportOptions) => void | Promise<void>;
  categories?: Array<{ id: string; name: string }>;
  isExporting?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type={ButtonType.SECONDARY}
        onClick={() => setIsOpen(true)}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <svg
              className="w-4 h-4 mr-2 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </>
        )}
      </Button>

      <ExportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onExport={onExport}
        categories={categories}
        isExporting={isExporting}
      />
    </>
  );
}
```

**Step 3: Update transaction page to use loading state**

```typescript
// Modify src/wj-client/app/dashboard/transaction/page.tsx

// Destructure isExporting from hook
const { exportTransactions, isExporting } = useExportTransactions({
  onError: (error) => {
    alert(error.message);
  },
});

// Pass isExporting to ExportButton
<ExportButton
  onExport={handleExportTransactions}
  categories={categoryOptions.map((c) => ({
    id: c.value,
    name: c.label,
  }))}
  isExporting={isExporting}
/>
```

**Step 4: Commit**

```bash
git add src/wj-client/hooks/useExportTransactions.ts src/wj-client/components/export/ExportDialog.tsx src/wj-client/app/dashboard/transaction/page.tsx
git commit -m "feat(export): add loading states and error handling"
```

---

## Task 7: Write Export Dialog Integration Tests

**Files:**

- Create: `src/wj-client/components/export/ExportDialog.test.tsx`

**Step 1: Create integration test**

```typescript
// src/wj-client/components/export/ExportDialog.test.tsx
import { describe, it, expect, vi } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExportDialog, ExportButton } from "./ExportDialog";
import { ExportOptions } from "./ExportDialog";
import { server } from "../../mocks/server";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("ExportDialog", () => {
  const mockOnExport = vi.fn();
  const mockOnClose = vi.fn();
  const mockCategories = [
    { id: "1", name: "Food" },
    { id: "2", name: "Transport" },
    { id: "3", name: "Utilities" },
  ];

  beforeEach(() => {
    mockOnExport.mockClear();
    mockOnClose.mockClear();
  });

  it("should render export format options", () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        categories={mockCategories}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Excel")).toBeInTheDocument();
  });

  it("should call onExport with CSV format when selected", async () => {
    const user = userEvent.setup();

    render(
      <ExportDialog
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        categories={mockCategories}
      />,
      { wrapper: createWrapper() }
    );

    // Click CSV format
    await user.click(screen.getByText("CSV"));

    // Select date range
    await user.click(screen.getByText("Last 30 days"));

    // Select a category
    const categoryCheckbox = screen.getByLabelText("Food");
    await user.click(categoryCheckbox);

    // Click export button
    const exportButton = screen.getByRole("button", { name: /export/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "csv",
          dateRange: "last30days",
          includeCategories: ["1"],
        })
      );
    });
  });

  it("should show custom date inputs when custom range selected", async () => {
    const user = userEvent.setup();

    render(
      <ExportDialog
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        categories={mockCategories}
      />,
      { wrapper: createWrapper() }
    );

    // Click custom range
    await user.click(screen.getByText("Custom range"));

    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("should allow selecting multiple categories", async () => {
    const user = userEvent.setup();

    render(
      <ExportDialog
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        categories={mockCategories}
      />,
      { wrapper: createWrapper() }
    );

    // Select multiple categories
    await user.click(screen.getByLabelText("Food"));
    await user.click(screen.getByLabelText("Transport"));

    // Click export
    await user.click(screen.getByRole("button", { name: /export/i }));

    await waitFor(() => {
      const calledWith = mockOnExport.mock.calls[0][0];
      expect(calledWith.includeCategories).toContain("1");
      expect(calledWith.includeCategories).toContain("2");
    });
  });

  it("should show and hide preview section", async () => {
    const user = userEvent.setup();

    render(
      <ExportDialog
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        categories={mockCategories}
      />,
      { wrapper: createWrapper() }
    );

    // Initially preview is hidden
    expect(screen.queryByText("Export Summary")).not.toBeInTheDocument();

    // Click show preview
    await user.click(screen.getByText(/show preview/i));

    expect(screen.getByText("Export Summary")).toBeInTheDocument();

    // Click hide preview
    await user.click(screen.getByText(/hide preview/i));

    expect(screen.queryByText("Export Summary")).not.toBeInTheDocument();
  });

  it("should reset state when dialog reopens", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ExportDialog
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        categories={mockCategories}
      />,
      { wrapper: createWrapper() }
    );

    // Change some selections
    await user.click(screen.getByText("PDF"));
    await user.click(screen.getByLabelText("Food"));

    // Close and reopen
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ExportDialog
          isOpen={false}
          onClose={mockOnClose}
          onExport={mockOnExport}
          categories={mockCategories}
        />
      </QueryClientProvider>
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ExportDialog
          isOpen={true}
          onClose={mockOnClose}
          onExport={mockOnExport}
          categories={mockCategories}
        />
      </QueryClientProvider>
    );

    // State should be reset to defaults
    // CSV should be selected again (default)
    // Food should be unselected
  });
});

describe("ExportButton", () => {
  it("should open dialog when clicked", async () => {
    const user = userEvent.setup();

    render(
      <ExportButton
        onExport={vi.fn()}
        categories={[]}
      />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByText("Export");
    await user.click(button);

    expect(screen.getByText("Export Format")).toBeInTheDocument();
  });

  it("should show loading state when exporting", () => {
    render(
      <ExportButton
        onExport={vi.fn()}
        categories={[]}
        isExporting={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Exporting...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exporting/i })).toBeDisabled();
  });
});
```

**Step 2: Run tests**

Run: `cd src/wj-client && npm test -- ExportDialog.test.tsx`

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/wj-client/components/export/ExportDialog.test.tsx
git commit -m "test(export): add integration tests for ExportDialog component"
```

---

## Task 8: Add Documentation

**Files:**

- Create: `src/wj-client/utils/export/README.md`

**Step 1: Create comprehensive documentation**

```markdown
# Transaction Export Feature

## Overview

The transaction export feature allows users to export their transaction data to CSV format with various filtering options.

## Architecture

```
┌─────────────────┐
│  ExportDialog   │ UI Component
│   (User Input)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ useExportTransactions│ Custom Hook
│   (API Calls)       │
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │ ListTransactions
│  (Filtered)     │ with TransactionFilter
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Export Utils    │ CSV Generation
│ (Format & Download)│
└─────────────────┘
```

## Usage

### Basic Export

```typescript
import { useExportTransactions } from "@/hooks/useExportTransactions";
import { ExportButton } from "@/components/export/ExportDialog";

function MyComponent() {
  const { exportTransactions, isExporting } = useExportTransactions({
    onSuccess: () => console.log("Export complete"),
    onError: (error) => alert(error.message),
  });

  return (
    <ExportButton
      onExport={exportTransactions}
      categories={categories}
      isExporting={isExporting}
    />
  );
}
```

### Manual Export

```typescript
import {
  getDateRangeTimestamps,
  generateTransactionCSV,
  downloadCSV,
  type TransactionExportData,
} from "@/utils/export";

// Get date range
const { startDate, endDate } = getDateRangeTimestamps("last30days");

// Fetch transactions from API
const response = await fetch(`/api/v1/transactions?filter=${JSON.stringify({ startDate, endDate })}`);
const data = await response.json();

// Generate CSV
const csvData: TransactionExportData = {
  transactions: data.transactions,
  categoryNames: new Map([[1, "Food"], [2, "Transport"]]),
  walletNames: new Map([[1, "Cash"], [2, "Bank"]]),
  currency: "VND",
};

const csvContent = generateTransactionCSV(csvData);

// Download
downloadCSV(csvContent, "transactions.csv");
```

## Date Range Options

| Option | Description | Example |
|--------|-------------|---------|
| `last7days` | Last 7 days from today | Feb 6 - Feb 13 |
| `last30days` | Last 30 days from today | Jan 15 - Feb 13 |
| `last90days` | Last 90 days from today | Nov 15 - Feb 13 |
| `ytd` | Year to date (Jan 1) | Jan 1 - Feb 13 |
| `all` | All transactions | - |
| `custom` | User-defined range | 2024-01-01 to 2024-01-31 |

## CSV Format

The exported CSV file contains the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Date | Transaction date (localized) | 2/6/2024 |
| Category | Category name | Food |
| Wallet | Wallet name | Cash |
| Note | Transaction note | Lunch at restaurant |
| Amount | Formatted amount | ₫150,000 |
| Type | Income/Expense | Expense |

## File Naming Convention

Default pattern: `transactions_{dateRange}_{date}.csv`

Examples:
- `transactions_last30days_2024-02-06.csv`
- `transactions_2024-01-01_to_2024-01-31_2024-02-06.csv`
- `transactions_all_2024-02-06.csv`

Custom filename: Uses the value from `options.fileName` + `.csv`

## API Integration

The export feature uses the existing `ListTransactions` API endpoint:

```
GET /api/v1/transactions
```

Request parameters:
```typescript
{
  pagination: {
    page: 1,
    pageSize: 10000, // Large page size for export
    orderBy: "date",
    order: "desc"
  },
  filter: {
    startDate?: number,  // Unix timestamp
    endDate?: number,    // Unix timestamp
    categoryId?: number, // Note: Only single category, multi-select handled client-side
    type?: TransactionType,
    minAmount?: number,
    maxAmount?: number,
    searchNote?: string
  },
  sortField: 1, // DATE
  sortOrder: "desc"
}
```

## Performance Considerations

1. **Large Datasets**: For exports with >1000 transactions, consider implementing pagination or streaming
2. **Client-side Filtering**: Category multi-filter is done client-side since API only supports single category
3. **Caching**: React Query caches API responses, improving performance on repeated exports

## Error Handling

The export function throws errors for:
- No transactions found after filtering
- API fetch failures
- CSV generation failures

Always wrap in try/catch or use the `onError` callback:

```typescript
const { exportTransactions } = useExportTransactions({
  onError: (error) => {
    toast.error(error.message);
  }
});
```

## Future Enhancements

- PDF export with charts
- Excel export with formatting
- Streaming export for very large datasets
- Progress bar for large exports
- Email export option
```

**Step 2: Update main project documentation**

Add export feature to main docs if applicable.

**Step 3: Commit**

```bash
git add src/wj-client/utils/export/README.md
git commit -m "docs(export): add comprehensive documentation"
```

---

## Task 9: Manual Testing Checklist

**Files:**

- Manual testing verification

**Step 1: Create testing checklist**

```markdown
# Export Feature Testing Checklist

## Prerequisites
- [ ] Backend server is running
- [ ] Frontend is running in dev mode
- [ ] User is logged in
- [ ] Test data exists (transactions, categories, wallets)

## Date Range Testing

### Last 7 Days
- [ ] Export contains only transactions from last 7 days
- [ ] Filename includes "last7days"
- [ ] Date filter is correctly applied

### Last 30 Days
- [ ] Export contains only transactions from last 30 days
- [ ] Transactions older than 30 days are excluded
- [ ] Boundary transactions are handled correctly

### Last 90 Days
- [ ] Export contains only transactions from last 90 days
- [ ] Correct number of transactions exported

### Year to Date
- [ ] Export starts from January 1 of current year
- [ ] All current year transactions included

### All Time
- [ ] All transactions in database are exported
- [ ] No date filtering applied

### Custom Range
- [ ] Start date is inclusive
- [ ] End date is inclusive (end of day)
- [ ] Custom range appears in filename

## Category Filtering

### No Categories Selected
- [ ] All categories are included in export
- [ ] Helper text says "All categories will be included"

### Single Category
- [ ] Only selected category appears in export
- [ ] Correct category count shown

### Multiple Categories
- [ ] All selected categories appear in export
- [ ] Unselected categories are excluded
- [ ] Category count updates correctly

### Select All / Clear All
- [ ] Select All checks all categories
- [ ] Clear All unchecks all categories

## CSV Format Validation

### Headers
- [ ] Column headers present: Date, Category, Wallet, Note, Amount, Type
- [ ] Headers are in correct order
- [ ] No extra whitespace

### Data Content
- [ ] Dates are properly formatted
- [ ] Category names are correct
- [ ] Wallet names are correct
- [ ] Amounts have proper currency formatting
- [ ] Type shows "Income" or "Expense"

### Special Characters
- [ ] Commas in notes are escaped
- [ ] Quotes in notes are escaped
- [ ] Newlines in notes are handled
- [ ] Unicode characters display correctly

## File Download

### File Creation
- [ ] File downloads automatically
- [ ] File has .csv extension
- [ ] File can be opened in spreadsheet software

### Filename
- [ ] Default filename format is correct
- [ ] Custom filename works when provided
- [ ] Date in filename is today's date
- [ ] No special characters in filename

## Error Handling

### Empty Results
- [ ] Error message shown when no transactions match filters
- [ ] No file download attempted
- [ ] User can dismiss error and try again

### API Errors
- [ ] Network errors are handled gracefully
- [ ] Error message is user-friendly
- [ ] Export button returns to normal state

## UI Interactions

### Dialog Behavior
- [ ] Export button opens dialog
- [ ] Cancel button closes dialog without changes
- [ ] Export button closes dialog after success
- [ ] Dialog focuses management works (tab trap)

### Loading States
- [ ] Export button shows loading spinner
- [ ] Export button is disabled during export
- [ ] Loading text changes ("Exporting...")
- [ ] Button returns to normal after completion

### Preview Section
- [ ] Show/Hide preview toggle works
- [ ] Preview shows current selections
- [ ] Preview updates when options change

## Cross-Browser Testing

- [ ] Chrome/Edge: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile Safari: Responsive, works on touch
- [ ] Mobile Chrome: Responsive, works on touch

## Performance

- [ ] Small dataset (<100 transactions): Export completes in <2 seconds
- [ ] Medium dataset (100-1000): Export completes in <5 seconds
- [ ] Large dataset (>1000): Export completes in <10 seconds
- [ ] UI remains responsive during export
```

**Step 2: Perform manual testing**

Run through the checklist with the dev server running.

**Step 3: Commit any fixes found during testing**

```bash
git add .
git commit -m "fix(export): fix issues found during manual testing"
```

---

## Task 10: Final Verification

**Files:**

- All modified files

**Step 1: Run full test suite**

```bash
cd src/wj-client
npm test -- --coverage
```

Expected: All tests pass, >80% coverage for export utilities

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Build check**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 4: End-to-end test**

1. Start backend server
2. Start frontend in dev mode
3. Log in as test user
4. Navigate to Transactions page
5. Click Export button
6. Test each date range option
7. Test category filtering
8. Verify CSV files download correctly
9. Open CSV in spreadsheet software to verify content

**Step 5: Final commit**

```bash
git add .
git commit -m "feat(transaction-export): complete export transactions feature with real API integration

Implementation includes:

- CSV export with date range filtering (last7days, last30days, last90days, ytd, all, custom)
- Category filtering with multi-select support (client-side for multi-category)
- Integration with backend ListTransactions API using TransactionFilter
- Proper CSV escaping for special characters (commas, quotes, newlines)
- Automatic file naming with date range and timestamp
- Loading states and error handling
- Comprehensive test coverage (unit and integration tests)
- MSW handlers for API mocking in tests
- Documentation and usage examples

Technical details:
- Uses React Query for API caching and data fetching
- Server-side date range filtering for performance
- Client-side category filtering for multi-select support
- Handles edge cases (empty results, special characters, unicode)
- Progress tracking during export
- Proper cleanup of blob URLs

Files:
- src/wj-client/utils/export/transaction-export.ts - Core export utilities
- src/wj-client/hooks/useExportTransactions.ts - Export hook with API integration
- src/wj-client/components/export/ExportDialog.tsx - Export dialog UI
- src/wj-client/app/dashboard/transaction/page.tsx - Integration
- src/wj-client/mocks/handlers.ts - MSW API handlers
- Test files for all modules
- Documentation in README"
```

---

## Summary

This implementation plan provides:

1. **Real API Integration**: Uses the existing `ListTransactions` backend endpoint with `TransactionFilter` for server-side filtering
2. **Proper Testing**: Integration tests with MSW handlers that mimic real API responses
3. **CSV Export**: Full CSV generation with proper escaping and formatting
4. **Date Range Filtering**: Multiple preset options plus custom date range support
5. **Category Filtering**: Multi-select with client-side filtering for multiple categories
6. **Error Handling**: Proper error messages and loading states
7. **Documentation**: Comprehensive README with usage examples
8. **Performance**: Server-side filtering for large datasets, React Query caching

The feature is extensible for future enhancements like PDF/Excel export.
