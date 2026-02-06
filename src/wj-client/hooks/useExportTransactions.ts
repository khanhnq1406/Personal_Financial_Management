// src/wj-client/hooks/useExportTransactions.ts
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExportOptions } from "@/components/export/ExportDialog";
import { Transaction } from "@/gen/protobuf/v1/transaction";
import {
  getDateRangeTimestamps,
  generateTransactionCSV,
  generateExportFilename,
  downloadCSV,
  type TransactionExportData,
} from "@/utils/export";

interface UseExportTransactionsOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function useExportTransactions(options?: UseExportTransactionsOptions) {
  const queryClient = useQueryClient();

  return useCallback(
    async (exportOptions: ExportOptions) => {
      try {
        // Build filter for API call
        const { startDate, endDate } = getDateRangeTimestamps(exportOptions.dateRange);

        // Use custom dates if provided
        const apiStartDate =
          exportOptions.customStartDate !== undefined
            ? Math.floor(exportOptions.customStartDate.getTime() / 1000)
            : startDate;
        const apiEndDate =
          exportOptions.customEndDate !== undefined
            ? Math.floor(exportOptions.customEndDate.getTime() / 1000)
            : endDate;

        // Build filter object for API
        // Note: For category filtering, we'll fetch all and filter client-side
        // since the API filter only supports single categoryId
        const filter = {
          startDate: apiStartDate,
          endDate: apiEndDate,
        };

        // Fetch all transactions matching date range
        // Use a large page size to get all data
        const { data: transactionsData } = await queryClient.fetchQuery({
          queryKey: ["ListTransactions", "export", filter],
          queryFn: () =>
            fetch("/api/v1/transactions?" + new URLSearchParams({
              pagination: JSON.stringify({ page: 1, pageSize: 10000, orderBy: "date", order: "desc" }),
              filter: JSON.stringify(filter),
              sortField: "1", // DATE
              sortOrder: "desc",
            })).then(res => res.json()),
        });

        const transactions: Transaction[] = transactionsData?.transactions || [];

        if (transactions.length === 0) {
          throw new Error("No transactions to export with the selected filters");
        }

        // Apply category filter client-side if specified
        let filteredTransactions = transactions;
        if (exportOptions.includeCategories.length > 0) {
          const categoryIds = new Set(
            exportOptions.includeCategories.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id)),
          );
          filteredTransactions = transactions.filter((t) => categoryIds.has(t.categoryId));
        }

        if (filteredTransactions.length === 0) {
          throw new Error("No transactions match the selected filters");
        }

        // Get categories and wallets for name mapping
        const [categoriesData, walletsData] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: ["ListCategories"],
            queryFn: () => fetch("/api/v1/categories?pagination=" + JSON.stringify({ page: 1, pageSize: 100, orderBy: "id", order: "asc" }))
              .then(res => res.json()),
          }),
          queryClient.fetchQuery({
            queryKey: ["ListWallets"],
            queryFn: () => fetch("/api/v1/wallets?pagination=" + JSON.stringify({ page: 1, pageSize: 100, orderBy: "id", order: "asc" }))
              .then(res => res.json()),
          }),
        ]);

        // Create lookup maps
        const categoryNames = new Map<number, string>();
        categoriesData?.categories?.forEach((cat: any) => {
          categoryNames.set(cat.id, cat.name);
        });

        const walletNames = new Map<number, string>();
        walletsData?.wallets?.forEach((wallet: any) => {
          walletNames.set(wallet.id, wallet.walletName);
        });

        // Get currency from first transaction or default
        const currency = filteredTransactions[0]?.displayCurrency || "VND";

        // Generate CSV
        const exportData: TransactionExportData = {
          transactions: filteredTransactions,
          categoryNames,
          walletNames,
          currency,
        };

        const csvContent = generateTransactionCSV(exportData);
        const fileName = generateExportFilename(
          "transactions",
          exportOptions.dateRange,
          exportOptions.customStartDate,
          exportOptions.customEndDate,
          exportOptions.fileName,
        );

        // Download file
        downloadCSV(csvContent, fileName);

        options?.onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Export failed");
        options?.onError?.(err);
        throw error;
      }
    },
    [queryClient, options],
  );
}
