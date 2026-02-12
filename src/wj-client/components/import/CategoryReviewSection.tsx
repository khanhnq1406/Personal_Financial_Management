"use client";

import React, { useState, useMemo } from "react";
import { ParsedTransaction } from "@/gen/protobuf/v1/import";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon } from "@/components/icons";
import { Select, SelectOption } from "@/components/select/Select";
import { formatCurrency } from "@/utils/currency-formatter";
import { FormSelect } from "../forms/FormSelect";

export interface CategoryReviewSectionProps {
  transactions: ParsedTransaction[];
  onCategoryChange: (rowNumber: number, categoryId: number) => void;
  categories?: Array<{ id: number; name: string }>;
  currency?: string;
}

export const CategoryReviewSection = React.memo(function CategoryReviewSection({
  transactions,
  onCategoryChange,
  categories = [],
  currency = "VND",
}: CategoryReviewSectionProps) {
  const [expanded, setExpanded] = useState(false);

  // Memoize category options to avoid recreating on every render
  const categoryOptions = useMemo<SelectOption<string>[]>(() => {
    return categories.map((cat) => ({
      value: String(cat.id),
      label: cat.name,
    }));
  }, [categories]);

  if (transactions.length === 0) {
    return null;
  }

  const handleAcceptAll = () => {
    transactions.forEach((tx) => {
      if (tx.suggestedCategoryId) {
        onCategoryChange(tx.rowNumber, tx.suggestedCategoryId);
      }
    });
  };

  const handleMarkAllUncategorized = () => {
    // Find the "Uncategorized" category ID from the categories list
    const uncategorizedCategory = categories.find(
      (cat) => cat.name === "Uncategorized",
    );
    const uncategorizedId = uncategorizedCategory?.id || 0;

    transactions.forEach((tx) => {
      onCategoryChange(tx.rowNumber, uncategorizedId);
    });
  };

  const getCategoryName = (categoryId?: number) => {
    if (categoryId === undefined || categoryId === null) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || `Category ${categoryId}`;
  };

  const getConfidenceBadgeClass = (confidence: number) => {
    if (confidence >= 80) {
      return "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300";
    } else if (confidence >= 60) {
      return "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300";
    } else {
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-dark-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-dark-surface-hover hover:bg-neutral-100 dark:hover:bg-dark-surface-active transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏷️</span>
          <div className="text-left">
            <h3 className="font-semibold text-base text-neutral-900 dark:text-dark-text">
              {transactions.length} Need Category Review
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Low confidence or no category suggestion
            </p>
          </div>
        </div>
        <ChevronDownIcon
          size="sm"
          className={cn(
            "transition-transform text-neutral-600 dark:text-neutral-400",
            expanded && "rotate-180",
          )}
          decorative
        />
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4 bg-white dark:bg-dark-surface">
          {/* Bulk Actions */}
          <div className="flex gap-2 pb-3 border-b border-neutral-200 dark:border-dark-border">
            <Button
              variant="primary"
              onClick={handleAcceptAll}
              size="sm"
              fullWidth
            >
              Accept All Suggestions
            </Button>
            <Button
              variant="secondary"
              onClick={handleMarkAllUncategorized}
              size="sm"
              fullWidth
            >
              Mark All Uncategorized
            </Button>
          </div>

          {/* Transaction List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.map((tx) => {
              return (
                <div
                  key={tx.rowNumber}
                  className="p-3 bg-neutral-50 dark:bg-dark-surface-hover border border-neutral-200 dark:border-dark-border rounded-lg"
                >
                  {/* Transaction Info */}
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-neutral-900 dark:text-dark-text truncate flex-1">
                        {tx.description}
                      </p>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-dark-text ml-2">
                        {formatCurrency(
                          tx.amount?.amount || 0,
                          tx.amount?.currency || currency,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-dark-text-tertiary">
                      <span>Row {tx.rowNumber}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>

                  {/* Suggested Category (if any) */}
                  {tx.suggestedCategoryId && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        Suggested:
                      </span>
                      <span className="text-xs font-medium text-neutral-900 dark:text-dark-text">
                        {getCategoryName(tx.suggestedCategoryId)}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-semibold rounded",
                          getConfidenceBadgeClass(tx.categoryConfidence),
                        )}
                      >
                        {tx.categoryConfidence}%
                      </span>
                    </div>
                  )}

                  {/* Category Selector */}
                  <FormSelect
                    options={categoryOptions}
                    value={String(tx.suggestedCategoryId || "")}
                    onChange={(value) => {
                      const categoryId = parseInt(value);
                      // Only update if we have a valid number (not NaN)
                      if (!isNaN(categoryId)) {
                        onCategoryChange(tx.rowNumber, categoryId);
                      }
                    }}
                    placeholder="Select category"
                    className="w-full"
                    portal
                  />
                </div>
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
