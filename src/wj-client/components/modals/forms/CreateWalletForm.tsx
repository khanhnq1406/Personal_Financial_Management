"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQueryListWallets,
  useMutationCreateWallet,
} from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import {
  createWalletSchemaWithExisting,
  CreateWalletFormOutput,
} from "@/lib/validation/wallet.schema";
import { SelectOption } from "@/components/forms/FormSelect";
import { useMemo } from "react";

interface CreateWalletFormProps {
  onSuccess?: () => void;
}

/**
 * Self-contained form component for creating wallets.
 * Owns its mutation logic, error handling, and loading state.
 * After successful creation, calls onSuccess() callback (caller handles refetch + modal close).
 */
export function CreateWalletForm({ onSuccess }: CreateWalletFormProps) {
  const createWallet = useMutationCreateWallet();
  const [errorMessage, setErrorMessage] = useState<string>();

  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  const existingWalletNames = useMemo(
    () => walletsData?.wallets?.map((w) => w.walletName) || [],
    [walletsData],
  );

  const { control, handleSubmit } = useForm<CreateWalletFormOutput>({
    resolver: zodResolver(createWalletSchemaWithExisting(existingWalletNames)),
    defaultValues: {
      walletName: "",
      initialBalance: 0,
      type: WalletType.BASIC,
    },
    mode: "onSubmit",
  });

  const walletTypeOptions: SelectOption[] = [
    { value: WalletType.BASIC, label: "Basic" },
    { value: WalletType.INVESTMENT, label: "Investment" },
  ];

  const onSubmit = (data: CreateWalletFormOutput) => {
    setErrorMessage("");
    createWallet.mutate(
      {
        walletName: data.walletName,
        initialBalance: {
          amount: data.initialBalance,
          currency: "VND",
        },
        type: data.type,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          setErrorMessage(
            error.message || "Failed to create wallet. Please try again",
          );
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && (
        <div className="bg-red-50 text-lred p-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <FormInput
        name="walletName"
        control={control}
        label="Name"
        placeholder="Enter wallet's name"
        required
      />

      <FormNumberInput
        name="initialBalance"
        control={control}
        label="Initial Balance"
        suffix="VND"
      />

      <FormSelect
        name="type"
        control={control}
        label="Wallet Type"
        options={walletTypeOptions}
        placeholder="Select wallet type"
      />

      <div className="mt-4">
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {}}
          loading={createWallet.isPending}
        >
          Create
        </Button>
      </div>
    </form>
  );
}
