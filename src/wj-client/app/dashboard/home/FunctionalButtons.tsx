import { ButtonType } from "@/app/constants";
import { Button } from "@/components/Button";
import { memo } from "react";

type ModalTypeLocal = "add-transaction" | "transfer-money" | "create-wallet";

type FunctionalButtonProps = {
  onOpenModal: (type: ModalTypeLocal) => void;
};

export const FunctionalButton = memo(function FunctionalButton({
  onOpenModal,
}: FunctionalButtonProps) {
  return (
    <div className="py-5">
      <div className="mb-5">
        <Button
          variant="primary"
          type={ButtonType.PRIMARY}
          onClick={() => onOpenModal("add-transaction")}
        >
          Add Transaction
        </Button>
      </div>
      <div className="mb-5">
        <Button
          type={ButtonType.SECONDARY}
          onClick={() => onOpenModal("transfer-money")}
        >
          Transfer Money
        </Button>
      </div>
      <div>
        <Button
          type={ButtonType.SECONDARY}
          onClick={() => onOpenModal("create-wallet")}
        >
          Create New Wallet
        </Button>
      </div>
    </div>
  );
});
