"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import {
  useQueryListWallets,
  useQueryListCategories,
  useMutationCreateCategory,
  EVENT_CategoryListCategories,
} from "@/utils/generated/hooks";
import { CategoryType } from "@/gen/protobuf/v1/transaction";
import { FormToggle } from "@/components/forms/FormToggle";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormCreatableSelect } from "@/components/forms/FormCreatableSelect";
import { FormDateTimePicker } from "@/components/forms/FormDateTimePicker";
import { FormTextarea } from "@/components/forms/FormTextarea";
import {
  createTransactionFormSchema,
  CreateTransactionFormInput,
} from "@/lib/validation/transaction.schema";
import { SelectOption } from "@/components/forms/FormSelect";
import { getCurrentTimestamp, toDateTimeLocal } from "@/lib/utils/date";
import { useQueryClient } from "@tanstack/react-query";

interface AddTransactionFormProps {
  onSubmit: (data: any) => void;
  isPending?: boolean;
}

export const AddTransactionForm = ({
  onSubmit,
  isPending = false,
}: AddTransactionFormProps) => {
  const queryClient = useQueryClient();
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  const { data: walletsData, isLoading: walletsLoading } = useQueryListWallets({
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
    formState: { errors },
  } = useForm<CreateTransactionFormInput>({
    resolver: zodResolver(createTransactionFormSchema),
    defaultValues: {
      transactionType: "income",
      walletId: "",
      categoryId: "",
      date: toDateTimeLocal(getCurrentTimestamp()),
      note: "",
    },
  });

  const transactionType = useWatch({
    control,
    name: "transactionType",
  });

  const filteredCategories =
    categoriesData?.categories?.filter(
      (cat) =>
        cat.type ===
        (transactionType === "income"
          ? CategoryType.CATEGORY_TYPE_INCOME
          : CategoryType.CATEGORY_TYPE_EXPENSE)
    ) || [];

  const createCategoryMutation = useMutationCreateCategory({
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [EVENT_CategoryListCategories],
      });
      if (data.data?.id) {
        setSelectedCategoryName(data.data.name);
        setValue("categoryId", String(data.data.id));
      }
    },
  });

  // Reset category when transaction type changes
  useEffect(() => {
    setValue("categoryId", "");
    setSelectedCategoryName("");
  }, [transactionType, setValue]);

  const walletOptions: SelectOption[] =
    (walletsData?.wallets || []).map((wallet) => ({
      value: wallet.id,
      label: `${wallet.walletName} (${(
        wallet.balance?.amount || 0
      ).toLocaleString()} VND)`,
      balance: wallet.balance?.amount || 0,
    })) || [];

  const categoryOptions = filteredCategories.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  const handleCreateCategory = async (categoryName: string) => {
    await createCategoryMutation.mutateAsync({
      name: categoryName,
      type:
        transactionType === "income"
          ? CategoryType.CATEGORY_TYPE_INCOME
          : CategoryType.CATEGORY_TYPE_EXPENSE,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="add-transaction-form">
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
        loading={walletsLoading}
      />

      <FormCreatableSelect
        name="categoryId"
        control={control}
        label="Category"
        options={categoryOptions}
        placeholder="Select or create category..."
        required
        loading={categoriesLoading || createCategoryMutation.isPending}
        onCreate={handleCreateCategory}
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
