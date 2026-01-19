/**
 * Format large numbers with K/M/B suffixes for Y-axis tick labels
 * Examples: 1500 → "1.5K", 2500000 → "2.5M", 1500000000 → "1.5B"
 */
export const formatTickValue = (value: number): string => {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
};
