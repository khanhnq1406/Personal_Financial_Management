"use client";

import { useState, useEffect } from "react";
import { ReviewStep } from "./ReviewStep";
import { ColumnMapping } from "./ColumnMappingStep";
import { ParsedTransaction, DuplicateHandlingStrategy, ImportSummary } from "@/gen/protobuf/v1/import";
import { Button } from "@/components/Button";
import { useMutationExecuteImport, useMutationParseStatement } from "@/utils/generated/hooks";

export interface ReviewStepWrapperProps {
  file: File;
  fileId: string;
  walletId: number;
  columnMapping: ColumnMapping | null; // Made optional for Excel/PDF
  bankTemplateId?: string | null;
  onImportSuccess: (summary: ImportSummary, importBatchId: string) => void;
  onBack: () => void;
  onError: (error: any) => void;
}

/**
 * Wrapper component that handles file parsing before showing the review step
 * Uses backend API for parsing (supports CSV, Excel, PDF)
 */
export function ReviewStepWrapper({
  file,
  fileId,
  walletId,
  columnMapping,
  bankTemplateId,
  onImportSuccess,
  onBack,
  onError,
}: ReviewStepWrapperProps) {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("VND");

  // Parse statement mutation (backend API)
  const parseStatementMutation = useMutationParseStatement({
    onSuccess: (response) => {
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
        // Extract currency from first transaction if available
        if (response.transactions.length > 0 && response.transactions[0].amount?.currency) {
          setCurrency(response.transactions[0].amount.currency);
        }
        setLoading(false);
      } else {
        setError(response.message || "Failed to parse file");
        setLoading(false);
      }
    },
    onError: (err: any) => {
      setError(err.message || "Failed to parse file");
      setLoading(false);
    },
  });

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

  // Parse the file when component mounts using backend API
  useEffect(() => {
    parseFileViaBackend();
  }, [fileId, columnMapping, bankTemplateId]);

  const parseFileViaBackend = () => {
    // Build custom mapping if provided (for CSV files)
    let customMapping = undefined;
    if (columnMapping) {
      customMapping = {
        dateColumn: columnMapping.dateColumn.toString(),
        amountColumn: columnMapping.amountColumn.toString(),
        descriptionColumn: columnMapping.descriptionColumn.toString(),
        typeColumn: columnMapping.typeColumn !== undefined ? columnMapping.typeColumn.toString() : "",
        categoryColumn: columnMapping.categoryColumn !== undefined ? columnMapping.categoryColumn.toString() : "",
        referenceColumn: columnMapping.referenceColumn !== undefined ? columnMapping.referenceColumn.toString() : "",
        dateFormat: columnMapping.dateFormat || "",
        currency: columnMapping.currency || "VND",
      };
      setCurrency(columnMapping.currency || "VND");
    }

    // Call backend parse API
    parseStatementMutation.mutate({
      fileId,
      bankTemplateId: bankTemplateId || "",
      customMapping,
    });
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
      currency={currency}
      isLoading={executeImportMutation.isPending}
      useGroupedUI={true}
      categories={[]}
      duplicateMatches={[]}
    />
  );
}
