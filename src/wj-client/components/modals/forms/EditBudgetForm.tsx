"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { Budget } from "@/gen/protobuf/v1/budget";
import {
  updateBudgetSchema,
  UpdateBudgetFormInput,
} from "@/lib/validation/budget.schema";

interface EditBudgetFormProps {
  budget: Budget;
  onSubmit: (data: UpdateBudgetFormInput) => void;
  isPending?: boolean;
}

export const EditBudgetForm = ({ budget, onSubmit }: EditBudgetFormProps) => {
  const { control, handleSubmit, reset } = useForm<UpdateBudgetFormInput>({
    resolver: zodResolver(updateBudgetSchema),
    defaultValues: {
      name: "",
      total: 0,
    },
    mode: "onSubmit",
  });

  // Populate form with existing budget data
  useEffect(() => {
    reset({
      name: budget.name,
      total: budget.total?.amount || 0,
    });
  }, [budget, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="edit-budget-form">
      <FormInput
        name="name"
        control={control}
        label="Budget Name"
        placeholder="e.g., Monthly Budget"
        required
      />

      <FormNumberInput
        name="total"
        control={control}
        label="Total Amount"
        placeholder="0"
        suffix="VND"
        required
        min={1}
        step="1"
      />
    </form>
  );
};
