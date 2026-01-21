"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutationCreateBudgetItem } from "@/utils/generated/hooks";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import {
  createBudgetItemSchema,
  CreateBudgetItemFormInput,
} from "@/lib/validation/budget.schema";

interface CreateBudgetItemFormProps {
  budgetId: number;
  onSuccess?: () => void;
}

/**
 * Self-contained form component for creating budget items.
 * Owns its mutation logic, error handling, and loading state.
 * After successful creation, calls onSuccess() callback (caller handles refetch + modal close).
 */
export function CreateBudgetItemForm({
  budgetId,
  onSuccess,
}: CreateBudgetItemFormProps) {
  const [errorMessage, setErrorMessage] = useState<string>();

  const createBudgetItem = useMutationCreateBudgetItem();

  const { control, handleSubmit } = useForm<CreateBudgetItemFormInput>({
    resolver: zodResolver(createBudgetItemSchema),
    defaultValues: {
      name: "",
      total: 0,
    },
    mode: "onSubmit",
  });

  const onSubmit = (data: CreateBudgetItemFormInput) => {
    setErrorMessage("");
    createBudgetItem.mutate(
      {
        budgetId,
        name: data.name,
        total: {
          amount: data.total,
          currency: "VND",
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          setErrorMessage(
            error.message || "Failed to create budget item. Please try again",
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

      <div className="mt-4">
        <Button
          type={ButtonType.PRIMARY}
          onClick={() => {}}
          loading={createBudgetItem.isPending}
        >
          Add Item
        </Button>
      </div>
    </form>
  );
}
