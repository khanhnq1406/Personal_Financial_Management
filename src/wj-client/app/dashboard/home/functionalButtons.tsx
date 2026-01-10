import { ButtonType, ModalType } from "@/app/constants";
import { Button } from "@/components/Button";
import { openModal } from "@/redux/actions";
import { store } from "@/redux/store";
import { memo } from "react";

type FunctionalButtonProps = {
  onRefreshWallets?: () => void;
};

export const FunctionalButton = memo(function FunctionalButton({
  onRefreshWallets,
}: FunctionalButtonProps) {
  return (
    <div className="py-5">
      <div className="mb-5">
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {
            store.dispatch(
              openModal({
                isOpen: true,
                type: ModalType.ADD_TRANSACTION,
                onSuccess: onRefreshWallets,
              })
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
              openModal({
                isOpen: true,
                type: ModalType.TRANSFER_MONEY,
                onSuccess: onRefreshWallets,
              })
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
              openModal({
                isOpen: true,
                type: ModalType.CREATE_WALLET,
                onSuccess: onRefreshWallets,
              })
            );
          }}
        >
          Create New Wallet
        </Button>
      </div>
    </div>
  );
});
