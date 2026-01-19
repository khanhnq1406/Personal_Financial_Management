"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { WalletType } from "@/gen/protobuf/v1/wallet";
import {
  createWalletSchemaWithExisting,
  CreateWalletFormOutput,
} from "@/lib/validation/wallet.schema";
import { SelectOption } from "@/components/forms/FormSelect";

interface CreateWalletFormProps {
  onSubmit: (data: CreateWalletFormOutput) => void;
  isPending?: boolean;
}

export const CreateWalletForm = ({ onSubmit }: CreateWalletFormProps) => {
  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  const existingWalletNames =
    walletsData?.wallets?.map((w) => w.walletName) || [];

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="create-wallet-form">
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
    </form>
  );
};
