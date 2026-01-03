// ============================================================================
// IMPORT GENERATED PROTOBUF TYPES
// ============================================================================
import type { Error, Money, PaginationParams, PaginationResult } from "@/gen/protobuf/v1/common";
import type { User, LoginData } from "@/gen/protobuf/v1/auth";
import type { Wallet } from "@/gen/protobuf/v1/wallet";

// ============================================================================
// GENERIC API RESPONSE TYPE (for api-client.ts)
// ============================================================================

/**
 * Generic API Response type used by the low-level apiClient
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: Error;
  timestamp?: string;
  path?: string;
  data?: T;
};

// ============================================================================
// RE-EXPORT COMMON TYPES FOR CONVENIENCE
// ============================================================================

export type { Money, PaginationParams, PaginationResult };
export type { User, LoginData };
export type { Wallet };

// ============================================================================
// API ERROR FROM GO BACKEND
// ============================================================================

/**
 * API Error from Go backend - uses generated protobuf Error type
 */
export type ApiErrorDetail = Error;

/**
 * Helper function to check if response is an error
 */
export function isApiResponseError(response: { success: boolean; error?: Error }): response is { success: false; error: Error } {
  return !response.success && response.error !== undefined;
}

// ============================================================================
// MONEY DISPLAY HELPER
// ============================================================================

/**
 * Format Money for display (converts int64 cents to decimal string)
 * @param money - Money object with amount in cents
 * @returns Formatted string (e.g., "USD 123.45")
 */
export function formatMoney(money: Money): string {
  const dollars = money.amount / 100;
  return `${money.currency} ${dollars.toFixed(2)}`;
}
