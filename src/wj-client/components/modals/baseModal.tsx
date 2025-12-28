"use client";

import { BACKEND_URL, ButtonType, ModalType, resources } from "@/app/constants";
import { Button } from "../Button";
import { useEffect, useState } from "react";
import { AddTransactionForm } from "./addTransactionForm";
import { store } from "@/redux/store";
import { closeModal, openModal } from "@/redux/actions";
import { ModalPayload } from "@/redux/interface";
import { TransferMoneyForm } from "./transferMoneyForm";
import { CreateWalletForm } from "./createWalletForm";
import { Success } from "./success";
import { usePost } from "@/hooks";
import type { CreateWalletResponseData } from "@/types/api";

type BaseModalProps = {
  modal: ModalPayload | { isOpen: boolean; type: null };
};

export interface CreateWalletType {
  type: string;
  name: string;
  initialBalance: number;
}

export interface AddTransactionType {
  type: string;
  name: string;
  initialBalance: number;
}

export interface TransferMoneyType {
  type: string;
  name: string;
  initialBalance: number;
}

const initialInput = ():
  | CreateWalletType
  | AddTransactionType
  | TransferMoneyType => {
  if (store.getState().setModalReducer.type === ModalType.CREATE_WALLET) {
    return { type: ModalType.CREATE_WALLET, name: "", initialBalance: 0 };
  }
  if (store.getState().setModalReducer.type === ModalType.ADD_TRANSACTION) {
    return { type: ModalType.ADD_TRANSACTION, name: "", initialBalance: 0 };
  }
  if (store.getState().setModalReducer.type === ModalType.TRANSFER_MONEY) {
    return { type: ModalType.TRANSFER_MONEY, name: "", initialBalance: 0 };
  }
  return { type: "", name: "", initialBalance: 0 };
};

export const BaseModal: React.FC<BaseModalProps> = ({ modal }) => {
  const [input, setInput] = useState(initialInput);
  const [successMessage, setSuccessMessage] = useState("");
  useEffect(() => {
    console.log(input);
  }, [input]);

  const [error, setError] = useState("");

  const { post } = usePost<CreateWalletResponseData>(
    `${BACKEND_URL}/wallet/create`,
    {
      onSuccess: () => {
        store.dispatch(closeModal());
        setSuccessMessage("Wallet has been created successfully");
        store.dispatch(openModal({ isOpen: true, type: ModalType.SUCCESS }));
      },
      onError: () => {
        setError("Create wallet fail! Please try again");
      },
    }
  );

  const handleSubmit = () => {
    if (modal.type === ModalType.SUCCESS) {
      store.dispatch(closeModal());
      return;
    }
    setError(""); // reset error message
    if (input) {
      if (input.type === ModalType.CREATE_WALLET) {
        if (!input.name) {
          setError("Name is required");
          return;
        }
        post({
          name: input.name,
          balance: input.initialBalance,
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
          <Button type={ButtonType.PRIMARY} onClick={handleSubmit}>
            {modal.type === ModalType.SUCCESS ? "Close" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};
