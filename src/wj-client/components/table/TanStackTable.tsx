"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { resources } from "@/app/constants";
import { cn } from "@/lib/utils/cn";

export interface TanStackTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  loadingRowCount?: number;
}

export interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageNumbers?: boolean;
}

/**
 * Pagination component for tables
 */
export const TablePagination = ({
  currentPage,
  pageSize,
  totalCount,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageNumbers = true,
}: TablePaginationProps) => {
  // Memoize calculated values to avoid recalculation on every render
  const { totalPages, startRecord, endRecord } = useMemo(() => {
    const calculatedTotalPages = Math.ceil(totalCount / pageSize);
    const calculatedStartRecord = (currentPage - 1) * pageSize + 1;
    const calculatedEndRecord = Math.min(currentPage * pageSize, totalCount);
    return {
      totalPages: calculatedTotalPages,
      startRecord: calculatedStartRecord,
      endRecord: calculatedEndRecord,
    };
  }, [currentPage, pageSize, totalCount]);

  // Memoize page size options to avoid recreating array
  const memoizedPageSizeOptions = useMemo(
    () => pageSizeOptions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageSizeOptions.join(",")]
  );

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPageSizeChange?.(parseInt(e.target.value));
    },
    [onPageSizeChange]
  );

  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-200">
      <p className="text-gray-900 text-base font-light">
        Showing {startRecord} to {endRecord} of {totalCount} results
      </p>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <>
            <span className="text-gray-900 text-base font-light">Rows</span>
            <div className="relative">
              <select
                value={pageSize.toString()}
                onChange={handlePageSizeChange}
                className="appearance-none bg-fg border-2 border-black/50 rounded px-3 py-1 pr-8 text-gray-900 text-sm font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-hgreen focus-visible:ring-offset-2 focus:border-bg"
              >
                {memoizedPageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Image
                src={`${resources}/down.png`}
                width={12}
                height={12}
                alt="Rows per page dropdown"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              />
            </div>
          </>
        )}

        {showPageNumbers && onPageChange && totalPages > 1 && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-gray-900 text-sm font-light">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Generic TanStack Table component with built-in sorting
 * @template T - The shape of the row data
 */
export function TanStackTable<T>({
  data,
  columns,
  className = "",
  emptyMessage = "No data found",
  emptyDescription = "Try adjusting your filters or search criteria",
  isLoading = false,
  loadingRowCount = 5,
}: TanStackTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  // Memoize loading skeleton to avoid recreating on every render
  const loadingSkeleton = useMemo(() => (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead className="sticky top-0 bg-white z-10 border-b-2 border-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left py-3 px-4 text-gray-900 text-base font-bold"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {Array.from({ length: loadingRowCount }).map((_, index) => (
            <tr key={`loading-${index}`} className="border-b border-gray-200">
              {columns.map((_, cellIndex) => (
                <td key={`loading-cell-${cellIndex}`} className="py-3 px-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [className, columns, loadingRowCount, table]);

  // Memoize empty state
  const emptyState = useMemo(() => (
    <div
      className={cn("flex flex-col items-center justify-center py-12", className)}
    >
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
  ), [className, emptyMessage, emptyDescription]);

  // Show loading state
  if (isLoading) {
    return loadingSkeleton;
  }

  if (data.length === 0) {
    return emptyState;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead className="sticky top-0 bg-white z-10 border-b-2 border-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b-2 border-gray-200">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left py-3 px-4 text-gray-900 text-base font-bold cursor-pointer hover:bg-gray-50 select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {header.column.getIsSorted() === "asc" ? (
                    <span className="ml-2">↑</span>
                  ) : header.column.getIsSorted() === "desc" ? (
                    <span className="ml-2">↓</span>
                  ) : null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={
                index < table.getRowModel().rows.length - 1
                  ? "border-b border-gray-200"
                  : ""
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="py-3 px-4 text-gray-900 text-base font-light"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
