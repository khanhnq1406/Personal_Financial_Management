// src/wj-client/components/import/ImportSuccess.tsx
"use client";

import { Button } from "@/components/Button";
import { formatCurrency } from "@/utils/currency-formatter";

export interface ImportSummary {
  importBatchId: string;
  totalImported: number;
  totalSkipped: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  newWalletBalance: number;
  currency: string;
  canUndo: boolean;
  undoExpiresAt: number; // Unix timestamp
}

export interface ImportSuccessProps {
  summary: ImportSummary;
  onDone: () => void;
  onUndo?: () => void;
}

export function ImportSuccess({ summary, onDone, onUndo }: ImportSuccessProps) {
  const undoExpiresIn = Math.max(0, Math.floor((summary.undoExpiresAt * 1000 - Date.now()) / (1000 * 60 * 60)));

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
          {summary.totalImported} transactions imported
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-success-50 dark:bg-success-950 rounded-lg border border-success-200 dark:border-success-800">
          <p className="text-xs text-success-600 dark:text-success-400 mb-1">Income</p>
          <p className="text-lg font-semibold text-success-700 dark:text-success-300">
            {formatCurrency(summary.totalIncome, summary.currency)}
          </p>
        </div>
        <div className="p-4 bg-danger-50 dark:bg-danger-950 rounded-lg border border-danger-200 dark:border-danger-800">
          <p className="text-xs text-danger-600 dark:text-danger-400 mb-1">Expenses</p>
          <p className="text-lg font-semibold text-danger-700 dark:text-danger-300">
            {formatCurrency(Math.abs(summary.totalExpenses), summary.currency)}
          </p>
        </div>
        <div className="p-4 bg-neutral-50 dark:bg-dark-surface-hover rounded-lg border border-neutral-200 dark:border-dark-border">
          <p className="text-xs text-neutral-600 dark:text-dark-text-secondary mb-1">Net Change</p>
          <p className={`text-lg font-semibold ${
            summary.netChange >= 0
              ? "text-success-700 dark:text-success-300"
              : "text-danger-700 dark:text-danger-300"
          }`}>
            {summary.netChange >= 0 ? "+" : ""}
            {formatCurrency(summary.netChange, summary.currency)}
          </p>
        </div>
        <div className="p-4 bg-neutral-50 dark:bg-dark-surface-hover rounded-lg border border-neutral-200 dark:border-dark-border">
          <p className="text-xs text-neutral-600 dark:text-dark-text-secondary mb-1">New Balance</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-dark-text">
            {formatCurrency(summary.newWalletBalance, summary.currency)}
          </p>
        </div>
      </div>

      {/* Undo Notice */}
      {summary.canUndo && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                You can undo this import within {undoExpiresIn} hours
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                All imported transactions will be deleted and wallet balance will be restored.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {summary.canUndo && onUndo && (
          <Button
            variant="secondary"
            onClick={onUndo}
            className="flex-1"
          >
            Undo Import
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onDone}
          className="flex-1"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
