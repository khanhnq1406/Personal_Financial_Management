"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { SelectOption } from "@/components/forms/FormSelect";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Success } from "@/components/modals/Success";
import {
  useMutationCreateInvestment,
  EVENT_InvestmentCreateInvestment,
  EVENT_InvestmentListInvestments,
  EVENT_InvestmentGetPortfolioSummary,
  EVENT_WalletListWallets,
} from "@/utils/generated/hooks";
import { InvestmentType } from "@/gen/protobuf/v1/investment";
import { useQueryClient } from "@tanstack/react-query";
import {
  createInvestmentSchema,
  CreateInvestmentFormInput,
} from "@/lib/validation/investment.schema";

interface AddInvestmentFormProps {
  walletId: number;
  onSuccess?: () => void;
}

const investmentTypeOptions: SelectOption[] = [
  { value: InvestmentType.INVESTMENT_TYPE_STOCK, label: "Stock" },
  { value: InvestmentType.INVESTMENT_TYPE_ETF, label: "ETF" },
  {
    value: InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND,
    label: "Mutual Fund",
  },
  {
    value: InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY,
    label: "Cryptocurrency",
  },
  { value: InvestmentType.INVESTMENT_TYPE_BOND, label: "Bond" },
  { value: InvestmentType.INVESTMENT_TYPE_COMMODITY, label: "Commodity" },
  { value: InvestmentType.INVESTMENT_TYPE_OTHER, label: "Other" },
];

export function AddInvestmentForm({
  walletId,
  onSuccess,
}: AddInvestmentFormProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const createInvestmentMutation = useMutationCreateInvestment({
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Investment created successfully");
      setShowSuccess(true);
      // Invalidate queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return [
            EVENT_InvestmentCreateInvestment,
            EVENT_InvestmentListInvestments,
            EVENT_InvestmentGetPortfolioSummary,
            EVENT_WalletListWallets,
          ].includes(key);
        },
      });
    },
    onError: (error: any) => {
      setErrorMessage(
        error.message || "Failed to create investment. Please try again",
      );
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    getValues,
  } = useForm<CreateInvestmentFormInput>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      symbol: "",
      name: "",
      type: InvestmentType.INVESTMENT_TYPE_STOCK,
      initialQuantity: 0,
      initialCost: 0,
    },
  });
  console.log(getValues());
  const onSubmit = (data: CreateInvestmentFormInput) => {
    setErrorMessage(undefined);

    // Convert quantity and cost to appropriate units
    // For stocks/ETFs: multiply by 10000 (4 decimal places)
    // For crypto: multiply by 100000000 (8 decimal places)
    // For others: multiply by 100 (2 decimal places)
    let quantityMultiplier = 10000;
    const costMultiplier = 100; // Cost is in cents

    if (data.type === InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY) {
      quantityMultiplier = 100000000;
    } else if (
      data.type === InvestmentType.INVESTMENT_TYPE_BOND ||
      data.type === InvestmentType.INVESTMENT_TYPE_COMMODITY ||
      data.type === InvestmentType.INVESTMENT_TYPE_OTHER
    ) {
      quantityMultiplier = 100;
    }

    const initialQuantity = Math.round(
      data.initialQuantity * quantityMultiplier,
    );
    const initialCost = Math.round(data.initialCost * costMultiplier);

    createInvestmentMutation.mutate({
      walletId,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      type: data.type,
      initialQuantity,
      initialCost,
      currency: "USD",
    });
  };

  // Show success state
  if (showSuccess) {
    return <Success message={successMessage} onDone={onSuccess} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Symbol */}
      <FormInput
        name="symbol"
        control={control}
        label="Symbol"
        placeholder="AAPL, BTC, VTI..."
        required
        disabled={isSubmitting}
        className="mb-4"
      />

      {/* Name */}
      <FormInput
        name="name"
        control={control}
        label="Name"
        placeholder="Apple Inc., Bitcoin, Vanguard Total Stock Market ETF..."
        required
        disabled={isSubmitting}
        className="mb-4"
      />

      {/* Type */}
      <FormSelect
        name="type"
        control={control}
        label="Investment Type"
        options={investmentTypeOptions}
        placeholder="Select investment type"
        required
        disabled={isSubmitting}
        className="mb-4"
      />

      {/* Initial Quantity */}
      <div>
        <FormNumberInput
          name="initialQuantity"
          control={control}
          label="Initial Quantity"
          placeholder="100"
          required
          disabled={isSubmitting}
          min={0}
          step="any"
        />
        <p className="text-xs text-gray-500 mt-1 -mb-3 ml-1">
          Number of shares, coins, or units you hold
        </p>
      </div>

      {/* Initial Cost */}
      <div>
        <FormNumberInput
          name="initialCost"
          control={control}
          label="Total Initial Cost (USD)"
          placeholder="15000.00"
          required
          disabled={isSubmitting}
          min={0}
          step="0.01"
        />
        <p className="text-xs text-gray-500 mt-1 -mb-3 ml-1">
          Total amount paid to acquire this investment (including fees)
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-lred text-lred px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* Submit button */}
      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={createInvestmentMutation.isPending || isSubmitting}
        className="w-full"
      >
        Add Investment
      </Button>
    </form>
  );
}
