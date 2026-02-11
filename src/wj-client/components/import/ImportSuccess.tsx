"use client";

import { Button } from "@/components/Button";
import { CheckIcon } from "@/components/icons";
import { formatCurrency } from "@/utils/currency-formatter";
import { ImportSummary } from "@/gen/protobuf/v1/import";

export interface ImportSuccessProps {
  summary: ImportSummary;
  currency?: string;
  canUndo?: boolean;
  onUndo?: () => void;
  onDone: () => void;
  isUndoing?: boolean;
}

export function ImportSuccess({
  summary,
  currency = "VND",
  canUndo = false,
  onUndo,
  onDone,
  isUndoing = false,
}: ImportSuccessProps) {
  // Calculate undo countdown (in hours)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(summary.undoExpiresAt || 0);
  const hoursRemaining = Math.max(
    0,
    Math.ceil((expiresAt - now) / 3600),
  );

  // Calculate net change
  const netChange = (summary.totalIncome || 0) - (summary.totalExpenses || 0);
  const isPositive = netChange >= 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 sm:px-6">
      {/* Success Icon */}
      <div className="mb-6 p-4 bg-success-100 dark:bg-success-900/20 rounded-full">
        <CheckIcon
          size="xl"
          className="text-success-600 dark:text-success-500"
        />
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 text-center">
        Import Successful!
      </h2>
      <p className="text-base text-neutral-600 dark:text-neutral-400 mb-8 text-center">
        {summary.totalImported || 0} transaction
        {(summary.totalImported || 0) !== 1 ? "s" : ""} imported successfully
      </p>

      {/* Summary Statistics Grid */}
      <div className="w-full max-w-2xl mb-8">
        <div className="grid grid-cols-2 gap-4">
          {/* Income */}
          <div className="bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800 rounded-lg p-4">
            <p className="text-sm font-medium text-success-700 dark:text-success-400 mb-1">
              Income
            </p>
            <p className="text-xl font-bold text-success-900 dark:text-success-300">
              {formatCurrency(summary.totalIncome || 0, currency)}
            </p>
          </div>

          {/* Expenses */}
          <div className="bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-400 mb-1">
              Expenses
            </p>
            <p className="text-xl font-bold text-danger-900 dark:text-danger-300">
              {formatCurrency(summary.totalExpenses || 0, currency)}
            </p>
          </div>

          {/* Net Change */}
          <div
            className={`${
              isPositive
                ? "bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-800"
                : "bg-danger-50 dark:bg-danger-900/10 border-danger-200 dark:border-danger-800"
            } border rounded-lg p-4`}
          >
            <p
              className={`text-sm font-medium mb-1 ${
                isPositive
                  ? "text-success-700 dark:text-success-400"
                  : "text-danger-700 dark:text-danger-400"
              }`}
            >
              Net Change
            </p>
            <p
              className={`text-xl font-bold ${
                isPositive
                  ? "text-success-900 dark:text-success-300"
                  : "text-danger-900 dark:text-danger-300"
              }`}
            >
              {isPositive && netChange > 0 ? "+" : ""}
              {formatCurrency(netChange, currency)}
            </p>
          </div>

          {/* New Balance */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
              New Balance
            </p>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-200">
              {formatCurrency(summary.newBalance || 0, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Undo Notice */}
      {canUndo && onUndo && (
        <div className="w-full max-w-2xl mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Undo Available
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                You can undo this import within the next {hoursRemaining} hour
                {hoursRemaining !== 1 ? "s" : ""}. After that, the import will be
                permanent.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {canUndo && onUndo && (
          <Button
            variant="secondary"
            onClick={onUndo}
            loading={isUndoing}
            disabled={isUndoing}
            fullWidth
          >
            Undo Import
          </Button>
        )}
        <Button variant="primary" onClick={onDone} fullWidth disabled={isUndoing}>
          Done
        </Button>
      </div>
    </div>
  );
}
