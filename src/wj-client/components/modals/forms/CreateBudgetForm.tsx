"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutationCreateBudget } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import {
  createBudgetSchema,
  CreateBudgetFormInput,
} from "@/lib/validation/budget.schema";

interface CreateBudgetFormProps {
  onSuccess?: () => void;
}

/**
 * Self-contained form component for creating budgets.
 * Owns its mutation logic, error handling, and loading state.
 * After successful creation, calls onSuccess() callback (caller handles refetch + modal close).
 */
export function CreateBudgetForm({ onSuccess }: CreateBudgetFormProps) {
  const [errorMessage, setErrorMessage] = useState<string>();

  const createBudget = useMutationCreateBudget();

  const { control, handleSubmit } = useForm<CreateBudgetFormInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: "",
      total: 0,
    },
    mode: "onSubmit",
  });

  const onSubmit = (data: CreateBudgetFormInput) => {
    setErrorMessage("");
    createBudget.mutate(
      {
        name: data.name,
        total: {
          amount: data.total,
          currency: "VND",
        },
        items: [],
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          setErrorMessage(
            error.message || "Failed to create budget. Please try again",
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

      <div className="mt-4">
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {}}
          loading={createBudget.isPending}
        >
          Create
        </Button>
      </div>
    </form>
  );
}
