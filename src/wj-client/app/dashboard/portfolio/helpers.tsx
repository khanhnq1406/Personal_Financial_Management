import { InvestmentType } from "@/gen/protobuf/v1/investment";

// Formatting helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100); // Convert from cents to dollars
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

export const getInvestmentTypeLabel = (type: InvestmentType): string => {
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
