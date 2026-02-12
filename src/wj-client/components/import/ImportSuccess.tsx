"use client";

import { Button } from "@/components/Button";
import { formatCurrency } from "@/utils/currency-formatter";
import { ImportSummary } from "@/gen/protobuf/v1/import";
import { useMutationUndoImport } from "@/utils/generated/hooks";
import { useState } from "react";

export interface ImportSuccessProps {
  summary: ImportSummary;
  importBatchId: string;
  onDone: () => void;
  onUndoSuccess?: () => void;
}

export function ImportSuccess({
  summary,
  importBatchId,
  onDone,
  onUndoSuccess,
}: ImportSuccessProps) {
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const undoMutation = useMutationUndoImport({
    onSuccess: () => {
      onUndoSuccess?.();
    },
    onError: (error: any) => {
      alert(`Failed to undo import: ${error.message || "Unknown error"}`);
    },
  });

  const handleUndoClick = () => {
    setShowUndoConfirm(true);
  };

  const handleUndoConfirm = () => {
    undoMutation.mutate({ importId: importBatchId });
  };

  const handleUndoCancel = () => {
    setShowUndoConfirm(false);
  };

  // Extract currency from summary money objects
  const currency = summary.totalIncome?.currency || summary.totalExpenses?.currency || "VND";

  // formatCurrency already handles conversion from smallest unit to display unit
  const totalIncome = summary.totalIncome?.amount || 0;
  const totalExpenses = summary.totalExpenses?.amount || 0;
  const netChange = summary.netChange?.amount || 0;
  const newBalance = summary.newWalletBalance?.amount || 0;

  if (showUndoConfirm) {
    return (
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-dark-text mb-2">
            Undo Import?
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
            This will delete all {summary.totalImported} imported transactions and restore your
            wallet balance.
          </p>
        </div>

        {/* Confirmation Message */}
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            This action cannot be reversed. Are you sure?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleUndoCancel}
            className="flex-1"
            disabled={undoMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUndoConfirm}
            className="flex-1 !bg-red-600 hover:!bg-red-700"
            loading={undoMutation.isPending}
          >
            Yes, Undo Import
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 sm:w-12 sm:h-12 text-success-600 dark:text-success-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-dark-text mb-2">
          Import Successful!
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
          {summary.totalImported} transaction{summary.totalImported !== 1 ? "s" : ""} imported
          {summary.totalSkipped > 0 && ` (${summary.totalSkipped} skipped)`}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-success-50 dark:bg-success-950 rounded-lg border border-success-200 dark:border-success-800">
          <p className="text-xs text-success-600 dark:text-success-400 mb-1">Income</p>
          <p className="text-lg font-semibold text-success-700 dark:text-success-300">
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>
        <div className="p-4 bg-danger-50 dark:bg-danger-950 rounded-lg border border-danger-200 dark:border-danger-800">
          <p className="text-xs text-danger-600 dark:text-danger-400 mb-1">Expenses</p>
          <p className="text-lg font-semibold text-danger-700 dark:text-danger-300">
            {formatCurrency(Math.abs(totalExpenses), currency)}
          </p>
        </div>
        <div className="p-4 bg-neutral-50 dark:bg-dark-surface-hover rounded-lg border border-neutral-200 dark:border-dark-border">
          <p className="text-xs text-neutral-600 dark:text-dark-text-secondary mb-1">Net Change</p>
          <p
            className={`text-lg font-semibold ${
              netChange >= 0
                ? "text-success-700 dark:text-success-300"
                : "text-danger-700 dark:text-danger-300"
            }`}
          >
            {netChange >= 0 ? "+" : ""}
            {formatCurrency(netChange, currency)}
          </p>
        </div>
        <div className="p-4 bg-neutral-50 dark:bg-dark-surface-hover rounded-lg border border-neutral-200 dark:border-dark-border">
          <p className="text-xs text-neutral-600 dark:text-dark-text-secondary mb-1">
            New Balance
          </p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-dark-text">
            {formatCurrency(newBalance, currency)}
          </p>
        </div>
      </div>

      {/* Duplicate Info */}
      {(summary.duplicatesMerged > 0 || summary.duplicatesSkipped > 0) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {summary.duplicatesSkipped > 0 &&
                  `${summary.duplicatesSkipped} duplicate${summary.duplicatesSkipped !== 1 ? "s" : ""} skipped`}
                {summary.duplicatesMerged > 0 &&
                  summary.duplicatesSkipped > 0 &&
                  ", "}
                {summary.duplicatesMerged > 0 &&
                  `${summary.duplicatesMerged} duplicate${summary.duplicatesMerged !== 1 ? "s" : ""} merged`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Undo Notice */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              You can undo this import within 24 hours
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              All imported transactions will be deleted and wallet balance will be restored.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleUndoClick} className="flex-1">
          Undo Import
        </Button>
        <Button variant="primary" onClick={onDone} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  );
}
