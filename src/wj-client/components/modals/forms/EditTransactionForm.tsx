"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import {
  useQueryListWallets,
  useQueryListCategories,
  useQueryGetTransaction,
} from "@/utils/generated/hooks";
import { CategoryType } from "@/gen/protobuf/v1/transaction";
import { FormToggle } from "@/components/forms/FormToggle";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormCreatableSelect } from "@/components/forms/FormCreatableSelect";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormTextarea } from "@/components/forms/FormTextarea";
import {
  updateTransactionFormSchema,
  UpdateTransactionFormInput,
} from "@/lib/validation/transaction.schema";
import { toDateTimeLocal } from "@/lib/utils/date";

interface EditTransactionFormProps {
  transactionId: number;
  onSubmit: (data: any) => void;
  isPending?: boolean;
}

export const EditTransactionForm = ({
  transactionId,
  onSubmit,
}: EditTransactionFormProps) => {
  // Fetch transaction details
  const { data: transactionData, isLoading: transactionLoading } =
    useQueryGetTransaction(
      { transactionId },
      {
        enabled: !!transactionId,
        refetchOnMount: "always",
      }
    );

  const { data: walletsData } = useQueryListWallets({
    pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
  });

  const { data: categoriesData, isLoading: categoriesLoading } =
    useQueryListCategories({
      pagination: { page: 1, pageSize: 100, orderBy: "id", order: "asc" },
    });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
  } = useForm<UpdateTransactionFormInput>({
    resolver: zodResolver(updateTransactionFormSchema),
    defaultValues: {
      transactionType: "income",
      walletId: "",
      categoryId: "",
      date: "",
      note: "",
    },
  });

  const transactionType = useWatch({
    control,
    name: "transactionType",
  });

  // Populate form with transaction data
  useEffect(() => {
    if (transactionData?.data) {
      const transaction = transactionData.data;
      const amount = transaction.amount?.amount || 0;
      const isIncom = amount >= 0;

      reset({
        transactionType: isIncom ? "income" : "expense",
        walletId: String(transaction.walletId),
        categoryId: transaction.categoryId
          ? String(transaction.categoryId)
          : "",
        date: toDateTimeLocal(transaction.date),
        note: transaction.note || "",
        amount: Math.abs(amount),
      });
    }
  }, [transactionData, reset]);

  const filteredCategories =
    categoriesData?.categories?.filter(
      (cat) =>
        cat.type ===
        (transactionType === "income"
          ? CategoryType.CATEGORY_TYPE_INCOME
          : CategoryType.CATEGORY_TYPE_EXPENSE)
    ) || [];

  // Only reset category when transaction type changes by user (not on initial load)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    // Only clear category if user manually changes transaction type
    setValue("categoryId", "");
  }, [transactionType, setValue]);

  const categoryOptions = filteredCategories.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  const walletOptions =
    (walletsData?.wallets || []).map((wallet) => ({
      value: String(wallet.id),
      label: `${wallet.walletName} (${(wallet.balance?.amount || 0).toLocaleString()} VND)`,
      balance: wallet.balance?.amount || 0,
    })) || [];

  const handleFormSubmit = (data: UpdateTransactionFormInput) => {
    onSubmit({
      transactionId,
      walletId: Number(data.walletId),
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      amount: {
        amount:
          data.transactionType === "income"
            ? data.amount
            : -Math.abs(data.amount),
        currency: "VND",
      },
      date: data.date,
      note: data.note,
    });
  };

  if (transactionLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hgreen"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} id="edit-transaction-form">
      <FormToggle
        name="transactionType"
        control={control}
        options={[
          {
            value: "income",
            label: "Income",
            className: "bg-green-500 text-white",
          },
          {
            value: "expense",
            label: "Expense",
            className: "bg-red-500 text-white",
          },
        ]}
      />

      <FormNumberInput
        name="amount"
        control={control}
        label="Amount"
        suffix="VND"
        required
      />

      <FormSelect
        name="walletId"
        control={control}
        label="Wallet"
        options={walletOptions}
        placeholder="Select wallet"
        required
      />

      <FormCreatableSelect
        name="categoryId"
        control={control}
        label="Category"
        options={categoryOptions}
        placeholder="Select category..."
        required
        loading={categoriesLoading}
        onCreate={undefined} // Disable category creation in edit mode
      />

      <FormDateTimePicker
        name="date"
        control={control}
        label="Date & Time"
        required
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
