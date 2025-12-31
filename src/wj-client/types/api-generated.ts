// ============================================================================
// REST API Types using Generated Protobuf Definitions
// This file provides type-safe interfaces for REST API endpoints using protobuf
// generated types as the source of truth.
// ============================================================================

// Import generated protobuf types
import {
  User,
  LoginData as ProtoLoginData,
} from "../gen/protobuf/v1/auth";

import {
  Wallet,
} from "../gen/protobuf/v1/wallet";

import {
  User as ProtoUser,
} from "../gen/protobuf/v1/user";

import Long from "long";

// ============================================================================
// UTILITY FUNCTIONS - Convert protobuf Long to number/string
// ============================================================================

/**
 * Convert protobuf Long to number (safe for smaller values)
 */
function longToNumber(long: Long | number | string | undefined): number {
  if (long === undefined || long === null) return 0;
  if (typeof long === "number") return long;
  if (typeof long === "string") return parseInt(long, 10);
  return long.toNumber();
}

/**
 * Convert protobuf Long to ISO date string
 */
function longToDate(long: Long | number | string | undefined): string {
  if (long === undefined || long === null) return "";
  const ms = typeof long === "number" ? long : typeof long === "string" ? parseInt(long, 10) : long.toNumber();
  return new Date(ms).toISOString();
}

// ============================================================================
// STANDARD API RESPONSE WRAPPER (REST)
// ============================================================================

/**
 * Standard REST API Response wrapper
 * Matches Go backend response structure (message is optional)
 */
export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  path?: string;
};

/**
 * Standard Paginated Response
 */
export type PaginatedResponse<T> = {
  success: boolean;
  message?: string;
  data?: T[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  timestamp?: string;
};

// ============================================================================
// AUTH TYPES (REST API)
// ============================================================================

/**
 * User data (from protobuf)
 */
export type AuthUser = User;

/**
 * Register Request for REST API
 * POST /api/v1/auth/register
 */
export interface RegisterRequest {
  googleToken: string;
}

/**
 * Register Response for REST API
 */
export type RegisterResponse = ApiResponse<AuthUser>;

/**
 * Login Request for REST API
 * POST /api/v1/auth/login
 */
export interface LoginRequest {
  token: string; // REST uses "token" instead of "googleToken"
}

/**
 * Login Data (from protobuf)
 */
export type LoginData = ProtoLoginData;

/**
 * Login Response for REST API
 */
export type LoginResponse = ApiResponse<LoginData>;

/**
 * Logout Request for REST API
 * POST /api/v1/auth/logout
 */
export interface LogoutRequest {
  token: string;
}

/**
 * Logout Response for REST API
 */
export type LogoutResponse = ApiResponse<void>;

/**
 * Verify Auth Request for REST API
 * GET /api/v1/auth/verify
 */
export interface VerifyAuthRequest {
  token: string;
}

/**
 * Verify Auth Response for REST API
 */
export type VerifyAuthResponse = ApiResponse<AuthUser>;

// ============================================================================
// WALLET TYPES (REST API)
// ============================================================================

/**
 * Wallet data (from protobuf)
 */
export type WalletData = Wallet;

/**
 * Create Wallet Request for REST API
 * POST /api/v1/wallets
 */
export interface CreateWalletRequest {
  walletName: string;
  initialBalance?: number;
}

/**
 * Create Wallet Response for REST API
 */
export type CreateWalletResponse = ApiResponse<WalletData>;

/**
 * Update Wallet Request for REST API
 * PUT /api/v1/wallets/:id
 */
export interface UpdateWalletRequest {
  walletName?: string;
}

/**
 * Update Wallet Response for REST API
 */
export type UpdateWalletResponse = ApiResponse<WalletData>;

/**
 * Delete Wallet Request for REST API
 * DELETE /api/v1/wallets/:id
 */
export interface DeleteWalletRequest {
  id: string; // URL parameter
}

/**
 * Delete Wallet Response for REST API
 */
export type DeleteWalletResponse = ApiResponse<void>;

/**
 * Get Wallet Request for REST API
 * GET /api/v1/wallets/:id
 */
export interface GetWalletRequest {
  id: string; // URL parameter
}

/**
 * Get Wallet Response for REST API
 */
export type GetWalletResponse = ApiResponse<WalletData>;

/**
 * List Wallets Query Params for REST API
 * GET /api/v1/wallets
 */
export interface ListWalletsQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

/**
 * List Wallets Response for REST API
 */
export type ListWalletsResponse = PaginatedResponse<WalletData>;

// ============================================================================
// USER TYPES (REST API)
// ============================================================================

/**
 * User Profile data (from protobuf)
 */
export type UserProfileData = ProtoUser;

/**
 * Update Profile Request for REST API
 * PUT /api/v1/users/profile
 */
export interface UpdateProfileRequest {
  name?: string;
  picture?: string;
}

/**
 * Update Profile Response for REST API
 */
export type UpdateProfileResponse = ApiResponse<UserProfileData>;

/**
 * List Users Query Params for REST API
 * GET /api/v1/users
 */
export interface ListUsersQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

/**
 * List Users Response for REST API
 */
export type ListUsersResponse = PaginatedResponse<UserProfileData>;

/**
 * Get User Request for REST API
 * GET /api/v1/users/:id
 */
export interface GetUserRequest {
  id: string; // URL parameter
}

/**
 * Get User Response for REST API
 */
export type GetUserResponse = ApiResponse<UserProfileData>;

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination Query Parameters
 */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

/**
 * Pagination Info
 */
export type PaginationInfo = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

// ============================================================================
// MONEY TYPE
// ============================================================================

/**
 * Money type with amount in cents
 */
export type Money = {
  amount: number; // in cents (smallest currency unit)
  currency: string; // ISO 4217 currency code
};

/**
 * Convert Money to display amount
 */
export function moneyToDecimal(money: Money): number {
  return money.amount / 100;
}

/**
 * Convert decimal amount to Money (cents)
 */
export function decimalToMoney(amount: number, currency: string = "USD"): Money {
  return {
    amount: Math.round(amount * 100),
    currency,
  };
}
