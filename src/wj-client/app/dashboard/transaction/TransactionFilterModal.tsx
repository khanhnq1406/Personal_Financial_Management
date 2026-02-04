"use client";

import { BaseModal } from "@/components/modals/BaseModal";
import { Select } from "@/components/select/Select";
import { useMemo, useCallback, useState, useEffect } from "react";

export interface TransactionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TransactionFilters) => void;
  currentFilters: TransactionFilters;
  walletOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
  onClearFilters: () => void;
}

export interface TransactionFilters {
  walletId: string | null;
  categoryFilter: string;
  sortField: string;
  sortOrder: "asc" | "desc";
  searchQuery: string;
}

/**
 * Mobile-optimized filter modal for transactions.
 * Shows as a bottom sheet on mobile with all filter options.
 */
export function TransactionFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  walletOptions,
  categoryOptions,
  sortOptions,
  onClearFilters,
}: TransactionFilterModalProps) {
  // Local state for filters before applying
  const [localWallet, setLocalWallet] = useState<string | null>(
    currentFilters.walletId,
  );
  const [localCategory, setLocalCategory] = useState(currentFilters.categoryFilter);
  const [localSort, setLocalSort] = useState(
    `${currentFilters.sortField}-${currentFilters.sortOrder}`,
  );
  const [localSearch, setLocalSearch] = useState(currentFilters.searchQuery);

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalWallet(currentFilters.walletId);
      setLocalCategory(currentFilters.categoryFilter);
      setLocalSort(`${currentFilters.sortField}-${currentFilters.sortOrder}`);
      setLocalSearch(currentFilters.searchQuery);
    }
  }, [isOpen, currentFilters]);

  const handleApply = useCallback(() => {
    const [field, order] = localSort.split("-");
    onApplyFilters({
      walletId: localWallet,
      categoryFilter: localCategory,
      sortField: field,
      sortOrder: order as "asc" | "desc",
      searchQuery: localSearch,
    });
    onClose();
  }, [localWallet, localCategory, localSort, localSearch, onApplyFilters, onClose]);

  const handleClear = useCallback(() => {
    setLocalWallet(null);
    setLocalCategory("");
    setLocalSearch("");
    setLocalSort("date-desc");
    onClearFilters();
    onClose();
  }, [onClearFilters, onClose]);

  const hasActiveFilters = useMemo(() => {
    return !!localWallet || !!localCategory || !!localSearch;
  }, [localWallet, localCategory, localSearch]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Transactions"
      maxWidth="max-w-lg"
      bottomSheetOnMobile
      fullScreenOnMobile={false}
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Search Input */}
        <div>
          <label
            htmlFor="filter-search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Search
          </label>
          <div className="relative">
            <input
              id="filter-search"
              type="text"
              placeholder="Search transactions..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 pr-10 text-sm bg-neutral-50 rounded-lg drop-shadow-round focus:outline-none focus:border-primary-600 placeholder:text-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {localSearch && (
              <button
                onClick={() => setLocalSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Wallet Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet
          </label>
          <Select
            value={localWallet || ""}
            onChange={(val) => setLocalWallet(val || null)}
            options={walletOptions}
            placeholder="All Wallets"
            clearable={true}
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <Select
            value={localCategory}
            onChange={setLocalCategory}
            options={categoryOptions}
            placeholder="All Categories"
            clearable={true}
          />
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <Select
            value={localSort}
            onChange={setLocalSort}
            options={sortOptions}
            placeholder="Sort transactions"
            clearable={false}
            disableInput
            disableFilter
          />
        </div>
      </div>

      {/* Footer with Apply and Clear buttons */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasActiveFilters}
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Clear All
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Apply Filters
        </button>
      </div>
    </BaseModal>
  );
}
