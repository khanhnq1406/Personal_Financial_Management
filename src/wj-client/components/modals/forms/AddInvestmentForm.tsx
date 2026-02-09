"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { RHFFormInput as FormInput } from "@/components/forms/RHFFormInput";
import { FormNumberInput } from "@/components/forms/FormNumberInput";
import { RHFFormSelect as FormSelect } from "@/components/forms/RHFFormSelect";
import { SelectOption } from "@/components/forms/FormSelect";
import {
  Select,
  SelectOption as SelectComponentOption,
} from "@/components/select/Select";
import { Success } from "@/components/modals/Success";
import { SymbolAutocomplete } from "@/components/forms/SymbolAutocomplete";
import {
  useMutationCreateInvestment,
  useQueryListWallets,
  EVENT_InvestmentCreateInvestment,
  EVENT_InvestmentListInvestments,
  EVENT_InvestmentGetPortfolioSummary,
  EVENT_InvestmentListUserInvestments,
  EVENT_InvestmentGetAggregatedPortfolioSummary,
  EVENT_WalletListWallets,
} from "@/utils/generated/hooks";
import { WalletType } from "@/gen/protobuf/v1/wallet";
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
import {
  useExchangeRate,
  convertAmount,
  formatExchangeRate,
} from "@/hooks/useExchangeRate";
import {
  isGoldType,
  getGoldTypeOptions,
  type GoldTypeOption,
  type GoldUnit,
  calculateGoldFromUserInput,
} from "@/lib/utils/gold-calculator";
import {
  isSilverType,
  getSilverTypeOptions,
  type SilverTypeOption,
  type SilverUnit,
  calculateSilverFromUserInput,
} from "@/lib/utils/silver-calculator";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AddInvestmentFormProps {
  walletId?: number; // Optional: if not provided, user must select from dropdown
  walletBalance?: number; // Wallet balance in smallest currency unit
  walletCurrency?: string; // Currency of the wallet (ISO 4217)
  onSuccess?: () => void;
}

const investmentTypeOptions: SelectOption[] = [
  { value: String(InvestmentType.INVESTMENT_TYPE_STOCK), label: "Stock" },
  { value: String(InvestmentType.INVESTMENT_TYPE_ETF), label: "ETF" },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND),
    label: "Mutual Fund",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY),
    label: "Cryptocurrency",
  },
  { value: String(InvestmentType.INVESTMENT_TYPE_BOND), label: "Bond" },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_COMMODITY),
    label: "Commodity",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_GOLD_VND),
    label: "Gold (Vietnam)",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_GOLD_USD),
    label: "Gold (World)",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_SILVER_VND),
    label: "Silver (Vietnam)",
  },
  {
    value: String(InvestmentType.INVESTMENT_TYPE_SILVER_USD),
    label: "Silver (World)",
  },
  { value: String(InvestmentType.INVESTMENT_TYPE_OTHER), label: "Other" },
];

export function AddInvestmentForm({
  walletId: propWalletId,
  walletBalance: propWalletBalance,
  walletCurrency: propWalletCurrency,
  onSuccess,
}: AddInvestmentFormProps) {
  const queryClient = useQueryClient();
  const { currency: preferredCurrency } = useCurrency();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  // Local wallet selection state (used when walletId not provided)
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(
    propWalletId ?? null,
  );
  // Gold-specific state
  const [selectedGoldType, setSelectedGoldType] =
    useState<GoldTypeOption | null>(null);
  const [goldQuantityUnit, setGoldQuantityUnit] = useState<GoldUnit>("tael");

  // Silver-specific state
  const [selectedSilverType, setSelectedSilverType] =
    useState<SilverTypeOption | null>(null);
  const [silverQuantityUnit, setSilverQuantityUnit] =
    useState<SilverUnit>("tael");

  // Fetch user's wallets if walletId not provided
  const getListWallets = useQueryListWallets(
    {
      pagination: {
        page: 1,
        pageSize: 100,
        orderBy: "created_at",
        order: "desc",
      },
    },
    {
      refetchOnMount: "always",
      enabled: propWalletId === undefined, // Only fetch if no wallet provided
    },
  );

  // Filter for investment wallets
  const investmentWallets = useMemo(() => {
    if (!getListWallets.data?.wallets) return [];
    return getListWallets.data.wallets.filter(
      (wallet) => wallet.type === WalletType.INVESTMENT,
    );
  }, [getListWallets.data]);

  // Determine the active wallet ID (either from props or from selector)
  const walletId = propWalletId ?? selectedWalletId;

  // Get wallet balance and currency from selected wallet or props
  const walletBalance = useMemo(() => {
    if (propWalletBalance !== undefined) return propWalletBalance;
    if (!walletId) return 0;
    const wallet = investmentWallets.find((w) => w.id === walletId);
    return wallet?.balance?.amount || 0;
  }, [propWalletBalance, walletId, investmentWallets]);

  const walletCurrency = useMemo(() => {
    if (propWalletCurrency !== undefined) return propWalletCurrency;
    if (!walletId) return "USD";
    const wallet = investmentWallets.find((w) => w.id === walletId);
    return wallet?.balance?.currency || "USD";
  }, [propWalletCurrency, walletId, investmentWallets]);

  const createInvestmentMutation = useMutationCreateInvestment({
    onSuccess: (data) => {
      setSuccessMessage(data.message || "Investment created successfully");
      setShowSuccess(true);
      // Invalidate queries (both old and new aggregated endpoints)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return [
            EVENT_InvestmentCreateInvestment,
            EVENT_InvestmentListInvestments,
            EVENT_InvestmentGetPortfolioSummary,
            EVENT_InvestmentListUserInvestments,
            EVENT_InvestmentGetAggregatedPortfolioSummary,
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

  // Check if current investment type is gold
  const isGoldInvestment = isGoldType(investmentType);

  // Check if current investment type is silver
  const isSilverInvestment = isSilverType(investmentType);

  // Get gold type options based on investment type (not currency field)
  const goldTypeOptions = useMemo(() => {
    if (!isGoldInvestment) return [];
    // Determine currency from investment type: GOLD_VND → VND, GOLD_USD → USD
    const goldCurrency =
      investmentType === InvestmentType.INVESTMENT_TYPE_GOLD_VND
        ? "VND"
        : "USD";
    return getGoldTypeOptions(goldCurrency);
  }, [isGoldInvestment, investmentType]);

  // Update gold quantity unit based on selected gold type
  useEffect(() => {
    if (selectedGoldType) {
      setGoldQuantityUnit(selectedGoldType.unit);
    }
  }, [selectedGoldType]);

  // Reset gold type when investment type changes
  useEffect(() => {
    if (!isGoldInvestment) {
      setSelectedGoldType(null);
    } else {
      // Auto-set currency based on gold investment type
      const targetCurrency =
        investmentType === InvestmentType.INVESTMENT_TYPE_GOLD_VND
          ? "VND"
          : "USD";
      setValue("currency", targetCurrency);
    }
  }, [isGoldInvestment, investmentType, setValue]);

  // Get silver type options based on investment type
  const silverTypeOptions = useMemo(() => {
    if (!isSilverInvestment) return [];
    // Determine currency from investment type: SILVER_VND → VND, SILVER_USD → USD
    const silverCurrency =
      investmentType === InvestmentType.INVESTMENT_TYPE_SILVER_VND
        ? "VND"
        : "USD";
    return getSilverTypeOptions(silverCurrency);
  }, [isSilverInvestment, investmentType]);

  // Update silver quantity unit based on selected silver type
  useEffect(() => {
    if (selectedSilverType && selectedSilverType.availableUnits.length > 0) {
      setSilverQuantityUnit(selectedSilverType.availableUnits[0]);
    }
  }, [selectedSilverType]);

  // Reset silver type when investment type changes
  useEffect(() => {
    if (!isSilverInvestment) {
      setSelectedSilverType(null);
    } else {
      // Auto-set currency based on silver investment type
      const targetCurrency =
        investmentType === InvestmentType.INVESTMENT_TYPE_SILVER_VND
          ? "VND"
          : "USD";
      setValue("currency", targetCurrency);
    }
  }, [isSilverInvestment, investmentType, setValue]);

  // Fetch exchange rate when currencies differ
  const currenciesMatch = currency === walletCurrency;
  const { rate: exchangeRate, isLoading: isLoadingRate } = useExchangeRate(
    walletCurrency,
    currency,
  );

  // Fetch exchange rate from wallet currency to preferred currency for display
  const { rate: walletToPreferredRate, isLoading: isLoadingPreferredRate } =
    useExchangeRate(walletCurrency, preferredCurrency);

  // Convert wallet balance to preferred currency for display
  const walletBalanceInPreferredCurrency = useMemo(() => {
    if (walletCurrency === preferredCurrency || !walletToPreferredRate) {
      return walletBalance;
    }
    return convertAmount(
      walletBalance,
      walletToPreferredRate,
      walletCurrency,
      preferredCurrency,
    );
  }, [walletBalance, walletToPreferredRate, walletCurrency, preferredCurrency]);

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
        initialCostInSmallestUnit > walletBalance && walletBalance > 0,
      );
    } else if (exchangeRate) {
      // Compare in investment currency
      setInsufficientBalance(
        initialCostInSmallestUnit > walletBalanceInInvestmentCurrency &&
          walletBalance > 0,
      );
    } else {
      // No rate available yet, don't block submission
      setInsufficientBalance(false);
    }
  }, [
    initialCostInSmallestUnit,
    walletBalance,
    walletBalanceInInvestmentCurrency,
    currenciesMatch,
    exchangeRate,
  ]);

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

    // Validate wallet is selected
    if (!walletId) {
      setErrorMessage("Please select a wallet");
      return;
    }

    // Validate gold type is selected for gold investments
    if (isGoldInvestment && !selectedGoldType) {
      setErrorMessage("Please select a gold type");
      return;
    }

    // Validate silver type is selected for silver investments
    if (isSilverInvestment && !selectedSilverType) {
      setErrorMessage("Please select a silver type");
      return;
    }

    if (isGoldInvestment && selectedGoldType) {
      // Use gold calculator for gold investments
      const goldCalculation = calculateGoldFromUserInput({
        quantity: data.initialQuantity,
        quantityUnit: goldQuantityUnit,
        pricePerUnit: data.initialCost / data.initialQuantity, // Calculate price per unit
        priceCurrency: data.currency,
        priceUnit: goldQuantityUnit,
        investmentType: data.type,
        walletCurrency: walletCurrency,
        fxRate: exchangeRate || 1,
      });

      createInvestmentMutation.mutate({
        walletId,
        symbol: selectedGoldType.value,
        name: selectedGoldType.label,
        type: data.type,
        initialQuantityDecimal: goldCalculation.storedQuantity / 10000, // Convert storage format (grams×10000) to decimal (grams)
        initialCostDecimal: data.initialCost, // Send decimal value in the user's input currency
        currency: data.currency, // Send the currency the user actually paid in (NOT wallet currency)
        purchaseUnit: goldQuantityUnit, // Store user's purchase unit for display
        // Set int64 fields to 0 (decimal fields take precedence)
        initialQuantity: 0,
        initialCost: 0,
      });
    } else if (isSilverInvestment && selectedSilverType) {
      // Use silver calculator for silver investments
      const silverCalculation = calculateSilverFromUserInput({
        quantity: data.initialQuantity,
        quantityUnit: silverQuantityUnit,
        pricePerUnit: data.initialCost / data.initialQuantity, // Calculate price per unit
        priceCurrency: data.currency,
        priceUnit: silverQuantityUnit,
        investmentType: data.type,
        walletCurrency: walletCurrency,
        fxRate: exchangeRate || 1,
      });

      // Use full symbol with unit suffix to allow multiple VND silver investments (tael and kg)
      createInvestmentMutation.mutate({
        walletId,
        symbol: selectedSilverType.value, // Keep unit suffix: AG_VND_Tael or AG_VND_Kg
        name: selectedSilverType.label,
        type: data.type,
        initialQuantityDecimal: silverCalculation.storedQuantity / 10000, // Convert storage format (grams×10000 or oz×10000) to decimal
        initialCostDecimal: data.initialCost, // Send decimal value in the user's input currency
        currency: data.currency, // Send the currency the user actually paid in (NOT wallet currency)
        purchaseUnit: silverCalculation.purchaseUnit, // Store user's purchase unit for display
        // Set int64 fields to 0 (decimal fields take precedence)
        initialQuantity: 0,
        initialCost: 0,
      });
    } else {
      // Convert to API format using utility functions for non-gold, non-silver investments
      createInvestmentMutation.mutate({
        walletId,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        type: data.type,
        initialQuantityDecimal: data.initialQuantity, // Send decimal value
        initialCostDecimal: data.initialCost, // Send decimal value
        currency: data.currency,
        purchaseUnit: "gram", // Default unit for non-gold, non-silver investments
        // Set int64 fields to 0 (decimal fields take precedence)
        initialQuantity: 0,
        initialCost: 0,
      });
    }
  };

  // Build wallet options for selector
  const walletSelectOptions = useMemo((): SelectComponentOption<string>[] => {
    return investmentWallets.map((wallet) => ({
      value: String(wallet.id),
      label: wallet.walletName,
    }));
  }, [investmentWallets]);

  // Show success state (AFTER all hooks have been called)
  if (showSuccess) {
    return <Success message={successMessage} onDone={onSuccess} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Wallet Selector - only shown when walletId not provided */}
      {propWalletId === undefined && (
        <div className="mb-4">
          <Label htmlFor="wallet" required>
            Investment Wallet
          </Label>
          <Select
            options={walletSelectOptions}
            value={selectedWalletId ? String(selectedWalletId) : undefined}
            onChange={(value) => setSelectedWalletId(parseInt(value, 10))}
            placeholder="Select investment wallet"
            disabled={isSubmitting || getListWallets.isLoading}
            isLoading={getListWallets.isLoading}
            clearable={false}
            className="mt-1"
          />
          {!walletId && (
            <ErrorMessage id="wallet-error">
              Please select a wallet
            </ErrorMessage>
          )}
        </div>
      )}

      {/* Symbol - hidden for gold and silver investments (auto-populated from type) */}
      {!isGoldInvestment && !isSilverInvestment && (
        <div className="mb-4">
          <Label htmlFor="symbol" required>
            Symbol
          </Label>
          <SymbolAutocomplete
            value={watch("symbol")}
            onChange={handleSymbolChange}
            placeholder="Search for stocks, ETFs, crypto (e.g., AAPL, BTC, VTI)..."
            // disabled={isSubmitting}
            className="mt-1"
          />
          {errors.symbol && (
            <ErrorMessage id="symbol-error">
              {errors.symbol.message}
            </ErrorMessage>
          )}
        </div>
      )}

      {/* Name - hidden for gold and silver investments (auto-populated from type) */}
      {!isGoldInvestment && !isSilverInvestment && (
        <FormInput
          name="name"
          control={control}
          label="Name"
          placeholder="Apple Inc., Bitcoin, Vanguard Total Stock Market ETF..."
          required
          disabled={isSubmitting}
          className="mb-4"
        />
      )}

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

      {/* Gold Type Selector - shown only for gold investments */}
      {isGoldInvestment && (
        <div className="mb-4">
          <Label htmlFor="goldType" required>
            Gold Type
          </Label>
          <Select
            options={goldTypeOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={selectedGoldType?.value}
            onChange={(value) => {
              const selected = goldTypeOptions.find(
                (opt) => opt.value === value,
              );
              if (selected) {
                setSelectedGoldType(selected);
                setValue("symbol", selected.value);
                setValue("name", selected.label);
                // Currency is already set based on investment type, no need to override
              }
            }}
            placeholder="Select gold type (SJC, XAU, etc.)"
            disabled={isSubmitting}
            className="mt-1"
          />
          {selectedGoldType && (
            <p className="text-xs text-gray-500 mt-1 ml-1">
              Unit: {selectedGoldType.unit} | Currency:{" "}
              {selectedGoldType.currency}
            </p>
          )}
        </div>
      )}

      {/* Silver Type Selector - shown only for silver investments */}
      {isSilverInvestment && (
        <div className="mb-4">
          <Label htmlFor="silverType" required>
            Silver Type
          </Label>
          <Select
            options={silverTypeOptions.map((opt: SilverTypeOption) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={selectedSilverType?.value}
            onChange={(value) => {
              const selected = silverTypeOptions.find(
                (opt: SilverTypeOption) => opt.value === value,
              );
              if (selected) {
                setSelectedSilverType(selected);
                setValue("symbol", selected.value);
                setValue("name", selected.label);
                // Reset quantity unit to first available unit for this type
                if (selected.availableUnits.length > 0) {
                  setSilverQuantityUnit(selected.availableUnits[0]);
                }
              }
            }}
            placeholder="Select silver type (AG_VND, XAG, etc.)"
            disabled={isSubmitting}
            className="mt-1"
          />
          {selectedSilverType && (
            <p className="text-xs text-gray-500 mt-1 ml-1">
              Currency: {selectedSilverType.currency}
            </p>
          )}
        </div>
      )}

      {/* Initial Quantity */}
      <div>
        {isGoldInvestment ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="initialQuantity" required>
                Quantity
              </Label>
              {/* {selectedGoldType?.currency === "VND" && (
                <Select
                  options={[
                    { value: "tael", label: "Tael (lượng)" },
                    { value: "gram", label: "Gram (g)" },
                  ]}
                  value={goldQuantityUnit}
                  onChange={(value) => setGoldQuantityUnit(value as GoldUnit)}
                  disabled={isSubmitting}
                  className="w-40"
                />
              )} */}
            </div>
            <FormNumberInput
              name="initialQuantity"
              control={control}
              label=""
              placeholder={`e.g., ${goldQuantityUnit === "tael" ? "2.5" : "100"}`}
              required
              disabled={isSubmitting}
              min={0}
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1 -mb-3 ml-1">
              Amount of gold in{" "}
              {goldQuantityUnit === "tael"
                ? "taels (lượng)"
                : goldQuantityUnit === "oz"
                  ? "oz"
                  : "grams"}
            </p>
          </>
        ) : isSilverInvestment ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Label htmlFor="initialQuantity" required>
                Quantity
              </Label>
              <FormNumberInput
                name="initialQuantity"
                control={control}
                label=""
                placeholder={`e.g., ${silverQuantityUnit === "tael" ? "2.5" : silverQuantityUnit === "kg" ? "1" : "10"}`}
                required
                disabled={isSubmitting}
                min={0}
                step="0.01"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 ml-1">
                Amount of silver in{" "}
                {silverQuantityUnit === "tael"
                  ? "taels (lượng)"
                  : silverQuantityUnit === "kg"
                    ? "kg"
                    : silverQuantityUnit === "oz"
                      ? "oz"
                      : "grams"}
              </p>
            </div>

            {/* Unit selector for silver - only show for VND silver which has multiple units */}
            {selectedSilverType?.currency === "VND" &&
              selectedSilverType?.availableUnits &&
              selectedSilverType.availableUnits.length > 1 && (
                <div>
                  <Label htmlFor="initialQuantity" required>
                    Unit
                  </Label>
                  <Select
                    options={selectedSilverType.availableUnits.map(
                      (unit: SilverUnit) => ({
                        value: unit,
                        label:
                          unit === "tael"
                            ? "Tael (lượng)"
                            : unit === "kg"
                              ? "Kg"
                              : unit,
                      }),
                    )}
                    value={silverQuantityUnit}
                    onChange={(value) =>
                      setSilverQuantityUnit(value as SilverUnit)
                    }
                    disabled={isSubmitting}
                    className="w-40 mt-1"
                  />
                </div>
              )}
          </div>
        ) : (
          <>
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
          </>
        )}
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
            disabled={isSubmitting || isGoldInvestment || isSilverInvestment}
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
            <span>
              {formatCurrency(
                walletBalanceInPreferredCurrency,
                preferredCurrency,
              )}
              {walletCurrency !== preferredCurrency &&
                walletToPreferredRate && (
                  <span className="text-gray-500 ml-1">
                    ({formatCurrency(walletBalance, walletCurrency)})
                  </span>
                )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Initial Cost:</span>
            <span className="text-red-600">
              -{formatCurrency(initialCostInSmallestUnit, currency)}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Remaining:</span>
            <span
              className={
                walletBalance - initialCostInSmallestUnit < 0
                  ? "text-red-600"
                  : "text-green-600"
              }
            >
              {formatCurrency(
                walletBalance - initialCostInSmallestUnit,
                currency,
              )}
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
              {formatCurrency(
                walletBalanceInPreferredCurrency,
                preferredCurrency,
              )}
              {walletCurrency !== preferredCurrency &&
                walletToPreferredRate && (
                  <span className="text-gray-500 ml-1">
                    ({formatCurrency(walletBalance, walletCurrency)})
                  </span>
                )}
              {exchangeRate && (
                <span className="text-gray-500 ml-1">
                  ≈{" "}
                  {formatCurrency(walletBalanceInInvestmentCurrency, currency)}
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Initial Cost:</span>
            <span className="text-red-600">
              -{formatCurrency(initialCostInSmallestUnit, currency)}
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
                  walletBalanceInInvestmentCurrency -
                    initialCostInSmallestUnit <
                  0
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                ≈{" "}
                {formatCurrency(
                  walletBalanceInInvestmentCurrency - initialCostInSmallestUnit,
                  currency,
                )}
              </span>
            ) : (
              <span className="text-gray-400">Rate unavailable</span>
            )}
          </div>
          {exchangeRate && (
            <p className="text-xs text-gray-500 mt-2">
              Exchange rate: 1 {walletCurrency} ≈{" "}
              {formatExchangeRate(exchangeRate)} {currency}
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
        <div className="bg-red-50 border border-danger-600 text-danger-600 px-4 py-3 rounded">
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
