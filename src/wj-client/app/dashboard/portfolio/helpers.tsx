import { InvestmentType } from "@/gen/protobuf/v1/investment";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency-formatter";
import {
  isGoldType,
  getGoldTypeLabel as getGoldTypeLabelUtil,
  formatGoldQuantityDisplay,
  formatGoldPriceDisplay,
  getGoldUnitLabel,
} from "@/lib/utils/gold-calculator";

// Formatting helpers
export const formatCurrency = (amount: number, currency: string = "VND"): string => {
  return formatCurrencyUtil(amount, currency);
};

export const formatQuantity = (
  quantity: number,
  type: InvestmentType,
): string => {
  // Crypto: 8 decimals, Stocks/ETFs/Mutual Funds: 4 decimals, Bonds/Commodities: 2 decimals
  let decimals = 2;
  if (type === InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY) {
    decimals = 8;
  } else if (
    type === InvestmentType.INVESTMENT_TYPE_STOCK ||
    type === InvestmentType.INVESTMENT_TYPE_ETF ||
    type === InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND
  ) {
    decimals = 4;
  }
  return (quantity / Math.pow(10, decimals)).toFixed(decimals);
};

export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

// Format prices with appropriate decimals based on investment type
export const formatPrice = (price: number, type: InvestmentType, currency: string = "VND"): string => {
  // Use the multi-currency formatter from utils
  return formatCurrencyUtil(price, currency);
};

export const getInvestmentTypeLabel = (type: InvestmentType): string => {
  // Use gold calculator utility for gold types
  if (isGoldType(type)) {
    return getGoldTypeLabelUtil(type);
  }

  switch (type) {
    case InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY:
      return "Crypto";
    case InvestmentType.INVESTMENT_TYPE_STOCK:
      return "Stock";
    case InvestmentType.INVESTMENT_TYPE_ETF:
      return "ETF";
    case InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND:
      return "Mutual Fund";
    case InvestmentType.INVESTMENT_TYPE_BOND:
      return "Bond";
    case InvestmentType.INVESTMENT_TYPE_COMMODITY:
      return "Commodity";
    case InvestmentType.INVESTMENT_TYPE_OTHER:
      return "Other";
    default:
      return "Unknown";
  }
};

// Format timestamp as relative time with freshness indicator
export const formatTimeAgo = (timestamp: number): { text: string; colorClass: string } => {
  if (!timestamp) {
    return { text: "Never", colorClass: "text-gray-400" };
  }

  const date = new Date(timestamp * 1000); // Convert Unix timestamp (seconds to ms)
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  let text: string;
  let colorClass: string;

  if (diffMins < 1) {
    text = "Just now";
    colorClass = "text-green-600";
  } else if (diffMins < 5) {
    text = `${diffMins}m ago`;
    colorClass = "text-green-600";
  } else if (diffMins < 15) {
    text = `${diffMins}m ago`;
    colorClass = "text-green-600";
  } else if (diffMins < 60) {
    text = `${diffMins}m ago`;
    colorClass = "text-yellow-600";
  } else if (diffMins < 1440) {
    // Less than 24 hours
    text = `${Math.floor(diffMins / 60)}h ago`;
    colorClass = "text-orange-600";
  } else {
    text = date.toLocaleDateString();
    colorClass = "text-red-600";
  }

  return { text, colorClass };
};

// Gold-specific formatting functions

/**
 * Format gold quantity for display with appropriate unit
 * @param storedQuantity - Quantity in storage format (base unit × 10000)
 * @param investmentType - The investment type
 * @returns Formatted quantity string (e.g., "2.0000 lượng" for VND gold)
 */
export function formatGoldQuantity(storedQuantity: number, investmentType: InvestmentType): string {
  if (!isGoldType(investmentType)) {
    // Use default formatting for non-gold investments
    const decimals = getDecimalsForType(investmentType);
    return (storedQuantity / Math.pow(10, decimals)).toFixed(decimals);
  }

  const { value, unit } = formatGoldQuantityDisplay(storedQuantity, investmentType, '');
  const unitLabel = getGoldUnitLabel(unit);

  return `${value.toFixed(4)} ${unitLabel}`;
}

/**
 * Format gold price for display with appropriate unit
 * @param price - Price in smallest currency unit
 * @param currency - Currency code
 * @param priceUnit - Unit of the price (if different from market default)
 * @returns Formatted price string (e.g., "85,000,000 ₫/lượng" for VND gold)
 */
export function formatGoldPrice(
  price: number,
  currency: string,
  priceUnit?: string,
  investmentType?: InvestmentType
): string {
  // For gold, we know the market price unit
  let unit: 'tael' | 'oz' = 'tael';

  if (investmentType === 9) { // GOLD_USD
    unit = 'oz';
  } else if (currency === 'USD') {
    unit = 'oz';
  }

  // Use provided priceUnit if available
  if (priceUnit) {
    unit = priceUnit as 'tael' | 'oz';
  }

  const unitLabel = getGoldUnitLabel(unit);

  // Format price with currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / (currency === 'VND' ? 1 : 100));

  return `${formattedPrice}/${unitLabel}`;
}

/**
 * Get decimal precision for an investment type (for non-gold)
 */
function getDecimalsForType(type: InvestmentType): number {
  if (type === InvestmentType.INVESTMENT_TYPE_CRYPTOCURRENCY) {
    return 8;
  } else if (
    type === InvestmentType.INVESTMENT_TYPE_STOCK ||
    type === InvestmentType.INVESTMENT_TYPE_ETF ||
    type === InvestmentType.INVESTMENT_TYPE_MUTUAL_FUND
  ) {
    return 4;
  }
  return 2;
}

/**
 * Check if an investment is gold type
 */
export function isGoldInvestment(type: InvestmentType): boolean {
  return isGoldType(type);
}
