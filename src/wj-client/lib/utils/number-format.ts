/**
 * Format number with thousand separators (commas)
 * @param value - The number to format
 * @returns Formatted string with commas (e.g., "1,000")
 */
export function formatNumberWithCommas(value: number | string): string {
  // Handle empty or invalid input
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  // Convert to string and remove existing commas
  const stringValue = String(value).replace(/,/g, "");

  // Handle invalid numeric strings
  if (isNaN(Number(stringValue))) {
    return "";
  }

  // Handle negative sign
  const isNegative = stringValue.startsWith("-");
  const absoluteValue = isNegative ? stringValue.slice(1) : stringValue;

  // Handle decimal numbers
  const parts = absoluteValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Reconstruct with decimal if present
  const formattedValue =
    decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;

  // Add negative sign back if needed
  return isNegative ? `-${formattedValue}` : formattedValue;
}

/**
 * Remove thousand separators from formatted string
 * @param value - The formatted string with commas
 * @returns Clean numeric string
 */
export function parseNumberWithCommas(value: string): string {
  return value.replace(/,/g, "");
}

/**
 * Check if a string represents a valid numeric value (allowing commas)
 * @param value - The string to validate
 * @returns True if valid number format
 */
export function isValidNumberInput(value: string): boolean {
  // Allow: digits, commas, single decimal point, leading minus
  const regex = /^-?\d{1,3}(,\d{3})*(\.\d*)?$|^-?\d+(\.\d*)?$/;
  return regex.test(value);
}
