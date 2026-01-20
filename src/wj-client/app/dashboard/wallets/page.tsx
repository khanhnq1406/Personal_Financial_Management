"use client";

import { useQueryListWallets } from "@/utils/generated/hooks";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Button } from "@/components/Button";
import Image from "next/image";
import { store } from "@/redux/store";
import { openModal } from "@/redux/actions";
import { ModalType, ButtonType, resources } from "@/app/constants";
import { WalletGrid } from "./WalletGrid";
import { Wallet } from "@/gen/protobuf/v1/wallet";

export default function WalletsPage() {
  const getListWallets = useQueryListWallets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } },
    { refetchOnMount: "always" },
  );

  const handleCreateWallet = () => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.CREATE_WALLET,
        onSuccess: () => {
          getListWallets.refetch();
        },
      }),
    );
  };

  const handleEditWallet = (wallet: Wallet) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.EDIT_WALLET,
        data: { wallet },
        onSuccess: () => {
          getListWallets.refetch();
        },
      }),
    );
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    store.dispatch(
      openModal({
        isOpen: true,
        type: ModalType.DELETE_WALLET,
        data: { wallet },
        onSuccess: () => {
          getListWallets.refetch();
        },
      }),
    );
  };

  if (getListWallets.isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner text="Loading wallets..." />
      </div>
    );
  }

  if (getListWallets.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-lred">Error loading wallets</div>
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => getListWallets.refetch()}
          className="w-fit px-5"
        >
          Retry
        </Button>
      </div>
    );
  }

  const wallets = getListWallets.data?.wallets ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Wallets</h1>
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleCreateWallet}
          className="px-4 py-2 rounded-md drop-shadow-round w-fit"
        >
          <div className="flex items-center gap-2">
            <Image
              src={`${resources}/plus.png`}
              alt="Add"
              width={20}
              height={20}
            />
            <span>Create new wallet</span>
          </div>
        </Button>
      </div>

      {/* Wallet Cards Grid */}
      <WalletGrid
        wallets={wallets}
        isLoading={getListWallets.isLoading}
        onEdit={handleEditWallet}
        onDelete={handleDeleteWallet}
      />
    </div>
  );
}
