"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Success } from "@/components/modals/Success";
import {
  useMutationCreateInvestment,
  EVENT_InvestmentCreateInvestment,
} from "@/utils/generated/hooks";
import { InvestmentType } from "@/gen/protobuf/v1/investment";
import { useQueryClient } from "@tanstack/react-query";

const createInvestmentFormSchema = z
  .object({
    symbol: z.string().min(1, "Symbol is required").max(20, "Symbol must be 20 characters or less"),
    name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
    type: z.nativeEnum(InvestmentType),
    initialQuantity: z.string().min(1, "Quantity is required"),
    initialCost: z.string().min(1, "Initial cost is required"),
  })
  .refine(
    (data) => {
      const quantity = parseFloat(data.initialQuantity);
      return quantity > 0;
    },
    { message: "Quantity must be greater than 0", path: ["initialQuantity"] }
  )
  .refine(
    (data) => {
      const cost = parseFloat(data.initialCost);
      return cost >= 0;
    },
    { message: "Initial cost must be 0 or greater", path: ["initialCost"] }
  );

type CreateInvestmentFormInput = z.infer<typeof createInvestmentFormSchema>;

interface AddInvestmentFormProps {
  walletId: number;
  onSuccess?: () => void;
}

export function AddInvestmentForm({ walletId, onSuccess }: AddInvestmentFormProps) {
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
            "InvestmentListInvestments",
            "InvestmentGetPortfolioSummary",
            "WalletListWallets",
          ].includes(key);
        },
      });
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to create investment. Please try again");
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvestmentFormInput>({
    resolver: zodResolver(createInvestmentFormSchema),
    defaultValues: {
      symbol: "",
      name: "",
      type: InvestmentType.INVESTMENT_TYPE_STOCK,
      initialQuantity: "",
      initialCost: "",
    },
  });

  const onSubmit = (data: CreateInvestmentFormInput) => {
    setErrorMessage(undefined);

    // Convert quantity and cost to appropriate units
    // For stocks/ETFs: multiply by 10000 (4 decimal places)
    // For crypto: multiply by 100000000 (8 decimal places)
    // For others: multiply by 100 (2 decimal places)
    let quantityMultiplier = 10000;
    let costMultiplier = 100; // Cost is in cents

    if (data.type === InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY) {
      quantityMultiplier = 100000000;
    } else if (
      data.type === InvestmentType.INVESTMENT_TYPE_BOND ||
      data.type === InvestmentType.INVESTMENT_TYPE_COMMODITY ||
      data.type === InvestmentType.INVESTMENT_TYPE_OTHER
    ) {
      quantityMultiplier = 100;
    }

    const initialQuantity = Math.round(parseFloat(data.initialQuantity) * quantityMultiplier);
    const initialCost = Math.round(parseFloat(data.initialCost) * costMultiplier);

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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Symbol *
        </label>
        <input
          type="text"
          {...control.register("symbol")}
          placeholder="AAPL, BTC, VTI..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen focus:border-transparent"
          disabled={isSubmitting}
        />
        {errors.symbol && (
          <p className="text-lred text-sm mt-1">{errors.symbol.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          {...control.register("name")}
          placeholder="Apple Inc., Bitcoin, Vanguard Total Stock Market ETF..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen focus:border-transparent"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-lred text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Investment Type *
        </label>
        <select
          {...control.register("type")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen focus:border-transparent"
          disabled={isSubmitting}
        >
          <option value={InvestmentType.INVESTMENT_TYPE_STOCK}>
            Stock
          </option>
          <option value={InvestmentType.INVESTMENT_TYPE_ETF}>
            ETF
          </option>
          <option value={InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND}>
            Mutual Fund
          </option>
          <option value={InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY}>
            Cryptocurrency
          </option>
          <option value={InvestmentType.INVESTMENT_TYPE_BOND}>
            Bond
          </option>
          <option value={InvestmentType.INVESTMENT_TYPE_COMMODITY}>
            Commodity
          </option>
          <option value={InvestmentType.INVESTMENT_TYPE_OTHER}>
            Other
          </option>
        </select>
        {errors.type && (
          <p className="text-lred text-sm mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* Initial Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Quantity *
        </label>
        <input
          type="number"
          step="any"
          {...control.register("initialQuantity")}
          placeholder="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen focus:border-transparent"
          disabled={isSubmitting}
        />
        {errors.initialQuantity && (
          <p className="text-lred text-sm mt-1">{errors.initialQuantity.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Number of shares, coins, or units you hold
        </p>
      </div>

      {/* Initial Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Initial Cost (USD) *
        </label>
        <input
          type="number"
          step="0.01"
          {...control.register("initialCost")}
          placeholder="15000.00"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hgreen focus:border-transparent"
          disabled={isSubmitting}
        />
        {errors.initialCost && (
          <p className="text-lred text-sm mt-1">{errors.initialCost.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
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
