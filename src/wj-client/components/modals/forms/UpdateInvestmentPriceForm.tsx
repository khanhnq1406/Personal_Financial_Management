"use client";

import { useState } from "react";
import { InvestmentType } from "@/gen/protobuf/v1/investment";
import { useMutationUpdateInvestment } from "@/utils/generated/hooks";
import { Button } from "@/components/Button";
import { ButtonType } from "@/app/constants";
import { FormInput } from "@/components/forms/FormInput";
import { Success } from "@/components/modals/Success";

interface UpdateInvestmentPriceFormProps {
  investmentId: number;
  currentSymbol: string;
  currentName: string;
  currentPrice: number;
  currency: string;
  investmentType: InvestmentType;
  onSuccess?: () => void;
}

export function UpdateInvestmentPriceForm({
  investmentId,
  currentSymbol,
  currentName,
  currentPrice,
  currency,
  investmentType,
  onSuccess,
}: UpdateInvestmentPriceFormProps) {
  const [priceInput, setPriceInput] = useState(
    currentPrice > 0 ? (currentPrice / 100).toFixed(2) : ""
  );
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showSuccess, setShowSuccess] = useState(false);

  const updateMutation = useMutationUpdateInvestment({
    onSuccess: () => {
      setShowSuccess(true);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to update price");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    const priceDecimal = parseFloat(priceInput);
    if (isNaN(priceDecimal) || priceDecimal < 0) {
      setErrorMessage("Please enter a valid price (0 or greater)");
      return;
    }

    // Convert to smallest currency unit
    const priceInSmallestUnit = Math.round(priceDecimal * 100);

    updateMutation.mutate({
      id: investmentId,
      name: currentName,
      currentPrice: priceInSmallestUnit,
    });
  };

  if (showSuccess) {
    return (
      <Success
        message="Price updated successfully!"
        onDone={onSuccess}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-md">
        <p className="text-sm text-gray-600">
          <strong>Symbol:</strong> {currentSymbol}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Current Price:</strong>{" "}
          {currentPrice > 0
            ? `${currency} ${(currentPrice / 100).toFixed(2)}`
            : "Not set"}
        </p>
      </div>

      <FormInput
        label="New Price"
        name="price"
        type="number"
        step="0.01"
        min="0"
        value={priceInput}
        onChange={(e) => setPriceInput(e.target.value)}
        placeholder="0.00"
        required
        helperText={`Enter price per unit in ${currency}`}
      />

      <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can set price to 0 if market price is unavailable.
          This will show your holdings without profit/loss calculations.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 p-3 rounded-md border border-red-200">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type={ButtonType.PRIMARY}
          onClick={handleSubmit}
          loading={updateMutation.isPending}
        >
          Update Price
        </Button>
      </div>
    </form>
  );
}
