import { ButtonType, ModalType } from "@/app/constants";
import { Button } from "@/components/Button";
import { openModal } from "@/redux/actions";
import { store } from "@/redux/store";
import { memo } from "react";

export const FunctionalButton = memo(function FunctionalButton() {
  return (
    <div className="py-5">
      <div className="mb-5">
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {
            store.dispatch(
              openModal({ isOpen: true, type: ModalType.ADD_TRANSACTION })
            );
          }}
        >
          Add Transaction
        </Button>
      </div>
      <div className="mb-5">
        <Button
          type={ButtonType.SECONDARY}
          onClick={() => {
            store.dispatch(
              openModal({ isOpen: true, type: ModalType.TRANSFER_MONEY })
            );
          }}
        >
          Transfer Money
        </Button>
      </div>
      <div>
        <Button
          type={ButtonType.SECONDARY}
          onClick={() => {
            store.dispatch(
              openModal({ isOpen: true, type: ModalType.CREATE_WALLET })
            );
          }}
        >
          Create New Wallet
        </Button>
      </div>
    </div>
  );
});
