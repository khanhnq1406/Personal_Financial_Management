"use client";

import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType } from "@/app/constants";

type TransactionHeaderProps = {
  onRefresh?: () => void;
};

export const TransactionHeader = ({ onRefresh }: TransactionHeaderProps) => {
  const handleAddTransaction = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.ADD_TRANSACTION,
        onSuccess: onRefresh,
      })
    );
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="font-semibold text-xl">Transaction History</div>
      <Button
        type={ButtonType.PRIMARY}
        onClick={handleAddTransaction}
        className="px-6 py-2"
      >
        + Add New
      </Button>
    </div>
  );
};
