"use client";

import React, { useMemo, memo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { cn } from "@/lib/utils/cn";

// Define a simplified column type for mobile table
export interface MobileColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorFn?: (row: T, index: number) => any;
  accessorKey?: keyof T | string;
  cell?: (props: { getValue: () => any; row: T }) => React.ReactNode;
}

export interface MobileTableProps<T> {
  data: T[];
  columns: MobileColumnDef<T>[];
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  loadingRowCount?: number;
  /**
   * Optional key extractor for items. If not provided, uses index
   */
  getKey?: (item: T, index: number) => string | number;
  /**
   * Optional custom renderer for field values. Useful for formatting dates, currency, etc.
   */
  renderFieldValue?: (columnId: string, value: any, row: T) => React.ReactNode;
  /**
   * Optional custom actions renderer for each row
   */
  renderActions?: (row: T) => React.ReactNode;
  /**
   * Optional max height for the scrollable container. Enables vertical scrolling when content exceeds this height.
   * Example: "400px", "50vh", "calc(100vh - 200px)"
   */
  maxHeight?: string;
  /**
   * Whether to show a scroll indicator when content is scrollable
   */
  showScrollIndicator?: boolean;
  /**
   * Position of action buttons. 'inline' shows actions in each card, 'sticky' shows a sticky footer with actions.
   * Sticky is better for scrollable tables with many rows.
   */
  actionsPosition?: "inline" | "sticky";
  /**
   * Label for sticky action button (only used when actionsPosition is 'sticky')
   */
  stickyActionLabel?: string;
  /**
   * Callback when sticky action button is clicked (only used when actionsPosition is 'sticky')
   * Returns the row that was clicked
   */
  onStickyActionClick?: (row: T) => void;
}

/**
 * Mobile Table Component
 *
 * A reusable component that displays tabular data as cards on mobile devices.
 * Follows a column-based API similar to TanStack Table for consistency.
 *
 * @template T - The shape of the row data
 *
 * @example
 * ```tsx
 * const columns: MobileColumnDef<Transaction>[] = [
 *   {
 *     id: 'category',
 *     header: 'Category',
 *     accessorFn: (row) => getCategoryName(row.categoryId),
 *   },
 *   {
 *     id: 'amount',
 *     header: 'Amount',
 *     accessorFn: (row) => row.amount,
 *   },
 * ];
 *
 * <MobileTable
 *   data={transactions}
 *   columns={columns}
 *   renderActions={(row) => (
 *     <button onClick={() => handleEdit(row.id)}>Edit</button>
 *   )}
 * />
 * ```
 */
export const MobileTable = memo(function MobileTable<T>({
  data,
  columns,
  className = "",
  emptyMessage = "No data found",
  emptyDescription = "Try adjusting your filters or search criteria",
  isLoading = false,
  loadingRowCount = 3,
  getKey,
  renderFieldValue,
  renderActions,
  maxHeight,
  showScrollIndicator = false,
  actionsPosition = "inline",
  stickyActionLabel = "View Details",
  onStickyActionClick,
}: MobileTableProps<T>) {
  // Memoize loading skeleton to avoid recreating on every render
  const loadingSkeleton = useMemo(
    () => (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: loadingRowCount }).map((_, index) => (
          <BaseCard key={`loading-${index}`}>
            <div className="p-3 space-y-2">
              {columns.map((_, cellIndex) => (
                <React.Fragment key={`loading-cell-${cellIndex}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                    </div>
                  </div>
                  {cellIndex < columns.length - 1 && (
                    <div className="border-t border-gray-200" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </BaseCard>
        ))}
      </div>
    ),
    [className, columns, loadingRowCount],
  );

  // Memoize empty state
  const emptyState = useMemo(
    () => (
      <BaseCard>
        <div className="flex flex-col items-center justify-center py-12">
          <svg
            className="w-16 h-16 mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900">{emptyMessage}</p>
          <p className="text-sm text-gray-400">{emptyDescription}</p>
        </div>
      </BaseCard>
    ),
    [emptyMessage, emptyDescription],
  );

  // Show loading state
  if (isLoading) {
    return loadingSkeleton;
  }

  if (data.length === 0) {
    return emptyState;
  }

  // Render the list of cards
  const cardsList = (
    <div className={cn("space-y-3", className)}>
      {data.map((row, rowIndex) => {
        const key = getKey ? getKey(row, rowIndex) : rowIndex;

        return (
          <BaseCard key={key}>
            <div className="p-3 space-y-2">
              {columns.map((column, cellIndex) => {
                // Get column header
                const headerText =
                  typeof column.header === "string" ? column.header : column.id;

                // Get cell value using accessorFn or accessorKey
                let cellValue: any;
                if (column.accessorFn) {
                  cellValue = column.accessorFn(row, rowIndex);
                } else if (column.accessorKey) {
                  cellValue = (row as any)[column.accessorKey];
                }

                // Use custom renderer if provided, otherwise use cell renderer
                const displayValue = renderFieldValue
                  ? renderFieldValue(column.id, cellValue, row)
                  : column.cell
                    ? column.cell({ getValue: () => cellValue, row })
                    : cellValue;

                return (
                  <React.Fragment key={column.id || cellIndex}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-900 text-sm font-bold mb-1">
                          {headerText}
                        </p>
                        <p className="text-gray-900 text-sm font-light text-right">
                          {displayValue ?? "-"}
                        </p>
                      </div>
                    </div>
                    {cellIndex < columns.length - 1 && (
                      <div className="border-t border-gray-200" />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Inline Actions section */}
              {renderActions && actionsPosition === "inline" && (
                <>
                  <div className="border-t border-gray-200" />
                  <div className="flex justify-between items-center">
                    <p className="text-gray-900 text-sm font-bold">Actions</p>
                    <div className="flex gap-2">{renderActions(row)}</div>
                  </div>
                </>
              )}
            </div>
          </BaseCard>
        );
      })}
    </div>
  );

  // If maxHeight is specified, wrap in scrollable container
  if (maxHeight) {
    return (
      <div className={cn("relative", className)}>
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {cardsList}
        </div>

        {/* Sticky Action Button (for single-action use cases like "View Details") */}
        {actionsPosition === "sticky" && onStickyActionClick && (
          <div className="sticky bottom-0 left-0 right-0 mt-3 z-10">
            <button
              onClick={() => {
                // For single row selection, use the first item
                // For multi-row, you might want a row selector first
                if (data.length > 0) {
                  onStickyActionClick(data[0]);
                }
              }}
              className="w-full bg-bg text-white py-3 px-4 rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity"
            >
              {stickyActionLabel}
            </button>
          </div>
        )}

        {/* Scroll indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
    );
  }

  return <div className={cn(className)}>{cardsList}</div>;
}) as <T>(props: MobileTableProps<T>) => React.ReactElement;
