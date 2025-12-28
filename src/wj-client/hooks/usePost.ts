import { useState } from "react";
import fetcher from "@/utils/fetcher";

interface UsePostOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UsePostReturn<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  post: (body: any) => Promise<void>;
  reset: () => void;
}

export function usePost<T = any>(
  url: string,
  options?: UsePostOptions
): UsePostReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const post = async (body: any) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetcher(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        options?.onSuccess?.(result);
      } else {
        const errorMessage = "Request failed. Please try again.";
        setError(errorMessage);
        options?.onError?.(new Error(errorMessage));
      }
    } catch {
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
      options?.onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { data, error, loading, post, reset };
}
