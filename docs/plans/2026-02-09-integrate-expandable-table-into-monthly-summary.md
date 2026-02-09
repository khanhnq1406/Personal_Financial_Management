# Integrate Expandable Table into Monthly Summary Report

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the simple inline Monthly Summary table in the report page with the more feature-rich ExpandableTable component that shows wallet-level data with expandable rows for Income/Expense breakdowns.

**Architecture:** The report page currently has two separate tables:
1. A simple "Monthly Summary" table (inline HTML) showing aggregated Month/Income/Expenses/Net/Savings Rate
2. A feature-rich `ExpandableTable` component (not currently used in page.tsx) showing wallet-level data with expandable rows

This plan integrates the ExpandableTable into the Monthly Summary section, replacing the inline table while preserving all existing functionality.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, existing API hooks

---

## Task 1: Analyze Current Implementation and Verify Component Compatibility

**Files:**
- Read: `src/wj-client/app/dashboard/report/page.tsx`
- Read: `src/wj-client/app/dashboard/report/FinancialTable.tsx`
- Read: `src/wj-client/app/dashboard/report/ExpandableTable.tsx`
- Read: `src/wj-client/app/dashboard/report/data-utils.ts`

**Step 1: Verify current Monthly Summary table implementation**

Confirm the current Monthly Summary table is in `page.tsx` lines 547-607.

Run: `grep -n "Monthly Summary" src/wj-client/app/dashboard/report/page.tsx`
Expected: Line 555 containing `<h3>Monthly Summary</h3>`

**Step 2: Verify ExpandableTable component interface**

The ExpandableTable expects these props (from ExpandableTable.tsx:28-33):
```typescript
interface ExpandableTableProps {
  months: string[];
  wallets: WalletData[];
  totals: TableData[];
  onToggleWallet: (walletId: number) => void;
}
```

**Step 3: Verify data transformation logic**

The `FinancialTable` component (lines 48-121) already transforms `reportData` into the format expected by `ExpandableTable`. We can reuse this logic.

Run: `grep -n "useMemo" src/wj-client/app/dashboard/report/FinancialTable.tsx | head -1`
Expected: Line 48 with the monthlyData useMemo

---

## Task 2: Extract Data Transformation Logic into Reusable Utility

**Files:**
- Create: `src/wj-client/app/dashboard/report/table-data-utils.ts`
- Modify: `src/wj-client/app/dashboard/report/page.tsx` (later)

**Step 1: Write the utility function for transforming report data**

Create `src/wj-client/app/dashboard/report/table-data-utils.ts`:

```typescript
"use client";

import { useMemo, useState } from "react";
import { GetFinancialReportResponse } from "@/gen/protobuf/v1/transaction";

export interface MonthlyData {
  income: number;
  expense: number;
  balance: number;
}

export interface WalletData {
  id: number;
  walletName: string;
  balance?: { amount: number };
  displayBalance?: { amount: number };
  isExpanded: boolean;
  monthlyData: MonthlyData[];
}

export interface TableData {
  income: number;
  expense: number;
  balance: number;
}

export interface TransformReportDataResult {
  months: string[];
  wallets: WalletData[];
  totals: TableData[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Transform financial report data into format expected by ExpandableTable
 * Used by both FinancialTable component and Monthly Summary section
 */
export function useTransformReportData(
  reportData: GetFinancialReportResponse | undefined,
  expandedWallets: Set<number>
): TransformReportDataResult {
  return useMemo(() => {
    if (!reportData?.walletData) {
      return {
        months: MONTH_NAMES,
        wallets: [],
        totals: MONTH_NAMES.map(() => ({
          income: 0,
          expense: 0,
          balance: 0,
        })),
      };
    }

    // Transform wallet data from API to display format
    const wallets = reportData.walletData.map((wallet) => {
      let runningBalance = 0;
      const monthlyDataWithBalance = wallet.monthlyData.map((monthData) => {
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
      const income = monthData.displayIncome?.amount ?? monthData.income?.amount ?? 0;
      const expense = monthData.displayExpense?.amount ?? monthData.expense?.amount ?? 0;
      runningTotalBalance += income - expense;
      return {
        income,
        expense,
        balance: runningTotalBalance,
      };
    });

    return {
      months: MONTH_NAMES,
      wallets,
      totals,
    };
  }, [reportData, expandedWallets]);
}

/**
 * Hook for managing expanded wallet state
 */
export function useExpandedWallets(initial: Set<number> = new Set()) {
  const [expandedWallets, setExpandedWallets] = useState<Set<number>>(initial);

  const toggleWallet = (walletId: number) => {
    setExpandedWallets((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) {
        next.delete(walletId);
      } else {
        next.add(walletId);
      }
      return next;
    });
  };

  return { expandedWallets, toggleWallet };
}
```

**Step 2: Run TypeScript compilation to verify types**

Run: `cd src/wj-client && npx tsc --noEmit --skipLibCheck`
Expected: No type errors

---

## Task 3: Update FinancialTable to Use the New Utility

**Files:**
- Modify: `src/wj-client/app/dashboard/report/FinancialTable.tsx`

**Step 1: Replace inline transformation logic with utility import**

Edit `src/wj-client/app/dashboard/report/FinancialTable.tsx`:

```typescript
"use client";

import { memo } from "react";
import { useQueryGetFinancialReport } from "@/utils/generated/hooks";
import { ChartSkeleton } from "@/components/loading/Skeleton";
import { ExpandableTable } from "./ExpandableTable";
import { useTransformReportData, useExpandedWallets } from "./table-data-utils";

interface FinancialTableProps {
  walletIds?: number[];
  selectedYear?: number;
}

export const FinancialTable = memo(function FinancialTable({
  walletIds,
  selectedYear = new Date().getFullYear(),
}: FinancialTableProps) {
  const { expandedWallets, toggleWallet } = useExpandedWallets();

  // Fetch financial report data from backend
  const { data: reportData, isLoading: reportLoading } =
    useQueryGetFinancialReport(
      {
        year: selectedYear,
        walletIds: walletIds ?? [],
      },
      {
        refetchOnMount: "always",
        enabled: !!selectedYear,
      },
    );

  // Transform data for display using shared utility
  const monthlyData = useTransformReportData(reportData, expandedWallets);

  if (reportLoading) {
    return (
      <div className="w-full h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] flex items-center justify-center">
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)]">
      <ExpandableTable
        months={monthlyData.months}
        wallets={monthlyData.wallets}
        totals={monthlyData.totals}
        onToggleWallet={toggleWallet}
      />
    </div>
  );
});
```

**Step 2: Run TypeScript compilation**

Run: `cd src/wj-client && npx tsc --noEmit --skipLibCheck`
Expected: No type errors

---

## Task 4: Replace Monthly Summary Table with ExpandableTable in Report Page

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`

**Step 1: Add imports for ExpandableTable and hooks**

Add these imports to `src/wj-client/app/dashboard/report/page.tsx` (after line 44):

```typescript
import { ExpandableTable } from "./ExpandableTable";
import { useTransformReportData, useExpandedWallets } from "./table-data-utils";
```

**Step 2: Add expanded wallets state hook**

After line 51 (after `const [selectedWalletIds]`), add:

```typescript
  const [selectedWalletIds] = useState<number[]>([]);

  // State for expandable table
  const { expandedWallets, toggleWallet } = useExpandedWallets();
```

**Step 3: Transform data for ExpandableTable**

After line 278 (after the `trendData` useMemo), add:

```typescript
  // Transform report data for ExpandableTable
  const tableData = useTransformReportData(reportData, expandedWallets);
```

**Step 4: Replace the Monthly Summary table section**

Replace lines 547-607 (the entire "Detailed Financial Table" section) with:

```typescript
      {/* Detailed Financial Table with Expandable Rows */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <BaseCard className="p-4">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            Monthly Summary
          </h3>
          <div className="h-[500px] overflow-auto">
            <ExpandableTable
              months={tableData.months}
              wallets={tableData.wallets}
              totals={tableData.totals}
              onToggleWallet={toggleWallet}
            />
          </div>
        </BaseCard>
      </motion.div>
```

**Step 5: Run TypeScript compilation**

Run: `cd src/wj-client && npx tsc --noEmit --skipLibCheck`
Expected: No type errors

---

## Task 5: Verify Styling and Responsive Behavior

**Files:**
- Modify: `src/wj-client/app/dashboard/report/ExpandableTable.tsx` (if needed)

**Step 1: Test the table renders correctly**

Run: `cd src/wj-client && npm run dev`
Navigate to: `/dashboard/report`

Verify:
- [ ] Monthly Summary section shows the ExpandableTable
- [ ] Wallets are listed with expand/collapse arrows
- [ ] Clicking a wallet expands to show Income/Expense rows
- [ ] Horizontal scrolling works correctly
- [ ] Totals footer stays fixed at bottom

**Step 2: Check responsive behavior on mobile**

Test at viewport width 375px (mobile):
- [ ] Table is horizontally scrollable
- [ ] Month columns don't overflow
- [ ] Expand/collapse buttons are tappable

**Step 3: Adjust height if needed**

If the table height needs adjustment for the card container, modify the inline height in page.tsx:

```typescript
<div className="h-[600px] overflow-auto"> {/* or h-[400px] */}
```

---

## Task 6: Update Import Paths After File Creation

**Files:**
- Modify: `src/wj-client/app/dashboard/report/FinancialTable.tsx`
- Modify: `src/wj-client/app/dashboard/report/page.tsx`

**Step 1: Verify imports are using correct relative paths**

Both files should import from:
```typescript
import { useTransformReportData, useExpandedWallets } from "./table-data-utils";
import { ExpandableTable } from "./ExpandableTable";
```

**Step 2: Run full TypeScript check**

Run: `cd src/wj-client && npx tsc --noEmit`
Expected: No type errors

**Step 3: Run build to verify production compatibility**

Run: `cd src/wj-client && npm run build`
Expected: Build succeeds with no errors

---

## Task 7: Write Tests for Table Data Utility

**Files:**
- Create: `src/wj-client/app/dashboard/report/table-data-utils.test.ts`

**Step 1: Write failing tests**

Create `src/wj-client/app/dashboard/report/table-data-utils.test.ts`:

```typescript
import { renderHook } from "@testing-library/react";
import { useTransformReportData, useExpandedWallets } from "./table-data-utils";
import { GetFinancialReportResponse } from "@/gen/protobuf/v1/transaction";

describe("useTransformReportData", () => {
  it("should return empty data when reportData is undefined", () => {
    const { result } = renderHook(() =>
      useTransformReportData(undefined, new Set())
    );

    expect(result.current.months).toEqual([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]);
    expect(result.current.wallets).toEqual([]);
    expect(result.current.totals).toHaveLength(12);
    expect(result.current.totals[0]).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
    });
  });

  it("should transform wallet data correctly", () => {
    const mockReportData: GetFinancialReportResponse = {
      success: true,
      year: 2026,
      walletData: [
        {
          walletId: 1,
          walletName: "Test Wallet",
          monthlyData: [
            {
              month: 0,
              income: { amount: 100000, currency: "VND" },
              expense: { amount: 30000, currency: "VND" },
            },
            {
              month: 1,
              income: { amount: 150000, currency: "VND" },
              expense: { amount: 50000, currency: "VND" },
            },
          ],
        },
      ],
      totals: [
        {
          month: 0,
          income: { amount: 100000, currency: "VND" },
          expense: { amount: 30000, currency: "VND" },
        },
        {
          month: 1,
          income: { amount: 150000, currency: "VND" },
          expense: { amount: 50000, currency: "VND" },
        },
      ],
    };

    const expandedWallets = new Set([1]);
    const { result } = renderHook(() =>
      useTransformReportData(mockReportData, expandedWallets)
    );

    expect(result.current.wallets).toHaveLength(1);
    expect(result.current.wallets[0]).toMatchObject({
      id: 1,
      walletName: "Test Wallet",
      isExpanded: true,
    });
    expect(result.current.wallets[0].monthlyData[0]).toMatchObject({
      income: 100000,
      expense: 30000,
      balance: 70000, // 100000 - 30000
    });
    expect(result.current.wallets[0].monthlyData[1]).toMatchObject({
      income: 150000,
      expense: 50000,
      balance: 170000, // 70000 + (150000 - 50000)
    });
  });

  it("should calculate running balance correctly for totals", () => {
    const mockReportData: GetFinancialReportResponse = {
      success: true,
      year: 2026,
      walletData: [],
      totals: [
        {
          month: 0,
          income: { amount: 100000, currency: "VND" },
          expense: { amount: 30000, currency: "VND" },
        },
        {
          month: 1,
          income: { amount: 150000, currency: "VND" },
          expense: { amount: 50000, currency: "VND" },
        },
      ],
    };

    const { result } = renderHook(() =>
      useTransformReportData(mockReportData, new Set())
    );

    expect(result.current.totals[0].balance).toBe(70000); // 100000 - 30000
    expect(result.current.totals[1].balance).toBe(170000); // 70000 + (150000 - 50000)
  });
});

describe("useExpandedWallets", () => {
  it("should initialize with empty set", () => {
    const { result } = renderHook(() => useExpandedWallets());

    expect(result.current.expandedWallets.size).toBe(0);
  });

  it("should initialize with provided set", () => {
    const initial = new Set([1, 2, 3]);
    const { result } = renderHook(() => useExpandedWallets(initial));

    expect(result.current.expandedWallets).toEqual(initial);
  });

  it("should add wallet when toggling non-existent ID", () => {
    const { result } = renderHook(() => useExpandedWallets());

    result.current.toggleWallet(1);
    expect(result.current.expandedWallets.has(1)).toBe(true);
  });

  it("should remove wallet when toggling existing ID", () => {
    const initial = new Set([1]);
    const { result } = renderHook(() => useExpandedWallets(initial));

    result.current.toggleWallet(1);
    expect(result.current.expandedWallets.has(1)).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd src/wj-client && npm test -- table-data-utils.test.ts`
Expected: Tests may fail if testing setup is needed

**Step 3: Implement tests (or skip if testing not configured)**

If testing is not configured, skip this step and note in documentation.

---

## Task 8: Update Documentation

**Files:**
- Create: `src/wj-client/app/dashboard/report/README.md`
- Update: `CLAUDE.md` (if needed)

**Step 1: Create component documentation**

Create `src/wj-client/app/dashboard/report/README.md`:

```markdown
# Report Page Components

## Overview

The report page provides comprehensive financial reporting with:
- Period selection with presets
- Summary cards with key metrics
- Category breakdown charts
- Income vs Expense trends
- **Monthly Summary with expandable wallet-level details**

## Monthly Summary Table

The Monthly Summary section now uses the `ExpandableTable` component which provides:
- **Wallet-level breakdown**: See data for each wallet separately
- **Expandable rows**: Click to expand a wallet and see Income/Expense details
- **Running balance**: Shows cumulative balance over time
- **Responsive design**: Horizontal scroll on mobile, synchronized header/footer

### Components

- **`ExpandableTable`**: Main table component with expand/collapse functionality
- **`FinancialTable`**: Wrapper that fetches data and renders ExpandableTable
- **`table-data-utils.ts`**: Shared utilities for data transformation

### Data Flow

```
API (useQueryGetFinancialReport)
  → reportData (GetFinancialReportResponse)
  → useTransformReportData(reportData, expandedWallets)
  → { months, wallets, totals }
  → ExpandableTable
```

### Key Features

1. **Expandable Rows**: Click on any wallet row to see Income/Expense breakdown
2. **Sticky Header**: Table header stays visible while scrolling
3. **Fixed Footer**: Totals row stays at bottom with synchronized scroll
4. **Responsive**: Works on mobile with horizontal scrolling

### Usage Example

```typescript
import { useTransformReportData, useExpandedWallets } from "./table-data-utils";
import { ExpandableTable } from "./ExpandableTable";

function MyComponent() {
  const { expandedWallets, toggleWallet } = useExpandedWallets();
  const tableData = useTransformReportData(reportData, expandedWallets);

  return (
    <ExpandableTable
      months={tableData.months}
      wallets={tableData.wallets}
      totals={tableData.totals}
      onToggleWallet={toggleWallet}
    />
  );
}
```

## Customization

### Adjusting Table Height

In `page.tsx`, modify the container height:

```typescript
<div className="h-[500px] overflow-auto">
  <ExpandableTable {...props} />
</div>
```

### Changing Default Expanded State

Initialize with pre-expanded wallets:

```typescript
const { expandedWallets, toggleWallet } = useExpandedWallets(new Set([1, 2]));
```
```

---

## Task 9: Final Integration Testing

**Files:**
- No file changes - manual testing

**Step 1: Start development server**

Run: `cd src/wj-client && npm run dev`

**Step 2: Navigate to report page**

Open: `http://localhost:3000/dashboard/report`

**Step 3: Verify all functionality**

Checklist:
- [ ] Page loads without errors
- [ ] Period selector changes data correctly
- [ ] Monthly Summary shows ExpandableTable
- [ ] Wallet rows are expandable/collapsible
- [ ] Income/Expense rows show on expansion
- [ ] Totals footer is fixed at bottom
- [ ] Horizontal scrolling works
- [ ] Chart sections still render correctly
- [ ] Export button still works
- [ ] Mobile view is usable

**Step 4: Test with different data scenarios**

- [ ] No data for selected period
- [ ] Single wallet
- [ ] Multiple wallets
- [ ] Custom date range
- [ ] Previous year data

**Step 5: Check console for errors**

Open browser DevTools → Console
Verify: No errors or warnings

---

## Task 10: Cleanup and Verification

**Files:**
- Modify: `src/wj-client/app/dashboard/report/FinancialTable.tsx` (if deprecated)
- Check for unused imports

**Step 1: Check for unused code**

Run: `cd src/wj-client && npx eslint . --ext .ts,.tsx --report-unused-disable-directives`

**Step 2: Verify FinancialTable is still used elsewhere**

Run: `grep -r "FinancialTable" src/wj-client/ --include="*.tsx" --include="*.ts"`

If FinancialTable is only used in the main report page and not elsewhere, it may be kept for backward compatibility or deprecated.

**Step 3: Run final build**

Run: `cd src/wj-client && npm run build`
Expected: Clean build with no errors

**Step 4: Create git tag for this feature**

```bash
git tag -a v1.0.0-expandable-table-integration -m "Integrate ExpandableTable into Monthly Summary report"
git push origin v1.0.0-expandable-table-integration
```

---

## Summary

This plan integrates the feature-rich `ExpandableTable` component into the Monthly Summary section of the report page, replacing the simple inline table. The implementation:

1. **Extracts shared data transformation logic** into a reusable utility (`table-data-utils.ts`)
2. **Updates both `FinancialTable` and `page.tsx`** to use the shared utility
3. **Preserves all existing functionality** while adding expandable wallet-level details
4. **Maintains responsive design** with proper mobile support
5. **Follows YAGNI and DRY principles** by extracting common logic

### Benefits

- Users can now see wallet-level breakdown in the Monthly Summary
- Expandable rows show detailed Income/Expense per wallet
- Running balance calculations are preserved
- Code is more maintainable with shared utilities
- Consistent table behavior across the report page

### Testing

After implementation, verify:
- All chart sections still render
- Export functionality works
- Period selection updates the table
- Mobile view is usable
- No console errors
