"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { ErrorSummary } from "./ErrorSummary";
import { TransactionReviewTable } from "./TransactionReviewTable";
import { ParsedTransaction, DuplicateMatch } from "@/gen/protobuf/v1/import";
import { ColumnMapping } from "./ColumnMappingStep";
import { useMutationParseStatement } from "@/utils/generated/hooks";

// Props for parsing mode (Task 10)
export interface ReviewStepParseProps {
  file: File;
  columnMapping: ColumnMapping;
  onNext: () => void;
  onBack: () => void;
  onError: (error: any) => void;
}

// Props for review mode (existing)
export interface ReviewStepReviewProps {
  transactions: ParsedTransaction[];
  duplicateMatches?: DuplicateMatch[];
  onImport: (selectedRowNumbers: number[]) => void;
  onBack: () => void;
  isLoading?: boolean;
  currency?: string;
}

export type ReviewStepProps = ReviewStepParseProps | ReviewStepReviewProps;

// Type guard to check if props are for parsing mode
function isParseProps(props: ReviewStepProps): props is ReviewStepParseProps {
  return 'file' in props && 'columnMapping' in props;
}

export function ReviewStep(props: ReviewStepProps) {
  // Extract props based on type
  const transactions = 'transactions' in props ? props.transactions : [];
  const duplicateMatches = 'duplicateMatches' in props ? props.duplicateMatches : undefined;
  const onImport = 'onImport' in props ? props.onImport : () => {};
  const onBack = props.onBack;
  const isLoading = 'isLoading' in props ? props.isLoading : false;
  const currency = 'currency' in props ? props.currency : "VND";
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Auto-select valid non-duplicate transactions by default
  useEffect(() => {
    const duplicateRowNumbers = new Set(
      duplicateMatches?.map((m) => m.importedTransaction?.rowNumber || 0) || [],
    );

    const validNonDuplicateRows = transactions
      .filter((t) => t.isValid && !duplicateRowNumbers.has(t.rowNumber))
      .map((t) => t.rowNumber);

    setSelectedRows(new Set(validNonDuplicateRows));
  }, [transactions, duplicateMatches]);

  // Build duplicate confidence map for table display
  const duplicateMap = new Map(
    duplicateMatches?.map((m) => [
      m.importedTransaction?.rowNumber || 0,
      {
        confidence: m.confidence,
        matchReason: m.matchReason,
      },
    ]) || [],
  );

  // Extract validation errors for ErrorSummary
  const errorsForSummary = transactions
    .filter((t) => t.validationErrors.length > 0)
    .map((t) => ({
      rowNumber: t.rowNumber,
      errors: t.validationErrors,
    }));

  const handleToggleRow = (rowNumber: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber);
      } else {
        newSet.add(rowNumber);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    const validTransactions = transactions.filter((t) => t.isValid);
    const allSelected = validTransactions.every((t) => selectedRows.has(t.rowNumber));

    if (allSelected) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all valid transactions
      setSelectedRows(new Set(validTransactions.map((t) => t.rowNumber)));
    }
  };

  const handleImport = () => {
    onImport(Array.from(selectedRows));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Instructions */}
      <div className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
        <p className="mb-2">
          Review the parsed transactions below. Select the rows you want to import.
        </p>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-dark-text-tertiary">
          Rows with errors cannot be imported. Duplicate transactions are detected
          automatically.
        </p>
      </div>

      {/* Error Summary */}
      {errorsForSummary.length > 0 && <ErrorSummary errors={errorsForSummary} />}

      {/* Transaction Review Table */}
      <TransactionReviewTable
        transactions={transactions}
        selectedRows={selectedRows}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
        duplicateMatches={duplicateMap}
        currency={currency}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={selectedRows.size === 0 || isLoading}
          loading={isLoading}
        >
          Import {selectedRows.size > 0 ? `${selectedRows.size} Transaction${selectedRows.size !== 1 ? "s" : ""}` : "Transactions"}
        </Button>
      </div>
    </div>
  );
}
