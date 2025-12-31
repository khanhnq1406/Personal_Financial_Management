import { LOCAL_STORAGE_TOKEN_NAME } from "@/app/constants";
import type { ApiResponse, ApiError } from "@/types/api";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  VerifyAuthRequest,
  VerifyAuthResponse,
  CreateWalletRequest,
  CreateWalletResponse,
  UpdateWalletRequest,
  UpdateWalletResponse,
  DeleteWalletResponse,
  GetWalletResponse,
  ListWalletsQuery,
  ListWalletsResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ListUsersQuery,
  ListUsersResponse,
  GetUserResponse,
} from "@/types/api-generated";

/**
 * API Client Configuration
 */
const CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Custom Error Class for API Errors
 */
export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Sleep utility for retry delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get auth token from localStorage (client-side only)
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);
}

/**
 * Build URL with base URL
 */
function buildUrl(endpoint: string): string {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${CONFIG.baseURL}${endpoint}`;
  return url;
}

/**
 * Parse and handle API error responses
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = "An unexpected error occurred";
  let errorCode: string | undefined;
  let errorDetails: string | undefined;

  try {
    const errorData: ApiError = await response.json();
    // Go backend returns error in format: { success: false, error: { code, message, details }, timestamp, path }
    if (errorData.error) {
      errorMessage = errorData.error.message || errorMessage;
      errorCode = errorData.error.code;
      errorDetails = errorData.error.details;
    }
  } catch {
    // If parsing fails, use status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new ApiRequestError(response.status, errorMessage, errorCode, errorDetails);
}

/**
 * Retry logic for failed requests
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt: number = 1
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Don't retry on client errors (4xx) except 408, 429
    if (response.status >= 400 && response.status < 500) {
      if (response.status === 408 || response.status === 429) {
        throw new Error(`Retryable status: ${response.status}`);
      }
      return response;
    }

    // Retry on server errors (5xx) and network issues
    if (!response.ok && attempt < CONFIG.retryAttempts) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (attempt < CONFIG.retryAttempts) {
      await sleep(CONFIG.retryDelay * attempt);
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw error;
  }
}

/**
 * Enhanced API Client with proper error handling and retry logic
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    const token = getAuthToken();

    const options: RequestInit = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    return response.json();
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    const token = getAuthToken();

    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    return response.json();
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    const token = getAuthToken();

    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    return response.json();
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    const token = getAuthToken();

    const options: RequestInit = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    return response.json();
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    const token = getAuthToken();

    const options: RequestInit = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    return response.json();
  },
};

/**
 * Legacy fetcher for backward compatibility
 * @deprecated Use apiClient instead
 */
export default function fetcher(url: string, options?: RequestInit) {
  const token = getAuthToken();
  const updatedOptions: RequestInit = {
    ...options,
    headers: {
      ...options?.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  return fetch(buildUrl(url), updatedOptions);
}

// ============================================================================
// TYPED API METHODS (Using Generated Protobuf Types)
// ============================================================================

/**
 * Auth API - Type-safe methods using protobuf-generated types
 */
export const authApi = {
  /**
   * Register a new user with Google OAuth token
   * POST /api/v1/auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse["data"]>("/v1/auth/register", { googleToken: data.googleToken });
  },

  /**
   * Login with Google OAuth token
   * POST /api/v1/auth/login
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse["data"]>("/v1/auth/login", { token: data.token });
  },

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    return apiClient.post<void>("/v1/auth/logout", { token: data.token });
  },

  /**
   * Verify authentication token
   * GET /api/v1/auth/verify
   */
  async verifyAuth(data: VerifyAuthRequest): Promise<VerifyAuthResponse> {
    return apiClient.get<VerifyAuthResponse["data"]>(`/v1/auth/verify?token=${encodeURIComponent(data.token)}`);
  },
};

/**
 * Wallet API - Type-safe methods using protobuf-generated types
 */
export const walletApi = {
  /**
   * Create a new wallet
   * POST /api/v1/wallets
   */
  async create(data: CreateWalletRequest): Promise<CreateWalletResponse> {
    return apiClient.post<CreateWalletResponse["data"]>("/v1/wallets", data);
  },

  /**
   * Update a wallet
   * PUT /api/v1/wallets/:id
   */
  async update(id: string, data: UpdateWalletRequest): Promise<UpdateWalletResponse> {
    return apiClient.put<UpdateWalletResponse["data"]>(`/v1/wallets/${id}`, data);
  },

  /**
   * Delete a wallet
   * DELETE /api/v1/wallets/:id
   */
  async delete(id: string): Promise<DeleteWalletResponse> {
    return apiClient.delete<void>(`/v1/wallets/${id}`);
  },

  /**
   * Get a wallet by ID
   * GET /api/v1/wallets/:id
   */
  async get(id: string): Promise<GetWalletResponse> {
    return apiClient.get<GetWalletResponse["data"]>(`/v1/wallets/${id}`);
  },

  /**
   * List wallets with pagination
   * GET /api/v1/wallets
   */
  async list(query?: ListWalletsQuery): Promise<ListWalletsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.pageSize) params.append("pageSize", query.pageSize.toString());
    if (query?.orderBy) params.append("orderBy", query.orderBy);
    if (query?.order) params.append("order", query.order);

    const queryString = params.toString();
    const endpoint = `/v1/wallets${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<ListWalletsResponse["data"]>(endpoint);
  },
};

/**
 * User API - Type-safe methods using protobuf-generated types
 */
export const userApi = {
  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return apiClient.put<UpdateProfileResponse["data"]>("/v1/users/profile", data);
  },

  /**
   * List users with pagination
   * GET /api/v1/users
   */
  async list(query?: ListUsersQuery): Promise<ListUsersResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.pageSize) params.append("pageSize", query.pageSize.toString());
    if (query?.orderBy) params.append("orderBy", query.orderBy);
    if (query?.order) params.append("order", query.order);

    const queryString = params.toString();
    const endpoint = `/v1/users${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<ListUsersResponse["data"]>(endpoint);
  },

  /**
   * Get a user by ID
   * GET /api/v1/users/:id
   */
  async get(id: string): Promise<GetUserResponse> {
    return apiClient.get<GetUserResponse["data"]>(`/v1/users/${id}`);
  },
};
