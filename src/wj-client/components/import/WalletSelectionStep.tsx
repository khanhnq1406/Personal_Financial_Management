"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { FormSelect } from "@/components/forms/FormSelect";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { cn } from "@/lib/utils/cn";

export interface WalletSelectionStepProps {
  onWalletSelected: (walletId: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function WalletSelectionStep({
  onWalletSelected,
  onBack,
  onNext,
}: WalletSelectionStepProps) {
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

  const { data: walletsData, isLoading, isError, error } = useQueryListWallets(
    { pagination: { page: 1, pageSize: 100, orderBy: "", order: "" } },
    { refetchOnMount: "always" }
  );

  const handleSelectWallet = (walletId: number) => {
    setSelectedWalletId(walletId);
    onWalletSelected(walletId);
  };

  const wallets = walletsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600 dark:text-dark-text-secondary">
            Loading wallets...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">
            Failed to load wallets. {error?.message || "Please try again."}
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-700 dark:text-yellow-300">
            No wallets found. Please create a wallet first before importing transactions.
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Instructions */}
      <div className="text-sm sm:text-base text-neutral-600 dark:text-dark-text-secondary">
        <p className="mb-2">Select the wallet where transactions will be imported.</p>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-dark-text-tertiary">
          The wallet balance will be updated based on imported transactions.
        </p>
      </div>

      {/* Wallet List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1">
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => handleSelectWallet(wallet.id)}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
              "hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-dark-surface-hover",
              "active:scale-[0.99]",
              selectedWalletId === wallet.id
                ? "border-primary-600 bg-primary-50 dark:bg-primary-950 dark:border-primary-600"
                : "border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-base text-neutral-900 dark:text-dark-text">
                  {wallet.walletName}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                  Balance: {wallet.balance?.amount?.toLocaleString()} {wallet.balance?.currency}
                </p>
              </div>
              {selectedWalletId === wallet.id && (
                <svg
                  className="w-6 h-6 text-primary-600 dark:text-primary-500 flex-shrink-0 ml-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={onNext} disabled={!selectedWalletId}>
          Next: Configure Mapping
        </Button>
      </div>
    </div>
  );
}
