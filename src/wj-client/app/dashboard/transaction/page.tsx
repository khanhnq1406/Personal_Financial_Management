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
import { SelectDropdown } from "@/components/select/SelectDropdown";
import { TransactionTable } from "@/app/dashboard/transaction/TransactionTable";
import { TablePagination } from "@/components/table/TanStackTable";
import { currencyFormatter } from "@/utils/currency-formatter";
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
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
      categoryId:
        categoryFilter && categoryFilter !== "all"
          ? parseInt(categoryFilter)
          : undefined,
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

  const totalBalance = totalBalanceData?.data?.amount || 0;
  const formattedBalance = useMemo(() => {
    return currencyFormatter.format(totalBalance);
  }, [totalBalance]);
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
    () => [
      { value: "", label: "All Wallets" },
      ...(walletsData?.wallets?.map((w) => ({
        value: w.id.toString(),
        label: w.walletName,
      })) || []),
    ],
    [walletsData?.wallets],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...(categoriesData?.categories?.map((c) => ({
        value: c.id.toString(),
        label: c.name,
      })) || []),
    ],
    [categoriesData?.categories],
  );

  const sortOptions = useMemo(
    () => [
      { value: "date-desc", label: "Newest first" },
      { value: "date-asc", label: "Oldest first" },
    ],
    [],
  );

  // Memoized transaction item for mobile view
  const MobileTransactionItem = useMemo(
    () =>
      function MobileTransactionItem({
        transaction,
      }: {
        transaction: (typeof transactions)[number];
      }) {
        return (
          <BaseCard>
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-bold mb-1">
                    Category
                  </p>
                  <p className="text-gray-900 text-sm font-light  text-right">
                    {getCategoryName(transaction.categoryId)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-bold mb-1">Wallet</p>
                  <p className="text-gray-900 text-sm font-light text-right">
                    {getWalletName(transaction.walletId)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-bold  mb-1">
                    Amount
                  </p>
                  <p className="text-gray-900 text-sm font-light  text-right">
                    {currencyFormatter.format(transaction.amount?.amount || 0)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-bold  mb-1">
                    Date & Time
                  </p>
                  <p className="text-gray-900 text-sm font-light  text-right">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-bold  mb-1">Note</p>
                  <p className="text-gray-900 text-sm font-light  text-right">
                    {transaction.note || "-"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex justify-between items-center">
                <p className="text-gray-900 text-sm font-bold ">Actions</p>
                <div className="flex gap-2">
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
                </div>
              </div>
            </div>
          </BaseCard>
        );
      },
    [
      getCategoryName,
      getWalletName,
      formatDate,
      handleEditTransaction,
      handleDeleteTransaction,
    ],
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
          <p className="text-lg font-medium text-gray-900">
            No transactions found
          </p>
          <p className="text-sm text-gray-400">
            Add your first transaction to get started
          </p>
        </div>
      </BaseCard>
    ),
    [],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <div className="sm:hidden bg-bg p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-3xl font-bold ">Transactions</h1>
          <div className="flex items-center gap-4">
            {/* Wallet Selector */}
            {walletsData &&
              walletsData.wallets &&
              walletsData.wallets.length > 0 && (
                <SelectDropdown
                  value={selectedWallet || ""}
                  onChange={(val) => setSelectedWallet(val || null)}
                  options={walletOptions}
                  aria-label="Select wallet"
                />
              )}
          </div>
        </div>

        {/* Balance Card */}
        <BaseCard>
          <div className="flex justify-between items-center p-4">
            <div>
              <p className="text-gray-400 text-sm font-bold mb-1">
                Total balance
              </p>
              <p className="text-gray-900 text-3xl font-bold ">
                {isHideBalance ? "*****" : formattedBalance}
              </p>
            </div>
            <button
              className="w-12 h-12"
              aria-label="Show balance"
              onClick={handleHideBalance}
            >
              <Image
                src={displayImg}
                width={48}
                height={48}
                alt="Show balance"
                className="w-full h-full object-contain"
              />
            </button>
          </div>
        </BaseCard>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between py-4 px-6 flex-shrink-0 border-b border-b-gray-300">
        <div>
          <h1 className="text-gray-900 text-xl font-bold ">Transactions</h1>
        </div>

        <div className="flex gap-2 items-center">
          <div className="mt-2 flex flex-col justify-center items-center">
            <p className="text-gray-400 text-sm font-bold">Balance</p>
            <p className="text-gray-900 text-xl font-bold ">
              {isHideBalance ? "*****" : formattedBalance}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Wallet Selector */}
          {walletsData &&
            walletsData.wallets &&
            walletsData.wallets.length > 0 && (
              <SelectDropdown
                value={selectedWallet || ""}
                onChange={(val) => setSelectedWallet(val || null)}
                options={walletOptions}
                aria-label="Select wallet"
              />
            )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
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
            <SelectDropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              aria-label="Filter by category"
            />

            <div className="relative sm:block">
              <SelectDropdown
                value={`${sortField}-${sortOrder}`}
                onChange={(val) => {
                  const [field, order] = val.split("-");
                  setSortField(field);
                  setSortOrder(order as "asc" | "desc");
                }}
                options={sortOptions}
                aria-label="Sort transactions"
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
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <MobileTransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </div>
            ) : !isLoading ? (
              emptyState
            ) : null}
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
