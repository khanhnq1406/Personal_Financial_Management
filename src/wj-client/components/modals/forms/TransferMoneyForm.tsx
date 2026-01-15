"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryListWallets } from "@/utils/generated/hooks";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormTextarea } from "@/components/forms/FormTextarea";
import {
  transferMoneySchemaWithBalances,
  TransferMoneyFormInput,
} from "@/lib/validation/transfer.schema";
import { SelectOption } from "@/components/forms/FormSelect";
import { toDateTimeLocal, getCurrentTimestamp } from "@/lib/utils/date";

interface TransferMoneyFormProps {
  onSubmit: (data: any) => void;
  isPending?: boolean;
}

export const TransferMoneyForm = ({
  onSubmit,
  isPending = false,
}: TransferMoneyFormProps) => {
  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  const wallets = walletsData?.wallets || [];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferMoneyFormInput>({
    resolver: zodResolver(
      transferMoneySchemaWithBalances(
        wallets.map((w) => ({ id: w.id, balance: w.balance?.amount || 0 }))
      )
    ),
    defaultValues: {
      fromWalletId: "",
      toWalletId: "",
      datetime: toDateTimeLocal(getCurrentTimestamp()),
      note: "",
    },
  });

  const fromWalletId = useWatch({
    control,
    name: "fromWalletId",
  });

  const availableToWallets = fromWalletId
    ? wallets.filter((w) => String(w.id) !== fromWalletId)
    : wallets;

  const formatWalletOption = (wallet: SelectOption): string => {
    const walletData = wallets.find((w) => w.id === Number(wallet.value));
    const balance = walletData?.balance?.amount || 0;
    return `${wallet.label} (${balance.toLocaleString()} VND)`;
  };

  const walletOptions: SelectOption[] = wallets.map((wallet) => ({
    value: wallet.id,
    label: wallet.walletName,
    balance: wallet.balance?.amount || 0,
  }));

  const toWalletOptions: SelectOption[] = availableToWallets.map((wallet) => ({
    value: wallet.id,
    label: wallet.walletName,
    balance: wallet.balance?.amount || 0,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="transfer-money-form">
      <FormNumberInput
        name="amount"
        control={control}
        label="Amount"
        suffix="VND"
        required
      />

      <FormSelect
        name="fromWalletId"
        control={control}
        label="From"
        options={walletOptions}
        placeholder="Select source wallet"
        required
        loading={walletsLoading}
        formatOption={formatWalletOption}
      />

      <FormSelect
        name="toWalletId"
        control={control}
        label="To"
        options={toWalletOptions}
        placeholder={
          !fromWalletId
            ? "Select source wallet first"
            : "Select destination wallet"
        }
        required
        loading={walletsLoading}
        disabled={!fromWalletId}
        formatOption={formatWalletOption}
      />

      <FormDateTimePicker
        name="datetime"
        control={control}
        label="Date & Time"
      />

      <FormTextarea
        name="note"
        control={control}
        label="Note"
        placeholder="Enter note (optional)"
        maxLength={500}
        showCharacterCount
      />
    </form>
  );
};
