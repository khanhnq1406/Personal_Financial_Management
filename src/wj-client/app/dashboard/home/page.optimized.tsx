"use client";

/**
 * Optimized Home Page
 *
 * Implements Vercel React Best Practices:
 * - bundle-dynamic-imports: Chart components loaded dynamically
 * - bundle-preload: Charts preloaded on hover for perceived speed
 * - rendering-hoist-jsx: Static JSX extracted outside component
 * - rerender-memo: Components memoized to prevent unnecessary re-renders
 */

import { useState, useMemo, useCallback, startTransition, memo } from "react";
import { BaseCard } from "@/components/BaseCard";
import { Wallets } from "./Walllets";
import { TotalBalance } from "./TotalBalance";
import { User } from "./User";
import { FunctionalButton } from "./FunctionalButtons";
import {
  useQueryListWallets,
  useQueryGetAvailableYears,
  EVENT_WalletGetBalanceHistory,
  EVENT_WalletGetMonthlyDominance,
} from "@/utils/generated/hooks";
import { BaseModal } from "@/components/modals/BaseModal";
import {
  CreateWalletForm,
  AddTransactionForm,
  TransferMoneyForm,
  BalanceChart,
  DominanceChart,
  MonthlyDominanceChart,
  AccountBalanceChart,
  preloadCharts,
} from "@/components/lazy/OptimizedComponents";
import { useQueryClient } from "@tanstack/react-query";
import {
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
  EVENT_TransactionListTransactions,
} from "@/utils/generated/hooks";

type ModalType = "add-transaction" | "transfer-money" | "create-wallet" | null;

// Hoist static JSX outside component (rendering-hoist-jsx)
const mobileHeader = (
  <div className="sm:hidden bg-[linear-gradient(to_bottom,#008148_50%,#F7F8FC_50%)] border-none flex justify-center">
    <div className="w-4/5">
      <TotalBalance />
    </div>
  </div>
);

// Memoized section header component to prevent recreation on every render
const SectionHeader = memo(({ title }: { title: string }) => (
  <div className="font-semibold mt-4 mb-2">{title}</div>
));

SectionHeader.displayName = "SectionHeader";

export default function Home() {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<ModalType>(null);

  const getListWallets = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 10, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" }
  );

  // Fetch available years once and pass to child components
  const { data: availableYearsData } = useQueryGetAvailableYears(
    {},
    { refetchOnMount: "always" }
  );

  // Use available years from API, or default to current year if no transactions
  const availableYears = useMemo(() => {
    return availableYearsData?.years?.length
      ? availableYearsData.years
      : [new Date().getFullYear()];
  }, [availableYearsData?.years]);

  // Memoize modal title to prevent recreation
  const modalTitle = useMemo(() => {
    switch (modalType) {
      case "add-transaction":
        return "Add Transaction";
      case "transfer-money":
        return "Transfer Money";
      case "create-wallet":
        return "Create Wallet";
      default:
        return "";
    }
  }, [modalType]);

  // Use startTransition for non-urgent modal state updates (rerender-transitions)
  const handleOpenModal = useCallback((type: ModalType) => {
    startTransition(() => {
      setModalType(type);
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalType(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    // Invalidate queries in a transition for better UX
    startTransition(() => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return [
            EVENT_WalletListWallets,
            EVENT_WalletGetTotalBalance,
            EVENT_TransactionListTransactions,
            EVENT_WalletGetBalanceHistory,
            EVENT_WalletGetMonthlyDominance,
          ].includes(key);
        },
      });
      handleCloseModal();
    });
  }, [queryClient, handleCloseModal]);

  // Preload charts on hover for perceived speed (bundle-preload)
  const handleChartSectionHover = useCallback(() => {
    preloadCharts();
  }, []);

  return (
    <div className="sm:grid grid-cols-[75%_25%] divide-x-2">
      {mobileHeader}

      <div className="flex justify-center py-2 border-none">
        <div className="w-[80%] mb-3">
          <SectionHeader title="My Wallets" />
          <BaseCard>
            <Wallets getListWallets={getListWallets} />
          </BaseCard>

          {/* Chart section with preload on hover */}
          <div onMouseEnter={handleChartSectionHover}>
            <SectionHeader title="Total balance fluctuation" />
            <BaseCard>
              <BalanceChart availableYears={availableYears} />
            </BaseCard>

            <SectionHeader title="Dominance" />
            <BaseCard>
              <DominanceChart availableYears={availableYears} />
            </BaseCard>

            <SectionHeader title="Monthly Dominance" />
            <BaseCard>
              <MonthlyDominanceChart availableYears={availableYears} />
            </BaseCard>

            <SectionHeader title="Account Balance" />
            <BaseCard>
              <AccountBalanceChart availableYears={availableYears} />
            </BaseCard>
          </div>
        </div>
      </div>

      <div className="px-3">
        <div className="grid divide-y-2">
          <User />
          <TotalBalance />
          <FunctionalButton onOpenModal={handleOpenModal} />
        </div>
      </div>

      {/* Modals */}
      <BaseModal
        isOpen={modalType !== null}
        onClose={handleCloseModal}
        title={modalTitle}
      >
        {modalType === "add-transaction" && (
          <AddTransactionForm onSuccess={handleModalSuccess} />
        )}
        {modalType === "transfer-money" && (
          <TransferMoneyForm onSuccess={handleModalSuccess} />
        )}
        {modalType === "create-wallet" && (
          <CreateWalletForm onSuccess={handleModalSuccess} />
        )}
      </BaseModal>
    </div>
  );
}
