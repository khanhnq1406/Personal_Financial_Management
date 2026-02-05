"use client";

import { BaseModal } from "@/components/modals/BaseModal";
import { Select } from "@/components/select/Select";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { FormInput } from "@/components/forms/FormInput";
import { FormDatePicker } from "@/components/forms/FormDatePicker";
import { Button } from "@/components/Button";

// Collapsible filter section component (defined outside to avoid re-renders)
interface FilterSectionProps {
  title: string;
  section: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: (section: string) => void;
}

function FilterSection({
  title,
  section,
  children,
  expanded,
  onToggle,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-200 dark:border-dark-border last:border-0">
      <button
        type="button"
        onClick={() => onToggle(section)}
        className="w-full flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 text-left hover:bg-neutral-50 dark:hover:bg-dark-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-medium text-gray-900 dark:text-dark-text">
          {title}
        </span>
        <svg
          className={cn(
            "w-5 h-5 text-gray-500 dark:text-dark-text-secondary transition-transform duration-200 flex-shrink-0",
            expanded ? "rotate-180" : "rotate-0",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-96 pb-3 sm:pb-4" : "max-h-0",
        )}
      >
        <div className="px-3 sm:px-4">{children}</div>
      </div>
    </div>
  );
}

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
  const [localCategory, setLocalCategory] = useState(
    currentFilters.categoryFilter,
  );
  const [localSort, setLocalSort] = useState(
    `${currentFilters.sortField}-${currentFilters.sortOrder}`,
  );
  const [localSearch, setLocalSearch] = useState(currentFilters.searchQuery);
  // Ref to track the debounced search value without causing re-renders
  const debouncedSearchRef = useRef(localSearch);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Track render count
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  console.log(
    `[TransactionFilterModal] Render #${renderCountRef.current}, localSearch: "${localSearch}"`,
  );

  // Custom debounce implementation that doesn't cause re-renders
  useEffect(() => {
    console.log(
      `[TransactionFilterModal] useEffect triggered, localSearch: "${localSearch}"`,
    );
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to update debounced value
    typingTimeoutRef.current = setTimeout(() => {
      debouncedSearchRef.current = localSearch;
    }, 300);

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [localSearch]);

  const [amountMin, setAmountMin] = useState(
    currentFilters.amountRange?.min || 0,
  );
  const [amountMax, setAmountMax] = useState(
    currentFilters.amountRange?.max || 10000000,
  );
  const [dateRangeType, setDateRangeType] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  // Parse date strings to Date objects for FormDatePicker
  const parseDate = (dateStr: string | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    parseDate(currentFilters.dateRange?.start),
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    parseDate(currentFilters.dateRange?.end),
  );

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["search", "filters"]),
  );

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalWallet(currentFilters.walletId);
      setLocalCategory(currentFilters.categoryFilter);
      setLocalSort(`${currentFilters.sortField}-${currentFilters.sortOrder}`);
      setLocalSearch(currentFilters.searchQuery);
      setAmountMin(currentFilters.amountRange?.min || 0);
      setAmountMax(currentFilters.amountRange?.max || 10000000);
      setCustomStartDate(parseDate(currentFilters.dateRange?.start));
      setCustomEndDate(parseDate(currentFilters.dateRange?.end));
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
      searchQuery: debouncedSearchRef.current,
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
        // Convert Date objects to ISO strings for the API
        const formatDate = (date: Date | undefined): string | undefined => {
          if (!date) return undefined;
          return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        };
        filters.dateRange = {
          start: formatDate(customStartDate),
          end: formatDate(customEndDate),
        };
      }
    }

    onApplyFilters(filters);
    onClose();
  }, [
    localWallet,
    localCategory,
    localSort,
    amountMin,
    amountMax,
    dateRangeType,
    customStartDate,
    customEndDate,
    onApplyFilters,
    onClose,
  ]);

  const handleClear = useCallback(() => {
    setLocalWallet(null);
    setLocalCategory("");
    setLocalSearch("");
    setLocalSort("date-desc");
    setAmountMin(0);
    setAmountMax(10000000);
    setDateRangeType("all");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    onClearFilters();
    onClose();
  }, [onClearFilters, onClose]);

  const hasActiveFilters = useMemo(() => {
    return (
      !!localWallet ||
      !!localCategory ||
      !!localSearch ||
      amountMin > 0 ||
      amountMax < 10000000 ||
      dateRangeType !== "all"
    );
  }, [
    localWallet,
    localCategory,
    localSearch,
    amountMin,
    amountMax,
    dateRangeType,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localWallet) count++;
    if (localCategory) count++;
    if (localSearch) count++;
    if (amountMin > 0 || amountMax < 10000000) count++;
    if (dateRangeType !== "all") count++;
    return count;
  }, [
    localWallet,
    localCategory,
    localSearch,
    amountMin,
    amountMax,
    dateRangeType,
  ]);

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
        <div className="mb-3 sm:mb-4 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <svg
            className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-primary-700 dark:text-primary-300">
            {activeFilterCount} active filter
            {activeFilterCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      <div className="space-y-0 sm:space-y-4 divide-y divide-gray-200 dark:divide-dark-border max-h-full ">
        {/* Search Input - Always visible */}
        <FilterSection
          title="Search"
          section="search"
          expanded={isExpanded("search")}
          onToggle={toggleSection}
        >
          <div className="mt-1">
            <FormInput
              id="filter-search"
              type="text"
              placeholder="Search transactions..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              size="sm"
              leftIcon={
                <svg
                  className="w-5 h-5"
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
              }
              rightIcon={
                localSearch ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : undefined
              }
              onRightIconClick={
                localSearch ? () => setLocalSearch("") : undefined
              }
            />
          </div>
        </FilterSection>

        {/* Filters Section - Collapsible on mobile */}
        <FilterSection
          title="Filters"
          section="filters"
          expanded={isExpanded("filters")}
          onToggle={toggleSection}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Wallet Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5 sm:mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5 sm:mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5 sm:mb-2">
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
        <FilterSection
          title="Amount Range"
          section="amount"
          expanded={isExpanded("amount")}
          onToggle={toggleSection}
        >
          <div className="space-y-3 sm:space-y-4">
            <FormInput
              id="amount-min"
              label="Min Amount"
              type="number"
              inputMode="decimal"
              value={amountMin || ""}
              onChange={(e) => setAmountMin(Number(e.target.value) || 0)}
              placeholder="0"
              size="sm"
            />
            <FormInput
              id="amount-max"
              label="Max Amount"
              type="number"
              inputMode="decimal"
              value={amountMax < 10000000 ? amountMax : ""}
              onChange={(e) => setAmountMax(Number(e.target.value) || 10000000)}
              placeholder="No limit"
              size="sm"
            />
          </div>
        </FilterSection>

        {/* Date Range Section - Collapsible */}
        <FilterSection
          title="Date Range"
          section="date"
          expanded={isExpanded("date")}
          onToggle={toggleSection}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Quick date options - 2x2 grid on mobile, 4 columns on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "today", label: "Today" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "custom", label: "Custom" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setDateRangeType(option.value as typeof dateRangeType)
                  }
                  variant={dateRangeType === option.value ? "primary" : "ghost"}
                  size="sm"
                  fullWidth={false}
                  className={cn(
                    "min-h-[44px]",
                    dateRangeType === option.value
                      ? undefined
                      : "bg-neutral-100 dark:bg-dark-surface-hover text-gray-700 dark:text-dark-text hover:bg-neutral-200 dark:hover:bg-dark-surface-active",
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Custom date range - stacked on mobile, side-by-side on desktop */}
            {dateRangeType === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3">
                <FormDatePicker
                  id="date-start"
                  label="From"
                  value={customStartDate}
                  onChange={(date) => setCustomStartDate(date || undefined)}
                  placeholder="Select start date"
                  size="sm"
                />
                <FormDatePicker
                  id="date-end"
                  label="To"
                  value={customEndDate}
                  onChange={(date) => setCustomEndDate(date || undefined)}
                  placeholder="Select end date"
                  size="sm"
                  minDate={customStartDate}
                />
              </div>
            )}
          </div>
        </FilterSection>
      </div>

      {/* Footer with Apply and Clear buttons */}
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          onClick={handleClear}
          disabled={!hasActiveFilters}
          variant="secondary"
          fullWidth={false}
          className="flex-1"
        >
          Clear All
        </Button>
        <Button
          type="button"
          onClick={handleApply}
          variant="primary"
          fullWidth={false}
          className="flex-1"
        >
          Apply Filters
        </Button>
      </div>
    </BaseModal>
  );
}
