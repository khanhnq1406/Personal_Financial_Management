"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import {
  updateWalletSchema,
  UpdateWalletFormOutput,
  adjustBalanceSchema,
  AdjustBalanceFormOutput,
} from "@/lib/validation/wallet.schema";

interface EditWalletFormProps {
  wallet: Wallet;
  onSubmit: (
    data: UpdateWalletFormOutput,
    adjustment?: AdjustBalanceFormOutput,
  ) => void;
  isPending?: boolean;
}

export const EditWalletForm = ({
  wallet,
  onSubmit,
  isPending,
}: EditWalletFormProps) => {
  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  // Filter out current wallet from the list when checking for name conflicts
  const existingWalletNames =
    walletsData?.wallets
      ?.filter((w) => w.id !== wallet.id)
      .map((w) => w.walletName) || [];

  // State for balance adjustment section
  const [showAdjustment, setShowAdjustment] = useState(false);

  const { control, handleSubmit, reset, watch, setError } = useForm<{
    walletName: string;
    adjustmentAmount?: number;
    adjustmentType?: "add" | "remove";
    reason?: string;
  }>({
    defaultValues: {
      walletName: "",
      adjustmentAmount: 0,
      adjustmentType: "add",
      reason: "",
    },
    mode: "onSubmit",
  });

  // Populate form with existing wallet data
  useEffect(() => {
    reset({
      walletName: wallet.walletName,
      adjustmentAmount: 0,
      adjustmentType: "add",
      reason: "",
    });
  }, [wallet, reset]);

  const watchAdjustmentAmount = watch("adjustmentAmount");
  const watchAdjustmentType = watch("adjustmentType");

  const onFormSubmit = (data: typeof control._defaultValues) => {
    // Validate wallet name
    const walletResult = updateWalletSchema(
      existingWalletNames,
      wallet.walletName,
    ).safeParse({
      walletName: data.walletName,
    });

    if (!walletResult.success) {
      walletResult.error.issues.forEach((issue) => {
        if (issue.path[0] === "walletName") {
          setError("walletName" as const, { message: issue.message });
        }
      });
      return;
    }

    const walletData: UpdateWalletFormOutput = walletResult.data;

    let adjustment: AdjustBalanceFormOutput | undefined;

    if (
      showAdjustment &&
      data.adjustmentAmount &&
      data.adjustmentAmount !== 0
    ) {
      // Validate adjustment amount and type
      const result = adjustBalanceSchema.safeParse({
        adjustmentAmount: data.adjustmentAmount,
        adjustmentType: data.adjustmentType || "add",
        reason: data.reason,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          if (issue.path[0] === "adjustmentAmount") {
            setError("adjustmentAmount" as const, { message: issue.message });
          }
          if (issue.path[0] === "adjustmentType") {
            setError("adjustmentType" as const, { message: issue.message });
          }
          if (issue.path[0] === "reason") {
            setError("reason" as const, { message: issue.message });
          }
        });
        return;
      }

      adjustment = result.data;
    }

    onSubmit(walletData, adjustment);
  };

  // Calculate projected balance
  const currentBalance = wallet.balance?.amount || 0;
  const adjustmentAmount = watchAdjustmentAmount || 0;
  const adjustmentType = watchAdjustmentType || "add";
  const isAdd = adjustmentType === "add";
  const delta = isAdd ? adjustmentAmount : -adjustmentAmount;
  const projectedBalance = currentBalance + delta;

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      id="edit-wallet-form"
      className="space-y-4"
    >
      {/* Wallet Name Section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Wallet Information</h3>
        <FormInput
          name="walletName"
          control={control}
          label="Name"
          placeholder="Enter wallet's name"
          required
          disabled={isPending}
        />
      </div>

      {/* Balance Adjustment Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Balance Adjustment</h3>
          <button
            type="button"
            onClick={() => setShowAdjustment(!showAdjustment)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdjustment ? "Cancel" : "Adjust Balance"}
          </button>
        </div>

        {showAdjustment && (
          <div className="space-y-3 bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600 mb-2">
              Current Balance: {currentBalance.toLocaleString()} VND
            </div>

            {/* Adjustment Type Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...control.register("adjustmentType")}
                    value="add"
                    className="mr-2"
                    disabled={isPending}
                  />
                  <span className="text-sm">Add funds</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...control.register("adjustmentType")}
                    value="remove"
                    className="mr-2"
                    disabled={isPending}
                  />
                  <span className="text-sm">Remove funds</span>
                </label>
              </div>
            </div>

            <FormNumberInput
              name="adjustmentAmount"
              control={control}
              label="Adjustment Amount (VND)"
              placeholder="Enter amount"
              step="1"
              min={0}
              disabled={isPending}
            />
            <div className="text-xs text-gray-500 ml-1 -mt-1">
              Enter the amount to add or remove from your wallet
            </div>

            {adjustmentAmount !== 0 && adjustmentAmount !== undefined && (
              <div className="text-sm">
                <span className="text-gray-600">Projected Balance: </span>
                <span
                  className={`font-medium ${projectedBalance < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {projectedBalance.toLocaleString()} VND
                </span>
              </div>
            )}

            <FormInput
              name="reason"
              control={control}
              label="Reason (Optional)"
              placeholder="Why are you adjusting this balance?"
              disabled={isPending}
            />

            <div className="text-xs text-gray-500 mt-2">
              This will create a transaction record for audit purposes.
            </div>
          </div>
        )}
      </div>
    </form>
  );
};
