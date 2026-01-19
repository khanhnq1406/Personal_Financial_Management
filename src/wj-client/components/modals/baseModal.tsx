"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ButtonType, ModalType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import { store } from "@/redux/store";
import { closeModal, openModal } from "@/redux/actions";
import { ModalPayload } from "@/redux/interface";
import { Success } from "./Success";
import { ConfirmationDialog } from "./ConfirmationDialog";
import {
  useMutationCreateWallet,
  useMutationTransferFunds,
  useMutationCreateTransaction,
  useMutationUpdateTransaction,
  useMutationDeleteTransaction,
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
  EVENT_TransactionListTransactions,
} from "@/utils/generated/hooks";
import { CreateWalletForm } from "./forms/CreateWalletForm";
import { AddTransactionForm } from "./forms/AddTransactionForm";
import { TransferMoneyForm } from "./forms/TransferMoneyForm";
import { EditTransactionForm } from "./forms/EditTransactionForm";
import { CreateWalletFormOutput } from "@/lib/validation/wallet.schema";
import { TransferMoneyFormInput } from "@/lib/validation/transfer.schema";
import { fromDateTimeLocal } from "@/lib/utils/date";

type BaseModalProps = {
  modal:
    | ModalPayload
    | {
        isOpen: boolean;
        type: null;
        transactionId?: number;
        onSuccess?: () => void;
      };
};

// Query keys to invalidate - memoized to avoid recreation
const INVALIDATION_QUERIES = [
  EVENT_WalletGetTotalBalance,
  EVENT_WalletListWallets,
  EVENT_TransactionListTransactions,
] as const;

export const BaseModal: React.FC<BaseModalProps> = ({ modal }) => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);

  // Clear error when modal type changes
  useEffect(() => {
    setError("");
  }, [modal.type]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modal.isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [modal.isOpen]);

  // Common invalidation function
  const invalidateQueries = useCallback(() => {
    INVALIDATION_QUERIES.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  }, [queryClient]);

  // Mutations - only create mutation hooks that are actually needed
  const deleteTransactionMutation = useMutationDeleteTransaction({
    onSuccess: () => {
      invalidateQueries();
      store.dispatch(closeModal());
      setSuccessMessage("Transaction deleted successfully");
      store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
    },
    onError: (err: any) => {
      setError(err.message || "Failed to delete transaction. Please try again");
      setIsConfirming(false);
    },
  });

  // Handle confirmation action
  const handleConfirmAction = useCallback(async () => {
    if (!("confirmConfig" in modal) || !modal.confirmConfig) return;

    const { action } = modal.confirmConfig;
    setIsConfirming(true);
    setError("");

    try {
      switch (action.type) {
        case "deleteTransaction":
          await deleteTransactionMutation.mutateAsync(action.payload);
          break;
        default:
          console.warn("[BaseModal] Unknown confirmation action:", action.type);
          setIsConfirming(false);
      }
    } catch (err) {
      console.error("[BaseModal] Error executing confirmation action:", err);
      setIsConfirming(false);
    }
  }, [modal, deleteTransactionMutation]);

  // Common success handler
  const handleSuccess = useCallback(
    (message: string) => {
      invalidateQueries();
      modal.onSuccess?.();
      store.dispatch(closeModal());
      setSuccessMessage(message);
      store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
    },
    [invalidateQueries, modal],
  );

  // Mutations for forms - memoized to avoid recreation
  const createWalletMutation = useMutationCreateWallet();
  const createTransactionMutation = useMutationCreateTransaction();
  const updateTransactionMutation = useMutationUpdateTransaction();
  const transferFundsMutation = useMutationTransferFunds();

  // Handle create wallet submission
  const handleCreateWallet = useCallback(
    (data: CreateWalletFormOutput) => {
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
            setError(
              err.message || "Failed to create wallet. Please try again",
            ),
        },
      );
    },
    [createWalletMutation, handleSuccess],
  );

  // Handle create transaction submission
  const handleCreateTransaction = useCallback(
    (formData: any) => {
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
            setError(
              err.message || "Failed to add transaction. Please try again",
            ),
        },
      );
    },
    [createTransactionMutation, handleSuccess],
  );

  // Handle update transaction submission
  const handleUpdateTransaction = useCallback(
    (formData: any) => {
      setError("");
      updateTransactionMutation.mutate(
        {
          transactionId: formData.transactionId,
          walletId: Number(formData.walletId),
          categoryId: Number(formData.categoryId),
          amount: formData.amount, // Already a Money object from form
          date: fromDateTimeLocal(formData.date),
          note: formData.note,
        },
        {
          onSuccess: () => handleSuccess("Transaction updated successfully"),
          onError: (err: any) =>
            setError(
              err.message || "Failed to update transaction. Please try again",
            ),
        },
      );
    },
    [updateTransactionMutation, handleSuccess],
  );

  // Handle transfer funds submission
  const handleTransferFunds = useCallback(
    (data: TransferMoneyFormInput) => {
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
            setError(
              err.message || "Failed to transfer funds. Please try again",
            ),
        },
      );
    },
    [transferFundsMutation, handleSuccess],
  );

  const handleClose = useCallback(() => {
    store.dispatch(closeModal());
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modal.type !== ModalType.SUCCESS) {
        handleClose();
      }
    };

    if (modal.isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [modal.isOpen, modal.type, handleClose]);

  // Memoize loading state
  const isLoading = useMemo(
    () =>
      createWalletMutation.isPending ||
      createTransactionMutation.isPending ||
      updateTransactionMutation.isPending ||
      transferFundsMutation.isPending,
    [
      createWalletMutation.isPending,
      createTransactionMutation.isPending,
      updateTransactionMutation.isPending,
      transferFundsMutation.isPending,
    ],
  );

  const handleButtonClick = useCallback(() => {
    if (modal.type === ModalType.SUCCESS) {
      handleClose();
    } else if (modal.type === ModalType.CONFIRM) {
      // Handled by ConfirmationDialog component
      return;
    } else {
      // Trigger form submission
      const formId =
        modal.type === ModalType.CREATE_WALLET
          ? "create-wallet-form"
          : modal.type === ModalType.ADD_TRANSACTION
            ? "add-transaction-form"
            : modal.type === ModalType.EDIT_TRANSACTION
              ? "edit-transaction-form"
              : "transfer-money-form";
      const form = document.getElementById(formId);
      form?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    }
  }, [modal.type, handleClose]);

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-modal flex justify-center items-center z-50 overscroll-contain"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modal.type ? `modal-title-${modal.type}` : undefined}
    >
      <div
        className="bg-fg p-5 rounded-lg drop-shadow-round max-w-md w-full mx-4 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {modal.type !== ModalType.SUCCESS && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2
                id={`modal-title-${modal.type}`}
                className="font-bold text-lg"
              >
                {modal.type}
              </h2>
              <Button
                type={ButtonType.IMG}
                src={`${resources}/close.png`}
                onClick={handleClose}
                aria-label="Close modal"
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

        {modal.type === ModalType.EDIT_TRANSACTION && modal.transactionId && (
          <EditTransactionForm
            transactionId={modal.transactionId}
            onSubmit={handleUpdateTransaction}
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

        {modal.type === ModalType.SUCCESS && (
          <Success message={successMessage} />
        )}

        {modal.type === ModalType.CONFIRM &&
          "confirmConfig" in modal &&
          modal.confirmConfig && (
            <ConfirmationDialog
              title={modal.confirmConfig.title}
              message={modal.confirmConfig.message}
              confirmText={modal.confirmConfig.confirmText}
              cancelText={modal.confirmConfig.cancelText}
              onConfirm={handleConfirmAction}
              onCancel={handleClose}
              isLoading={isConfirming}
              variant={modal.confirmConfig.variant}
            />
          )}

        {error && <div className="text-lred mb-2 text-sm">{error}</div>}

        {modal.type !== ModalType.CONFIRM && (
          <div className="mt-4">
            <Button
              type={ButtonType.PRIMARY}
              onClick={handleButtonClick}
              loading={isLoading}
            >
              {modal.type === ModalType.SUCCESS ? "Close" : "Save"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
