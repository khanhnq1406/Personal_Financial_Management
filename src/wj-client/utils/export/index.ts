// src/wj-client/utils/export/index.ts

// =============================================================================
// CSV Export
// =============================================================================
export {
  getDateRangeTimestamps,
  generateTransactionCSV,
  downloadCSV,
  type TransactionExportData,
} from "./transaction-export";

// Filename generator - explicitly aliased for clarity
export { generateExportFilename as generateCSVFilename } from "./transaction-export";

// =============================================================================
// PDF Export
// =============================================================================
export {
  generateTransactionPDF,
  generateExportFilename as generatePDFFilename,
  downloadPDF,
  type PDFExportOptions,
} from "./pdf-export";

// =============================================================================
// Excel Export
// =============================================================================
export {
  generateTransactionExcel,
  generateExportFilename as generateExcelFilename,
  downloadExcel,
} from "./excel-export";

// =============================================================================
// Legacy Exports
// =============================================================================
// Re-export existing financial report export
export { exportFinancialReportToCSV } from "@/utils/csv-export";
