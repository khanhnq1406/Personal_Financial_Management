"use client";

import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";

type TransactionHeaderProps = {
  onRefresh?: () => void;
  onAddTransaction?: () => void;
};

export const TransactionHeader = ({
  onAddTransaction,
}: TransactionHeaderProps) => {
  const handleAddTransaction = () => {
    onAddTransaction?.();
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
