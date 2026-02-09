"use client";

import React, { memo } from "react";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";

/**
 * EmptyWalletsState component props
 */
export interface EmptyWalletsStateProps {
  /** Callback when user clicks create wallet button */
  onOpenModal: () => void;
}

/**
 * EmptyWalletsState component - displayed when user has no investment wallets
 */
export const EmptyWalletsState = memo(function EmptyWalletsState({
  onOpenModal,
}: EmptyWalletsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-center">
        <p className="text-xl sm:text-2xl font-bold text-neutral-800">
          No Investment Wallets
        </p>
        <p className="text-base text-neutral-600 mt-2">
          Create an investment wallet to start tracking your portfolio
        </p>
      </div>
      <Button
        type={ButtonType.PRIMARY}
        onClick={onOpenModal}
        className="w-fit px-4"
      >
        Create Investment Wallet
      </Button>
    </div>
  );
});

/**
 * EmptyInvestmentsState component - displayed when wallet has no investments
 */
export const EmptyInvestmentsState = memo(function EmptyInvestmentsState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <p>
        No investments yet. Add your first investment to get started.
      </p>
    </div>
  );
});
