"use client";

import { useState } from "react";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Button } from "@/components/Button";
import Image from "next/image";
import { ButtonType, resources } from "@/app/constants";
import { WalletGrid } from "./WalletGrid";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import { BaseModal } from "@/components/modals/BaseModal";
import { CreateWalletForm } from "@/components/modals/forms/CreateWalletForm";
import { EditWalletForm } from "@/components/modals/forms/EditWalletForm";
import { DeleteWalletModal } from "@/components/modals/DeleteWalletModal";
import {
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
} from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";

type ModalState =
  | { type: "create-wallet" }
  | { type: "edit-wallet"; wallet: Wallet }
  | { type: "delete-wallet"; wallet: Wallet }
  | null;

export default function WalletsPage() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<ModalState>(null);

  const getListWallets = useQueryListWallets(
    { pagination: { page: 1, pageSize: 10, orderBy: "", order: "" } },
    { refetchOnMount: "always" },
  );

  const handleCreateWallet = () => {
    setModalState({ type: "create-wallet" });
  };

  const handleEditWallet = (wallet: Wallet) => {
    setModalState({ type: "edit-wallet", wallet });
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    setModalState({ type: "delete-wallet", wallet });
  };

  const handleCloseModal = () => {
    setModalState(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
    queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetTotalBalance] });
    handleCloseModal();
  };

  const getModalTitle = () => {
    switch (modalState?.type) {
      case "create-wallet":
        return "Create Wallet";
      case "edit-wallet":
        return "Edit Wallet";
      case "delete-wallet":
        return "";
      default:
        return "";
    }
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

      {/* Create Wallet Modal */}
      {modalState?.type === "create-wallet" && (
        <BaseModal
          isOpen={modalState.type === "create-wallet"}
          onClose={handleCloseModal}
          title={getModalTitle()}
        >
          <CreateWalletForm onSuccess={handleModalSuccess} />
        </BaseModal>
      )}

      {/* Edit Wallet Modal */}
      {modalState?.type === "edit-wallet" && (
        <BaseModal
          isOpen={modalState.type === "edit-wallet"}
          onClose={handleCloseModal}
          title={getModalTitle()}
        >
          <EditWalletForm
            wallet={modalState.wallet}
            onSuccess={handleModalSuccess}
          />
        </BaseModal>
      )}

      {/* Delete Wallet Modal */}
      {modalState?.type === "delete-wallet" && (
        <div className="fixed inset-0 bg-modal flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <DeleteWalletModal
              wallet={modalState.wallet}
              onSuccess={handleModalSuccess}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
