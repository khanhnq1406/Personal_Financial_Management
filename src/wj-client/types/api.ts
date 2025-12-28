// ============================================================================
// STANDARD API RESPONSE TYPES
// ============================================================================

/**
 * Standard API Response Structure
 * All API responses follow this structure for consistency
 */
export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  errors?: Array<{
    field?: string;
    message: string;
    value?: any;
  }>;
};

/**
 * API Error Response
 */
export type ApiError = {
  success: false;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
};

// ============================================================================
// AUTH TYPES
// ============================================================================

/**
 * Authenticated User
 */
export type AuthUser = {
  id: number;
  email: string;
  name: string;
  picture: string;
};

/**
 * Login Request
 */
export type LoginRequest = {
  token: string;
};

/**
 * Login Response Data
 */
export type LoginResponseData = {
  accessToken: string;
  email: string;
  fullname: string;
  picture: string;
};

/**
 * Register Request
 */
export type RegisterRequest = {
  token: string;
};

/**
 * Logout Request
 */
export type LogoutRequest = {
  token: string;
};

// ============================================================================
// WALLET TYPES
// ============================================================================

/**
 * Wallet Entity
 */
export type Wallet = {
  id: number;
  wallet_name: string;
  balance: number;
  user_id: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * Create Wallet Request
 */
export type CreateWalletRequest = {
  name: string;
  balance?: number;
};

/**
 * Create Wallet Response Data
 */
export type CreateWalletResponseData = {
  id: number;
  name: string;
  balance: number;
  userId: number;
};

/**
 * List Wallets Response Data
 */
export type ListWalletsResponseData = Wallet[];

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * Transaction Entity
 */
export type Transaction = {
  id: number;
  amount: number;
  description: string;
  wallet_id: number;
  user_id: number;
  created_at: string;
};
