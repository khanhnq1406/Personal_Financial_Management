import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, ApiRequestError } from "@/utils/api-client";
import type { ApiResponse } from "@/types/api";

// ============================================================================
// USE GET HOOK
// ============================================================================

interface UseGetOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiRequestError) => void;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseGetReturn<T> {
  data: T | null;
  error: ApiRequestError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useGet<T = any>(
  url: string | null,
  options?: UseGetOptions
): UseGetReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetch = useCallback(async () => {
    if (!url || options?.enabled === false) {
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await apiClient.get<T>(url);

      if (response.success && response.data !== undefined) {
        setData(response.data);
        setIsSuccess(true);
        setIsError(false);
        options?.onSuccess?.(response.data);
      } else {
        throw new ApiRequestError(500, response.message || "Request failed");
      }
    } catch (err) {
      const apiError =
        err instanceof ApiRequestError
          ? err
          : new ApiRequestError(500, "An unexpected error occurred");
      setError(apiError);
      setIsError(true);
      setIsSuccess(false);
      options?.onError?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, [url, options?.enabled, options?.onSuccess, options?.onError]);

  useEffect(() => {
    fetch();

    // Set up interval refetch if specified
    if (options?.refetchInterval && options.refetchInterval > 0) {
      intervalRef.current = setInterval(fetch, options.refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetch, options?.refetchInterval]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
  }, []);

  return { data, error, isLoading, isError, isSuccess, refetch: fetch, reset };
}

// ============================================================================
// USE POST HOOK
// ============================================================================

interface UsePostOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiRequestError) => void;
}

interface UsePostReturn<T> {
  data: T | null;
  error: ApiRequestError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  post: (body?: any) => Promise<void>;
  reset: () => void;
}

export function usePost<T = any>(
  url: string,
  options?: UsePostOptions
): UsePostReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const post = useCallback(
    async (body?: any) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      setData(null);

      try {
        const response = await apiClient.post<T>(url, body);

        if (response.success && response.data !== undefined) {
          setData(response.data);
          setIsSuccess(true);
          setIsError(false);
          options?.onSuccess?.(response.data);
        } else {
          throw new ApiRequestError(500, response.message || "Request failed");
        }
      } catch (err) {
        const apiError =
          err instanceof ApiRequestError
            ? err
            : new ApiRequestError(500, "An unexpected error occurred");
        setError(apiError);
        setIsError(true);
        setIsSuccess(false);
        options?.onError?.(apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [url, options?.onSuccess, options?.onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
  }, []);

  return { data, error, isLoading, isError, isSuccess, post, reset };
}

// ============================================================================
// USE MUTATION HOOK (for PUT, PATCH, DELETE)
// ============================================================================

type MutationMethod = "PUT" | "PATCH" | "DELETE";

interface UseMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiRequestError) => void;
}

interface UseMutationReturn<T> {
  data: T | null;
  error: ApiRequestError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  mutate: (body?: any) => Promise<void>;
  reset: () => void;
}

export function useMutation<T = any>(
  url: string,
  method: MutationMethod,
  options?: UseMutationOptions
): UseMutationReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutate = useCallback(
    async (body?: any) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      setData(null);

      try {
        let response: ApiResponse<T>;

        switch (method) {
          case "PUT":
            response = await apiClient.put<T>(url, body);
            break;
          case "PATCH":
            response = await apiClient.patch<T>(url, body);
            break;
          case "DELETE":
            response = await apiClient.delete<T>(url);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        if (response.success) {
          setData(response.data ?? null);
          setIsSuccess(true);
          setIsError(false);
          options?.onSuccess?.(response.data);
        } else {
          throw new ApiRequestError(500, response.message || "Request failed");
        }
      } catch (err) {
        const apiError =
          err instanceof ApiRequestError
            ? err
            : new ApiRequestError(500, "An unexpected error occurred");
        setError(apiError);
        setIsError(true);
        setIsSuccess(false);
        options?.onError?.(apiError);
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, options?.onSuccess, options?.onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
  }, []);

  return { data, error, isLoading, isError, isSuccess, mutate, reset };
}

// ============================================================================
// ERROR MESSAGES UTILITY
// ============================================================================

export function getErrorMessage(error: ApiRequestError | null): string {
  if (!error) return "";

  // Handle specific error codes
  switch (error.statusCode) {
    case 400:
      return error.message || "Invalid request. Please check your input.";
    case 401:
      return "You're not authenticated. Please login.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return error.message || "This resource already exists.";
    case 422:
      return error.message || "Validation failed. Please check your input.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
      return "Server error. Please try again later.";
    case 503:
      return "Service unavailable. Please try again later.";
    default:
      return error.message || "An unexpected error occurred.";
  }
}

// ============================================================================
// EXPORT LEGACY HOOKS
// ============================================================================

/**
 * @deprecated Use useGet instead
 */
export { useGet as useGetLegacy };

/**
 * @deprecated Use usePost instead
 */
export { usePost as usePostLegacy };
