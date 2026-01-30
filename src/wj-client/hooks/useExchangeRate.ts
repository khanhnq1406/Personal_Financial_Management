"use client";

import { useQuery } from "@tanstack/react-query";

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;  // API uses "rates" not "conversion_rates"
}

// Cache exchange rates for 1 hour
const CACHE_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
const STALE_TIME = 30 * 60 * 1000; // 30 minutes - refetch after this

/**
 * Fetches exchange rates from ExchangeRate-API (free tier)
 * Falls back to approximate rates if API fails
 */
async function fetchExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  try {
    // Using the free ExchangeRate-API
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (data.result !== "success") {
      throw new Error("Exchange rate API returned error");
    }

    return data.rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates, using fallback rates:", error);
    // Return fallback rates (approximate values as of 2024)
    return getFallbackRates(baseCurrency);
  }
}

/**
 * Fallback exchange rates (approximate) when API is unavailable
 * These should be periodically updated
 */
function getFallbackRates(baseCurrency: string): Record<string, number> {
  // Rates relative to USD (approximate)
  const usdRates: Record<string, number> = {
    USD: 1,
    VND: 25000,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150,
    HKD: 7.82,
    AUD: 1.53,
    CAD: 1.36,
    SGD: 1.34,
    CNY: 7.25,
    INR: 83,
    KRW: 1350,
    THB: 35,
    MYR: 4.7,
    IDR: 15800,
    PHP: 56,
  };

  if (baseCurrency === "USD") {
    return usdRates;
  }

  // Convert to the requested base currency
  const baseToUsd = usdRates[baseCurrency] || 1;
  const converted: Record<string, number> = {};

  for (const [currency, rate] of Object.entries(usdRates)) {
    converted[currency] = rate / baseToUsd;
  }

  return converted;
}

/**
 * Hook to get exchange rates with a specific base currency
 */
export function useExchangeRates(baseCurrency: string) {
  return useQuery({
    queryKey: ["exchangeRates", baseCurrency],
    queryFn: () => fetchExchangeRates(baseCurrency),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook to get a specific exchange rate between two currencies
 */
export function useExchangeRate(fromCurrency: string, toCurrency: string) {
  const { data: rates, isLoading, error } = useExchangeRates(fromCurrency);

  const rate = rates?.[toCurrency] ?? null;

  return {
    rate,
    isLoading,
    error,
  };
}

/**
 * Convert an amount from one currency to another
 * @param amount - Amount in the smallest unit of fromCurrency
 * @param rate - Exchange rate (fromCurrency to toCurrency)
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Amount in the smallest unit of toCurrency
 */
/**
 * Format exchange rate with appropriate precision
 * Small rates (< 0.01) need more decimal places to be meaningful
 */
export function formatExchangeRate(rate: number): string {
  if (rate >= 1) {
    return rate.toFixed(4);
  } else if (rate >= 0.01) {
    return rate.toFixed(4);
  } else if (rate >= 0.0001) {
    return rate.toFixed(6);
  } else {
    // For very small rates like VND to USD (0.000039)
    return rate.toExponential(2);
  }
}

/**
 * Convert an amount from one currency to another
 * @param amount - Amount in the smallest unit of fromCurrency
 * @param rate - Exchange rate (fromCurrency to toCurrency)
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Amount in the smallest unit of toCurrency
 */
export function convertAmount(
  amount: number,
  rate: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // Currency decimal places
  const decimals: Record<string, number> = {
    VND: 0,
    JPY: 0,
    KRW: 0,
    IDR: 0,
    USD: 2,
    EUR: 2,
    GBP: 2,
    AUD: 2,
    CAD: 2,
    SGD: 2,
    CNY: 2,
    INR: 2,
    HKD: 2,
    THB: 2,
    MYR: 2,
    PHP: 2,
  };

  const fromDecimals = decimals[fromCurrency] ?? 2;
  const toDecimals = decimals[toCurrency] ?? 2;

  // Convert from smallest unit to actual value
  const fromMultiplier = Math.pow(10, fromDecimals);
  const toMultiplier = Math.pow(10, toDecimals);

  // Convert: (amount / fromMultiplier) * rate * toMultiplier
  const actualAmount = amount / fromMultiplier;
  const convertedActual = actualAmount * rate;
  const convertedSmallest = Math.round(convertedActual * toMultiplier);

  return convertedSmallest;
}
