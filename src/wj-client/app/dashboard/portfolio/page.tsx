"use client";

/**
 * Optimized Portfolio Page
 *
 * Implements Vercel React Best Practices:
 * - bundle-dynamic-imports: Heavy modal loaded dynamically
 * - bundle-preload: Modal preloaded on row hover for perceived speed
 * - rerender-memo: Components memoized to prevent unnecessary re-renders
 * - rerender-functional-setState: Use functional setState for stable callbacks
 * - rendering-hoist-jsx: Static JSX extracted outside component
 */

import React, {
  useState,
  useMemo,
  useCallback,
  startTransition,
  memo,
} from "react";
import { BaseCard } from "@/components/BaseCard";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  useQueryListWallets,
  useQueryGetPortfolioSummary,
  useQueryListInvestments,
  useMutationUpdatePrices,
  EVENT_InvestmentListInvestments,
  EVENT_InvestmentGetPortfolioSummary,
} from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import {
  formatPercent,
  formatQuantity,
  getInvestmentTypeLabel,
  formatTimeAgo,
  formatPrice,
} from "./helpers";
import { formatCurrency } from "@/utils/currency-formatter";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  CreateWalletForm,
  AddInvestmentForm,
  InvestmentDetailModal,
  preloadInvestmentDetailModal,
  TanStackTable,
} from "@/components/lazy/OptimizedComponents";
import { BaseModal } from "@/components/modals/BaseModal";
import { MobileTable } from "@/components/table/MobileTable";
import type { ColumnDef } from "@tanstack/react-table";

const ModalType = {
  CREATE_WALLET: "CREATE_WALLET",
  ADD_INVESTMENT: "ADD_INVESTMENT",
  INVESTMENT_DETAIL: "INVESTMENT_DETAIL",
} as const;

// Hoist static empty state outside component (rendering-hoist-jsx)
const EmptyInvestmentWalletsState = memo(
  ({ onOpenModal }: { onOpenModal: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700">
          No Investment Wallets
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Create an investment wallet to start tracking your portfolio
        </p>
      </div>
      <Button
        type={ButtonType.PRIMARY}
        onClick={onOpenModal}
        className="w-fit px-4"
      >
        Create Investment Wallet
      </Button>
    </div>
  ),
);
EmptyInvestmentWalletsState.displayName = "EmptyInvestmentWalletsState";

// Memoized portfolio summary cards to prevent re-renders
const PortfolioSummaryCards = memo(
  ({ portfolioSummary, currency }: { portfolioSummary: any; currency: string }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <BaseCard className="p-4">
        <div className="text-sm text-gray-600">Total Value</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">
          {formatCurrency(portfolioSummary.totalValue || 0, currency)}
        </div>
      </BaseCard>

      <BaseCard className="p-4">
        <div className="text-sm text-gray-600">Total Cost</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">
          {formatCurrency(portfolioSummary.totalCost || 0, currency)}
        </div>
      </BaseCard>

      <BaseCard className="p-4">
        <div className="text-sm text-gray-600">Total PNL</div>
        <div
          className={`text-2xl font-bold mt-1 ${
            (portfolioSummary.totalPnl || 0) >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {formatCurrency(portfolioSummary.totalPnl || 0, currency)}
        </div>
      </BaseCard>

      <BaseCard className="p-4">
        <div className="text-sm text-gray-600">Holdings</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">
          {portfolioSummary.totalInvestments || 0}
        </div>
      </BaseCard>
    </div>
  ),
);
PortfolioSummaryCards.displayName = "PortfolioSummaryCards";

// Investment data type for TanStackTable
type InvestmentData = {
  id: number;
  symbol: string;
  name: string;
  type: number;
  quantity: number;
  averageCost?: number;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  updatedAt?: number;
};

// Column definitions for TanStackTable (memoized to prevent recreation)
const useInvestmentColumns = (
  onRowClick: (investmentId: number) => void,
  currency: string,
): ColumnDef<InvestmentData>[] => {
  return useMemo(
    () => [
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: (info) => (
          <span className="font-medium">{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => getInvestmentTypeLabel(info.getValue<number>() as any),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: (info) => {
          const row = info.row.original;
          return formatQuantity(row.quantity, row.type as any);
        },
      },
      {
        accessorKey: "averageCost",
        header: "Avg Cost",
        cell: (info) => {
          const row = info.row.original;
          return formatPrice(
            (info.getValue() as number | undefined) || 0,
            row.type as any,
            currency,
          );
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Current Price",
        cell: (info) => {
          const row = info.row.original;
          return formatPrice(
            (info.getValue() as number | undefined) || 0,
            row.type as any,
            currency,
          );
        },
      },
      {
        accessorKey: "currentValue",
        header: "Current Value",
        cell: (info) => (
          <span className="font-medium">
            {formatCurrency((info.getValue() as number | undefined) || 0, currency)}
          </span>
        ),
      },
      {
        accessorKey: "unrealizedPnl",
        header: "PNL",
        cell: (info) => (
          <span
            className={`font-medium ${
              ((info.getValue() as number | undefined) || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency((info.getValue() as number | undefined) || 0, currency)}
          </span>
        ),
      },
      {
        accessorKey: "unrealizedPnlPercent",
        header: "PNL %",
        cell: (info) => (
          <span
            className={`font-medium ${
              ((info.getValue() as number | undefined) || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatPercent((info.getValue() as number | undefined) || 0)}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: (info) => {
          const timestamp = info.getValue<number>();
          const { text, colorClass } = formatTimeAgo(timestamp || 0);
          return <span className={`text-xs ${colorClass}`}>{text}</span>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: (info) => {
          const investmentId = info.row.original.id;
          return (
            <button
              onClick={() => onRowClick(investmentId)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
              aria-label="View investment details"
            >
              View Details
            </button>
          );
        },
      },
    ],
    [onRowClick, currency],
  );
};

// Mobile columns for MobileTable
const useMobileInvestmentColumns = (
  onRowClick: (investmentId: number) => void,
  currency: string,
) => {
  return useMemo(
    () => [
      {
        id: "symbol",
        header: "Symbol",
        accessorFn: (row: InvestmentData) => row.symbol,
      },
      {
        id: "name",
        header: "Name",
        accessorFn: (row: InvestmentData) => row.name,
      },
      {
        id: "type",
        header: "Type",
        accessorFn: (row: InvestmentData) =>
          getInvestmentTypeLabel(row.type as any),
      },
      {
        id: "quantity",
        header: "Quantity",
        accessorFn: (row: InvestmentData) =>
          formatQuantity(row.quantity, row.type as any),
      },
      {
        id: "averageCost",
        header: "Avg Cost",
        accessorFn: (row: InvestmentData) =>
          formatPrice(row.averageCost || 0, row.type as any, currency),
      },
      {
        id: "currentPrice",
        header: "Current Price",
        accessorFn: (row: InvestmentData) =>
          formatPrice(row.currentPrice || 0, row.type as any, currency),
      },
      {
        id: "currentValue",
        header: "Current Value",
        accessorFn: (row: InvestmentData) =>
          formatCurrency(row.currentValue || 0, currency),
      },
      {
        id: "unrealizedPnl",
        header: "PNL",
        accessorFn: (row: InvestmentData) =>
          formatCurrency(row.unrealizedPnl || 0, currency),
      },
      {
        id: "unrealizedPnlPercent",
        header: "PNL %",
        accessorFn: (row: InvestmentData) =>
          formatPercent(row.unrealizedPnlPercent || 0),
      },
      {
        id: "updatedAt",
        header: "Last Updated",
        accessorFn: (row: InvestmentData) => {
          const { text, colorClass } = formatTimeAgo(row.updatedAt || 0);
          return <span className={`text-xs ${colorClass}`}>{text}</span>;
        },
      },
    ],
    [currency],
  );
};

// Memoized holdings table wrapper with TanStackTable and MobileTable
const HoldingsTable = memo(
  ({
    investments,
    onRowClick,
    onRowHover,
    currency,
  }: {
    investments: InvestmentData[];
    onRowClick: (investmentId: number) => void;
    onRowHover?: () => void;
    currency: string;
  }) => {
    const columns = useInvestmentColumns(onRowClick, currency);
    const mobileColumns = useMobileInvestmentColumns(onRowClick, currency);

    return (
      <>
        {/* Desktop Table */}
        <div
          className="hidden sm:block overflow-x-auto"
          onMouseEnter={onRowHover}
        >
          {/* Cast TanStackTable to any to bypass generic type constraint */}
          <TanStackTable
            data={investments}
            columns={columns as any}
            emptyMessage="No investments yet. Add your first investment to get started."
          />
        </div>

        {/* Mobile Table */}
        <div className="sm:hidden">
          <MobileTable
            data={investments}
            columns={mobileColumns}
            getKey={(investment) => investment.id}
            renderActions={(investment) => (
              <button
                onClick={() => onRowClick(investment.id)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                aria-label="View investment details"
              >
                View Details
              </button>
            )}
            emptyMessage="No investments yet. Add your first investment to get started."
          />
        </div>
      </>
    );
  },
);
HoldingsTable.displayName = "HoldingsTable";

export default function PortfolioPage() {
  const { currency } = useCurrency();
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<keyof typeof ModalType | null>(
    null,
  );
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    number | null
  >(null);

  // Fetch user's wallets
  const getListWallets = useQueryListWallets(
    {
      pagination: {
        page: 1,
        pageSize: 100,
        orderBy: "created_at",
        order: "desc",
      },
    },
    { refetchOnMount: "always" },
  );

  // Filter for investment wallets (memoized)
  const investmentWallets = useMemo(() => {
    if (!getListWallets.data?.wallets) return [];
    return getListWallets.data.wallets.filter(
      (wallet) => wallet.type === WalletType.INVESTMENT,
    );
  }, [getListWallets.data]);

  // Set default wallet if none selected (use functional setState)
  React.useEffect(() => {
    setSelectedWalletId((prevId) => {
      if (!prevId && investmentWallets.length > 0) {
        return investmentWallets[0].id;
      }
      return prevId;
    });
  }, [investmentWallets]);

  // Fetch portfolio summary for selected wallet
  const getPortfolioSummary = useQueryGetPortfolioSummary(
    { walletId: selectedWalletId || 0 },
    {
      enabled: !!selectedWalletId,
      refetchOnMount: "always",
    },
  );

  // Fetch investments for selected wallet
  const getListInvestments = useQueryListInvestments(
    {
      walletId: selectedWalletId || 0,
      pagination: { page: 1, pageSize: 100, orderBy: "symbol", order: "asc" },
      typeFilter: 0,
    },
    {
      enabled: !!selectedWalletId,
      refetchOnMount: "always",
    },
  );

  // Query client for invalidating queries
  const queryClient = useQueryClient();

  // Update prices mutation
  const updatePricesMutation = useMutationUpdatePrices({
    onSuccess: (data) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: [EVENT_InvestmentListInvestments] });
      queryClient.invalidateQueries({ queryKey: [EVENT_InvestmentGetPortfolioSummary] });

      // Show success message
      console.log(`Updated prices for ${data.updatedInvestments?.length || 0} investments`);
    },
    onError: (error: any) => {
      console.error(`Failed to update prices: ${error.message}`);
    },
  });

  // Memoize modal title
  const modalTitle = useMemo(() => {
    switch (modalType) {
      case ModalType.CREATE_WALLET:
        return "Create Investment Wallet";
      case ModalType.ADD_INVESTMENT:
        return "Add Investment";
      case ModalType.INVESTMENT_DETAIL:
        return "Investment Details";
      default:
        return "";
    }
  }, [modalType]);

  // Use startTransition for non-urgent state updates (rerender-transitions)
  const handleOpenModal = useCallback(
    (type: keyof typeof ModalType, investmentId?: number) => {
      startTransition(() => {
        if (investmentId) {
          setSelectedInvestmentId(investmentId);
        }
        setModalType(type);
      });
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedInvestmentId(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    startTransition(() => {
      getListWallets.refetch();
      getPortfolioSummary.refetch();
      getListInvestments.refetch();
      handleCloseModal();
    });
  }, [
    getListWallets,
    getPortfolioSummary,
    getListInvestments,
    handleCloseModal,
  ]);

  // Preload modal on hover for perceived speed (bundle-preload)
  const handleRowHover = useCallback(() => {
    preloadInvestmentDetailModal();
  }, []);

  // Loading state
  if (getListWallets.isLoading || getListWallets.isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner text="Loading portfolio..." />
      </div>
    );
  }

  // Error state
  if (getListWallets.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lred text-center">
          <p className="text-lg font-semibold">Error loading portfolio</p>
          <p className="text-sm">{getListWallets.error.message}</p>
        </div>
      </div>
    );
  }

  const portfolioSummary = getPortfolioSummary.data;
  const investments = (getListInvestments.data?.data || []) as InvestmentData[];

  // No investment wallets - render empty state with modal
  if (investmentWallets.length === 0) {
    return (
      <>
        <EmptyInvestmentWalletsState
          onOpenModal={() => handleOpenModal(ModalType.CREATE_WALLET)}
        />
        <BaseModal
          isOpen={modalType !== null}
          onClose={handleCloseModal}
          title={modalTitle}
        >
          {modalType === ModalType.CREATE_WALLET && (
            <CreateWalletForm
              onSuccess={handleModalSuccess}
              defaultType={WalletType.INVESTMENT}
            />
          )}
        </BaseModal>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-center py-4 px-6">
        <div className="w-full space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Investment Portfolio</h1>

            {/* Wallet Selector */}
            {investmentWallets.length > 1 && (
              <select
                value={selectedWalletId || ""}
                onChange={(e) =>
                  startTransition(() => {
                    setSelectedWalletId(Number(e.target.value));
                  })
                }
                className="px-4 py-2 border-2 border-hgreen rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen"
              >
                {investmentWallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.walletName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Portfolio Summary Cards */}
          {getPortfolioSummary.isLoading || getPortfolioSummary.isPending ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner text="Loading summary..." />
            </div>
          ) : portfolioSummary?.data ? (
            <PortfolioSummaryCards portfolioSummary={portfolioSummary.data} currency={currency} />
          ) : null}

          {/* Holdings Table */}
          <BaseCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Holdings</h2>
              <div className="flex gap-2">
                <Button
                  type={ButtonType.SECONDARY}
                  onClick={() => updatePricesMutation.mutate({
                    investmentIds: [], // Empty = update all investments
                    forceRefresh: true, // Bypass cache for fresh data
                  })}
                  loading={updatePricesMutation.isPending}
                  disabled={updatePricesMutation.isPending || !selectedWalletId}
                  className="w-auto px-4"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Prices
                </Button>
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={() => handleOpenModal(ModalType.ADD_INVESTMENT)}
                  disabled={!selectedWalletId}
                  className="w-auto px-4"
                >
                  Add Investment
                </Button>
              </div>
            </div>

            {getListInvestments.isLoading || getListInvestments.isPending ? (
              <div className="flex items-center justify-center h-48">
                <LoadingSpinner text="Loading holdings..." />
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  No investments yet. Add your first investment to get started.
                </p>
              </div>
            ) : (
              <HoldingsTable
                investments={investments}
                onRowClick={(id) =>
                  handleOpenModal(ModalType.INVESTMENT_DETAIL, id)
                }
                onRowHover={handleRowHover}
                currency={currency}
              />
            )}
          </BaseCard>
        </div>
      </div>

      {/* Modal - InvestmentDetailModal handles its own BaseModal */}
      {modalType === ModalType.INVESTMENT_DETAIL && selectedInvestmentId && (
        <InvestmentDetailModal
          isOpen={modalType === ModalType.INVESTMENT_DETAIL}
          onClose={handleCloseModal}
          investmentId={selectedInvestmentId}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* BaseModal for other modals */}
      <BaseModal
        isOpen={modalType !== null && modalType !== ModalType.INVESTMENT_DETAIL}
        onClose={handleCloseModal}
        title={modalTitle}
      >
        {modalType === ModalType.CREATE_WALLET && (
          <CreateWalletForm
            onSuccess={handleModalSuccess}
            defaultType={WalletType.INVESTMENT}
          />
        )}
        {modalType === ModalType.ADD_INVESTMENT && selectedWalletId && (
          <AddInvestmentForm
            walletId={selectedWalletId}
            onSuccess={handleModalSuccess}
          />
        )}
      </BaseModal>
    </>
  );
}
