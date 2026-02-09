/**
 * Format large numbers with K/M/B suffixes for Y-axis tick labels
 * Examples: 1500 → "1.5K", 2500000 → "2.5M", 1500000000 → "1.5B"
 * Handles negative numbers: -1500 → "-1.5K", -2500000 → "-2.5M"
 */
export const formatTickValue = (value: number): string => {
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  let formatted: string;
  if (absValue >= 1_000_000_000) {
    formatted = `${(absValue / 1_000_000_000).toFixed(1)}B`;
  } else if (absValue >= 1_000_000) {
    formatted = `${(absValue / 1_000_000).toFixed(1)}M`;
  } else if (absValue >= 1_000) {
    formatted = `${(absValue / 1_000).toFixed(1)}K`;
  } else {
    formatted = `${absValue}`;
  }

  return isNegative ? `-${formatted}` : formatted;
};
