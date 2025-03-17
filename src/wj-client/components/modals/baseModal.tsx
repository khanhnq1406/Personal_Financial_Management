"use client";

import { BACKEND_URL, ButtonType, ModalType, resources } from "@/app/constants";
import { Button } from "../Button";
import { useEffect, useState } from "react";
import { AddTransactionForm } from "./addTransactionForm";
import { store } from "@/redux/store";
import { closeModal } from "@/redux/actions";
import { ModalPayload } from "@/redux/interface";
import { TransferMoneyForm } from "./transferMoneyForm";
import { CreateWalletForm } from "./createWalletForm";
import fetcher from "@/utils/fetcher";

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

const initialInput = (): CreateWalletType | AddTransactionType | TransferMoneyType => {
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
  useEffect(() => {
    console.log(input);
  }, [input]);

  const handleSubmit = () => {
    console.log(input);
    if (input) {
      if (input.type === ModalType.CREATE_WALLET) {
        // TODO: Log error if input.name is empty
        fetcher(`${BACKEND_URL}/wallet/create`, {
          method: "POST",
          body: JSON.stringify({
            name: input.name,
            balance: input.initialBalance,
          }),
          headers: { "Content-Type": "application/json" },
        })
          .then((res) => {
            if (res.ok) {
              store.dispatch(closeModal());
            }
            // TODO: Log error if creating wallet fails
          })
          .catch((err) => console.log(err));
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
        {modal.type === ModalType.ADD_TRANSACTION && (
          <AddTransactionForm setInput={setInput} />
        )}
        {modal.type === ModalType.TRANSFER_MONEY && (
          <TransferMoneyForm setInput={setInput} />
        )}
        {modal.type === ModalType.CREATE_WALLET && (
          <CreateWalletForm setInput={setInput} />
        )}
        {/* TODO: Create error message component */}
        <div>
          <Button type={ButtonType.PRIMARY} onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
