"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { SelectOption } from "@/components/forms/FormSelect";
import { FormInput } from "@/components/forms/FormInput";
import { ErrorMessage } from "@/components/forms/ErrorMessage";
import {
  useMutationAddInvestmentTransaction,
  EVENT_WalletListWallets,
  EVENT_WalletGetWallet,
} from "@/utils/generated/hooks";
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
  calculateTransactionCost,
  formatCurrency,
} from "@/lib/utils/units";
import {
  AddTransactionFormInput,
  addTransactionSchema,
} from "@/lib/validation/investment.schema";
import {
  useExchangeRate,
  convertAmount,
  formatExchangeRate,
} from "@/hooks/useExchangeRate";

interface AddInvestmentTransactionFormProps {
  investmentId: number;
  investmentType: InvestmentType;
  investmentCurrency?: string; // Currency of the parent investment (ISO 4217)
  walletBalance?: number; // Wallet balance in smallest currency unit
  walletCurrency?: string; // Currency of the wallet (ISO 4217)
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
  walletBalance = 0,
  walletCurrency = "USD",
  onSuccess,
}: AddInvestmentTransactionFormProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const addTransactionMutation = useMutationAddInvestmentTransaction({
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Transaction added successfully");
      setShowSuccess(true);
      setErrorMessage("");
      // Invalidate investment queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return ["Investment", "investments"].some((k) => key.includes(k));
        },
      });
      // Invalidate wallet queries to refresh balance after transaction
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletListWallets] });
      queryClient.invalidateQueries({ queryKey: [EVENT_WalletGetWallet] });
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
    watch,
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

  // Watch form values for balance validation
  const transactionType = watch("type");
  const quantity = watch("quantity");
  const price = watch("price");
  const fees = watch("fees");

  // Check if currencies match
  const currenciesMatch = investmentCurrency === walletCurrency;

  // Fetch exchange rate when currencies differ
  const { rate: exchangeRate, isLoading: isLoadingRate } = useExchangeRate(
    walletCurrency,
    investmentCurrency,
  );

  // Calculate total cost for BUY transactions
  const totalCost = useMemo(() => {
    if (
      transactionType !==
      InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY
    )
      return 0;
    const quantityInStorage = quantityToStorage(
      Number(quantity) || 0,
      investmentType,
    );
    const priceInCents = amountToSmallestUnit(
      Number(price) || 0,
      investmentCurrency,
    );
    const feesInCents = amountToSmallestUnit(
      Number(fees) || 0,
      investmentCurrency,
    );
    return (
      calculateTransactionCost(
        quantityInStorage,
        priceInCents,
        investmentType,
      ) + feesInCents
    );
  }, [
    quantity,
    price,
    fees,
    transactionType,
    investmentType,
    investmentCurrency,
  ]);

  // Convert wallet balance to investment currency for comparison
  const walletBalanceInInvestmentCurrency = useMemo(() => {
    if (currenciesMatch || !exchangeRate) {
      return walletBalance;
    }
    return convertAmount(
      walletBalance,
      exchangeRate,
      walletCurrency,
      investmentCurrency,
    );
  }, [
    walletBalance,
    exchangeRate,
    walletCurrency,
    investmentCurrency,
    currenciesMatch,
  ]);

  // Check for insufficient balance (with currency conversion when needed)
  useEffect(() => {
    const isBuyTransaction =
      transactionType ===
      InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY;
    if (!isBuyTransaction || walletBalance <= 0) {
      setInsufficientBalance(false);
      return;
    }

    if (currenciesMatch) {
      setInsufficientBalance(totalCost > walletBalance);
    } else if (exchangeRate) {
      setInsufficientBalance(totalCost > walletBalanceInInvestmentCurrency);
    } else {
      // No rate available yet, don't block submission
      setInsufficientBalance(false);
    }
  }, [
    totalCost,
    walletBalance,
    walletBalanceInInvestmentCurrency,
    transactionType,
    currenciesMatch,
    exchangeRate,
  ]);

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
        disableFilter
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

      {/* Balance Preview for BUY transactions - same currency */}
      {transactionType ===
        InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY &&
        walletBalance > 0 &&
        currenciesMatch && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Wallet Balance:</span>
              <span>{formatCurrency(walletBalance, walletCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Transaction Cost:</span>
              <span className="text-red-600">
                -{formatCurrency(totalCost, investmentCurrency)}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Remaining:</span>
              <span
                className={
                  walletBalance - totalCost < 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                {formatCurrency(walletBalance - totalCost, investmentCurrency)}
              </span>
            </div>
          </div>
        )}

      {/* Balance Preview for BUY transactions - different currencies with conversion */}
      {transactionType ===
        InvestmentTransactionType.INVESTMENT_TRANSACTION_TYPE_BUY &&
        walletBalance > 0 &&
        !currenciesMatch && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Wallet Balance:</span>
              <span>
                {formatCurrency(walletBalance, walletCurrency)}
                {exchangeRate && (
                  <span className="text-gray-500 ml-1">
                    (≈{" "}
                    {formatCurrency(
                      walletBalanceInInvestmentCurrency,
                      investmentCurrency,
                    )}
                    )
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Transaction Cost:</span>
              <span className="text-red-600">
                -{formatCurrency(totalCost, investmentCurrency)}
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Remaining:</span>
              {isLoadingRate ? (
                <span className="text-gray-400">Loading rate...</span>
              ) : exchangeRate ? (
                <span
                  className={
                    walletBalanceInInvestmentCurrency - totalCost < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  ≈{" "}
                  {formatCurrency(
                    walletBalanceInInvestmentCurrency - totalCost,
                    investmentCurrency,
                  )}
                </span>
              ) : (
                <span className="text-gray-400">Rate unavailable</span>
              )}
            </div>
            {exchangeRate && (
              <p className="text-xs text-gray-500 mt-2">
                Exchange rate: 1 {walletCurrency} ≈{" "}
                {formatExchangeRate(exchangeRate)} {investmentCurrency}
              </p>
            )}
          </div>
        )}

      {/* Insufficient balance error */}
      {insufficientBalance && (
        <p className="text-red-600 text-sm mt-2">
          Insufficient wallet balance. You need{" "}
          {formatCurrency(
            currenciesMatch
              ? totalCost - walletBalance
              : totalCost - walletBalanceInInvestmentCurrency,
            investmentCurrency,
          )}{" "}
          more.
        </p>
      )}

      {/* Submit button */}
      <Button
        type={ButtonType.PRIMARY}
        onClick={handleSubmit(onSubmit)}
        loading={addTransactionMutation.isPending || isSubmitting}
        disabled={insufficientBalance}
        className="w-full"
      >
        Add Transaction
      </Button>
    </form>
  );
}
