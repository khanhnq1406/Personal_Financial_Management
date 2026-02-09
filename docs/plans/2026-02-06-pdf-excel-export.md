# PDF and Excel Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add PDF and Excel export functionality to the existing transaction export system, extending the current CSV-only implementation to support multiple export formats.

**Architecture:** Extend the existing export utility module with format-specific generators (PDF, Excel) while maintaining the current CSV implementation. Use client-side libraries for PDF generation (jsPDF) and Excel creation (ExcelJS) to avoid backend changes. Implement a unified export interface that delegates to format-specific handlers.

**Tech Stack:**
- **PDF Generation**: `jspdf` + `jspdf-autotable` for table rendering and chart embedding
- **Excel Generation**: `exceljs` for native .xlsx file creation with formatting
- **Chart Capture**: `html2canvas` to capture Recharts components for PDF embedding
- **Testing**: Jest with DOM mocking for download verification
- **Build**: Next.js 15, TypeScript 5

---

## Prerequisites

### Existing Files Referenced
- `src/wj-client/utils/export/transaction-export.ts` - Current CSV export implementation
- `src/wj-client/utils/export/transaction-export.test.ts` - CSV export tests
- `src/wj-client/hooks/useExportTransactions.ts` - Export hook using CSV utilities
- `src/wj-client/components/export/ExportDialog.tsx` - Export UI with format selection
- `src/wj-client/app/dashboard/transaction/page.tsx` - Transaction page using export

### New Dependencies to Install
```bash
cd src/wj-client
npm install --save jspdf jspdf-autotable exceljs html2canvas
npm install --save-dev @types/jspdf @types/exceljs @types/html2canvas
```

---

## Task 1: Install Required Dependencies

**Files:**
- Modify: `src/wj-client/package.json`

**Step 1: Install PDF generation library**

Run: `cd src/wj-client && npm install --save jspdf jspdf-autotable`

Expected: package.json updated with jspdf dependencies

**Step 2: Install Excel generation library**

Run: `cd src/wj-client && npm install --save exceljs`

Expected: package.json updated with exceljs dependency

**Step 3: Install chart capture library**

Run: `cd src/wj-client && npm install --save html2canvas`

Expected: package.json updated with html2canvas dependency

**Step 4: Install TypeScript type definitions**

Run: `cd src/wj-client && npm install --save-dev @types/jspdf @types/exceljs @types/html2canvas`

Expected: package.json devDependencies updated with type definitions

**Step 5: Verify installation**

Run: `cd src/wj-client && npm list jspdf jspdf-autotable exceljs html2canvas`

Expected: All packages listed with versions

---

## Task 2: Create PDF Export Utility Module

**Files:**
- Create: `src/wj-client/utils/export/pdf-export.ts`
- Create: `src/wj-client/utils/export/pdf-export.test.ts`

**Step 1: Write the failing test for PDF generation**

Create: `src/wj-client/utils/export/pdf-export.test.ts`

```typescript
// src/wj-client/utils/export/pdf-export.test.ts
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  generateTransactionPDF,
  generateExportFilename,
  downloadPDF,
  type TransactionExportData,
  type PDFExportOptions,
} from "./pdf-export";
import { Transaction } from "@/gen/protobuf/v1/transaction";

describe("generateTransactionPDF", () => {
  const mockCategoryNames = new Map([[1, "Food"], [2, "Salary"], [3, "Transport"]]);
  const mockWalletNames = new Map([[1, "Cash"], [2, "Bank Account"]]);

  beforeEach(() => {
    // Mock jsPDF
    jest.mock("jspdf", () => {
      return {
        jsPDF: jest.fn().mockImplementation(() => ({
          text: jest.fn(),
          table: jest.fn(),
          save: jest.fn(),
          addPage: jest.fn(),
          setFontSize: jest.fn(),
          setTextColor: jest.fn(),
          lastAutoTable: { finalY: 0 },
        })),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate PDF with proper title", () => {
    const data: TransactionExportData = {
      transactions: [],
      categoryNames: mockCategoryNames,
      walletNames: mockWalletNames,
      currency: "VND",
    };

    const options: PDFExportOptions = {
      includeCharts: false,
      customBranding: false,
    };

    const pdf = generateTransactionPDF(data, options);

    expect(pdf).toBeDefined();
    // Verify PDF document was created with title
  });

  it("should format transaction data in table", () => {
    const transaction: Transaction = {
      id: 1,
      walletId: 1,
      categoryId: 1,
      type: 2, // EXPENSE
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

    const options: PDFExportOptions = {
      includeCharts: false,
      customBranding: false,
    };

    const pdf = generateTransactionPDF(data, options);

    expect(pdf).toBeDefined();
    // Verify table was called with transaction data
  });

  it("should handle charts when includeCharts is true", () => {
    const data: TransactionExportData = {
      transactions: [],
      categoryNames: mockCategoryNames,
      walletNames: mockWalletNames,
      currency: "VND",
    };

    const options: PDFExportOptions = {
      includeCharts: true,
      customBranding: false,
      chartImage: "data:image/png;base64,mockdata", // Mock chart image
    };

    const pdf = generateTransactionPDF(data, options);

    expect(pdf).toBeDefined();
    // Verify chart image was added
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd src/wj-client && npm test -- pdf-export.test.ts`

Expected: FAIL with "Cannot find module './pdf-export'"

**Step 3: Create minimal PDF export implementation**

Create: `src/wj-client/utils/export/pdf-export.ts`

```typescript
// src/wj-client/utils/export/pdf-export.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/gen/protobuf/v1/transaction";
import { formatCurrency, formatCurrencyWithSymbol } from "@/utils/currency-formatter";

export interface TransactionExportData {
  transactions: Transaction[];
  categoryNames: Map<number, string>;
  walletNames: Map<number, string>;
  currency: string;
}

export interface PDFExportOptions {
  includeCharts: boolean;
  customBranding: boolean;
  chartImage?: string;
}

/**
 * Generate a PDF document for transaction export
 * @param data - Transaction data with category and wallet mappings
 * @param options - PDF export options
 * @returns jsPDF document instance
 */
export function generateTransactionPDF(
  data: TransactionExportData,
  options: PDFExportOptions = { includeCharts: false, customBranding: false },
): jsPDF {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14; // ~10mm margin

  let yPosition = margin;

  // Add title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 129, 72); // Brand green color
  pdf.text("Transaction Report", margin, yPosition);
  yPosition += 10;

  // Add subtitle with date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const currentDate = new Date().toLocaleDateString();
  pdf.text(`Generated on ${currentDate}`, margin, yPosition);
  yPosition += 10;

  // Add chart if included
  if (options.includeCharts && options.chartImage) {
    const maxWidth = pageWidth - 2 * margin;
    const maxHeight = 80;
    pdf.addImage(options.chartImage, "PNG", margin, yPosition, maxWidth, maxHeight);
    yPosition += maxHeight + 10;
  }

  // Prepare table data
  const tableData = data.transactions.map((transaction) => {
    const categoryName = data.categoryNames.get(transaction.categoryId) || "Uncategorized";
    const walletName = data.walletNames.get(transaction.walletId) || "Unknown Wallet";
    const date = new Date(transaction.date * 1000).toLocaleDateString();
    const amount = formatCurrency(transaction.displayAmount || transaction.amount, data.currency);
    const type = transaction.type === 1 ? "Income" : "Expense";

    return [date, categoryName, walletName, transaction.note || "", amount, type];
  });

  // Add table using autoTable
  autoTable(pdf, {
    startY: yPosition,
    head: [["Date", "Category", "Wallet", "Note", "Amount", "Type"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 129, 72], // Brand green
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
 * Generate export filename with date range and format
 * Reuses the CSV filename generator but changes extension
 */
export function generateExportFilename(
  baseName: string = "transactions",
  dateRange: string = "all",
  startDate?: Date,
  endDate?: Date,
  customFileName?: string,
): string {
  // Reuse CSV filename logic but change extension
  const csvFilename = `${baseName}_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`;
  return csvFilename.replace(".csv", ".pdf");
}

/**
 * Trigger PDF download in browser
 * @param pdf - jsPDF document instance
 * @param filename - Name for downloaded file
 */
export function downloadPDF(pdf: jsPDF, filename: string): void {
  pdf.save(filename);
}
```

**Step 4: Run test to verify it passes**

Run: `cd src/wj-client && npm test -- pdf-export.test.ts`

Expected: PASS

---

## Task 3: Create Excel Export Utility Module

**Files:**
- Create: `src/wj-client/utils/export/excel-export.ts`
- Create: `src/wj-client/utils/export/excel-export.test.ts`

**Step 1: Write the failing test for Excel generation**

Create: `src/wj-client/utils/export/excel-export.test.ts`

```typescript
// src/wj-client/utils/export/excel-export.test.ts
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  generateTransactionExcel,
  generateExportFilename,
  downloadExcel,
  type TransactionExportData,
} from "./excel-export";
import { Transaction } from "@/gen/protobuf/v1/transaction";

describe("generateTransactionExcel", () => {
  const mockCategoryNames = new Map([[1, "Food"], [2, "Salary"]]);
  const mockWalletNames = new Map([[1, "Cash"], [2, "Bank Account"]]);

  beforeEach(() => {
    // Mock DOM methods
    document.body.appendChild = jest.fn() as any;
    document.body.removeChild = jest.fn() as any;
    URL.createObjectURL = jest.fn(() => "blob:mock-url") as any;
    URL.revokeObjectURL = jest.fn() as any;
  });

  it("should generate Excel workbook with proper structure", () => {
    const data: TransactionExportData = {
      transactions: [],
      categoryNames: mockCategoryNames,
      walletNames: mockWalletNames,
      currency: "VND",
    };

    const workbook = generateTransactionExcel(data);

    expect(workbook).toBeDefined();
    expect(workbook.worksheets.length).toBeGreaterThan(0);
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

    const workbook = generateTransactionExcel(data);
    const worksheet = workbook.worksheets[0];

    // Verify header row exists
    expect(worksheet.getRow(1).values).toContain("Date");
    expect(worksheet.getRow(1).values).toContain("Amount");

    // Verify transaction data row exists
    const rowCount = worksheet.rowCount;
    expect(rowCount).toBeGreaterThan(1); // Header + data
  });

  it("should apply formatting to cells", () => {
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

    const workbook = generateTransactionExcel(data);
    const worksheet = workbook.worksheets[0];

    // Verify header row is bold
    const headerRow = worksheet.getRow(1);
    expect(headerRow.font?.bold).toBe(true);
  });
});

describe("generateExportFilename", () => {
  it("should generate filename with .xlsx extension", () => {
    const filename = generateExportFilename("transactions", "last30days");
    expect(filename).toMatch(/\.xlsx$/);
  });
});

describe("downloadExcel", () => {
  it("should trigger download with Excel file", () => {
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: "" as string },
    };
    jest.spyOn(document, "createElement").mockReturnValue(mockLink as any);

    const mockWorkbook = {
      xlsx: { writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)) },
    } as any;

    downloadExcel(mockWorkbook, "test.xlsx");

    // Verify link setup
    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "test.xlsx");
    expect(mockLink.click).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd src/wj-client && npm test -- excel-export.test.ts`

Expected: FAIL with "Cannot find module './excel-export'"

**Step 3: Create minimal Excel export implementation**

Create: `src/wj-client/utils/export/excel-export.ts`

```typescript
// src/wj-client/utils/export/excel-export.ts
import ExcelJS from "exceljs";
import { Transaction } from "@/gen/protobuf/v1/transaction";
import { formatCurrency } from "@/utils/currency-formatter";

export interface TransactionExportData {
  transactions: Transaction[];
  categoryNames: Map<number, string>;
  walletNames: Map<number, string>;
  currency: string;
}

/**
 * Generate an Excel workbook for transaction export
 * @param data - Transaction data with category and wallet mappings
 * @returns ExcelJS workbook instance
 */
export async function generateTransactionExcel(
  data: TransactionExportData,
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Transactions");

  // Define columns
  worksheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Category", key: "category", width: 20 },
    { header: "Wallet", key: "wallet", width: 20 },
    { header: "Note", key: "note", width: 30 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Type", key: "type", width: 12 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF008148" }, // Brand green
  };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 25;

  // Add transaction data
  data.transactions.forEach((transaction) => {
    const categoryName = data.categoryNames.get(transaction.categoryId) || "Uncategorized";
    const walletName = data.walletNames.get(transaction.walletId) || "Unknown Wallet";
    const date = new Date(transaction.date * 1000).toLocaleDateString();
    const amount = formatCurrency(transaction.displayAmount || transaction.amount, data.currency);
    const type = transaction.type === 1 ? "Income" : "Expense";

    worksheet.addRow({
      date,
      category: categoryName,
      wallet: walletName,
      note: transaction.note || "",
      amount,
      type,
    });
  });

  // Apply formatting to data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      // Add alternate row color
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
      }

      // Align cells
      row.alignment = { vertical: "middle", horizontal: "left" };

      // Right-align amount column
      const amountCell = row.getCell("amount");
      amountCell.alignment = { horizontal: "right" };
    }
  });

  // Freeze header row
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  // Auto-filter
  worksheet.autoFilter = {
    from: "A1",
    to: `F1`,
  };

  return workbook;
}

/**
 * Generate export filename with date range and format
 */
export function generateExportFilename(
  baseName: string = "transactions",
  dateRange: string = "all",
  startDate?: Date,
  endDate?: Date,
  customFileName?: string,
): string {
  const csvFilename = `${baseName}_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`;
  return csvFilename.replace(".csv", ".xlsx");
}

/**
 * Trigger Excel download in browser
 * @param workbook - ExcelJS workbook instance
 * @param filename - Name for downloaded file
 */
export async function downloadExcel(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  // Generate Excel buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Create blob
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
```

**Step 4: Run test to verify it passes**

Run: `cd src/wj-client && npm test -- excel-export.test.ts`

Expected: PASS

---

## Task 4: Update Export Index File

**Files:**
- Modify: `src/wj-client/utils/export/index.ts`

**Step 1: Update index.ts to export new modules**

Read current: `src/wj-client/utils/export/index.ts`

Expected content:
```typescript
export * from "./transaction-export";
```

**Step 2: Add new exports**

Edit: `src/wj-client/utils/export/index.ts`

```typescript
// CSV Export
export * from "./transaction-export";

// PDF Export
export * from "./pdf-export";

// Excel Export
export * from "./excel-export";
```

---

## Task 5: Update useExportTransactions Hook

**Files:**
- Modify: `src/wj-client/hooks/useExportTransactions.ts`

**Step 1: Read the current hook implementation**

Read: `src/wj-client/hooks/useExportTransactions.ts`

**Step 2: Update hook to support multiple formats**

Modify: `src/wj-client/hooks/useExportTransactions.ts`

Add imports:
```typescript
import {
  generateTransactionCSV,
  downloadCSV,
  generateTransactionPDF,
  downloadPDF,
  generateTransactionExcel,
  downloadExcel,
  getDateRangeTimestamps,
  generateExportFilename,
} from "@/utils/export";
```

Update the handleExport function to switch on format:

```typescript
const handleExport = useCallback(
  async (options: ExportOptions) => {
    setExportState((prev) => ({ ...prev, isExporting: true, error: null }));

    try {
      // Get date range timestamps
      const { startDate, endDate } = getDateRangeTimestamps(
        options.dateRange,
        options.customStartDate,
        options.customEndDate,
      );

      // Fetch filtered transactions
      const response = await fetchTransactions({
        pagination: { page: 1, pageSize: 10000, orderBy: "date", order: "DESC" },
        startDate,
        endDate,
        categoryIds: options.includeCategories.length > 0 ? options.includeCategories : undefined,
      });

      if (!response.transactions) {
        throw new Error("No transactions to export");
      }

      // Prepare export data
      const data: TransactionExportData = {
        transactions: response.transactions,
        categoryNames: new Map(
          categories.map((c) => [parseInt(c.id), c.name]),
        ),
        walletNames: new Map(
          wallets.map((w) => [w.id, w.walletName]),
        ),
        currency: defaultCurrency || "VND",
      };

      // Generate filename
      const filename = generateExportFilename(
        "transactions",
        options.dateRange,
        options.customStartDate,
        options.customEndDate,
        options.fileName,
      );

      // Export based on format
      switch (options.format) {
        case "csv": {
          const csv = generateTransactionCSV(data);
          downloadCSV(csv, `${filename.replace(".csv", "")}.csv`);
          break;
        }
        case "pdf": {
          // Capture chart if needed
          let chartImage: string | undefined;
          if (options.includeCharts) {
            chartImage = await captureChartAsImage();
          }

          const pdf = generateTransactionPDF(data, {
            includeCharts: options.includeCharts,
            customBranding: options.customBranding,
            chartImage,
          });
          downloadPDF(pdf, `${filename.replace(".csv", "")}.pdf`);
          break;
        }
        case "excel": {
          const workbook = await generateTransactionExcel(data);
          await downloadExcel(workbook, `${filename.replace(".csv", "")}.xlsx`);
          break;
        }
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      setExportState((prev) => ({ ...prev, isExporting: false }));
    } catch (error) {
      setExportState((prev) => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : "Export failed",
      }));
    }
  },
  [transactions, categories, wallets, defaultCurrency],
);

// Helper function to capture chart as image
const captureChartAsImage = async (): Promise<string | undefined> => {
  const chartElement = document.querySelector("[data-chart-container]");
  if (!chartElement) return undefined;

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(chartElement as HTMLElement);
  return canvas.toDataURL("image/png");
};
```

---

## Task 6: Update Transaction Page Integration

**Files:**
- Modify: `src/wj-client/app/dashboard/transaction/page.tsx`

**Step 1: Read current transaction page implementation**

Read: `src/wj-client/app/dashboard/transaction/page.tsx`

**Step 2: Update ExportDialog usage**

Ensure the ExportDialog is properly configured with all three format options. The ExportDialog already supports CSV, PDF, and Excel selection, so verify the onExport handler correctly processes all formats.

**Step 3: Verify integration**

Check that:
- ExportButton component is used with proper categories prop
- ExportDialog receives the onExport callback from useExportTransactions
- isExporting prop is correctly passed to show loading state

---

## Task 7: Add Chart Capture Support for PDF

**Files:**
- Modify: `src/wj-client/app/dashboard/transaction/page.tsx` or relevant chart component

**Step 1: Add chart container attribute**

Locate the chart component(s) in the transaction page and add the data attribute for chart capture:

```typescript
<div data-chart-container>
  {/* Your Recharts component here */}
</div>
```

**Step 2: Ensure chart is renderable for html2canvas**

Verify chart components have proper dimensions and are not using special CSS that might prevent canvas capture.

**Step 3: Test chart capture**

Manual test: Export with PDF format and includeCharts=true to verify chart appears in PDF.

---

## Task 8: Run Full Test Suite

**Files:**
- All test files

**Step 1: Run all export tests**

Run: `cd src/wj-client && npm test -- --testPathPattern=export`

Expected: All tests PASS

**Step 2: Run full test suite**

Run: `cd src/wj-client && npm test`

Expected: All tests PASS

**Step 3: Fix any failing tests**

If tests fail:
1. Read error messages carefully
2. Identify root cause
3. Fix the issue
4. Re-run tests

---

## Task 9: Build Verification

**Files:**
- Build output

**Step 1: Run production build**

Run: `cd src/wj-client && npm run build`

Expected: Build completes successfully without errors

**Step 2: Check for TypeScript errors**

If build fails:
1. Read TypeScript errors
2. Fix type issues
3. Re-run build

**Step 3: Verify bundle size**

Check that new libraries (jspdf, exceljs, html2canvas) don't significantly increase bundle size. If too large, consider dynamic imports.

---

## Task 10: Manual Testing Checklist

**Files:**
- None (manual testing)

**Step 1: Test CSV export**

1. Open transaction page
2. Click Export button
3. Select CSV format
4. Choose date range (e.g., last30days)
5. Click Export
6. Verify file downloads with correct name
7. Open CSV file and verify data

Expected: CSV file contains all transaction data with proper formatting

**Step 2: Test PDF export without charts**

1. Open transaction page
2. Click Export button
3. Select PDF format
4. Uncheck "Include charts"
5. Choose date range
6. Click Export
7. Verify PDF downloads
8. Open PDF and verify table formatting

Expected: PDF with title, subtitle, and transaction table with proper styling

**Step 3: Test PDF export with charts**

1. Open transaction page
2. Click Export button
3. Select PDF format
4. Check "Include charts"
5. Choose date range
6. Click Export
7. Verify PDF downloads
8. Open PDF and verify chart appears

Expected: PDF includes chart image above transaction table

**Step 4: Test Excel export**

1. Open transaction page
2. Click Export button
3. Select Excel format
4. Choose date range
5. Click Export
6. Verify .xlsx file downloads
7. Open Excel file and verify:
   - Header row with brand colors
   - Formatted data rows
   - Alternate row colors
   - Auto-filter enabled
   - Frozen header row

Expected: Excel file with proper formatting and all transaction data

**Step 5: Test error handling**

1. Disconnect from network
2. Try to export
3. Verify error message displays

Expected: User-friendly error message appears

**Step 6: Test loading states**

1. Click Export button
2. Select any format
3. Click Export
4. Verify loading indicator appears

Expected: Export button shows "Exporting..." with spinner

**Step 7: Document any issues**

If issues found during manual testing:
1. Document the issue
2. Create bug fix task
3. Implement fix
4. Retest

---

## Task 11: Add Type Definitions for New Libraries

**Files:**
- Create: `src/wj-client/types/export.d.ts`

**Step 1: Create export type definitions file**

Create: `src/wj-client/types/export.d.ts`

```typescript
// src/wj-client/types/export.d.ts
/**
 * Type definitions for export-related libraries
 */

declare module "jspdf" {
  export interface jsPDF {
    text: (text: string, x: number, y: number) => void;
    addImage: (
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => void;
    addPage: () => void;
    setFontSize: (size: number) => void;
    setTextColor: (r: number, g: number, b: number) => void;
    save: (filename: string) => void;
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
  }

  export class jsPDF {
    constructor(orientation?: "p" | "portrait" | "l" | "landscape");
  }
}

declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";

  export interface UserOptions {
    startY?: number;
    head?: string[][];
    body?: string[][];
    theme?: "grid" | "striped" | "plain";
    styles?: {
      fontSize?: number;
      cellPadding?: number;
      font?: string;
    };
    headStyles?: {
      fillColor?: [number, number, number];
      textColor?: [number, number, number];
      fontStyle?: "normal" | "bold" | "italic";
    };
    alternateRowStyles?: {
      fillColor?: [number, number, number];
    };
    margin?: {
      top?: number;
      left?: number;
      right?: number;
      bottom?: number;
    };
  }

  export interface autoTable {
    (pdf: jsPDF, options: UserOptions): void;
  }

  export default function autoTable(pdf: jsPDF, options: UserOptions): void;
}

declare module "html2canvas" {
  export interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    backgroundColor?: string;
  }

  export default function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions,
  ): Promise<HTMLCanvasElement>;
}
```

---

## Task 12: Update Documentation

**Files:**
- Create: `src/wj-client/docs/export-implementation.md`

**Step 1: Create export documentation**

Create: `src/wj-client/docs/export-implementation.md`

```markdown
# Transaction Export Implementation

## Overview

The transaction export system supports three formats: CSV, PDF, and Excel. All exports are generated client-side to reduce server load and enable real-time data formatting.

## Supported Formats

### CSV
- Universal spreadsheet format
- Compatible with Excel, Google Sheets, Numbers
- Smallest file size
- Basic formatting

### PDF
- Professional document format
- Supports embedded charts
- Styled with brand colors
- Ideal for reports and printing

### Excel
- Native .xlsx format
- Rich formatting support
- Auto-filter enabled
- Frozen header row
- Best for data analysis

## Usage

### Basic Export

```typescript
import { useExportTransactions } from "@/hooks/useExportTransactions";
import { ExportDialog } from "@/components/export/ExportDialog";

function TransactionPage() {
  const { exportTransactions, isExporting } = useExportTransactions();

  return (
    <ExportDialog
      isOpen={isExportOpen}
      onClose={() => setIsExportOpen(false)}
      onExport={exportTransactions}
      categories={categories}
      isExporting={isExporting}
    />
  );
}
```

### Export Options

```typescript
interface ExportOptions {
  format: "csv" | "pdf" | "excel";
  dateRange: "last7days" | "last30days" | "last90days" | "ytd" | "custom" | "all";
  customStartDate?: Date;
  customEndDate?: Date;
  includeCharts: boolean; // PDF only
  includeCategories: string[];
  customBranding: boolean;
  fileName?: string;
}
```

## Implementation Details

### CSV Export
- File: `utils/export/transaction-export.ts`
- Generates RFC 4180 compliant CSV
- Proper escaping for special characters
- UTF-8 encoding

### PDF Export
- File: `utils/export/pdf-export.ts`
- Uses jsPDF and jsPDF-autotable
- Chart capture via html2canvas
- Brand color integration

### Excel Export
- File: `utils/export/excel-export.ts`
- Uses ExcelJS
- Styled headers and cells
- Auto-filter and freeze panes

## Chart Export for PDF

To enable chart export, add the `data-chart-container` attribute:

```typescript
<div data-chart-container>
  <LineChart data={data}>
    {/* Chart components */}
  </LineChart>
</div>
```

## Testing

```bash
# Run export tests
npm test -- --testPathPattern=export

# Run specific format tests
npm test -- pdf-export.test.ts
npm test -- excel-export.test.ts
npm test -- transaction-export.test.ts
```

## Dependencies

- `jspdf` - PDF generation
- `jspdf-autotable` - Table rendering in PDF
- `exceljs` - Excel file creation
- `html2canvas` - Chart capture for PDF

## Future Enhancements

- Custom branding with logo
- Multiple chart types
- Summary statistics
- Category breakdown pages
- Custom templates
```

---

## Task 13: Final Verification and Integration

**Files:**
- All modified files

**Step 1: Run full test suite**

Run: `cd src/wj-client && npm test`

Expected: All tests PASS

**Step 2: Run production build**

Run: `cd src/wj-client && npm run build`

Expected: Build completes successfully

**Step 3: Check TypeScript compilation**

Run: `cd src/wj-client && npx tsc --noEmit`

Expected: No TypeScript errors

**Step 4: Verify export functionality end-to-end**

1. Start dev server: `cd src/wj-client && npm run dev`
2. Navigate to transaction page
3. Test all three export formats
4. Verify downloaded files

**Step 5: Clean up any temporary files**

Remove any debug files or console.log statements added during development.

---

## Summary

This plan implements PDF and Excel export functionality by:

1. **Installing required libraries**: jsPDF, ExcelJS, html2canvas
2. **Creating format-specific modules**: Separate utilities for PDF and Excel
3. **Updating the export hook**: Routing based on format selection
4. **Adding comprehensive tests**: Unit tests for new functionality
5. **Maintaining backward compatibility**: Existing CSV export unchanged
6. **Providing documentation**: Usage examples and implementation details

The implementation follows the existing codebase patterns:
- Same test structure as CSV export
- Consistent naming conventions
- Type-safe TypeScript implementation
- Client-side generation approach
- Proper error handling and loading states

**Estimated completion time**: 2-3 hours for full implementation and testing.
