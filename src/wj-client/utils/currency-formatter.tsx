// Currency symbols and locale mappings
const CURRENCY_CONFIG: Record<
  string,
  { locale: string; symbol: string; decimals: number }
> = {
  VND: { locale: "vi-VN", symbol: "₫", decimals: 0 }, // Vietnamese Dong has no decimals
  USD: { locale: "en-US", symbol: "$", decimals: 2 },
  EUR: { locale: "de-DE", symbol: "€", decimals: 2 },
  GBP: { locale: "en-GB", symbol: "£", decimals: 2 },
  JPY: { locale: "ja-JP", symbol: "¥", decimals: 0 }, // Japanese Yen has no decimals
  AUD: { locale: "en-AU", symbol: "A$", decimals: 2 },
  CAD: { locale: "en-CA", symbol: "C$", decimals: 2 },
  SGD: { locale: "en-SG", symbol: "S$", decimals: 2 },
  CNY: { locale: "zh-CN", symbol: "¥", decimals: 2 },
  INR: { locale: "en-IN", symbol: "₹", decimals: 2 },
};

/**
 * Format a monetary value with proper currency symbol and decimal places
 * @param amount - Amount in smallest currency unit (e.g., cents, pence, or VND)
 * @param currency - ISO 4217 currency code (default: "VND")
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | bigint,
  currency: string = "VND",
  currencyDisplay?: keyof Intl.NumberFormatOptionsCurrencyDisplayRegistry,
): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.VND;

  // Convert from smallest unit to major unit
  // All amounts are stored as ×10000 for 4 decimal precision
  // For currencies with 0 decimals (VND, JPY), we need to divide by 10000
  // For currencies with 2 decimals (USD, EUR), divide by 10000 to get the base value
  const value = Number(amount) / 10000;

  const formatter = new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
    trailingZeroDisplay: "stripIfInteger",
    currencyDisplay: currencyDisplay,
  });

  return formatter.format(value);
}

/**
 * Get currency symbol for a given currency code
 * @param currency - ISO 4217 currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string = "VND"): string {
  return CURRENCY_CONFIG[currency]?.symbol || currency;
}

/**
 * Format currency for chart axes with compact notation (K, M, B)
 * @param amount - Amount in smallest currency unit
 * @param currency - ISO 4217 currency code (default: "VND")
 * @returns Compact formatted string (e.g., "₫200K" instead of "₫200,000")
 */
export function formatCurrencyCompact(
  amount: number | bigint,
  currency: string = "VND",
): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.VND;
  const symbol = getCurrencySymbol(currency);

  // Convert from smallest unit to major unit
  // All amounts are stored as ×10000 for 4 decimal precision
  // For currencies with 0 decimals (VND, JPY), we need to divide by 10000
  // For currencies with 2 decimals (USD, EUR), divide by 10000 to get the base value
  const value = Number(amount) / 10000;

  const absValue = Math.abs(value);

  // Determine the scale
  let scaledValue: number;
  let suffix: string;

  if (absValue >= 1_000_000_000) {
    // Billions
    scaledValue = value / 1_000_000_000;
    suffix = "B";
  } else if (absValue >= 1_000_000) {
    // Millions
    scaledValue = value / 1_000_000;
    suffix = "M";
  } else if (absValue >= 1_000) {
    // Thousands
    scaledValue = value / 1_000;
    suffix = "K";
  } else {
    // Less than 1000, no scaling
    const formattedSmall = Math.abs(value).toLocaleString(config.locale, { maximumFractionDigits: 0 });
    return value < 0 ? `-${symbol}${formattedSmall}` : `${symbol}${formattedSmall}`;
  }

  // Format with appropriate precision (use absolute value for precision check)
  const absScaledValue = Math.abs(scaledValue);
  const precision = absScaledValue >= 100 ? 0 : absScaledValue >= 10 ? 1 : 1;
  const formattedValue = Math.abs(scaledValue).toLocaleString(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });

  // Return with proper negative sign placement
  return scaledValue < 0 ? `-${symbol}${formattedValue}${suffix}` : `${symbol}${formattedValue}${suffix}`;
}

/**
 * Get decimal places for a currency
 * @param currency - ISO 4217 currency code
 * @returns Number of decimal places (0 for VND/JPY, 2 for most others)
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_CONFIG[currency]?.decimals ?? 2;
}

/**
 * Format exchange rate with appropriate decimal places
 * @param rate - Exchange rate value
 * @param currency - Target currency code (determines decimal places)
 * @returns Formatted rate string (e.g., "25000" for VND, "1.23" for USD)
 */
export function formatExchangeRate(rate: number, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

/**
 * Legacy formatter for backward compatibility (VND only)
 * @deprecated Use formatCurrency(amount, currency) instead
 * This formatter is deprecated and will be removed in a future version.
 * Please use formatCurrency(amount, currency) with the user's preferred currency.
 *
 * Migration example:
 * // Before
 * currencyFormatter.format(amount)
 *
 * // After
 * import { useCurrency } from "@/contexts/CurrencyContext";
 * const { currency } = useCurrency();
 * formatCurrency(amount, currency)
 */
export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  trailingZeroDisplay: "stripIfInteger",
});
