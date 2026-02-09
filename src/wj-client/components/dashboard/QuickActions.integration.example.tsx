/**
 * QuickActions Integration Example for Home Page
 *
 * This example shows how to integrate QuickActions into the existing
 * dashboard home page with the current modal pattern.
 */

"use client";

import { useState } from "react";
import {
  QuickActions,
  homeQuickActions,
  portfolioQuickActions,
} from "./QuickActions";
import { BaseModal } from "@/components/modals/BaseModal";
import { CreateWalletForm } from "@/components/modals/forms/CreateWalletForm";
import { AddTransactionForm } from "@/components/modals/forms/AddTransactionForm";
import { TransferMoneyForm } from "@/components/modals/forms/TransferMoneyForm";
import { useQueryClient } from "@tanstack/react-query";

type ModalType = "add-transaction" | "transfer-money" | "create-wallet" | null;

/**
 * Example: Integrating QuickActions into Home Page
 *
 * This demonstrates the minimal changes needed to add QuickActions
 * to the existing home page.
 */
export function HomePageWithQuickActions() {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<ModalType>(null);

  const handleModalClose = () => setModalType(null);

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return [
          "EVENT_WalletListWallets",
          "EVENT_WalletGetTotalBalance",
          "EVENT_TransactionListTransactions",
        ].includes(key);
      },
    });
    handleModalClose();
  };

  const getModalTitle = () => {
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
  };

  // Map action IDs to modal types
  const handleOpenModal = (actionId: string) => {
    const modalMapping: Record<string, ModalType> = {
      "add-transaction": "add-transaction",
      transfer: "transfer-money",
      "new-wallet": "create-wallet",
    };

    setModalType(modalMapping[actionId] || null);
  };

  return (
    <>
      {/* NEW: Quick Actions Bar - Mobile Only */}
      <QuickActions actions={homeQuickActions(handleOpenModal)} />

      {/* Existing page content */}
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {/* Your existing dashboard content */}
      </div>

      {/* Existing Modal System */}
      <BaseModal
        isOpen={modalType !== null}
        onClose={handleModalClose}
        title={getModalTitle()}
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
    </>
  );
}

/**
 * Alternative: Using ModalType constants from @/app/constants
 */
import { ModalType as AppModalType } from "@/app/constants";

export function HomePageWithModalConstants() {
  const [modalType, setModalType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return [
          "EVENT_WalletListWallets",
          "EVENT_WalletGetTotalBalance",
        ].includes(key);
      },
    });
    setModalType(null);
  };

  // Map action IDs to ModalType constants
  const handleOpenModal = (actionId: string) => {
    const modalMapping: Record<string, string> = {
      "add-transaction": AppModalType.ADD_TRANSACTION,
      transfer: AppModalType.TRANSFER_MONEY,
      "new-wallet": AppModalType.CREATE_WALLET,
    };

    setModalType(modalMapping[actionId]);
  };

  return (
    <>
      <QuickActions actions={homeQuickActions(handleOpenModal)} />
      {/* Rest of page */}
    </>
  );
}

/**
 * Complete example with Portfolio page
 */
export function PortfolioPageWithQuickActions() {
  const [modalType, setModalType] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key.includes("investment");
      },
    });
    setModalType(null);
  };

  const handleOpenModal = (actionId: string) => {
    if (actionId === "refresh") {
      // Handle refresh separately
      return;
    }
    setModalType(actionId === "add-investment" ? "ADD_INVESTMENT" : actionId);
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      // Your refresh logic here
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Prices refreshed!");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <QuickActions
        actions={portfolioQuickActions(handleOpenModal, handleRefreshPrices)}
      />
      {/* Portfolio content */}
    </>
  );
}
