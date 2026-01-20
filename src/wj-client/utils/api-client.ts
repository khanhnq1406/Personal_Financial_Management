import { LOCAL_STORAGE_TOKEN_NAME } from "@/app/constants";
import type { ApiResponse } from "@/types/api";

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
 * Custom Error Class for API Errors - FULLY TYPED
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
 * Parse and handle API error responses - TYPE SAFE
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = "An unexpected error occurred";
  let errorCode: string | undefined;
  let errorDetails: string | undefined;

  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get("content-type");
  const hasJsonContent = contentType?.includes("application/json");

  if (hasJsonContent) {
    try {
      const errorData = await response.json();

      // Handle standard Go backend format with error object
      if (errorData.error && typeof errorData.error === "object") {
        errorMessage = errorData.error.message || errorMessage;
        errorCode = errorData.error.code;
        errorDetails = errorData.error.details;
      }
      // Handle flat error format with error code string and message
      else if (errorData.error && typeof errorData.error === "string") {
        errorCode = errorData.error;
        errorMessage = errorData.message || errorMessage;
      }
      // Handle simple message format
      else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If JSON parsing fails, fall through to status text
      errorMessage = response.statusText || errorMessage;
    }
  } else {
    // No JSON content, use status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new ApiRequestError(
    response.status,
    errorMessage,
    errorCode,
    errorDetails
  );
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
 * Enhanced API Client - FULLY TYPE SAFE
 */
export const apiClient = {
  /**
   * GET request - TYPED
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
   * POST request - TYPED
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
   * PUT request - TYPED
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
   * PATCH request - TYPED
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
   * DELETE request - TYPED
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

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as ApiResponse<T>;
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
