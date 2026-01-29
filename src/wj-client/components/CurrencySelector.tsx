"use client";

import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { SUPPORTED_CURRENCIES } from "@/app/constants";

export function CurrencySelector() {
  const { currency, updateCurrency, isConverting } = useCurrency();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Find current currency info - will update when currency context changes
  const currentCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const isDisabled = isConverting || isLoading;

  const handleCurrencyClick = (newCurrency: string) => {
    if (newCurrency === currency) {
      return; // No change
    }
    setSelectedCurrency(newCurrency);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await updateCurrency(selectedCurrency);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Failed to update currency:", error);
      // Error is handled by the mutation hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedCurrency("");
  };

  return (
    <>
      <div className="relative group">
        <button
          className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg drop-shadow-round transition-colors ${
            isDisabled
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-gray-50 cursor-pointer"
          }`}
          aria-label="Select currency"
          disabled={isDisabled}
          title={
            isConverting
              ? "Currency conversion in progress..."
              : "Select currency"
          }
        >
          {isConverting ? (
            // Show loading spinner during conversion
            <svg
              className="animate-spin h-5 w-5 text-hgreen"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <span className="text-lg font-semibold">
              {currentCurrency?.symbol || currency}
            </span>
          )}
          <span className="text-sm text-gray-600 hidden sm:inline">
            {currency}
          </span>
          {!isConverting && (
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>

        {/* Dropdown menu - only show when not disabled */}
        {!isDisabled && (
          <div className="absolute right-0 bottom-full mb-2 bg-white rounded-lg drop-shadow-round py-2 z-50 hidden group-hover:block min-w-[200px]">
            {SUPPORTED_CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyClick(curr.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                  curr.code === currency ? "bg-green-50 font-semibold" : ""
                }`}
              >
                <span className="text-lg w-6">{curr.symbol}</span>
                <div className="flex flex-col">
                  <span className="text-sm">{curr.code}</span>
                  <span className="text-xs text-gray-500">{curr.name}</span>
                </div>
                {curr.code === currency && (
                  <svg
                    className="w-4 h-4 text-hgreen ml-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <ConfirmationDialog
          title="Change Currency?"
          message={
            <div>
              <div>
                {`Are you sure you want to change your display currency to ${
                  SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency)
                    ?.name
                }?`}
              </div>
              <div>
                This will convert all your financial data. This process may take
                a few minutes.
              </div>
            </div>
          }
          confirmText="Change Currency"
          cancelText="Cancel"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={isLoading}
          variant="default"
        />
      )}
    </>
  );
}
