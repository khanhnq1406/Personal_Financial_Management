"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import {
  createBudgetItemSchema,
  CreateBudgetItemFormInput,
} from "@/lib/validation/budget.schema";

interface CreateBudgetItemFormProps {
  onSubmit: (data: CreateBudgetItemFormInput) => void;
  isPending?: boolean;
}

export const CreateBudgetItemForm = ({
  onSubmit,
}: CreateBudgetItemFormProps) => {
  const { control, handleSubmit } = useForm<CreateBudgetItemFormInput>({
    resolver: zodResolver(createBudgetItemSchema),
    defaultValues: {
      name: "",
      total: 0,
    },
    mode: "onSubmit",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="create-budget-item-form">
      <FormInput
        name="name"
        control={control}
        label="Budget Item Name"
        placeholder="e.g., Groceries"
        required
      />

      <FormNumberInput
        name="total"
        control={control}
        label="Allocated Amount"
        placeholder="0"
        suffix="VND"
        required
        min={1}
        step="1"
      />
    </form>
  );
};
