"use client";

/**
 * Optimized Portfolio Page
 *
 * Phase 2 Refactoring: Component breakdown for better maintainability and mobile optimization
 *
 * Implements Vercel React Best Practices:
 * - bundle-dynamic-imports: Heavy modal loaded dynamically
 * - bundle-preload: Modal preloaded on row hover for perceived speed
 * - rerender-memo: Components memoized to prevent unnecessary re-renders
 * - rerender-functional-setState: Use functional setState for stable callbacks
 * - rendering-hoist-jsx: Static JSX extracted outside component
 *
 * Component Breakdown:
 * - PortfolioSummary: Overview stats cards (Total Value, Cost, PNL, Holdings)
 * - InvestmentList: Desktop table + mobile card view for holdings
 * - InvestmentCard: Individual investment card (mobile)
 * - PortfolioAnalytics: Charts and metrics (collapsible on mobile)
 * - InvestmentActions: Quick action buttons (Add, Refresh)
 */

import {
  useState,
  useMemo,
  useCallback,
  startTransition,
} from "react";
import { BaseCard } from "@/components/BaseCard";
import { StatsCardSkeleton, TableSkeleton } from "@/components/loading/Skeleton";
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
import { Select, SelectOption } from "@/components/select/Select";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  CreateWalletForm,
  AddInvestmentForm,
  InvestmentDetailModal,
  preloadInvestmentDetailModal,
} from "@/components/lazy/OptimizedComponents";
import { BaseModal } from "@/components/modals/BaseModal";
import {
  PortfolioSummary,
  InvestmentList,
  InvestmentActions,
  EmptyInvestmentsState,
  EmptyWalletsState,
  UpdateProgressBanner,
  UpdateSuccessBanner,
  WalletCashBalanceCard,
} from "./components";

const ModalType = {
  CREATE_WALLET: "CREATE_WALLET",
  ADD_INVESTMENT: "ADD_INVESTMENT",
  INVESTMENT_DETAIL: "INVESTMENT_DETAIL",
} as const;

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

  // Handle refresh prices
  const handleRefreshPrices = useCallback(() => {
    updatePricesMutation.mutate({
      investmentIds: [], // Empty = update all investments
      forceRefresh: true, // Bypass cache for fresh data
    });
  }, [updatePricesMutation]);

  // Loading state
  if (getListWallets.isLoading || getListWallets.isPending) {
    return (
      <div className="flex flex-col gap-6 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-neutral-200 rounded animate-pulse" />
        </div>

        {/* Summary cards skeleton */}
        <StatsCardSkeleton cards={4} />

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow-card p-4 sm:p-6">
          <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4" />
          <TableSkeleton rows={5} showAvatar={false} />
        </div>
      </div>
    );
  }

  // Error state
  if (getListWallets.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-danger-600 text-center">
          <p className="text-lg font-semibold">Error loading portfolio</p>
          <p className="text-sm">{getListWallets.error.message}</p>
        </div>
      </div>
    );
  }

  const portfolioSummary = getPortfolioSummary.data?.data;
  const investments = getListInvestments.data?.investments || [];

  // No investment wallets - render empty state with modal
  if (investmentWallets.length === 0) {
    return (
      <>
        <EmptyWalletsState
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">
              Investment Portfolio
            </h1>

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
            <StatsCardSkeleton cards={4} />
          ) : portfolioSummary ? (
            <PortfolioSummary
              portfolioSummary={portfolioSummary}
              userCurrency={currency}
            />
          ) : null}

          {/* Update Banner - Shows during price update */}
          {showUpdateBanner && (
            <UpdateProgressBanner />
          )}

          {/* Success Banner - Shows after successful update */}
          {showSuccessBanner && (
            <UpdateSuccessBanner />
          )}

          {/* Wallet Cash Balance (only for specific wallet selection) */}
          {!isAllWalletsView && (
            <WalletCashBalanceCard
              wallet={investmentWallets.find(
                (w) => w.id === Number(selectedWallet),
              )}
              userCurrency={currency}
            />
          )}

          {/* Holdings Table */}
          <BaseCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-800">
                Holdings
              </h2>
              <InvestmentActions
                onAddInvestment={() =>
                  handleOpenModal(ModalType.ADD_INVESTMENT)
                }
                onRefreshPrices={handleRefreshPrices}
                isRefreshing={
                  updatePricesMutation.isPending || showUpdateBanner
                }
                disableRefresh={investmentWallets.length === 0}
              />
            </div>

            {getListInvestments.isLoading || getListInvestments.isPending ? (
              <TableSkeleton rows={5} showAvatar={false} />
            ) : investments.length === 0 ? (
              <EmptyInvestmentsState />
            ) : (
              <InvestmentList
                investments={investments}
                userCurrency={currency}
                onInvestmentClick={(id) =>
                  handleOpenModal(ModalType.INVESTMENT_DETAIL, id)
                }
                onRowHover={handleRowHover}
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
