"use client";

import { useState, useRef } from "react";
import { resources } from "@/app/constants";
import { BaseModal } from "@/components/modals/BaseModal";
import { AddTransactionForm } from "@/components/modals/forms/AddTransactionForm";
import { TransferMoneyForm } from "@/components/modals/forms/TransferMoneyForm";
import { useQueryClient } from "@tanstack/react-query";
import {
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
  EVENT_TransactionListTransactions,
  EVENT_WalletGetBalanceHistory,
  EVENT_WalletGetMonthlyDominance,
  EVENT_TransactionGetFinancialReport,
} from "@/utils/generated/hooks";

type ModalType = "add-transaction" | "transfer-money" | null;

interface FloatingActionButtonProps {
  onRefresh?: () => void;
}

/**
 * Floating action button component with Add Transaction and Transfer Money functionality.
 * Uses local state for modal management.
 */
export function FloatingActionButton({ onRefresh }: FloatingActionButtonProps) {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [extend, setExtend] = useState(false);
  const transactionButtonRef = useRef<HTMLButtonElement>(null);
  const transferButtonRef = useRef<HTMLButtonElement>(null);

  const handleExtend = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setExtend(!extend);
    if (extend) {
      if (transferButtonRef.current) {
        transferButtonRef.current.classList.remove("show");
      }
      if (transactionButtonRef.current) {
        transactionButtonRef.current.classList.remove("show");
      }
    } else {
      if (transferButtonRef.current) {
        transferButtonRef.current.classList.add("show");
      }
      if (transactionButtonRef.current) {
        transactionButtonRef.current.classList.add("show");
      }
    }
  };

  const handleModalClose = () => setModalType(null);

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetTotalBalance] });
    queryClient.invalidateQueries({
      queryKey: [EVENT_TransactionListTransactions],
    });
    queryClient.invalidateQueries({
      queryKey: [EVENT_WalletGetBalanceHistory],
    });
    queryClient.invalidateQueries({
      queryKey: [EVENT_WalletGetMonthlyDominance],
    });
    queryClient.invalidateQueries({
      queryKey: [EVENT_TransactionGetFinancialReport],
    });
    onRefresh?.();
    handleModalClose();
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "add-transaction":
        return "Add Transaction";
      case "transfer-money":
        return "Transfer Money";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="fixed bottom-3 right-5 z-40">
        <div className="">
          <button
            className="relative hover:drop-shadow-round z-50"
            onClick={handleExtend}
          >
            <img src={`${resources}/plus.png`} alt="Add" className="w-8" />
          </button>
          <button
            className="btn-transaction fixed hover:drop-shadow-round bottom-8 right-14 bg-bg rounded-full w-8"
            ref={transactionButtonRef}
            onClick={() => setModalType("add-transaction")}
          >
            <img
              src={`${resources}/transaction.png`}
              alt="Transaction"
              className="w-8"
            />
          </button>
          <button
            className="btn-transfer fixed hover:drop-shadow-round bottom-14 right-6 bg-bg rounded-full w-8 p-1"
            ref={transferButtonRef}
            onClick={() => setModalType("transfer-money")}
          >
            <img
              src={`${resources}/transfer.png`}
              alt="Transfer"
              className=""
            />
          </button>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <BaseModal
        isOpen={modalType === "add-transaction"}
        onClose={handleModalClose}
        title={getModalTitle()}
      >
        <AddTransactionForm onSuccess={handleModalSuccess} />
      </BaseModal>

      {/* Transfer Money Modal */}
      <BaseModal
        isOpen={modalType === "transfer-money"}
        onClose={handleModalClose}
        title={getModalTitle()}
      >
        <TransferMoneyForm onSuccess={handleModalSuccess} />
      </BaseModal>
    </>
  );
}
