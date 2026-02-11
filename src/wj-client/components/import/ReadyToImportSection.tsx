"use client";

import React, { useState } from "react";
import { ParsedTransaction } from "@/gen/protobuf/v1/import";
import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon, CheckIcon, MinusIcon } from "@/components/icons";
import { formatCurrency } from "@/utils/currency-formatter";

export interface ReadyToImportSectionProps {
  transactions: ParsedTransaction[];
  excludedRows: Set<number>;
  onToggleExclude: (rowNumber: number) => void;
  categories?: Array<{ id: number; name: string }>;
  currency?: string;
}

export const ReadyToImportSection = React.memo(function ReadyToImportSection({
  transactions,
  excludedRows,
  onToggleExclude,
  categories = [],
  currency = "VND",
}: ReadyToImportSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (transactions.length === 0) {
    return null;
  }

  const selectedCount = transactions.filter(
    (tx) => !excludedRows.has(tx.rowNumber)
  ).length;

  const allSelected = selectedCount === transactions.length;
  const someSelected = selectedCount > 0 && selectedCount < transactions.length;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      transactions.forEach((tx) => {
        if (!excludedRows.has(tx.rowNumber)) {
          onToggleExclude(tx.rowNumber);
        }
      });
    } else {
      // Select all
      transactions.forEach((tx) => {
        if (excludedRows.has(tx.rowNumber)) {
          onToggleExclude(tx.rowNumber);
        }
      });
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || `Category ${categoryId}`;
  };

  return (
    <div className="border border-success-300 dark:border-success-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-success-50 dark:bg-success-950 hover:bg-success-100 dark:hover:bg-success-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div className="text-left">
            <h3 className="font-semibold text-base text-success-700 dark:text-success-300">
              {selectedCount} Ready to Import
            </h3>
            <p className="text-sm text-success-600 dark:text-success-400">
              High confidence, auto-categorized
            </p>
          </div>
        </div>
        <ChevronDownIcon
          size="sm"
          className={cn(
            "transition-transform text-success-600 dark:text-success-400",
            expanded && "rotate-180"
          )}
          decorative
        />
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-3 bg-white dark:bg-dark-surface">
          {/* Select All */}
          <div className="flex items-center justify-between pb-2 border-b border-success-200 dark:border-success-800">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <button
                type="button"
                onClick={handleSelectAll}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  allSelected
                    ? "bg-primary-600 border-primary-600 dark:bg-primary-700 dark:border-primary-700"
                    : someSelected
                      ? "bg-primary-600 border-primary-600 dark:bg-primary-700 dark:border-primary-700"
                      : "border-neutral-400 dark:border-neutral-500 hover:border-primary-500"
                )}
                aria-label="Toggle all rows"
              >
                {allSelected ? (
                  <CheckIcon size="sm" className="text-white" decorative />
                ) : someSelected ? (
                  <MinusIcon size="sm" className="text-white" decorative />
                ) : null}
              </button>
              <span className="text-sm font-medium text-neutral-900 dark:text-dark-text">
                Select All ({selectedCount} of {transactions.length})
              </span>
            </label>
          </div>

          {/* Transaction List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.map((tx) => {
              const isChecked = !excludedRows.has(tx.rowNumber);

              return (
                <label
                  key={tx.rowNumber}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    isChecked
                      ? "bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border"
                      : "bg-neutral-100 dark:bg-dark-surface-hover opacity-60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onToggleExclude(tx.rowNumber)}
                    className={cn(
                      "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                      isChecked
                        ? "bg-primary-600 border-primary-600 dark:bg-primary-700 dark:border-primary-700"
                        : "border-neutral-400 dark:border-neutral-500"
                    )}
                    aria-label={`Toggle row ${tx.rowNumber}`}
                  >
                    {isChecked && (
                      <CheckIcon size="sm" className="text-white" decorative />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-dark-text truncate">
                        {tx.description}
                      </p>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-dark-text ml-2">
                        {formatCurrency(tx.amount?.amount || 0, tx.amount?.currency || currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-dark-text-tertiary flex-wrap">
                      <span>{formatDate(tx.date)}</span>
                      {tx.suggestedCategoryId && (
                        <>
                          <span>•</span>
                          <span className="text-success-600 dark:text-success-400">
                            {getCategoryName(tx.suggestedCategoryId)} (
                            {tx.categoryConfidence}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

function formatDate(timestamp?: number): string {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
