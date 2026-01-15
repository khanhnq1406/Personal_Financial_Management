"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ButtonType, ModalType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import { store } from "@/redux/store";
import { closeModal, openModal } from "@/redux/actions";
import { ModalPayload } from "@/redux/interface";
import { Success } from "./success";
import {
  useMutationCreateWallet,
  useMutationTransferFunds,
  useMutationCreateTransaction,
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
} from "@/utils/generated/hooks";
import { CreateWalletForm } from "./forms/CreateWalletForm";
import { AddTransactionForm } from "./forms/AddTransactionForm";
import { TransferMoneyForm } from "./forms/TransferMoneyForm";
import { CreateWalletFormOutput } from "@/lib/validation/wallet.schema";
import { TransferMoneyFormInput } from "@/lib/validation/transfer.schema";
import { fromDateTimeLocal } from "@/lib/utils/date";

type BaseModalProps = {
  modal: ModalPayload | { isOpen: boolean; type: null; onSuccess?: () => void };
};

export const BaseModal: React.FC<BaseModalProps> = ({ modal }) => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string>("");

  // Clear error when modal type changes
  useEffect(() => {
    setError("");
  }, [modal.type]);

  // Mutations
  const createWalletMutation = useMutationCreateWallet();
  const createTransactionMutation = useMutationCreateTransaction();
  const transferFundsMutation = useMutationTransferFunds();

  // Common success handler
  const handleSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetTotalBalance] });
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
    modal.onSuccess?.();
    store.dispatch(closeModal());
    setSuccessMessage(message);
    store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
  };

  // Handle create wallet submission
  const handleCreateWallet = (data: CreateWalletFormOutput) => {
    setError("");
    createWalletMutation.mutate(
      {
        walletName: data.walletName,
        initialBalance: {
          amount: data.initialBalance,
          currency: "VND",
        },
        type: data.type,
      },
      {
        onSuccess: () =>
          handleSuccess("Wallet has been created successfully"),
        onError: (err: any) =>
          setError(err.message || "Failed to create wallet. Please try again"),
      }
    );
  };

  // Handle create transaction submission
  const handleCreateTransaction = (formData: any) => {
    setError("");
    createTransactionMutation.mutate(
      {
        walletId: Number(formData.walletId),
        categoryId: Number(formData.categoryId),
        amount: {
          amount: formData.amount,
          currency: "VND",
        },
        date: fromDateTimeLocal(formData.date),
        note: formData.note,
      },
      {
        onSuccess: () => handleSuccess("Transaction added successfully"),
        onError: (err: any) =>
          setError(err.message || "Failed to add transaction. Please try again"),
      }
    );
  };

  // Handle transfer funds submission
  const handleTransferFunds = (data: TransferMoneyFormInput) => {
    setError("");
    transferFundsMutation.mutate(
      {
        fromWalletId: Number(data.fromWalletId),
        toWalletId: Number(data.toWalletId),
        amount: {
          amount: data.amount,
          currency: "VND",
        },
      },
      {
        onSuccess: () => handleSuccess("Transfer completed successfully"),
        onError: (err: any) =>
          setError(err.message || "Failed to transfer funds. Please try again"),
      }
    );
  };

  const handleClose = () => {
    store.dispatch(closeModal());
  };

  const isLoading =
    createWalletMutation.isPending ||
    createTransactionMutation.isPending ||
    transferFundsMutation.isPending;

  const handleButtonClick = () => {
    if (modal.type === ModalType.SUCCESS) {
      handleClose();
    } else {
      // Trigger form submission
      const formId =
        modal.type === ModalType.CREATE_WALLET
          ? "create-wallet-form"
          : modal.type === ModalType.ADD_TRANSACTION
          ? "add-transaction-form"
          : "transfer-money-form";
      const form = document.getElementById(formId);
      form?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-modal flex justify-center items-center z-50">
      <div className="bg-fg p-5 rounded-lg drop-shadow-round max-w-md w-full mx-4">
        {modal.type !== ModalType.SUCCESS && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">{modal.type}</div>
              <Button
                type={ButtonType.IMG}
                src={`${resources}/close.png`}
                onClick={handleClose}
              />
            </div>
          </div>
        )}

        {modal.type === ModalType.ADD_TRANSACTION && (
          <AddTransactionForm
            onSubmit={handleCreateTransaction}
            isPending={isLoading}
          />
        )}

        {modal.type === ModalType.TRANSFER_MONEY && (
          <TransferMoneyForm
            onSubmit={handleTransferFunds}
            isPending={isLoading}
          />
        )}

        {modal.type === ModalType.CREATE_WALLET && (
          <CreateWalletForm
            onSubmit={handleCreateWallet}
            isPending={isLoading}
          />
        )}

        {modal.type === ModalType.SUCCESS && <Success message={successMessage} />}

        {error && <div className="text-lred mb-2 text-sm">{error}</div>}

        <div className="mt-4">
          <Button
            type={ButtonType.PRIMARY}
            onClick={handleButtonClick}
            loading={isLoading}
          >
            {modal.type === ModalType.SUCCESS ? "Close" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};
