"use client";

import { useState, useEffect } from "react";
import { ReviewStep } from "./ReviewStep";
import { ColumnMapping } from "./ColumnMappingStep";
import { ParsedTransaction, DuplicateHandlingStrategy, ImportSummary } from "@/gen/protobuf/v1/import";
import { Button } from "@/components/Button";
import { useMutationExecuteImport } from "@/utils/generated/hooks";

export interface ReviewStepWrapperProps {
  file: File;
  fileId: string;
  walletId: number;
  columnMapping: ColumnMapping;
  onImportSuccess: (summary: ImportSummary, importBatchId: string) => void;
  onBack: () => void;
  onError: (error: any) => void;
}

/**
 * Wrapper component that handles file parsing before showing the review step
 */
export function ReviewStepWrapper({
  file,
  fileId,
  walletId,
  columnMapping,
  onImportSuccess,
  onBack,
  onError,
}: ReviewStepWrapperProps) {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import execution mutation
  const executeImportMutation = useMutationExecuteImport({
    onSuccess: (response) => {
      if (response.success && response.summary) {
        onImportSuccess(response.summary, response.importBatchId);
      } else {
        onError(new Error(response.message || "Import failed"));
      }
    },
    onError: (err: any) => {
      onError(err);
    },
  });

  // Parse the file when component mounts
  useEffect(() => {
    parseFile();
  }, [file, columnMapping]);

  const parseFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        throw new Error("File is empty");
      }

      // Skip header row
      const dataLines = lines.slice(1);
      const parsedTransactions: ParsedTransaction[] = [];

      dataLines.forEach((line, index) => {
        const columns = line.split(",").map((col) => col.trim().replace(/"/g, ""));
        const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed

        try {
          // Extract values based on column mapping
          const dateStr = columns[columnMapping.dateColumn] || "";
          const amountStr = columns[columnMapping.amountColumn] || "";
          const description = columns[columnMapping.descriptionColumn] || "Imported Transaction";

          // Parse date
          const date = parseDate(dateStr, columnMapping.dateFormat);

          // Parse amount
          const amount = parseAmount(amountStr);

          // Determine transaction type
          const type = amount >= 0 ? 1 : 2; // 1 = INCOME, 2 = EXPENSE

          // Validate transaction
          const validationErrors: any[] = [];
          if (!date) {
            validationErrors.push({
              field: "date",
              message: `Invalid date: ${dateStr}`,
              severity: "error",
            });
          }
          if (isNaN(amount)) {
            validationErrors.push({
              field: "amount",
              message: `Invalid amount: ${amountStr}`,
              severity: "error",
            });
          }

          parsedTransactions.push({
            rowNumber,
            date: date?.getTime() ? Math.floor(date.getTime() / 1000) : 0,
            amount: {
              amount: Math.abs(amount),
              currency: columnMapping.currency,
            },
            description,
            type,
            suggestedCategoryId: 0,
            categoryConfidence: 0,
            referenceNumber: columnMapping.referenceColumn !== undefined
              ? columns[columnMapping.referenceColumn] || ""
              : "",
            validationErrors,
            isValid: validationErrors.length === 0,
          });
        } catch (err: any) {
          parsedTransactions.push({
            rowNumber,
            date: 0,
            amount: { amount: 0, currency: columnMapping.currency },
            description: "Parse error",
            type: 2,
            suggestedCategoryId: 0,
            categoryConfidence: 0,
            referenceNumber: "",
            validationErrors: [{
              field: "row",
              message: err.message || "Failed to parse row",
              severity: "error",
            }],
            isValid: false,
          });
        }
      });

      setTransactions(parsedTransactions);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
      setLoading(false);
      onError(err);
    }
  };

  const parseDate = (dateStr: string, format: string): Date | null => {
    try {
      // Simple date parsing - can be enhanced later
      const parts = dateStr.split(/[/-]/);

      let day: number, month: number, year: number;

      if (format === "DD/MM/YYYY" || format === "DD-MM-YYYY") {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1; // JS months are 0-indexed
        year = parseInt(parts[2]);
      } else if (format === "MM/DD/YYYY") {
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else if (format === "YYYY-MM-DD") {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else {
        return null;
      }

      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const parseAmount = (amountStr: string): number => {
    // Remove currency symbols and whitespace
    let cleaned = amountStr
      .replace(/₫|\$|€|£/g, "")
      .replace(/\s/g, "")
      .trim();

    // Handle parentheses for negative (accounting format)
    let isNegative = false;
    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
      isNegative = true;
      cleaned = cleaned.slice(1, -1);
    }

    // Handle trailing minus
    if (cleaned.endsWith("-")) {
      isNegative = true;
      cleaned = cleaned.slice(0, -1);
    }

    // Handle leading minus
    if (cleaned.startsWith("-")) {
      isNegative = true;
      cleaned = cleaned.slice(1);
    }

    // Remove thousands separators (comma)
    cleaned = cleaned.replace(/,/g, "");

    // Parse as float
    const value = parseFloat(cleaned);

    if (isNaN(value)) {
      throw new Error(`Cannot parse amount: ${amountStr}`);
    }

    // Convert to smallest currency unit (multiply by 10000 for 4 decimal precision)
    return (isNegative ? -value : value) * 10000;
  };

  const handleImport = (selectedRowNumbers: number[]) => {
    // Filter transactions to only include selected rows
    const selectedTransactions = transactions.filter((t) =>
      selectedRowNumbers.includes(t.rowNumber)
    );

    // Determine excluded row numbers (all rows minus selected)
    const allRowNumbers = transactions.map((t) => t.rowNumber);
    const excludedRowNumbers = allRowNumbers.filter(
      (num) => !selectedRowNumbers.includes(num)
    );

    // Execute import
    executeImportMutation.mutate({
      fileId,
      walletId,
      transactions: selectedTransactions,
      strategy: DuplicateHandlingStrategy.DUPLICATE_STRATEGY_SKIP_ALL, // Default strategy
      excludedRowNumbers,
      dateFilterStart: 0,
      dateFilterEnd: 0,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600 dark:text-dark-text-secondary">
            Parsing file...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <ReviewStep
      transactions={transactions}
      onImport={handleImport}
      onBack={onBack}
      currency={columnMapping.currency}
      isLoading={executeImportMutation.isPending}
    />
  );
}
