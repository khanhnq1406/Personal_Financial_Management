"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { Wallet } from "@/gen/protobuf/v1/wallet";
import {
  updateWalletSchema,
  UpdateWalletFormOutput,
} from "@/lib/validation/wallet.schema";

interface EditWalletFormProps {
  wallet: Wallet;
  onSubmit: (data: UpdateWalletFormOutput) => void;
  isPending?: boolean;
}

export const EditWalletForm = ({ wallet, onSubmit, isPending }: EditWalletFormProps) => {
  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  // Filter out current wallet from the list when checking for name conflicts
  const existingWalletNames =
    walletsData?.wallets
      ?.filter((w) => w.id !== wallet.id)
      .map((w) => w.walletName) || [];

  const { control, handleSubmit, reset } = useForm<UpdateWalletFormOutput>({
    resolver: zodResolver(updateWalletSchema(existingWalletNames, wallet.walletName)),
    defaultValues: {
      walletName: "",
    },
    mode: "onSubmit",
  });

  // Populate form with existing wallet data
  useEffect(() => {
    reset({
      walletName: wallet.walletName,
    });
  }, [wallet, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="edit-wallet-form">
      <FormInput
        name="walletName"
        control={control}
        label="Name"
        placeholder="Enter wallet's name"
        required
        disabled={isPending}
      />
    </form>
  );
};
