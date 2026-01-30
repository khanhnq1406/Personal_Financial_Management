"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { FormInput } from "@/components/forms/FormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { SelectOption } from "@/components/forms/FormSelect";
import { Success } from "@/components/modals/Success";
import { SymbolAutocomplete } from "@/components/forms/SymbolAutocomplete";
import {
  useMutationCreateInvestment,
  EVENT_InvestmentCreateInvestment,
  EVENT_InvestmentListInvestments,
  EVENT_InvestmentGetPortfolioSummary,
  EVENT_WalletListWallets,
} from "@/utils/generated/hooks";
import { InvestmentType, SearchResult } from "@/gen/protobuf/v1/investment";
import { useQueryClient } from "@tanstack/react-query";
import {
  createInvestmentSchema,
  CreateInvestmentFormInput,
} from "@/lib/validation/investment.schema";
import {
  quantityToStorage,
  amountToSmallestUnit,
  getQuantityInputConfig,
  formatCurrency,
} from "@/lib/utils/units";
import { Label } from "@/components/forms/Label";
import { ErrorMessage } from "@/components/forms/ErrorMessage";
import { CurrencyBadge } from "@/components/forms/CurrencyBadge";
import { useExchangeRate, convertAmount, formatExchangeRate } from "@/hooks/useExchangeRate";

interface AddInvestmentFormProps {
  walletId: number;
  walletBalance?: number;  // Wallet balance in smallest currency unit
  walletCurrency?: string; // Currency of the wallet (ISO 4217)
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
  walletBalance = 0,
  walletCurrency = "USD",
  onSuccess,
}: AddInvestmentFormProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

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
    formState: { isSubmitting, errors },
    watch,
    setValue,
  } = useForm<CreateInvestmentFormInput>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      symbol: "",
      name: "",
      type: InvestmentType.INVESTMENT_TYPE_STOCK,
      initialQuantity: 0,
      initialCost: 0,
      currency: "USD",
    },
  });

  // Watch investment type to update quantity input config dynamically
  const investmentType = watch("type");
  const currency = watch("currency");
  const initialCost = watch("initialCost");
  const quantityConfig = getQuantityInputConfig(investmentType);

  // Fetch exchange rate when currencies differ
  const currenciesMatch = currency === walletCurrency;
  const { rate: exchangeRate, isLoading: isLoadingRate } = useExchangeRate(
    walletCurrency,
    currency
  );

  // Calculate initial cost in smallest unit for balance validation
  const initialCostInSmallestUnit = useMemo(() => {
    return amountToSmallestUnit(Number(initialCost) || 0, currency);
  }, [initialCost, currency]);

  // Convert wallet balance to investment currency for comparison
  const walletBalanceInInvestmentCurrency = useMemo(() => {
    if (currenciesMatch || !exchangeRate) {
      return walletBalance;
    }
    return convertAmount(walletBalance, exchangeRate, walletCurrency, currency);
  }, [walletBalance, exchangeRate, walletCurrency, currency, currenciesMatch]);

  // Check for insufficient balance (with currency conversion when needed)
  useEffect(() => {
    if (currenciesMatch) {
      setInsufficientBalance(
        initialCostInSmallestUnit > walletBalance && walletBalance > 0
      );
    } else if (exchangeRate) {
      // Compare in investment currency
      setInsufficientBalance(
        initialCostInSmallestUnit > walletBalanceInInvestmentCurrency && walletBalance > 0
      );
    } else {
      // No rate available yet, don't block submission
      setInsufficientBalance(false);
    }
  }, [initialCostInSmallestUnit, walletBalance, walletBalanceInInvestmentCurrency, currenciesMatch, exchangeRate]);

  // Handle symbol selection - auto-fill name and currency from search result
  const handleSymbolChange = (symbol: string, result?: SearchResult) => {
    setValue("symbol", symbol);
    if (result?.name) {
      setValue("name", result.name);
    }
    if (result?.currency) {
      setValue("currency", result.currency);
    }
  };

  const onSubmit = (data: CreateInvestmentFormInput) => {
    setErrorMessage(undefined);

    // Convert to API format using utility functions
    createInvestmentMutation.mutate({
      walletId,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      type: data.type,
      initialQuantity: quantityToStorage(data.initialQuantity, data.type),
      initialCost: amountToSmallestUnit(data.initialCost, data.currency),
      currency: data.currency,
    });
  };

  // Show success state
  if (showSuccess) {
    return <Success message={successMessage} onDone={onSuccess} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Symbol */}
      <div className="mb-4">
        <Label htmlFor="symbol" required>
          Symbol
        </Label>
        <SymbolAutocomplete
          value={watch("symbol")}
          onChange={handleSymbolChange}
          placeholder="Search for stocks, ETFs, crypto (e.g., AAPL, BTC, VTI)..."
          disabled={isSubmitting}
          className="mt-1"
        />
        {errors.symbol && (
          <ErrorMessage id="symbol-error">{errors.symbol.message}</ErrorMessage>
        )}
      </div>

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
          placeholder={quantityConfig.placeholder}
          required
          disabled={isSubmitting}
          min={0}
          step={quantityConfig.step}
        />
        <p className="text-xs text-gray-500 mt-1 -mb-3 ml-1">
          Number of shares, coins, or units you hold
        </p>
      </div>

      {/* Initial Cost */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label htmlFor="initialCost" required>
            Total Initial Cost
          </Label>
          <CurrencyBadge
            value={currency}
            onChange={(newCurrency) => setValue("currency", newCurrency)}
            disabled={isSubmitting}
          />
        </div>
        <FormNumberInput
          name="initialCost"
          control={control}
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

      {/* Balance Preview - same currency */}
      {walletBalance > 0 && currenciesMatch && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between text-sm">
            <span>Wallet Balance:</span>
            <span>{formatCurrency(walletBalance, walletCurrency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Initial Cost:</span>
            <span className="text-red-600">-{formatCurrency(initialCostInSmallestUnit, currency)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Remaining:</span>
            <span className={walletBalance - initialCostInSmallestUnit < 0 ? "text-red-600" : "text-green-600"}>
              {formatCurrency(walletBalance - initialCostInSmallestUnit, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Balance Preview - different currencies with conversion */}
      {walletBalance > 0 && !currenciesMatch && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between text-sm">
            <span>Wallet Balance:</span>
            <span>
              {formatCurrency(walletBalance, walletCurrency)}
              {exchangeRate && (
                <span className="text-gray-500 ml-1">
                  (≈ {formatCurrency(walletBalanceInInvestmentCurrency, currency)})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Initial Cost:</span>
            <span className="text-red-600">-{formatCurrency(initialCostInSmallestUnit, currency)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Remaining:</span>
            {isLoadingRate ? (
              <span className="text-gray-400">Loading rate...</span>
            ) : exchangeRate ? (
              <span className={walletBalanceInInvestmentCurrency - initialCostInSmallestUnit < 0 ? "text-red-600" : "text-green-600"}>
                ≈ {formatCurrency(walletBalanceInInvestmentCurrency - initialCostInSmallestUnit, currency)}
              </span>
            ) : (
              <span className="text-gray-400">Rate unavailable</span>
            )}
          </div>
          {exchangeRate && (
            <p className="text-xs text-gray-500 mt-2">
              Exchange rate: 1 {walletCurrency} ≈ {formatExchangeRate(exchangeRate)} {currency}
            </p>
          )}
        </div>
      )}

      {/* Insufficient balance error */}
      {insufficientBalance && (
        <p className="text-red-600 text-sm mt-2">
          Insufficient wallet balance for this investment.
        </p>
      )}

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
        disabled={insufficientBalance}
        className="w-full"
      >
        Add Investment
      </Button>
    </form>
  );
}
