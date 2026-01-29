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
  currency: string = "VND"
): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.VND;

  // Convert from smallest unit to major unit
  const value =
    config.decimals > 0
      ? Number(amount) / Math.pow(10, config.decimals)
      : Number(amount);

  const formatter = new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
    trailingZeroDisplay: "stripIfInteger",
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
 * Legacy formatter for backward compatibility (VND only)
 * @deprecated Use formatCurrency(amount, currency) instead
 */
export const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  trailingZeroDisplay: "stripIfInteger",
});
