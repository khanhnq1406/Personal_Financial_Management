// ============================================================================
// STANDARD API RESPONSE TYPES (Go Backend)
// ============================================================================

/**
 * API Error Detail from Go backend
 */
export type ApiErrorDetail = {
  code: string;
  message: string;
  details?: string;
};

/**
 * Standard API Response Structure
 * All API responses from Go backend follow this structure
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
  message?: string;
  timestamp: string;
  path?: string;
};

/**
 * API Error Response
 */
export type ApiError = {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
  path?: string;
};

/**
 * Pagination Response
 */
export type PaginationResult = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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
  createdAt?: string;
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
  createdAt?: string;
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
  walletName: string;
  balance: number;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Create Wallet Request
 */
export type CreateWalletRequest = {
  walletName: string;
  initialBalance?: number;
};

/**
 * List Wallets Response Data
 */
export type ListWalletsResponseData = {
  pagination: PaginationResult;
  wallets: Wallet[];
};

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
  walletId: number;
  userId: number;
  createdAt: string;
};
