/**
 * Date utility functions for form handling
 */

/**
 * Convert Unix timestamp to datetime-local input format
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted datetime string (YYYY-MM-DDTHH:mm)
 */
export const toDateTimeLocal = (
  timestamp: number | string | undefined
): string => {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp) * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert datetime-local input to Unix timestamp
 * @param dateTimeStr - Datetime string from input
 * @returns Unix timestamp in seconds
 */
export const fromDateTimeLocal = (dateTimeStr: string): number => {
  return Math.floor(new Date(dateTimeStr).getTime() / 1000);
};

/**
 * Get current Unix timestamp
 * @returns Current Unix timestamp in seconds
 */
export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * Validate if a timestamp is within a reasonable range
 * @param timestamp - Unix timestamp to validate
 * @returns true if valid
 */
export const isValidTimestamp = (timestamp: number): boolean => {
  const min = 946684800; // Jan 1, 2000
  const max = 4102444800; // Jan 1, 2100
  return timestamp >= min && timestamp <= max;
};

/**
 * Format Unix timestamp for display
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date time string (e.g., "Jan 15, 2025 at 2:30 PM")
 */
export const formatDateTime = (timestamp: number | undefined): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format Unix timestamp to date only
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
