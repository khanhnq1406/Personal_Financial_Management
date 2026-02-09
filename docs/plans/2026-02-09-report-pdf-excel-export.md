# Report Page PDF and Excel Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement PDF and Excel export functionality for the financial report page using existing export utilities from `src/wj-client/utils/export/`.

**Architecture:** The report page already has CSV export implemented via `exportFinancialReportToCSV()`. We need to add PDF and Excel export using the existing `report-pdf-export.ts` and `report-excel-export.ts` utilities. The data transformation functions already exist in `data-utils.ts` to convert API responses into the format expected by the export utilities.

**Tech Stack:**
- jsPDF ^4.1.0 + jspdf-autotable ^5.0.7 for PDF generation
- ExcelJS ^4.4.0 for Excel generation
- React hooks for state management
- Existing export utilities in `src/wj-client/utils/export/`

---

## Task 1: Review and Understand Existing Export Utilities

**Files:**
- Read: `src/wj-client/utils/export/report-pdf-export.ts`
- Read: `src/wj-client/utils/export/report-excel-export.ts`
- Read: `src/wj-client/utils/export/index.ts`

**Step 1: Read the existing PDF export utility**

No action needed - already reviewed. The `report-pdf-export.ts` file exports:
- `generateReportPDF(data, options)` - Generates jsPDF document
- `generateReportPDFFilename(period, startDate, endDate, customFileName)` - Generates filename
- `downloadPDF(pdf, filename)` - Triggers download
- `exportReportToPDF(data, options)` - One-shot export function

Expected data interface: `ReportExportData` with:
- `summaryData: SummaryData`
- `trendData: TrendData[]`
- `expenseCategories: ExpenseCategoryData[]`
- `categoryComparisonData?: CategoryComparisonData[]`
- `period: string`
- `dateRange: { start: Date; end: Date }`
- `currency: string`

**Step 2: Read the existing Excel export utility**

No action needed - already reviewed. The `report-excel-export.ts` file exports:
- `generateReportExcel(data, options)` - Generates ExcelJS workbook
- `generateReportExcelFilename(period, startDate, endDate, customFileName)` - Generates filename
- `downloadExcel(workbook, filename)` - Triggers download
- `exportReportToExcel(data, options)` - One-shot export function

Same data interface as PDF export: `ReportExportData`

**Step 3: Verify data-utils.ts export compatibility**

Already verified. The `data-utils.ts` file has functions that produce the required data:
- `calculateSummaryData()` returns `SummaryData` (matches interface)
- `calculateTrendData()` returns `TrendData[]` (matches interface)
- `expenseCategories` from page state is already in `ExpenseCategoryData` format
- `categoryComparisonData` from page state is already in `CategoryComparisonData` format

---

## Task 2: Create Data Preparation Utility for Export

**Files:**
- Create: `src/wj-client/app/dashboard/report/export-utils.ts`
- Test: `src/wj-client/app/dashboard/report/export-utils.test.ts`

**Step 1: Write the failing test**

Create test file `src/wj-client/app/dashboard/report/export-utils.test.ts`:

```typescript
import { prepareReportExportData } from "./export-utils";
import {
  ReportExportData,
  SummaryData,
  TrendData,
  ExpenseCategoryData,
  CategoryComparisonData,
} from "@/utils/export/report-pdf-export";

describe("prepareReportExportData", () => {
  it("should transform report page data into ReportExportData format", () => {
    // Mock input data matching the report page state
    const mockSummaryData: SummaryData = {
      totalIncome: 100000,
      totalExpenses: 75000,
      netSavings: 25000,
      savingsRate: 25,
      topExpenseCategory: { name: "Food", amount: 30000 },
      currency: "VND",
    };

    const mockTrendData: TrendData[] = [
      {
        month: "Jan",
        income: 50000,
        expenses: 40000,
        net: 10000,
        savingsRate: 20,
      },
      {
        month: "Feb",
        income: 50000,
        expenses: 35000,
        net: 15000,
        savingsRate: 30,
      },
    ];

    const mockExpenseCategories: ExpenseCategoryData[] = [
      { name: "Food", value: 30000, color: "#008148", percentage: 40 },
      { name: "Transport", value: 20000, color: "#22C55E", percentage: 26.7 },
      { name: "Entertainment", value: 15000, color: "#14B8A6", percentage: 20 },
    ];

    const mockCategoryComparison: CategoryComparisonData[] = [
      {
        category: "Food",
        thisMonth: 30000,
        lastMonth: 25000,
        change: 5000,
        changePercentage: 20,
      },
    ];

    const period = "this-month";
    const dateRange = { start: new Date("2026-02-01"), end: new Date("2026-02-28") };

    const result = prepareReportExportData(
      mockSummaryData,
      mockTrendData,
      mockExpenseCategories,
      mockCategoryComparison,
      period,
      dateRange,
    );

    // Verify the result matches ReportExportData interface
    expect(result).toEqual({
      summaryData: mockSummaryData,
      trendData: mockTrendData,
      expenseCategories: mockExpenseCategories,
      categoryComparisonData: mockCategoryComparison,
      period,
      dateRange,
      currency: "VND",
    } as ReportExportData);
  });

  it("should handle optional categoryComparisonData", () => {
    const mockSummaryData: SummaryData = {
      totalIncome: 100000,
      totalExpenses: 75000,
      netSavings: 25000,
      savingsRate: 25,
      topExpenseCategory: null,
      currency: "VND",
    };

    const result = prepareReportExportData(
      mockSummaryData,
      [],
      [],
      undefined, // No comparison data
      "this-month",
      { start: new Date(), end: new Date() },
    );

    expect(result.categoryComparisonData).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd src/wj-client && npm test -- export-utils.test.ts`

Expected: FAIL with "export file not found" error

**Step 3: Write minimal implementation**

Create file `src/wj-client/app/dashboard/report/export-utils.ts`:

```typescript
/**
 * Report Export Utilities
 *
 * Functions to prepare report page data for PDF and Excel export.
 * Transforms the page state into the format expected by the export utilities.
 */

import {
  ReportExportData,
  SummaryData,
  TrendData,
  ExpenseCategoryData,
  CategoryComparisonData,
} from "@/utils/export/report-pdf-export";

/**
 * Prepare report data for export
 *
 * Transforms the report page state into the ReportExportData format
 * expected by the PDF and Excel export utilities.
 *
 * @param summaryData - Summary statistics from the report
 * @param trendData - Monthly trend data
 * @param expenseCategories - Expense category breakdown
 * @param categoryComparisonData - Optional category comparison data
 * @param period - Period type label
 * @param dateRange - Date range for the report
 * @returns Formatted data ready for export
 *
 * @example
 * ```typescript
 * const exportData = prepareReportExportData(
 *   summaryData,
 *   trendData,
 *   expenseCategories,
 *   categoryComparisonData,
 *   "this-month",
 *   { start: new Date("2026-02-01"), end: new Date("2026-02-28") }
 * );
 *
 * // Use with PDF export
 * exportReportToPDF(exportData, {
 *   period: "this-month",
 *   startDate: exportData.dateRange.start,
 *   endDate: exportData.dateRange.end,
 * });
 *
 * // Use with Excel export
 * await exportReportToExcel(exportData, {
 *   period: "this-month",
 *   startDate: exportData.dateRange.start,
 *   endDate: exportData.dateRange.end,
 * });
 * ```
 */
export function prepareReportExportData(
  summaryData: SummaryData,
  trendData: TrendData[],
  expenseCategories: ExpenseCategoryData[],
  categoryComparisonData: CategoryComparisonData[] | undefined,
  period: string,
  dateRange: { start: Date; end: Date },
): ReportExportData {
  return {
    summaryData,
    trendData,
    expenseCategories,
    categoryComparisonData,
    period,
    dateRange,
    currency: summaryData.currency,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd src/wj-client && npm test -- export-utils.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/wj-client/app/dashboard/report/export-utils.ts src/wj-client/app/dashboard/report/export-utils.test.ts
git commit -m "feat(report): add data preparation utility for PDF/Excel export"
```

---

## Task 3: Update Report Page Export Handler to Support PDF and Excel

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx:157-181`

**Step 1: Write the test expectations (manual test plan)**

Expected behavior after implementation:
1. Click "Export" button
2. In dialog, select "PDF" format
3. Click "Export"
4. PDF file downloads with:
   - Summary section (income, expenses, net savings, savings rate)
   - Monthly breakdown table
   - Expense categories breakdown
   - Category comparison (if available)
5. Repeat for "Excel" format
6. Excel file downloads with multiple sheets:
   - Summary sheet
   - Monthly Breakdown sheet
   - Category Breakdown sheet
   - Category Comparison sheet (if available)

**Step 2: Update imports in page.tsx**

Add these imports to `src/wj-client/app/dashboard/report/page.tsx`:

```typescript
// Add after line 25 (after exportFinancialReportToCSV import)
import {
  exportReportToPDF,
  exportReportToExcel,
  type ReportExportData,
} from "@/utils/export";
import { prepareReportExportData } from "./export-utils";
```

**Step 3: Replace the handleExport function**

Replace lines 157-181 in `src/wj-client/app/dashboard/report/page.tsx` with:

```typescript
  // Handle export with dialog options
  const handleExport = useCallback(
    async (options: ExportOptions) => {
      try {
        // Prepare export data from current page state
        const exportData: ReportExportData = prepareReportExportData(
          {
            totalIncome: summaryData.totalIncome,
            totalExpenses: summaryData.totalExpenses,
            netSavings: summaryData.netSavings,
            savingsRate: summaryData.savingsRate,
            topExpenseCategory: summaryData.topExpenseCategory,
            currency: summaryData.currency,
          },
          trendData,
          expenseCategories,
          compareWithPrevious ? categoryComparisonData : undefined,
          selectedPeriod,
          dateRange,
        );

        switch (options.format) {
          case "csv":
            // Keep existing CSV export
            if (reportData) {
              exportFinancialReportToCSV(reportData, reportYear, currency);
            }
            break;
          case "pdf":
            // Export to PDF using prepared data
            exportReportToPDF(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              includeCharts: options.includeCharts,
              customFileName: options.fileName,
            });
            break;
          case "excel":
            // Export to Excel using prepared data
            await exportReportToExcel(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              customFileName: options.fileName,
            });
            break;
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to export");
      }
    },
    [
      summaryData,
      trendData,
      expenseCategories,
      categoryComparisonData,
      compareWithPrevious,
      selectedPeriod,
      dateRange,
      reportData,
      reportYear,
      currency,
    ],
  );
```

**Step 4: Verify the changes build successfully**

Run: `cd src/wj-client && npm run build`

Expected: Build succeeds with no TypeScript errors

**Step 5: Manual testing**

1. Start dev server: `cd src/wj-client && npm run dev`
2. Navigate to http://localhost:3000/dashboard/report
3. Click "Export" button
4. Select "PDF" format and click "Export"
5. Verify PDF downloads and opens with correct data
6. Repeat for "Excel" format

**Step 6: Commit**

```bash
git add src/wj-client/app/dashboard/report/page.tsx
git commit -m "feat(report): implement PDF and Excel export functionality"
```

---

## Task 4: Add Loading State Management for Export

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`
- Modify: `src/wj-client/components/export/ExportDialog.tsx`

**Step 1: Add export loading state to page.tsx**

After line 51 in `src/wj-client/app/dashboard/report/page.tsx` (after `selectedWalletIds` state):

```typescript
  const [isExporting, setIsExporting] = useState(false);
```

**Step 2: Update handleExport to manage loading state**

Update the handleExport function to set loading state:

```typescript
  // Handle export with dialog options
  const handleExport = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      try {
        // Prepare export data from current page state
        const exportData: ReportExportData = prepareReportExportData(
          {
            totalIncome: summaryData.totalIncome,
            totalExpenses: summaryData.totalExpenses,
            netSavings: summaryData.netSavings,
            savingsRate: summaryData.savingsRate,
            topExpenseCategory: summaryData.topExpenseCategory,
            currency: summaryData.currency,
          },
          trendData,
          expenseCategories,
          compareWithPrevious ? categoryComparisonData : undefined,
          selectedPeriod,
          dateRange,
        );

        switch (options.format) {
          case "csv":
            // Keep existing CSV export
            if (reportData) {
              exportFinancialReportToCSV(reportData, reportYear, currency);
            }
            break;
          case "pdf":
            // Export to PDF using prepared data
            exportReportToPDF(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              includeCharts: options.includeCharts,
              customFileName: options.fileName,
            });
            break;
          case "excel":
            // Export to Excel using prepared data
            await exportReportToExcel(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              customFileName: options.fileName,
            });
            break;
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to export");
      } finally {
        setIsExporting(false);
      }
    },
    [
      summaryData,
      trendData,
      expenseCategories,
      categoryComparisonData,
      compareWithPrevious,
      selectedPeriod,
      dateRange,
      reportData,
      reportYear,
      currency,
    ],
  );
```

**Step 3: Pass isExporting to ExportButton**

Update line 369-373 in `src/wj-client/app/dashboard/report/page.tsx`:

```typescript
        <ExportButton
          onExport={handleExport}
          categories={categoriesForExport}
          isExporting={isExporting}
          className="w-fit"
        />
```

**Step 4: Verify loading indicator works**

1. Start dev server: `cd src/wj-client && npm run dev`
2. Navigate to http://localhost:3000/dashboard/report
3. Click "Export" button
4. Select "Excel" format (takes longer than PDF)
5. Click "Export"
6. Verify button shows "Exporting..." with spinner

**Step 5: Commit**

```bash
git add src/wj-client/app/dashboard/report/page.tsx
git commit -m "feat(report): add loading state for export operations"
```

---

## Task 5: Add Export Type Filtering for Categories (Optional Enhancement)

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`

**Step 1: Update handleExport to filter by selected categories**

If the user has selected specific categories in the export dialog, filter the data before export.

Update the handleExport function to include category filtering:

```typescript
  // Handle export with dialog options
  const handleExport = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      try {
        // Filter categories if specific ones were selected
        let filteredExpenseCategories = expenseCategories;
        let filteredCategoryComparison = categoryComparisonData;

        if (options.includeCategories && options.includeCategories.length > 0) {
          const selectedIds = new Set(options.includeCategories);
          filteredExpenseCategories = expenseCategories.filter((cat) =>
            selectedIds.has(cat.name) // Note: using name as ID, adjust if using actual IDs
          );
          filteredCategoryComparison = categoryComparisonData.filter((cat) =>
            selectedIds.has(cat.category)
          );
        }

        // Prepare export data from current page state
        const exportData: ReportExportData = prepareReportExportData(
          {
            totalIncome: summaryData.totalIncome,
            totalExpenses: summaryData.totalExpenses,
            netSavings: summaryData.netSavings,
            savingsRate: summaryData.savingsRate,
            topExpenseCategory: summaryData.topExpenseCategory,
            currency: summaryData.currency,
          },
          trendData,
          filteredExpenseCategories,
          compareWithPrevious ? filteredCategoryComparison : undefined,
          selectedPeriod,
          dateRange,
        );

        switch (options.format) {
          case "csv":
            // Keep existing CSV export
            if (reportData) {
              exportFinancialReportToCSV(reportData, reportYear, currency);
            }
            break;
          case "pdf":
            // Export to PDF using prepared data
            exportReportToPDF(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              includeCharts: options.includeCharts,
              customFileName: options.fileName,
            });
            break;
          case "excel":
            // Export to Excel using prepared data
            await exportReportToExcel(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              customFileName: options.fileName,
            });
            break;
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to export");
      } finally {
        setIsExporting(false);
      }
    },
    [
      summaryData,
      trendData,
      expenseCategories,
      categoryComparisonData,
      compareWithPrevious,
      selectedPeriod,
      dateRange,
      reportData,
      reportYear,
      currency,
    ],
  );
```

**Step 2: Test category filtering**

1. Start dev server: `cd src/wj-client && npm run dev`
2. Navigate to http://localhost:3000/dashboard/report
3. Click "Export" button
4. Select specific categories in the category filter
5. Export to PDF/Excel
6. Verify only selected categories appear in the export

**Step 3: Commit**

```bash
git add src/wj-client/app/dashboard/report/page.tsx
git commit -m "feat(report): add category filtering for exports"
```

---

## Task 6: Update Export Index.ts to Re-export New Utilities

**Files:**
- Modify: `src/wj-client/utils/export/index.ts`

**Step 1: Add export-utils to the index barrel (optional)**

This step is optional since `export-utils.ts` is co-located with the report page. Skip this step unless you want to make it a general utility.

**Step 2: Verify existing exports are correct**

The `index.ts` file already correctly exports:
- `exportReportToPDF` from `report-pdf-export`
- `exportReportToExcel` from `report-excel-export`
- All necessary types

No changes needed to `index.ts`.

---

## Task 7: Add Error Handling for Edge Cases

**Files:**
- Modify: `src/wj-client/app/dashboard/report/page.tsx`

**Step 1: Add validation for empty data**

Update the handleExport function to validate data before export:

```typescript
  // Handle export with dialog options
  const handleExport = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      try {
        // Validate data exists
        if (!reportData || reportData.totals?.length === 0) {
          alert("No data available to export. Please select a different time range.");
          return;
        }

        // Filter categories if specific ones were selected
        let filteredExpenseCategories = expenseCategories;
        let filteredCategoryComparison = categoryComparisonData;

        if (options.includeCategories && options.includeCategories.length > 0) {
          const selectedIds = new Set(options.includeCategories);
          filteredExpenseCategories = expenseCategories.filter((cat) =>
            selectedIds.has(cat.name)
          );
          filteredCategoryComparison = categoryComparisonData.filter((cat) =>
            selectedIds.has(cat.category)
          );
        }

        // Prepare export data from current page state
        const exportData: ReportExportData = prepareReportExportData(
          {
            totalIncome: summaryData.totalIncome,
            totalExpenses: summaryData.totalExpenses,
            netSavings: summaryData.netSavings,
            savingsRate: summaryData.savingsRate,
            topExpenseCategory: summaryData.topExpenseCategory,
            currency: summaryData.currency,
          },
          trendData,
          filteredExpenseCategories,
          compareWithPrevious ? filteredCategoryComparison : undefined,
          selectedPeriod,
          dateRange,
        );

        switch (options.format) {
          case "csv":
            if (reportData) {
              exportFinancialReportToCSV(reportData, reportYear, currency);
            }
            break;
          case "pdf":
            exportReportToPDF(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              includeCharts: options.includeCharts,
              customFileName: options.fileName,
            });
            break;
          case "excel":
            await exportReportToExcel(exportData, {
              period: selectedPeriod,
              startDate: dateRange.start,
              endDate: dateRange.end,
              customFileName: options.fileName,
            });
            break;
        }
      } catch (error) {
        console.error("Export error:", error);
        alert(error instanceof Error ? error.message : "Failed to export. Please try again.");
      } finally {
        setIsExporting(false);
      }
    },
    [
      summaryData,
      trendData,
      expenseCategories,
      categoryComparisonData,
      compareWithPrevious,
      selectedPeriod,
      dateRange,
      reportData,
      reportYear,
      currency,
    ],
  );
```

**Step 2: Test error scenarios**

1. Navigate to report page with no data
2. Try to export
3. Verify "No data available" alert appears

**Step 3: Commit**

```bash
git add src/wj-client/app/dashboard/report/page.tsx
git commit -m "feat(report): add error handling for export edge cases"
```

---

## Task 8: Update Documentation

**Files:**
- Modify: `src/wj-client/app/dashboard/report/README.md` (create if doesn't exist)

**Step 1: Create documentation**

Create file `src/wj-client/app/dashboard/report/README.md`:

```markdown
# Report Page Export Features

## Overview

The report page supports exporting financial data in three formats:
- **CSV**: Universal spreadsheet format
- **PDF**: Professional document format with tables and styling
- **Excel**: Native Excel format with multiple sheets and formatting

## Export Data

The export includes the following data from the current report view:

### Summary Section
- Total Income
- Total Expenses
- Net Savings
- Savings Rate
- Top Expense Category

### Monthly Breakdown
- Monthly income, expenses, and net savings
- Savings rate per month

### Expense Categories
- Category breakdown with amounts and percentages
- Color-coded by category

### Category Comparison (if enabled)
- Current period vs previous period comparison
- Change amount and percentage

## Usage

### Basic Export

1. Click the "Export" button in the top-right of the report page
2. Select export format (CSV, PDF, or Excel)
3. Select date range (optional, defaults to current period)
4. Click "Export" to download the file

### Filtered Export

To export only specific categories:

1. Click the "Export" button
2. In the Categories section, select specific categories
3. Choose export format
4. Click "Export"

### Custom File Name

1. Click the "Export" button
2. Enter a custom file name in the "File Name" field
3. Click "Export"

## Technical Details

### Export Utilities

- **PDF Export**: `src/wj-client/utils/export/report-pdf-export.ts`
  - Uses jsPDF and jsPDF-autotable
  - Generates professional PDF with brand colors

- **Excel Export**: `src/wj-client/utils/export/report-excel-export.ts`
  - Uses ExcelJS
  - Creates multiple sheets for different data views

- **Data Preparation**: `src/wj-client/app/dashboard/report/export-utils.ts`
  - Transforms page state into export format

### Data Flow

```
Report Page State
    ↓
prepareReportExportData()
    ↓
exportReportToPDF() / exportReportToExcel()
    ↓
Browser Download
```

## File Naming

Default file names follow the pattern:
- PDF: `financial-report_{period}_{start-date}_to_{end-date}_{export-date}.pdf`
- Excel: `financial-report_{period}_{start-date}_to_{end-date}_{export-date}.xlsx`

Example: `financial-report_this-month_2026-02-01_to_2026-02-28_2026-02-09.pdf`

## Dependencies

- jsPDF ^4.1.0
- jspdf-autotable ^5.0.7
- ExcelJS ^4.4.0
```

**Step 2: Commit**

```bash
git add src/wj-client/app/dashboard/report/README.md
git commit -m "docs(report): add export feature documentation"
```

---

## Summary

This implementation plan adds PDF and Excel export functionality to the report page by:

1. Creating a data preparation utility that transforms page state into the format expected by export functions
2. Updating the export handler to call the existing PDF and Excel export utilities
3. Adding loading state management for better UX
4. Optionally adding category filtering support
5. Adding error handling for edge cases
6. Creating documentation

The key insight is that all the heavy lifting (PDF generation, Excel generation) is already implemented in `src/wj-client/utils/export/`. We only need to:
1. Transform the report page data into the expected format
2. Call the existing export functions with the correct parameters
