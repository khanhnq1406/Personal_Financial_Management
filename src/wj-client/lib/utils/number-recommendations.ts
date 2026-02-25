/**
 * Number Recommendations Utility
 *
 * Generates recommended monetary values by multiplying user input by powers of 10.
 * Used by FormNumberInput to provide quick-select suggestions for common amounts.
 */

import { parseNumberWithCommas, formatNumberWithCommas } from './number-format';

/**
 * Default multipliers for recommendations
 * [1K, 10K, 100K, 1M, 10M, 100M]
 */
export const DEFAULT_MULTIPLIERS = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8];

/**
 * Generates recommended monetary values based on user input.
 *
 * Algorithm:
 * - Input "12" → [12,000, 120,000, 1,200,000, 12,000,000, 120,000,000, 1,200,000,000]
 * - Input "1" → [1,000, 10,000, 100,000, 1,000,000, 10,000,000, 100,000,000]
 *
 * @param inputValue - The raw input value (may contain commas)
 * @param multipliers - Optional custom multipliers (defaults to DEFAULT_MULTIPLIERS)
 * @returns Array of recommended values
 *
 * @example
 * generateRecommendations("12") // [12000, 120000, 1200000, 12000000, 120000000, 1200000000]
 * generateRecommendations("12.5") // [] (decimals not supported)
 * generateRecommendations("-12") // [-12000, -120000, ...] (negative values supported)
 */
export function generateRecommendations(
  inputValue: string,
  multipliers: number[] = DEFAULT_MULTIPLIERS
): number[] {
  // Handle empty input
  if (!inputValue || inputValue.trim() === '') {
    return [];
  }

  // Parse and clean input
  const cleanValue = parseNumberWithCommas(inputValue);
  const numValue = parseFloat(cleanValue);

  // Handle invalid numbers
  if (isNaN(numValue) || numValue === 0) {
    return [];
  }

  // Don't show recommendations for decimal values (except trailing decimal like "12.")
  if (inputValue.includes('.') && !inputValue.endsWith('.')) {
    return [];
  }

  // Handle negative numbers
  const isNegative = numValue < 0;
  const absoluteValue = Math.abs(numValue);

  // Generate recommendations: input × multipliers
  return multipliers
    .map(mult => absoluteValue * mult)
    .filter(value => value <= Number.MAX_SAFE_INTEGER)
    .map(value => isNegative ? -value : value);
}

/**
 * Formats a recommended value for display.
 *
 * Formatting rules:
 * - < 100K: Show with commas (e.g., "12,000")
 * - 100K - 1M: Show with K suffix (e.g., "120K")
 * - 1M - 1B: Show with M suffix (e.g., "1.2M")
 * - >= 1B: Show with B suffix (e.g., "1.2B")
 *
 * @param value - The numeric value to format
 * @returns Formatted string
 *
 * @example
 * formatRecommendation(12000) // "12,000"
 * formatRecommendation(120000) // "120K"
 * formatRecommendation(1200000) // "1.2M"
 * formatRecommendation(1200000000) // "1.2B"
 */
export function formatRecommendation(value: number): string {
  const absValue = Math.abs(value);
  const isNegative = value < 0;
  const sign = isNegative ? '-' : '';

  // < 100K: Show with commas
  if (absValue < 100000) {
    return sign + formatNumberWithCommas(absValue);
  }

  // 100K - 1M: Show with K suffix
  if (absValue < 1000000) {
    const kValue = absValue / 1000;
    // Remove trailing .0
    const formatted = kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1);
    return sign + formatted + 'K';
  }

  // 1M - 1B: Show with M suffix
  if (absValue < 1000000000) {
    const mValue = absValue / 1000000;
    // Remove trailing .0
    const formatted = mValue % 1 === 0 ? mValue.toFixed(0) : mValue.toFixed(1);
    return sign + formatted + 'M';
  }

  // >= 1B: Show with B suffix
  const bValue = absValue / 1000000000;
  // Remove trailing .0
  const formatted = bValue % 1 === 0 ? bValue.toFixed(0) : bValue.toFixed(1);
  return sign + formatted + 'B';
}

/**
 * Generates formatted recommendation strings from input value.
 * Convenience function that combines generateRecommendations + formatRecommendation.
 *
 * @param inputValue - The raw input value
 * @param multipliers - Optional custom multipliers
 * @param maxResults - Maximum number of recommendations to return
 * @returns Array of formatted recommendation strings
 *
 * @example
 * getFormattedRecommendations("12", undefined, 3) // ["12,000", "120K", "1.2M"]
 */
export function getFormattedRecommendations(
  inputValue: string,
  multipliers?: number[],
  maxResults?: number
): string[] {
  const recommendations = generateRecommendations(inputValue, multipliers);
  const formatted = recommendations.map(formatRecommendation);

  return maxResults !== undefined
    ? formatted.slice(0, maxResults)
    : formatted;
}
