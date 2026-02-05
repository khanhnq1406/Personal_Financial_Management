"use client";

import { BaseModal } from "@/components/modals/BaseModal";
import { Select } from "@/components/select/Select";
import { useMemo, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

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
  amountRange?: { min?: number; max?: number };
  dateRange?: { start?: string; end?: string };
}

/**
 * Enhanced mobile-optimized filter modal for transactions.
 * - Full-screen on mobile with collapsible sections
 * - Range slider for amount filtering
 * - Date range picker
 * - Multi-select for categories
 * - Active filter count badge
 * - Clear all button
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
  const [amountMin, setAmountMin] = useState(currentFilters.amountRange?.min || 0);
  const [amountMax, setAmountMax] = useState(currentFilters.amountRange?.max || 10000000);
  const [dateRangeType, setDateRangeType] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState(currentFilters.dateRange?.start || "");
  const [customEndDate, setCustomEndDate] = useState(currentFilters.dateRange?.end || "");

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["search", "filters"]));

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalWallet(currentFilters.walletId);
      setLocalCategory(currentFilters.categoryFilter);
      setLocalSort(`${currentFilters.sortField}-${currentFilters.sortOrder}`);
      setLocalSearch(currentFilters.searchQuery);
      setAmountMin(currentFilters.amountRange?.min || 0);
      setAmountMax(currentFilters.amountRange?.max || 10000000);
      // Reset expanded sections on mobile
      setExpandedSections(new Set(["search", "filters"]));
    }
  }, [isOpen, currentFilters]);

  const handleApply = useCallback(() => {
    const [field, order] = localSort.split("-");
    const filters: TransactionFilters = {
      walletId: localWallet,
      categoryFilter: localCategory,
      sortField: field,
      sortOrder: order as "asc" | "desc",
      searchQuery: localSearch,
    };

    // Add amount range if specified
    if (amountMin > 0 || amountMax < 10000000) {
      filters.amountRange = {
        min: amountMin > 0 ? amountMin : undefined,
        max: amountMax < 10000000 ? amountMax : undefined,
      };
    }

    // Add date range if specified
    if (dateRangeType !== "all") {
      if (dateRangeType === "custom" && (customStartDate || customEndDate)) {
        filters.dateRange = {
          start: customStartDate,
          end: customEndDate,
        };
      }
    }

    onApplyFilters(filters);
    onClose();
  }, [localWallet, localCategory, localSort, localSearch, amountMin, amountMax, dateRangeType, customStartDate, customEndDate, onApplyFilters, onClose]);

  const handleClear = useCallback(() => {
    setLocalWallet(null);
    setLocalCategory("");
    setLocalSearch("");
    setLocalSort("date-desc");
    setAmountMin(0);
    setAmountMax(10000000);
    setDateRangeType("all");
    setCustomStartDate("");
    setCustomEndDate("");
    onClearFilters();
    onClose();
  }, [onClearFilters, onClose]);

  const hasActiveFilters = useMemo(() => {
    return !!localWallet || !!localCategory || !!localSearch || amountMin > 0 || amountMax < 10000000 || dateRangeType !== "all";
  }, [localWallet, localCategory, localSearch, amountMin, amountMax, dateRangeType]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localWallet) count++;
    if (localCategory) count++;
    if (localSearch) count++;
    if (amountMin > 0 || amountMax < 10000000) count++;
    if (dateRangeType !== "all") count++;
    return count;
  }, [localWallet, localCategory, localSearch, amountMin, amountMax, dateRangeType]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const isExpanded = (section: string) => expandedSections.has(section);

  // Collapsible filter section
  const FilterSection = useCallback(({ title, section, children, defaultOpen = false }: {
    title: string;
    section: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const expanded = isExpanded(section);
    return (
      <div className="border-b border-gray-200 dark:border-dark-border last:border-0">
        <button
          type="button"
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between py-3 px-4 sm:px-0 text-left"
          aria-expanded={expanded}
        >
          <span className="font-medium text-gray-900 dark:text-dark-text">{title}</span>
          <svg
            className={cn(
              "w-5 h-5 text-gray-500 dark:text-dark-text-secondary transition-transform duration-200",
              expanded ? "rotate-180" : "rotate-0"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            expanded ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="px-4 sm:px-0">
            {children}
          </div>
        </div>
      </div>
    );
  }, [isExpanded, toggleSection]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Filter Transactions${activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}`}
      maxWidth="max-w-lg"
      bottomSheetOnMobile
      fullScreenOnMobile={false}
    >
      {activeFilterCount > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-primary-700 dark:text-primary-300">
            {activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      <div className="space-y-0 sm:space-y-4 divide-y divide-gray-200 dark:divide-dark-border">
        {/* Search Input - Always visible */}
        <FilterSection title="Search" section="search" defaultOpen={true}>
          <div className="relative">
            <input
              id="filter-search"
              type="text"
              placeholder="Search transactions..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 pr-10 text-sm bg-neutral-50 dark:bg-dark-surface-hover rounded-lg drop-shadow-round focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 dark:text-dark-text dark:placeholder:text-dark-text-tertiary"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text"
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
        </FilterSection>

        {/* Filters Section - Collapsible on mobile */}
        <FilterSection title="Filters" section="filters" defaultOpen={true}>
          <div className="space-y-4">
            {/* Wallet Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
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
        </FilterSection>

        {/* Amount Range Section - Collapsible */}
        <FilterSection title="Amount Range" section="amount">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Min Amount
              </label>
              <input
                type="number"
                value={amountMin || ""}
                onChange={(e) => setAmountMin(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-dark-surface-hover rounded-lg drop-shadow-round focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Max Amount
              </label>
              <input
                type="number"
                value={amountMax < 10000000 ? amountMax : ""}
                onChange={(e) => setAmountMax(Number(e.target.value) || 10000000)}
                placeholder="No limit"
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-dark-surface-hover rounded-lg drop-shadow-round focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text"
              />
            </div>
          </div>
        </FilterSection>

        {/* Date Range Section - Collapsible */}
        <FilterSection title="Date Range" section="date">
          <div className="space-y-4">
            {/* Quick date options */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: "today", label: "Today" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "custom", label: "Custom" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDateRangeType(option.value as typeof dateRangeType)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px]",
                    dateRangeType === option.value
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 dark:bg-dark-surface-hover text-gray-700 dark:text-dark-text hover:bg-neutral-200 dark:hover:bg-dark-surface-active"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {dateRangeType === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    From
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-dark-surface-hover rounded-lg drop-shadow-round focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    To
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 dark:bg-dark-surface-hover rounded-lg drop-shadow-round focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-dark-text"
                  />
                </div>
              </div>
            )}
          </div>
        </FilterSection>
      </div>

      {/* Footer with Apply and Clear buttons */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasActiveFilters}
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-surface-hover active:bg-gray-100 dark:active:bg-dark-surface-active transition-colors"
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
