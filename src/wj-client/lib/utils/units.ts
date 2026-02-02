import { InvestmentType } from "@/gen/protobuf/v1/investment";

// Decimal precision configuration
const PRECISION_CONFIG: Record<number, number> = {
  [InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY]: 8,
  [InvestmentType.INVESTMENT_TYPE_STOCK]: 4,
  [InvestmentType.INVESTMENT_TYPE_ETF]: 4,
  [InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND]: 4,
  [InvestmentType.INVESTMENT_TYPE_GOLD_VND]: 4, // Stored in grams × 10000
  [InvestmentType.INVESTMENT_TYPE_GOLD_USD]: 4, // Stored in ounces × 10000
};

/**
 * Get decimal places for investment type
 */
export function getDecimalPlaces(investmentType: InvestmentType): number {
  return PRECISION_CONFIG[investmentType] ?? 4; // Default to 4 decimals
}

/**
 * Get decimal multiplier (power of 10) for investment type
 */
export function getDecimalMultiplier(investmentType: InvestmentType): number {
  return Math.pow(10, getDecimalPlaces(investmentType));
}

/**
 * Convert user input quantity to storage format (smallest units)
 * Example: 1.5 BTC → 150,000,000 satoshis
 */
export function quantityToStorage(
  quantity: number,
  investmentType: InvestmentType
): number {
  const multiplier = getDecimalMultiplier(investmentType);
  return Math.round(quantity * multiplier);
}

/**
 * Convert storage quantity to display format
 * Example: 150,000,000 satoshis → 1.5 BTC
 */
export function quantityFromStorage(
  quantity: number,
  investmentType: InvestmentType,
  decimals?: number
): string {
  const defaultDecimals = getDecimalPlaces(investmentType);
  const displayDecimals = decimals ?? defaultDecimals;
  const divider = Math.pow(10, displayDecimals);
  return (quantity / divider).toFixed(displayDecimals);
}

// Currency decimal configuration (same as currency-formatter.tsx)
const CURRENCY_DECIMALS: Record<string, number> = {
  VND: 0, // Vietnamese Dong has no decimals
  JPY: 0, // Japanese Yen has no decimals
  USD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  CAD: 2,
  SGD: 2,
  CNY: 2,
  INR: 2,
  HKD: 2,
};

/**
 * Get decimal places for a currency
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? 2; // Default to 2 decimals
}

/**
 * Convert user input amount to smallest currency unit for storage
 * Example: 150.50 USD → 15050 cents
 * Example: 30000 VND → 30000 (no conversion needed)
 */
export function amountToSmallestUnit(
  amount: number,
  currency: string
): number {
  const decimals = getCurrencyDecimals(currency);
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier);
}

/**
 * Convert smallest currency unit to display amount
 * Example: 15050 cents → 150.50 USD
 * Example: 30000 VND → 30000 (no conversion needed)
 */
export function smallestUnitToAmount(
  smallestUnit: number,
  currency: string
): number {
  const decimals = getCurrencyDecimals(currency);
  const divider = Math.pow(10, decimals);
  return smallestUnit / divider;
}

/**
 * Convert dollars to cents for storage
 * @deprecated Use amountToSmallestUnit(amount, currency) for multi-currency support
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents from storage to dollars for display
 * @deprecated Use smallestUnitToAmount(amount, currency) for multi-currency support
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format currency for display
 * Converts from smallest currency unit to display format
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  const decimals = getCurrencyDecimals(currency);
  const divider = Math.pow(10, decimals);
  const value = amount / divider;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Calculate total transaction cost (for validation display)
 */
export function calculateTransactionCost(
  quantity: number,
  priceCents: number,
  investmentType: InvestmentType
): number {
  const multiplier = getDecimalMultiplier(investmentType);
  const quantityWholeUnits = quantity / multiplier;
  return Math.round(quantityWholeUnits * priceCents);
}

/**
 * Get display configuration for form inputs
 */
export function getQuantityInputConfig(investmentType: InvestmentType) {
  const decimals = getDecimalPlaces(investmentType);
  return {
    step: `0.${"0".repeat(decimals - 1)}1`,
    placeholder: `0.${"0".repeat(decimals)}`,
    decimals,
  };
}

/**
 * Format quantity for display
 */
export function formatQuantity(
  quantity: number,
  investmentType: InvestmentType
): string {
  const decimals = getDecimalPlaces(investmentType);
  return quantityFromStorage(quantity, investmentType, decimals);
}

/**
 * Calculate current value in cents
 */
export function calculateCurrentValue(
  quantity: number,
  priceCents: number,
  investmentType: InvestmentType
): number {
  return calculateTransactionCost(quantity, priceCents, investmentType);
}

/**
 * Calculate unrealized PNL in cents
 */
export function calculateUnrealizedPNL(
  currentValue: number,
  totalCost: number
): number {
  return currentValue - totalCost;
}

/**
 * Calculate unrealized PNL percentage
 */
export function calculateUnrealizedPNLPercent(
  unrealizedPNL: number,
  totalCost: number
): number {
  if (totalCost === 0) return 0;
  return (unrealizedPNL / totalCost) * 100;
}
