"use client";

import { ButtonType, ModalType, resources } from "@/app/constants";
import { Button } from "../Button";
import { useEffect, useState } from "react";
import { AddTransactionForm } from "./addTransactionForm";
import { store } from "@/redux/store";
import { closeModal } from "@/redux/actions";
import { ModalPayload } from "@/redux/interface";
import { TransferMoneyForm } from "./transferMoneyForm";
import { CreateWalletForm } from "./createWalletForm";

type BaseModalProps = {
  modal: ModalPayload | { isOpen: boolean; type: null };
};

export const BaseModal: React.FC<BaseModalProps> = ({ modal }) => {
  const [input, setInput] = useState({});
  useEffect(() => {
    console.log(input);
  }, [input]);
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
            onClick={(e) => {
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
          <Button type={ButtonType.PRIMARY}>Save</Button>
        </div>
      </div>
    </div>
  );
};
