"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { BudgetItem } from "@/gen/protobuf/v1/budget";
import {
  updateBudgetItemSchema,
  UpdateBudgetItemFormInput,
} from "@/lib/validation/budget.schema";

interface EditBudgetItemFormProps {
  item: BudgetItem;
  onSubmit: (data: UpdateBudgetItemFormInput) => void;
  isPending?: boolean;
}

export const EditBudgetItemForm = ({
  item,
  onSubmit,
}: EditBudgetItemFormProps) => {
  const { control, handleSubmit, reset } = useForm<UpdateBudgetItemFormInput>({
    resolver: zodResolver(updateBudgetItemSchema),
    defaultValues: {
      name: "",
      total: 0,
    },
    mode: "onSubmit",
  });

  // Populate form with existing budget item data
  useEffect(() => {
    reset({
      name: item.name,
      total: item.total?.amount || 0, // Convert from int64 to float
    });
  }, [item, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="edit-budget-item-form">
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
