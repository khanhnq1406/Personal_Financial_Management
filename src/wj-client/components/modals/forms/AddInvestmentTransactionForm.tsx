"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { SelectOption } from "@/components/forms/FormSelect";
import { FormInput } from "@/components/forms/FormInput";
import { ErrorMessage } from "@/components/forms/ErrorMessage";
import { useMutationAddInvestmentTransaction } from "@/utils/generated/hooks";
import {
  InvestmentTransactionType,
  InvestmentType,
} from "@/gen/protobuf/v1/investment";
import type { AddTransactionRequest } from "@/gen/protobuf/v1/investment";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  quantityToStorage,
  amountToSmallestUnit,
  getQuantityInputConfig,
} from "@/lib/utils/units";
import {
  AddTransactionFormInput,
  addTransactionSchema,
} from "@/lib/validation/investment.schema";

interface AddInvestmentTransactionFormProps {
  investmentId: number;
  investmentType: InvestmentType;
  investmentCurrency?: string;  // Currency of the parent investment (ISO 4217)
  onSuccess?: () => void;
}

const transactionTypeOptions: SelectOption[] = [
  {
    value: InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY,
    label: "Buy",
  },
  {
    value: InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_SELL,
    label: "Sell",
  },
  {
    value: InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_DIVIDEND,
    label: "Dividend",
  },
];

/**
 * Self-contained form component for adding investment transactions.
 * Follows the established pattern of other form components in the codebase.
 * Owns its mutation logic, error handling, and loading state.
 */
export function AddInvestmentTransactionForm({
  investmentId,
  investmentType,
  investmentCurrency = "USD",
  onSuccess,
}: AddInvestmentTransactionFormProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const addTransactionMutation = useMutationAddInvestmentTransaction({
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Transaction added successfully");
      setShowSuccess(true);
      setErrorMessage("");
      // Invalidate related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return ["Investment", "investments"].some((k) => key.includes(k));
        },
      });
    },
    onError: (error: any) => {
      setErrorMessage(
        error.message || "Failed to add transaction. Please try again",
      );
    },
  });

  // Get quantity input configuration from utilities
  const quantityConfig = getQuantityInputConfig(investmentType);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AddTransactionFormInput>({
    resolver: zodResolver(addTransactionSchema),
    defaultValues: {
      type: InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY,
      quantity: 0,
      price: 0,
      fees: 0,
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = (data: AddTransactionFormInput) => {
    setErrorMessage(undefined);

    // Convert to API format using utility functions
    const request: AddTransactionRequest = {
      investmentId: investmentId,
      type: data.type,
      quantity: quantityToStorage(data.quantity, investmentType),
      price: amountToSmallestUnit(data.price, investmentCurrency),
      fees: amountToSmallestUnit(data.fees, investmentCurrency),
      transactionDate: Math.floor(
        new Date(data.transactionDate).getTime() / 1000,
      ),
      notes: "",
    };

    addTransactionMutation.mutate(request);
  };

  // Show success state
  if (showSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-hgreen text-6xl mb-4">✓</div>
        <h3 className="text-lg font-semibold mb-2">Transaction Added!</h3>
        <p className="text-gray-600 mb-6">{successMessage}</p>
        <Button type={ButtonType.PRIMARY} onClick={onSuccess}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error message */}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {/* Transaction Type */}
      <FormSelect
        name="type"
        control={control}
        label="Transaction Type"
        options={transactionTypeOptions}
        placeholder="Select transaction type"
        required
        disabled={isSubmitting}
      />

      {/* Quantity */}
      <FormNumberInput
        name="quantity"
        control={control}
        label="Quantity"
        placeholder={quantityConfig.placeholder}
        required
        disabled={isSubmitting}
        min={0}
        step={quantityConfig.step}
      />

      {/* Price */}
      <FormNumberInput
        name="price"
        control={control}
        label={`Price per Unit (${investmentCurrency})`}
        placeholder="0.00"
        required
        disabled={isSubmitting}
        min={0}
        step="0.01"
      />

      {/* Fees */}
      <FormNumberInput
        name="fees"
        control={control}
        label={`Fees (${investmentCurrency})`}
        placeholder="0.00"
        disabled={isSubmitting}
        min={0}
        step="0.01"
      />

      {/* Transaction Date */}
      <div className="mb-2">
        <label
          htmlFor="transactionDate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Transaction Date <span className="text-lred">*</span>
        </label>
        <input
          id="transactionDate"
          type="date"
          disabled={isSubmitting}
          className="p-2 drop-shadow-round rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
          {...control.register("transactionDate", {
            required: "Transaction date is required",
          })}
        />
      </div>

      {/* Submit button */}
      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={addTransactionMutation.isPending || isSubmitting}
        className="w-full"
      >
        Add Transaction
      </Button>
    </form>
  );
}
