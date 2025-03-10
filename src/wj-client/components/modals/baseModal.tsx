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

export interface BaseType {
  type: string;
}
export interface CreateWalletType extends BaseType {
  name: string;
  initialBalance: number;
}

const initialInput = (): BaseType | CreateWalletType | undefined => {
  if (store.getState().setModalReducer.type === ModalType.CREATE_WALLET) {
    return { type: ModalType.CREATE_WALLET, name: "", initialBalance: 0 };
  }
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
        fetcher(`${BACKEND_URL}/auth/logout`, {
          method: "POST",
          body: JSON.stringify({
            name: input.name,
            initialBalance: input.initialBalance,
          }),
          headers: { "Content-Type": "application/json" },
        })
          .then((res) => {
            console.log(res);
            if (res.ok) {
            }
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
        <div>
          <Button type={ButtonType.PRIMARY} onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
