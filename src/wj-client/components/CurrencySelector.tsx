"use client";

import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ConfirmationDialog } from "@/components/modals/ConfirmationDialog";
import { SUPPORTED_CURRENCIES } from "@/app/constants";
import { ZIndex } from "@/lib/utils/z-index";
import { cn } from "@/lib/utils/cn";

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
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
            "bg-white dark:bg-dark-surface",
            "border border-neutral-200 dark:border-neutral-700",
            "shadow-sm dark:shadow-dark-card",
            isDisabled
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-neutral-50 dark:hover:bg-dark-surface-hover cursor-pointer hover:shadow-md"
          )}
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
              className="animate-spin h-5 w-5 text-primary-500"
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
            <span className="text-lg font-semibold text-neutral-900 dark:text-dark-text">
              {currentCurrency?.symbol || currency}
            </span>
          )}
          <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden sm:inline">
            {currency}
          </span>
          {!isConverting && (
            <svg
              className="w-4 h-4 text-neutral-500 dark:text-neutral-400"
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
        {/* Mobile: dropdown below (top-full mt-2), Desktop: dropdown above (sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0) */}
        {!isDisabled && (
          <div
            className={cn(
              "absolute right-0 top-full mt-2 sm:top-auto sm:bottom-full sm:mt-0 sm:mb-2",
              "bg-white dark:bg-dark-surface",
              "rounded-lg shadow-lg dark:shadow-dark-card",
              "border border-neutral-200 dark:border-neutral-700",
              "py-2 hidden group-hover:block min-w-[200px]"
            )}
            style={{ zIndex: ZIndex.dropdown }}
          >
            {SUPPORTED_CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyClick(curr.code)}
                className={cn(
                  "w-full px-4 py-2 text-left transition-colors flex items-center gap-3",
                  "hover:bg-neutral-100 dark:hover:bg-dark-surface-hover",
                  "text-neutral-900 dark:text-dark-text",
                  curr.code === currency &&
                    "bg-primary-50 dark:bg-primary-900/20 font-semibold"
                )}
              >
                <span className="text-lg w-6">{curr.symbol}</span>
                <div className="flex flex-col">
                  <span className="text-sm">{curr.code}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {curr.name}
                  </span>
                </div>
                {curr.code === currency && (
                  <svg
                    className="w-4 h-4 text-primary-500 dark:text-primary-400 ml-auto"
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
