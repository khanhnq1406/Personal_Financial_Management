"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useQueryListTransactions,
  useQueryListCategories,
  useQueryListWallets,
  useQueryGetTotalBalance,
  useMutationDeleteTransaction,
} from "@/utils/generated/hooks";
import { SortField } from "@/gen/protobuf/v1/transaction";
import { BaseCard } from "@/components/BaseCard";
import { Select } from "@/components/select/Select";
import { TransactionTable } from "@/app/dashboard/transaction/TransactionTable";
import { TablePagination } from "@/components/table/TanStackTable";
import { MobileTable } from "@/components/table/MobileTable";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { resources } from "@/app/constants";
import { useDebounce } from "@/hooks";
import Image from "next/image";
import { BaseModal } from "@/components/modals/BaseModal";
import { EditTransactionForm } from "@/components/modals/forms/EditTransactionForm";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";

const displayImgList = [`${resources}/unhide.png`, `${resources}/hide.png`];

type ModalState =
  | { type: "edit-transaction"; transactionId: number }
  | { type: "delete-confirmation"; transactionId: number }
  | null;

export default function TransactionPage() {
  const { currency } = useCurrency();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHideBalance, setHideBalance] = useState(false);
  const [displayImg, setDisplayImg] = useState(displayImgList[0]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch data - use memoized filter to prevent re-renders on every keystroke
  const filter = useMemo(
    () => ({
      searchNote: debouncedSearchQuery || undefined,
      walletId: selectedWallet ? parseInt(selectedWallet) : undefined,
      categoryId: categoryFilter ? parseInt(categoryFilter) : undefined,
    }),
    [debouncedSearchQuery, selectedWallet, categoryFilter],
  );

  // Memoize pagination config
  const paginationConfig = useMemo(
    () => ({
      page: currentPage,
      pageSize: rowsPerPage,
      orderBy: sortField,
      order: sortOrder,
    }),
    [currentPage, rowsPerPage, sortField, sortOrder],
  );

  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = useQueryListTransactions(
    {
      pagination: paginationConfig,
      filter,
      sortField: SortField.DATE,
      sortOrder: sortOrder,
    },
    { refetchOnMount: "always" },
  );

  const { data: categoriesData, refetch: refetchListCategories } =
    useQueryListCategories({
      pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
    });

  const { data: walletsData, refetch: refetchListWallets } =
    useQueryListWallets({
      pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
    });

  const { data: totalBalanceData, refetch: refetchTotalBalance } =
    useQueryGetTotalBalance({});

  const deleteTransactionMutation = useMutationDeleteTransaction({
    onSuccess: () => {
      refetchListWallets();
      refetchListCategories();
      refetchTotalBalance();
      refetch();
      setModalState(null);
    },
  });

  // Get category name by ID - memoized with proper dependency
  const getCategoryName = useMemo(() => {
    const categoryMap = new Map<number, string>();
    categoriesData?.categories?.forEach((cat) => {
      categoryMap.set(cat.id, cat.name);
    });
    return (id: number) => categoryMap.get(id) || "Uncategorized";
  }, [categoriesData]);

  // Get wallet name by ID - memoized with proper dependency
  const getWalletName = useMemo(() => {
    const walletMap = new Map<number, string>();
    walletsData?.wallets?.forEach((wallet) => {
      walletMap.set(wallet.id, wallet.walletName);
    });
    return (id: number) => walletMap.get(id) || "Unknown Wallet";
  }, [walletsData]);

  // Format date - memoized
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Handle actions - memoized callbacks
  const handleEditTransaction = useCallback((transactionId: number) => {
    setModalState({ type: "edit-transaction", transactionId });
  }, []);

  const handleDeleteTransaction = useCallback((transactionId: number) => {
    setModalState({ type: "delete-confirmation", transactionId });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (modalState?.type === "delete-confirmation") {
      deleteTransactionMutation.mutate({
        transactionId: modalState.transactionId,
      });
    }
  }, [modalState, deleteTransactionMutation]);

  const handleCloseModal = useCallback(() => {
    setModalState(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    refetchListWallets();
    refetchListCategories();
    refetchTotalBalance();
    refetch();
    handleCloseModal();
  }, [refetch, handleCloseModal]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedWallet,
    debouncedSearchQuery,
    categoryFilter,
    sortField,
    sortOrder,
  ]);

  const totalBalance =
    totalBalanceData?.displayNetWorth?.amount ??
    totalBalanceData?.displayValue?.amount ??
    totalBalanceData?.data?.amount ??
    0;
  const formattedBalance = useMemo(() => {
    return formatCurrency(totalBalance, currency);
  }, [totalBalance, currency]);
  const transactions = transactionsData?.transactions || [];
  const totalCount =
    transactionsData?.pagination?.totalCount ?? transactions.length;

  const handleHideBalance = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      setHideBalance((prev) => !prev);
      setDisplayImg(displayImgList[Number(isHideBalance)]);
    },
    [isHideBalance],
  );

  // Prepare filter options - memoized
  const walletOptions = useMemo(
    () =>
      walletsData?.wallets?.map((w) => ({
        value: w.id.toString(),
        label: w.walletName,
      })) || [],
    [walletsData?.wallets],
  );

  const categoryOptions = useMemo(
    () =>
      categoriesData?.categories?.map((c) => ({
        value: c.id.toString(),
        label: c.name,
      })) || [],
    [categoriesData?.categories],
  );

  const sortOptions = useMemo(
    () => [
      { value: "date-desc", label: "Newest first" },
      { value: "date-asc", label: "Oldest first" },
    ],
    [],
  );

  // Memoize mobile table columns to avoid recreating on every render
  const mobileColumns = useMemo(
    () => [
      {
        id: "category",
        header: "Category",
        accessorFn: (row: (typeof transactions)[number]) =>
          getCategoryName(row.categoryId),
      },
      {
        id: "wallet",
        header: "Wallet",
        accessorFn: (row: (typeof transactions)[number]) =>
          getWalletName(row.walletId),
      },
      {
        id: "amount",
        header: "Amount",
        accessorFn: (row: (typeof transactions)[number]) => {
          const amountValue =
            row.displayAmount?.amount ?? row.amount?.amount ?? 0;
          const numericAmount =
            typeof amountValue === "number"
              ? amountValue
              : Number(amountValue) || 0;
          return formatCurrency(
            numericAmount,
            row.displayAmount ? currency : row.currency,
          );
        },
      },
      {
        id: "date",
        header: "Date & Time",
        accessorFn: (row: (typeof transactions)[number]) =>
          formatDate(row.date),
      },
      {
        id: "note",
        header: "Note",
        accessorFn: (row: (typeof transactions)[number]) => row.note || "-",
      },
    ],
    [getCategoryName, getWalletName, formatDate, currency],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Unified Responsive Header */}
      <div className="flex-shrink-0 bg-bg sm:bg-white border-b sm:border-b-gray-300">
        <div className="p-3 sm:p-4 md:px-6">
          {/* Title and Balance Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-0">
            <h1 className="text-white sm:text-gray-900 text-2xl sm:text-xl font-bold">
              Transactions
            </h1>

            {/* Balance and Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              {/* Balance Display */}
              <div className="flex flex-col items-start sm:items-center">
                <p className="text-white sm:text-gray-400 text-xs sm:text-sm font-bold">
                  {totalBalanceData ? "Total balance" : "Balance"}
                </p>
                <p className="text-white sm:text-gray-900 text-xl sm:text-lg font-bold">
                  {isHideBalance ? "*****" : formattedBalance}
                </p>
              </div>

              {/* Hide Balance Button */}
              <button
                className="w-10 h-10 sm:w-8 sm:h-8 flex-shrink-0"
                aria-label="Toggle balance visibility"
                onClick={handleHideBalance}
              >
                <Image
                  src={displayImg}
                  width={40}
                  height={40}
                  alt="Toggle balance"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>

            {/* Wallet Selector */}
            {walletsData &&
              walletsData.wallets &&
              walletsData.wallets.length > 0 && (
                <div className="w-40 sm:w-48">
                  <Select
                    value={selectedWallet || ""}
                    onChange={(val) => setSelectedWallet(val || null)}
                    options={walletOptions}
                    placeholder="All Wallets"
                    clearable={true}
                  />
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              name="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-fg rounded-lg px-4 py-2.5 pl-10 pr-10 text-sm drop-shadow-round focus:outline-none focus:border-bg placeholder:text-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Filter Dropdowns */}
          <div className="flex gap-3 justify-between">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              placeholder="All Categories"
              clearable={true}
            />

            <div className="relative sm:block">
              <Select
                value={`${sortField}-${sortOrder}`}
                onChange={(val) => {
                  const [field, order] = val.split("-");
                  setSortField(field);
                  setSortOrder(order as "asc" | "desc");
                }}
                options={sortOptions}
                placeholder="Sort transactions"
                clearable={false}
                disableInput
                disableFilter
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 min-h-0 px-3 sm:px-6 pb-6 ">
        {/* Desktop Table */}
        <BaseCard className="hidden sm:flex sm:flex-col h-full overflow-hidden">
          <TransactionTable
            transactions={transactions}
            getCategoryName={getCategoryName}
            getWalletName={getWalletName}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            isLoading={isLoading}
            className="overflow-auto flex-1 min-h-0"
          />

          {/* Pagination */}
          {!isLoading && transactions.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              pageSize={rowsPerPage}
              totalCount={totalCount}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setRowsPerPage(size);
                setCurrentPage(1);
              }}
              showPageNumbers={true}
            />
          )}
        </BaseCard>

        {/* Mobile Transaction List */}
        <div className="sm:hidden flex flex-col h-full">
          <div className="flex-1 overflow-auto p-1">
            <MobileTable
              data={transactions}
              columns={mobileColumns}
              getKey={(transaction) => transaction.id}
              renderActions={(transaction) => (
                <>
                  <button
                    onClick={() => handleEditTransaction(transaction.id)}
                    className="w-5 h-5 hover:opacity-70 transition-opacity"
                    aria-label="Edit transaction"
                  >
                    <Image
                      src={`${resources}/editing.png`}
                      width={20}
                      height={20}
                      alt="Edit transaction"
                      className="w-full h-full object-contain"
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="w-5 h-5 hover:opacity-70 transition-opacity"
                    aria-label="Delete transaction"
                  >
                    <Image
                      src={`${resources}/remove.png`}
                      width={20}
                      height={20}
                      alt="Delete transaction"
                      className="w-full h-full object-contain"
                    />
                  </button>
                </>
              )}
              emptyMessage="No transactions found"
              emptyDescription="Add your first transaction to get started"
              isLoading={isLoading}
              maxHeight="calc(100vh - 400px)"
              showScrollIndicator={transactions.length > 5}
            />
          </div>

          {/* Mobile Pagination */}
          {!isLoading && transactions.length > 0 && (
            <div className="flex-shrink-0 pt-3">
              <BaseCard>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-24 px-4 py-2 rounded-lg bg-bg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-center"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      Page {currentPage} of{" "}
                      {Math.ceil(totalCount / rowsPerPage)}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(Math.ceil(totalCount / rowsPerPage), p + 1),
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(totalCount / rowsPerPage)
                    }
                    className="w-24 px-4 py-2 rounded-lg bg-bg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed text-center"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </BaseCard>
            </div>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {modalState?.type === "edit-transaction" && (
        <BaseModal
          isOpen={modalState.type === "edit-transaction"}
          onClose={handleCloseModal}
          title="Edit Transaction"
        >
          <EditTransactionForm
            transactionId={modalState.transactionId}
            onSuccess={handleModalSuccess}
          />
        </BaseModal>
      )}

      {/* Delete Confirmation Modal */}
      {modalState?.type === "delete-confirmation" && (
        <ConfirmationDialog
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseModal}
          isLoading={deleteTransactionMutation.isPending}
          variant="danger"
        />
      )}
    </div>
  );
}
