"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/Button";
import { ErrorSummary } from "./ErrorSummary";
import { TransactionReviewTable } from "./TransactionReviewTable";
import { ParsedTransaction, DuplicateMatch, DuplicateHandlingStrategy, CurrencyConversion } from "@/gen/protobuf/v1/import";
import { ColumnMapping } from "./ColumnMappingStep";
import { useMutationParseStatement } from "@/utils/generated/hooks";
import { ErrorSection } from "./ErrorSection";
import { DuplicateSection } from "./DuplicateSection";
import { CategoryReviewSection } from "./CategoryReviewSection";
import { ReadyToImportSection } from "./ReadyToImportSection";
import { DateRangeFilter } from "./DateRangeFilter";
import { DuplicateStrategySelector } from "./DuplicateStrategySelector";
import { CurrencyConversionSection } from "./CurrencyConversionSection";
import { ChangeRateModal } from "./ChangeRateModal";

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
  categories?: Array<{ id: number; name: string }>;
  // New grouped UI props
  useGroupedUI?: boolean;
  // Duplicate strategy props
  duplicateStrategy?: DuplicateHandlingStrategy;
  onDuplicateStrategyChange?: (strategy: DuplicateHandlingStrategy) => void;
  // Currency conversion props
  conversions?: CurrencyConversion[];
  onChangeRate?: (fromCurrency: string, toCurrency: string, newRate: number) => void;
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
  const categories = 'categories' in props ? props.categories : [];
  const useGroupedUI = 'useGroupedUI' in props ? props.useGroupedUI : true; // Default to new UI
  const duplicateStrategy = 'duplicateStrategy' in props ? props.duplicateStrategy : DuplicateHandlingStrategy.DUPLICATE_STRATEGY_SKIP_ALL;
  const onDuplicateStrategyChange = 'onDuplicateStrategyChange' in props ? props.onDuplicateStrategyChange : undefined;
  const conversions = 'conversions' in props ? props.conversions : undefined;
  const onChangeRate = 'onChangeRate' in props ? props.onChangeRate : undefined;

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [handledDuplicates, setHandledDuplicates] = useState<Set<number>>(new Set());
  const [transactionsState, setTransactionsState] = useState<ParsedTransaction[]>([]);
  const [showChangeRateModal, setShowChangeRateModal] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState<CurrencyConversion | null>(null);

  // Initialize transactions state
  useEffect(() => {
    setTransactionsState(transactions);
  }, [transactions]);

  // Auto-select valid non-duplicate transactions by default
  useEffect(() => {
    const duplicateRowNumbers = new Set(
      duplicateMatches?.map((m) => m.importedTransaction?.rowNumber || 0) || [],
    );

    const validNonDuplicateRows = transactionsState
      .filter((t) => t.isValid && !duplicateRowNumbers.has(t.rowNumber))
      .map((t) => t.rowNumber);

    setSelectedRows(new Set(validNonDuplicateRows));
  }, [transactionsState, duplicateMatches]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!dateRangeStart && !dateRangeEnd) {
      return transactionsState;
    }

    const startTime = dateRangeStart ? Math.floor(dateRangeStart.getTime() / 1000) : 0;
    const endTime = dateRangeEnd ? Math.floor(dateRangeEnd.getTime() / 1000) : Number.MAX_SAFE_INTEGER;

    return transactionsState.filter((tx) => {
      return tx.date >= startTime && tx.date <= endTime;
    });
  }, [transactionsState, dateRangeStart, dateRangeEnd]);

  // Group transactions by status (for new UI)
  const groups = useMemo(() => {
    const duplicateRowNumbers = new Set(
      duplicateMatches
        ?.filter((m) => !handledDuplicates.has(m.importedTransaction?.rowNumber || 0))
        .map((m) => m.importedTransaction?.rowNumber || 0) || []
    );

    const hasErrors = filteredTransactions.filter((tx) => !tx.isValid);

    const hasDuplicates = filteredTransactions.filter((tx) =>
      duplicateRowNumbers.has(tx.rowNumber)
    );

    const needsCategoryReview = filteredTransactions.filter(
      (tx) =>
        tx.isValid &&
        !duplicateRowNumbers.has(tx.rowNumber) &&
        (!tx.suggestedCategoryId || tx.categoryConfidence < 80)
    );

    const readyToImport = filteredTransactions.filter(
      (tx) =>
        tx.isValid &&
        !duplicateRowNumbers.has(tx.rowNumber) &&
        tx.suggestedCategoryId &&
        tx.categoryConfidence >= 80
    );

    return {
      hasErrors,
      hasDuplicates,
      needsCategoryReview,
      readyToImport,
    };
  }, [filteredTransactions, duplicateMatches, handledDuplicates]);

  // Build duplicate confidence map for table display (old UI)
  const duplicateMap = new Map(
    duplicateMatches?.map((m) => [
      m.importedTransaction?.rowNumber || 0,
      {
        confidence: m.confidence,
        matchReason: m.matchReason,
      },
    ]) || [],
  );

  // Extract validation errors for ErrorSummary (old UI)
  const errorsForSummary = transactionsState
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
    const validTransactions = filteredTransactions.filter((t) => t.isValid);
    const allSelected = validTransactions.every((t) => selectedRows.has(t.rowNumber));

    if (allSelected) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all valid transactions
      setSelectedRows(new Set(validTransactions.map((t) => t.rowNumber)));
    }
  };

  const handleTransactionUpdate = (rowNumber: number, updates: Partial<ParsedTransaction>) => {
    setTransactionsState((prev) =>
      prev.map((tx) =>
        tx.rowNumber === rowNumber ? { ...tx, ...updates } : tx
      )
    );
  };

  const handleDuplicateAction = (rowNumber: number, action: "merge" | "keep" | "skip") => {
    // Mark this duplicate as handled
    setHandledDuplicates((prev) => new Set(prev).add(rowNumber));

    // If action is "skip", also add to excluded rows
    if (action === "skip") {
      setExcludedRows((prev) => new Set(prev).add(rowNumber));
    }
  };

  const handleToggleExclude = (rowNumber: number) => {
    const newExcluded = new Set(excludedRows);
    if (newExcluded.has(rowNumber)) {
      newExcluded.delete(rowNumber);
    } else {
      newExcluded.add(rowNumber);
    }
    setExcludedRows(newExcluded);
  };

  const handleCategoryChange = (rowNumber: number, categoryId: number) => {
    handleTransactionUpdate(rowNumber, {
      suggestedCategoryId: categoryId,
      categoryConfidence: 100, // Manual selection = 100% confidence
    });
  };

  const handleSkipError = (rowNumber: number) => {
    setExcludedRows((prev) => new Set(prev).add(rowNumber));
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRangeStart(start);
    setDateRangeEnd(end);
  };

  const handleOpenChangeRateModal = (fromCurrency: string, toCurrency: string) => {
    const conversion = conversions?.find(
      (c) => c.fromCurrency === fromCurrency && c.toCurrency === toCurrency
    );
    if (conversion) {
      setSelectedConversion(conversion);
      setShowChangeRateModal(true);
    }
  };

  const handleConfirmRateChange = (newRate: number) => {
    if (selectedConversion && onChangeRate) {
      onChangeRate(
        selectedConversion.fromCurrency,
        selectedConversion.toCurrency,
        newRate
      );
    }
    setShowChangeRateModal(false);
    setSelectedConversion(null);
  };

  const handleCancelRateChange = () => {
    setShowChangeRateModal(false);
    setSelectedConversion(null);
  };

  const handleImport = () => {
    if (useGroupedUI) {
      // New UI: exclude rows that are in excludedRows set
      const importableRows = filteredTransactions
        .filter((t) => t.isValid && !excludedRows.has(t.rowNumber))
        .map((t) => t.rowNumber);
      onImport(importableRows);
    } else {
      // Old UI: use selectedRows
      onImport(Array.from(selectedRows));
    }
  };

  // Calculate importable count
  const importableCount = useGroupedUI
    ? groups.readyToImport.filter((tx) => !excludedRows.has(tx.rowNumber)).length
    : selectedRows.size;

  // Blocked count includes errors and unhandled duplicates
  const blockedCount = groups.hasErrors.length + groups.hasDuplicates.length;

  // Render new grouped UI
  if (useGroupedUI) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header Summary */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text mb-2">
            Review Import
          </h2>
          <p className="text-sm text-neutral-600 dark:text-dark-text-secondary">
            {transactionsState.length} transaction{transactionsState.length !== 1 ? "s" : ""} from statement
          </p>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter
          startDate={dateRangeStart}
          endDate={dateRangeEnd}
          onChange={handleDateRangeChange}
          transactionCount={transactionsState.length}
        />

        {/* Duplicate Strategy Selector */}
        {duplicateMatches && duplicateMatches.length > 0 && onDuplicateStrategyChange && (
          <DuplicateStrategySelector
            duplicateCount={duplicateMatches.length}
            selectedStrategy={duplicateStrategy || DuplicateHandlingStrategy.DUPLICATE_STRATEGY_SKIP_ALL}
            onStrategyChange={onDuplicateStrategyChange}
          />
        )}

        {/* Currency Conversion Section */}
        {conversions && conversions.length > 0 && (
          <CurrencyConversionSection
            conversions={conversions}
            onChangeRate={handleOpenChangeRateModal}
          />
        )}

        {/* Grouped Sections */}
        <div className="space-y-3">
          {/* Error Section */}
          {groups.hasErrors.length > 0 && (
            <ErrorSection
              transactions={groups.hasErrors}
              onTransactionUpdate={handleTransactionUpdate}
              onSkip={handleSkipError}
              currency={currency}
            />
          )}

          {/* Duplicate Section */}
          {groups.hasDuplicates.length > 0 && duplicateMatches && (
            <DuplicateSection
              matches={duplicateMatches.filter(
                (m) => !handledDuplicates.has(m.importedTransaction?.rowNumber || 0)
              )}
              onDuplicateHandled={handleDuplicateAction}
              currency={currency}
            />
          )}

          {/* Category Review Section */}
          {groups.needsCategoryReview.length > 0 && (
            <CategoryReviewSection
              transactions={groups.needsCategoryReview}
              onCategoryChange={handleCategoryChange}
              categories={categories}
              currency={currency}
            />
          )}

          {/* Ready to Import Section */}
          {groups.readyToImport.length > 0 && (
            <ReadyToImportSection
              transactions={groups.readyToImport}
              excludedRows={excludedRows}
              onToggleExclude={handleToggleExclude}
              categories={categories}
              currency={currency}
            />
          )}
        </div>

        {/* Summary Stats */}
        <div className="p-4 bg-neutral-100 dark:bg-dark-surface-hover rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-neutral-600 dark:text-dark-text-secondary text-sm mb-1">
                Ready to import
              </p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {importableCount}
              </p>
            </div>
            <div>
              <p className="text-neutral-600 dark:text-dark-text-secondary text-sm mb-1">
                Need attention
              </p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {blockedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={importableCount === 0 || isLoading}
            loading={isLoading}
            className="flex-1"
          >
            {isLoading
              ? "Importing..."
              : `Import ${importableCount} Transaction${importableCount !== 1 ? "s" : ""}`}
          </Button>
        </div>

        {/* Change Rate Modal */}
        {showChangeRateModal && selectedConversion && (
          <ChangeRateModal
            isOpen={showChangeRateModal}
            onClose={handleCancelRateChange}
            conversion={selectedConversion}
            onConfirm={handleConfirmRateChange}
          />
        )}
      </div>
    );
  }

  // Render old UI (fallback)
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
        transactions={filteredTransactions}
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
