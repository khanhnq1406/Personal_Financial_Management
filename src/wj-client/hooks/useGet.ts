import { useState, useEffect } from "react";
import fetcher from "@/utils/fetcher";

interface UseGetOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseGetReturn<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useGet<T = any>(
  url: string | null,
  options?: UseGetOptions
): UseGetReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!url || options?.enabled === false) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetcher(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        options?.onSuccess?.(result);
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        const errorMessage = `Request failed (${response.status}): ${errorText}`;
        setError(errorMessage);
        options?.onError?.(new Error(errorMessage));
      }
    } catch (err) {
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [url]);

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { data, error, loading, refetch: fetch, reset };
}
