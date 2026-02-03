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
  useQueryListUserInvestments,
  useQueryGetAggregatedPortfolioSummary,
  useMutationUpdatePrices,
  EVENT_InvestmentListUserInvestments,
  EVENT_InvestmentGetAggregatedPortfolioSummary,
} from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import { InvestmentType } from "@/gen/protobuf/v1/investment";
import {
  formatPercent,
  formatQuantity,
  getInvestmentTypeLabel,
  formatTimeAgo,
  formatPrice,
} from "./helpers";
import { Select, SelectOption } from "@/components/select/Select";
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
// Prefers display fields (converted to user's preferred currency) when available
const PortfolioSummaryCards = memo(
  ({
    portfolioSummary,
    userCurrency,
  }: {
    portfolioSummary: any;
    userCurrency: string;
  }) => {
    // Use display fields if available, otherwise fall back to base values
    const displayValue =
      portfolioSummary.displayTotalValue?.amount ??
      portfolioSummary.totalValue ??
      0;
    const displayCost =
      portfolioSummary.displayTotalCost?.amount ??
      portfolioSummary.totalCost ??
      0;
    const displayPnl =
      portfolioSummary.displayTotalPnl?.amount ??
      portfolioSummary.totalPnl ??
      0;
    const displayCurrency =
      portfolioSummary.displayCurrency ||
      portfolioSummary.currency ||
      userCurrency;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <BaseCard className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total Value</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(displayValue, displayCurrency)}
          </div>
        </BaseCard>

        <BaseCard className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total Cost</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(displayCost, displayCurrency)}
          </div>
        </BaseCard>

        <BaseCard className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Total PNL</div>
          <div
            className={`text-lg sm:text-2xl font-bold mt-1 ${
              displayPnl >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(displayPnl, displayCurrency)}
          </div>
        </BaseCard>

        <BaseCard className="p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600">Holdings</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">
            {portfolioSummary.totalInvestments || 0}
          </div>
        </BaseCard>
      </div>
    );
  },
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
  // Native currency of the investment
  currency?: string;
  // Purchase unit for display (gold/silver)
  purchaseUnit?: string;
  // Display fields (converted to user's preferred currency)
  displayCurrentValue?: { amount: number; currency: string };
  displayUnrealizedPnl?: { amount: number; currency: string };
  displayCurrentPrice?: { amount: number; currency: string };
  displayAverageCost?: { amount: number; currency: string };
  displayCurrency?: string;
  // Wallet name for "All Wallets" view
  walletName?: string;
};

// Column definitions for TanStackTable (memoized to prevent recreation)
const useInvestmentColumns = (
  onRowClick: (investmentId: number) => void,
  currency: string,
  showWalletColumn: boolean,
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
      // Conditionally include wallet column
      ...(showWalletColumn
        ? [
            {
              accessorKey: "walletName" as const,
              header: "Wallet",
              cell: (info: any) => (
                <span className="text-gray-600">{info.getValue()}</span>
              ),
            },
          ]
        : []),
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
          return formatQuantity(
            row.quantity,
            row.type as any,
            row.purchaseUnit,
          );
        },
      },
      {
        accessorKey: "averageCost",
        header: "Avg Cost",
        cell: (info) => {
          const row = info.row.original;
          const nativeCurrency = row.currency || "USD";
          const price = (info.getValue() as number | undefined) || 0;
          return (
            <div>
              <span className="font-medium">
                {formatPrice(
                  price,
                  row.type as any,
                  nativeCurrency,
                  row.purchaseUnit,
                )}
              </span>
              {row.displayAverageCost && row.displayCurrency && (
                <span className="text-xs text-gray-500 block">
                  ≈{" "}
                  {formatPrice(
                    row.displayAverageCost.amount || 0,
                    row.type as any,
                    row.displayCurrency,
                    row.purchaseUnit,
                  )}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Current Price",
        cell: (info) => {
          const row = info.row.original;
          const nativeCurrency = row.currency || "USD";
          const price = (info.getValue() as number | undefined) || 0;
          return (
            <div>
              <span className="font-medium">
                {formatPrice(
                  price,
                  row.type as any,
                  nativeCurrency,
                  row.purchaseUnit,
                )}
              </span>
              {row.displayCurrentPrice && row.displayCurrency && (
                <span className="text-xs text-gray-500 block">
                  ≈{" "}
                  {formatPrice(
                    row.displayCurrentPrice.amount || 0,
                    row.type as any,
                    row.displayCurrency,
                    row.purchaseUnit,
                  )}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "currentValue",
        header: "Current Value",
        cell: (info) => {
          const row = info.row.original;
          const nativeCurrency = row.currency || "USD";
          const value = (info.getValue() as number | undefined) || 0;
          return (
            <div>
              <span className="font-medium">
                {formatCurrency(value, nativeCurrency)}
              </span>
              {row.displayCurrentValue && row.displayCurrency && (
                <span className="text-xs text-gray-500 block">
                  ≈{" "}
                  {formatCurrency(
                    row.displayCurrentValue.amount || 0,
                    row.displayCurrency,
                  )}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "unrealizedPnl",
        header: "PNL",
        cell: (info) => {
          const row = info.row.original;
          const nativeCurrency = row.currency || "USD";
          const value = (info.getValue() as number | undefined) || 0;
          return (
            <div>
              <span
                className={`font-medium ${
                  value >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(value, nativeCurrency)}
              </span>
              {row.displayUnrealizedPnl && row.displayCurrency && (
                <span className="text-xs text-gray-500 block">
                  ≈{" "}
                  {formatCurrency(
                    row.displayUnrealizedPnl.amount || 0,
                    row.displayCurrency,
                  )}
                </span>
              )}
            </div>
          );
        },
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
    [onRowClick, currency, showWalletColumn],
  );
};

// Mobile columns for MobileTable
const useMobileInvestmentColumns = (
  onRowClick: (investmentId: number) => void,
  currency: string,
  showWalletColumn: boolean,
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
      // Conditionally include wallet column
      ...(showWalletColumn
        ? [
            {
              id: "walletName",
              header: "Wallet",
              accessorFn: (row: InvestmentData) => row.walletName || "",
            },
          ]
        : []),
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
          formatPrice(
            row.averageCost || 0,
            row.type as any,
            row.currency || "USD",
          ),
      },
      {
        id: "currentPrice",
        header: "Current Price",
        accessorFn: (row: InvestmentData) =>
          formatPrice(
            row.currentPrice || 0,
            row.type as any,
            row.currency || "USD",
          ),
      },
      {
        id: "currentValue",
        header: "Current Value",
        accessorFn: (row: InvestmentData) => {
          const nativeCurrency = row.currency || "USD";
          const native = formatCurrency(row.currentValue || 0, nativeCurrency);
          if (row.displayCurrentValue && row.displayCurrency) {
            const converted = formatCurrency(
              row.displayCurrentValue.amount || 0,
              row.displayCurrency,
            );
            return `${native} (≈ ${converted})`;
          }
          return native;
        },
      },
      {
        id: "unrealizedPnl",
        header: "PNL",
        accessorFn: (row: InvestmentData) => {
          const nativeCurrency = row.currency || "USD";
          const native = formatCurrency(row.unrealizedPnl || 0, nativeCurrency);
          if (row.displayUnrealizedPnl && row.displayCurrency) {
            const converted = formatCurrency(
              row.displayUnrealizedPnl.amount || 0,
              row.displayCurrency,
            );
            return `${native} (≈ ${converted})`;
          }
          return native;
        },
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
    [currency, showWalletColumn],
  );
};

// Memoized holdings table wrapper with TanStackTable and MobileTable
const HoldingsTable = memo(
  ({
    investments,
    onRowClick,
    onRowHover,
    currency,
    showWalletColumn = false,
  }: {
    investments: InvestmentData[];
    onRowClick: (investmentId: number) => void;
    onRowHover?: () => void;
    currency: string;
    showWalletColumn?: boolean;
  }) => {
    const columns = useInvestmentColumns(
      onRowClick,
      currency,
      showWalletColumn,
    );
    const mobileColumns = useMobileInvestmentColumns(
      onRowClick,
      currency,
      showWalletColumn,
    );

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

// Wallet filter value: "all" for all wallets, or wallet ID as string
type WalletFilterValue = "all" | string;

// Type filter options
const TYPE_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "0", label: "All Types" },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY),
    label: "Cryptocurrency",
  },
  { value: String(InvestmentType.INVESTMENT_TYPE_STOCK), label: "Stock" },
  { value: String(InvestmentType.INVESTMENT_TYPE_ETF), label: "ETF" },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND),
    label: "Mutual Fund",
  },
  { value: String(InvestmentType.INVESTMENT_TYPE_BOND), label: "Bond" },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_COMMODITY),
    label: "Commodity",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_GOLD_VND),
    label: "Gold (Vietnam)",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_GOLD_USD),
    label: "Gold (World)",
  },
  { value: String(InvestmentType.INVESTMENT_TYPE_OTHER), label: "Other" },
];

export default function PortfolioPage() {
  const { currency } = useCurrency();
  // "all" for all wallets, or wallet ID as string
  const [selectedWallet, setSelectedWallet] =
    useState<WalletFilterValue>("all");
  // Type filter (0 = all types)
  const [typeFilter, setTypeFilter] = useState<string>("0");
  const [modalType, setModalType] = useState<keyof typeof ModalType | null>(
    null,
  );
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<
    number | null
  >(null);
  // UI state for price update feedback
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

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

  // Build wallet filter options
  const walletOptions = useMemo((): SelectOption<string>[] => {
    const options: SelectOption<string>[] = [
      { value: "all", label: "All Investment Wallets" },
    ];
    investmentWallets.forEach((wallet) => {
      options.push({
        value: String(wallet.id),
        label: wallet.walletName,
      });
    });
    return options;
  }, [investmentWallets]);

  // Computed values for API calls
  const walletIdForApi = useMemo(() => {
    if (selectedWallet === "all") return 0;
    return parseInt(selectedWallet, 10);
  }, [selectedWallet]);

  const typeFilterForApi = useMemo(() => {
    return parseInt(
      typeFilter,
      10,
    ) as (typeof InvestmentType)[keyof typeof InvestmentType];
  }, [typeFilter]);

  const isAllWalletsView = selectedWallet === "all";

  // Fetch portfolio summary (uses aggregated endpoint)
  const getPortfolioSummary = useQueryGetAggregatedPortfolioSummary(
    {
      walletId: walletIdForApi,
      typeFilter: typeFilterForApi,
    },
    {
      enabled: investmentWallets.length > 0,
      refetchOnMount: "always",
    },
  );

  // Fetch investments (uses user investments endpoint)
  const getListInvestments = useQueryListUserInvestments(
    {
      walletId: walletIdForApi,
      pagination: { page: 1, pageSize: 100, orderBy: "symbol", order: "asc" },
      typeFilter: typeFilterForApi,
    },
    {
      enabled: investmentWallets.length > 0,
      refetchOnMount: "always",
    },
  );

  // Get selected wallet balance and currency for AddInvestmentForm validation
  // Only available when a specific wallet is selected (not "all")
  const selectedWalletBalance = useMemo(() => {
    if (isAllWalletsView) return 0;
    const walletId = parseInt(selectedWallet, 10);
    const wallet = investmentWallets.find((w) => w.id === walletId);
    return wallet?.balance?.amount || 0;
  }, [selectedWallet, investmentWallets, isAllWalletsView]);

  const selectedWalletCurrency = useMemo(() => {
    if (isAllWalletsView) return "USD";
    const walletId = parseInt(selectedWallet, 10);
    const wallet = investmentWallets.find((w) => w.id === walletId);
    return wallet?.balance?.currency || "USD";
  }, [selectedWallet, investmentWallets, isAllWalletsView]);

  // Query client for invalidating queries
  const queryClient = useQueryClient();

  // Update prices mutation
  const updatePricesMutation = useMutationUpdatePrices({
    onSuccess: (data) => {
      // Show update in progress banner
      setShowUpdateBanner(true);
      console.log(`Price update started: ${data.message}`);

      // Polling mechanism to check for updated prices
      // We'll check every 2 seconds for up to 15 seconds (max 7 attempts)
      let pollAttempts = 0;
      const maxPollAttempts = 7;
      const pollInterval = 2000; // 2 seconds

      const pollForUpdates = () => {
        pollAttempts++;
        console.log(
          `Checking for price updates (attempt ${pollAttempts}/${maxPollAttempts})...`,
        );

        // Refetch data
        queryClient
          .invalidateQueries({
            queryKey: [EVENT_InvestmentListUserInvestments],
          })
          .then(() => {
            return queryClient.invalidateQueries({
              queryKey: [EVENT_InvestmentGetAggregatedPortfolioSummary],
            });
          });

        // Check if we should continue polling or show success
        if (pollAttempts >= maxPollAttempts) {
          // Max attempts reached, assume complete
          setShowUpdateBanner(false);
          setShowSuccessBanner(true);
          console.log(
            "Price update polling complete (max attempts reached). Showing success.",
          );

          // Auto-hide success banner after 4 seconds
          setTimeout(() => {
            setShowSuccessBanner(false);
          }, 4000);
        } else {
          // Continue polling
          setTimeout(pollForUpdates, pollInterval);
        }
      };

      // Start polling after initial delay (give backend time to start processing)
      setTimeout(pollForUpdates, 2000);
    },
    onError: (error: any) => {
      setShowUpdateBanner(false);
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
  const investments = (getListInvestments.data?.investments ||
    []) as InvestmentData[];

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
      <div className="flex justify-center py-3 sm:py-4 px-3 sm:px-6">
        <div className="w-full space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold">Investment Portfolio</h1>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Wallet Selector */}
              <div className="w-full sm:w-56 md:w-fit">
                <Select
                  options={walletOptions}
                  value={selectedWallet}
                  onChange={(value) => {
                    startTransition(() => {
                      setSelectedWallet(value as WalletFilterValue);
                    });
                  }}
                  placeholder="Select Wallet"
                  clearable={false}
                  disableFilter={true}
                />
              </div>

              {/* Type Filter */}
              <div className="w-full sm:w-full md:w-48">
                <Select
                  options={TYPE_FILTER_OPTIONS}
                  value={typeFilter}
                  onChange={(value) => {
                    startTransition(() => {
                      setTypeFilter(value);
                    });
                  }}
                  placeholder="Filter by Type"
                  clearable={false}
                  disableFilter={true}
                />
              </div>
            </div>
          </div>

          {/* Portfolio Summary Cards */}
          {getPortfolioSummary.isLoading || getPortfolioSummary.isPending ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner text="Loading summary..." />
            </div>
          ) : portfolioSummary?.data ? (
            <PortfolioSummaryCards
              portfolioSummary={portfolioSummary.data}
              userCurrency={currency}
            />
          ) : null}

          {/* Update Banner - Shows during price update */}
          {showUpdateBanner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Fetching latest prices from market...
                </p>
                <p className="text-xs text-blue-700">
                  This may take 5-15 seconds. We're checking for updates every 2
                  seconds.
                </p>
              </div>
            </div>
          )}

          {/* Success Banner - Shows after successful update */}
          {showSuccessBanner && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
              <svg
                className="h-5 w-5 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Prices updated successfully!
                </p>
                <p className="text-xs text-green-700">
                  Your portfolio is now showing the latest market prices.
                </p>
              </div>
            </div>
          )}

          {/* Wallet Cash Balance */}
          {selectedWallet &&
            selectedWallet !== "all" &&
            (() => {
              const wallet = investmentWallets.find(
                (w) => w.id === Number(selectedWallet),
              );
              if (!wallet) return null;
              return (
                <BaseCard className="p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">
                        Available Cash
                      </div>
                      <div className="text-xl font-bold text-bg">
                        {formatCurrency(
                          wallet.displayBalance?.amount ??
                            wallet.balance?.amount ??
                            0,
                          wallet.displayCurrency ||
                            wallet.balance?.currency ||
                            currency,
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Ready to invest
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Total Wallet Value
                      </div>
                      <div className="text-xl font-bold">
                        {formatCurrency(
                          wallet.displayTotalValue?.amount ??
                            wallet.totalValue?.amount ??
                            0,
                          wallet.displayCurrency ||
                            wallet.totalValue?.currency ||
                            currency,
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Cash + Investments
                      </div>
                    </div>
                  </div>
                </BaseCard>
              );
            })()}

          {/* Holdings Table */}
          <BaseCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Holdings</h2>
              <div className="flex gap-2">
                <Button
                  type={ButtonType.SECONDARY}
                  onClick={() =>
                    updatePricesMutation.mutate({
                      investmentIds: [], // Empty = update all investments
                      forceRefresh: true, // Bypass cache for fresh data
                    })
                  }
                  disabled={
                    updatePricesMutation.isPending ||
                    showUpdateBanner ||
                    investmentWallets.length === 0
                  }
                  className="w-auto px-4"
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      updatePricesMutation.isPending || showUpdateBanner
                        ? "animate-spin"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {updatePricesMutation.isPending || showUpdateBanner
                    ? "Updating..."
                    : "Refresh Prices"}
                </Button>
                <Button
                  type={ButtonType.PRIMARY}
                  onClick={() => handleOpenModal(ModalType.ADD_INVESTMENT)}
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
                showWalletColumn={isAllWalletsView}
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
        {modalType === ModalType.ADD_INVESTMENT && (
          <AddInvestmentForm
            walletId={
              !isAllWalletsView ? parseInt(selectedWallet, 10) : undefined
            }
            walletBalance={
              !isAllWalletsView ? selectedWalletBalance : undefined
            }
            walletCurrency={
              !isAllWalletsView ? selectedWalletCurrency : undefined
            }
            onSuccess={handleModalSuccess}
          />
        )}
      </BaseModal>
    </>
  );
}
