"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import {
  createBudgetSchema,
  CreateBudgetFormInput,
} from "@/lib/validation/budget.schema";

interface CreateBudgetFormProps {
  onSubmit: (data: CreateBudgetFormInput) => void;
  isPending?: boolean;
}

export const CreateBudgetForm = ({ onSubmit }: CreateBudgetFormProps) => {
  const { control, handleSubmit } = useForm<CreateBudgetFormInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: "",
      total: 0,
    },
    mode: "onSubmit",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="create-budget-form">
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
