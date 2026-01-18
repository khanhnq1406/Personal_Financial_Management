/**
 * Transaction utility functions
 */

import { Transaction } from "@/gen/protobuf/v1/transaction";

/**
 * Group transactions by date
 * @param transactions - Array of transactions
 * @returns Object with date strings as keys and transaction arrays as values
 */
export const groupTransactionsByDate = (
  transactions: Transaction[]
): Record<string, Transaction[]> => {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((transaction) => {
    const date = formatTransactionDate(transaction.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
  });

  return groups;
};

/**
 * Format transaction date for grouping (YYYY-MM-DD)
 * @param timestamp - Unix timestamp
 * @returns Formatted date string
 */
export const formatTransactionDate = (timestamp: number | undefined): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format date for display in a friendly way (e.g., "Today", "Yesterday", "Jan 15, 2025")
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Friendly date string
 */
export const formatDateFriendly = (dateString: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
};
