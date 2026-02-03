"use client";

import { useState } from "react";
import { BaseCard } from "@/components/BaseCard";
import { Wallets } from "./Walllets";
import { Balance } from "./Balance";
import { Dominance } from "./Dominance";
import { MonthlyDominance } from "./MonthlyDominance";
import { AccountBalance } from "./AccountBalance";
import { User } from "./User";
import { TotalBalance } from "./TotalBalance";
import { FunctionalButton } from "./FunctionalButtons";
import {
  useQueryListWallets,
  useQueryGetAvailableYears,
  EVENT_WalletGetBalanceHistory,
  EVENT_WalletGetMonthlyDominance,
} from "@/utils/generated/hooks";
import { BaseModal } from "@/components/modals/BaseModal";
import { CreateWalletForm } from "@/components/modals/forms/CreateWalletForm";
import { AddTransactionForm } from "@/components/modals/forms/AddTransactionForm";
import { TransferMoneyForm } from "@/components/modals/forms/TransferMoneyForm";
import { useQueryClient } from "@tanstack/react-query";
import {
  EVENT_WalletListWallets,
  EVENT_WalletGetTotalBalance,
  EVENT_TransactionListTransactions,
} from "@/utils/generated/hooks";

type ModalType = "add-transaction" | "transfer-money" | "create-wallet" | null;

export default function Home() {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<ModalType>(null);

  const getListWallets = useQueryListWallets(
    {
      pagination: { page: 1, pageSize: 10, orderBy: "", order: "" },
    },
    { refetchOnMount: "always" },
  );

  // Fetch available years once and pass to child components
  const { data: availableYearsData } = useQueryGetAvailableYears(
    {},
    { refetchOnMount: "always" },
  );

  // Use available years from API, or default to current year if no transactions
  const availableYears = availableYearsData?.years?.length
    ? availableYearsData.years
    : [new Date().getFullYear()];

  const handleModalClose = () => setModalType(null);

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return [
          EVENT_WalletListWallets,
          EVENT_WalletGetTotalBalance,
          EVENT_TransactionListTransactions,
          EVENT_WalletGetBalanceHistory,
          EVENT_WalletGetMonthlyDominance,
        ].includes(key);
      },
    });
    handleModalClose();
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "add-transaction":
        return "Add Transaction";
      case "transfer-money":
        return "Transfer Money";
      case "create-wallet":
        return "Create Wallet";
      default:
        return "";
    }
  };

  return (
    <div className="lg:grid lg:grid-cols-[70%_30%] lg:divide-x-2">
      <div className="lg:hidden bg-[linear-gradient(to_bottom,#008148_50%,#F7F8FC_50%)] border-none flex justify-center px-4">
        <div className="w-full max-w-md">
          <TotalBalance />
        </div>
      </div>
      <div className="flex justify-center py-2 sm:py-4 border-none px-3 sm:px-4">
        <div className="w-full max-w-4xl mb-3">
          <div className="font-semibold my-2 text-sm sm:text-base">
            My Wallets
          </div>
          <BaseCard>
            <Wallets getListWallets={getListWallets} />
          </BaseCard>
          <div className="font-semibold mt-3 sm:mt-4 mb-2 text-sm sm:text-base">
            Total balance fluctuation
          </div>
          <BaseCard>
            <Balance availableYears={availableYears} />
          </BaseCard>
          <div className="font-semibold mt-3 sm:mt-4 mb-2 text-sm sm:text-base">
            Dominance
          </div>
          <BaseCard>
            <Dominance availableYears={availableYears} />
          </BaseCard>
          <div className="font-semibold mt-3 sm:mt-4 mb-2 text-sm sm:text-base">
            Monthly Dominance
          </div>
          <BaseCard>
            <MonthlyDominance availableYears={availableYears} />
          </BaseCard>
          <div className="font-semibold mt-3 sm:mt-4 mb-2 text-sm sm:text-base">
            Account Balance
          </div>
          <BaseCard>
            <AccountBalance availableYears={availableYears} />
          </BaseCard>
        </div>
      </div>
      <div className="px-3 sm:px-4 ">
        <div className="grid divide-y-2">
          <User />
          <TotalBalance />
          <FunctionalButton onOpenModal={(type) => setModalType(type)} />
        </div>
      </div>

      {/* Mobile Functional Buttons */}
      {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-3 z-40">
        <FunctionalButton onOpenModal={(type) => setModalType(type)} />
      </div> */}

      {/* Modals */}
      <BaseModal
        isOpen={modalType !== null}
        onClose={handleModalClose}
        title={getModalTitle()}
      >
        {modalType === "add-transaction" && (
          <AddTransactionForm onSuccess={handleModalSuccess} />
        )}
        {modalType === "transfer-money" && (
          <TransferMoneyForm onSuccess={handleModalSuccess} />
        )}
        {modalType === "create-wallet" && (
          <CreateWalletForm onSuccess={handleModalSuccess} />
        )}
      </BaseModal>
    </div>
  );
}
