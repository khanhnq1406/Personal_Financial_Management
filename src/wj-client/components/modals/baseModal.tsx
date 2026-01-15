"use client";

import { ButtonType, ModalType, resources } from "@/app/constants";
import { Button } from "../Button";
import { useState } from "react";
import { AddTransactionForm } from "./addTransactionForm";
import { store } from "@/redux/store";
import { closeModal, openModal } from "@/redux/actions";
import { ModalPayload } from "@/redux/interface";
import { TransferMoneyForm } from "./transferMoneyForm";
import { CreateWalletForm } from "./createWalletForm";
import { Success } from "./success";
import {
  useMutationCreateWallet,
  useMutationTransferFunds,
  useMutationCreateTransaction,
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
} from "@/utils/generated/hooks";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import { useQueryClient } from "@tanstack/react-query";

type BaseModalProps = {
  modal: ModalPayload | { isOpen: boolean; type: null; onSuccess?: () => void };
};

export interface CreateWalletType {
  type: string;
  name: string;
  initialBalance: number;
  walletType: WalletType;
}

export interface AddTransactionType {
  type: string;
  amount?: number;
  categoryId?: number;
  walletId?: number;
  date?: number; // Unix timestamp
  note?: string;
}

export interface TransferMoneyType {
  type: string;
  amount?: number;
  from?: string;
  to?: string;
  datetime?: string;
  note?: string;
}

const initialInput = ():
  | CreateWalletType
  | AddTransactionType
  | TransferMoneyType => {
  if (store.getState().setModalReducer.type === ModalType.CREATE_WALLET) {
    return {
      type: ModalType.CREATE_WALLET,
      name: "",
      initialBalance: 0,
    };
  }
  if (store.getState().setModalReducer.type === ModalType.ADD_TRANSACTION) {
    return { type: ModalType.ADD_TRANSACTION };
  }
  if (store.getState().setModalReducer.type === ModalType.TRANSFER_MONEY) {
    return { type: ModalType.TRANSFER_MONEY };
  }
  return {
    type: "",
    name: "",
    initialBalance: 0,
  };
};

export const BaseModal: React.FC<BaseModalProps> = ({ modal }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState(initialInput);
  const [successMessage, setSuccessMessage] = useState("");

  const [error, setError] = useState("");

  const createWalletMutation = useMutationCreateWallet({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetTotalBalance] });
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
      modal.onSuccess?.();
      store.dispatch(closeModal());
      setSuccessMessage("Wallet has been created successfully");
      store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create wallet. Please try again");
    },
  });

  const createTransactionMutation = useMutationCreateTransaction({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetTotalBalance] });
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
      modal.onSuccess?.();
      store.dispatch(closeModal());
      setSuccessMessage("Transaction added successfully");
      store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
    },
    onError: (error: any) => {
      setError(error.message || "Failed to add transaction. Please try again");
    },
  });

  const transferFundsMutation = useMutationTransferFunds({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetTotalBalance] });
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
      modal.onSuccess?.();
      store.dispatch(closeModal());
      setSuccessMessage("Transfer completed successfully");
      store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
    },
    onError: (error: any) => {
      setError(error.message || "Failed to transfer funds. Please try again");
    },
  });

  const handleSubmit = () => {
    if (modal.type === ModalType.SUCCESS) {
      store.dispatch(closeModal());
      return;
    }
    setError(""); // reset error message
    if (input) {
      if (input.type === ModalType.CREATE_WALLET) {
        const walletInput = input as CreateWalletType;
        if (!walletInput.name) {
          setError("Name is required");
          return;
        }
        createWalletMutation.mutate({
          walletName: walletInput.name,
          initialBalance: {
            amount: walletInput.initialBalance,
            currency: "VND",
          },
          type: walletInput.walletType,
        });
      }
      if (input.type === ModalType.ADD_TRANSACTION) {
        const transactionInput = input as AddTransactionType;
        if (!transactionInput.amount) {
          setError("Amount is required");
          return;
        }
        if (!transactionInput.walletId) {
          setError("Please select a wallet");
          return;
        }
        if (!transactionInput.categoryId) {
          setError("Please select a category");
          return;
        }
        if (!transactionInput.date) {
          setError("Please select date");
          return;
        }
        createTransactionMutation.mutate({
          walletId: transactionInput.walletId,
          categoryId: transactionInput.categoryId,
          amount: {
            amount: transactionInput.amount,
            currency: "VND",
          },
          date: transactionInput.date,
          note: transactionInput.note,
        });
      }
      if (input.type === ModalType.TRANSFER_MONEY) {
        const transferInput = input as TransferMoneyType;
        if (!transferInput.amount) {
          setError("Amount is required");
          return;
        }
        if (!transferInput.from || !transferInput.to) {
          setError("Please select both source and destination wallets");
          return;
        }
        transferFundsMutation.mutate({
          fromWalletId: Number(transferInput.from),
          toWalletId: Number(transferInput.to),
          amount: {
            amount: transferInput.amount,
            currency: "VND",
          },
        });
      }
    }
  };
  return (
    <div
      className={
        "fixed top-0 left-0 w-full h-full bg-modal flex justify-center items-center"
      }
    >
      <div className={"bg-fg p-5 rounded-lg drop-shadow-round"}>
        {modal.type !== ModalType.SUCCESS && (
          <div>
            <div>
              <Button
                type={ButtonType.IMG}
                src={`${resources}/close.png`}
                onClick={() => {
                  store.dispatch(closeModal());
                }}
              />
            </div>
            <div className="font-bold text-lg">{modal.type}</div>
          </div>
        )}
        {modal.type === ModalType.ADD_TRANSACTION && (
          <AddTransactionForm setInput={setInput} />
        )}
        {modal.type === ModalType.TRANSFER_MONEY && (
          <TransferMoneyForm setInput={setInput} />
        )}
        {modal.type === ModalType.CREATE_WALLET && (
          <CreateWalletForm setInput={setInput} />
        )}
        {modal.type === ModalType.SUCCESS && (
          <Success message={successMessage} />
        )}
        <div className="text-red-600 mb-2">{error}</div>
        <div>
          <Button
            type={ButtonType.PRIMARY}
            onClick={handleSubmit}
            loading={
              createWalletMutation.isPending ||
              createTransactionMutation.isPending ||
              transferFundsMutation.isPending
            }
          >
            {modal.type === ModalType.SUCCESS ? "Close" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};
