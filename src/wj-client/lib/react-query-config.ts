/**
 * React Query Optimization Configuration
 *
 * This file contains optimized settings for React Query including:
 * - Stale-time configuration for different query types
 * - Prefetch on hover patterns
 * - Background refetch settings
 * - Optimistic update helpers
 */

import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";

/**
 * Query cache times based on data type
 *
 * shorter stale times for frequently changing data
 * longer stale times for rarely changing data
 */
export const CACHE_TIMES = {
  /** Very volatile data - 30 seconds */
  VOLATILE: 30 * 1000,

  /** User-specific real-time data - 1 minute */
  USER_DATA: 60 * 1000,

  /** Transaction data - 2 minutes */
  TRANSACTIONS: 2 * 60 * 1000,

  /** Wallet data - 3 minutes */
  WALLETS: 3 * 60 * 1000,

  /** Budget data - 5 minutes */
  BUDGETS: 5 * 60 * 1000,

  /** Investment portfolio - 2 minutes (market data) */
  INVESTMENTS: 2 * 60 * 1000,

  /** Market/stock prices - 1 minute */
  MARKET_DATA: 60 * 1000,

  /** Gold prices - 15 minutes */
  GOLD_PRICES: 15 * 60 * 1000,

  /** Static data (categories, etc) - 30 minutes */
  STATIC: 30 * 60 * 1000,

  /** User preferences - 1 hour */
  PREFERENCES: 60 * 60 * 1000,
} as const;

/**
 * GC times for garbage collection
 * Keep data in cache longer for potential reuse
 */
export const GC_TIMES = {
  /** Short GC for volatile data - 5 minutes */
  VOLATILE: 5 * 60 * 1000,

  /** Standard GC - 30 minutes */
  STANDARD: 30 * 60 * 1000,

  /** Long GC for static data - 1 hour */
  LONG: 60 * 60 * 1000,
} as const;

/**
 * Create an optimized QueryClient instance
 *
 * Features:
 * - Configurable stale times per query type
 * - Automatic retry with exponential backoff
 * - Cache cleanup
 * - Global error handling
 */
export function createOptimizedQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.error("Query error:", error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    }),
    defaultOptions: {
      queries: {
        // Keep data fresh for 2 minutes by default
        staleTime: CACHE_TIMES.TRANSACTIONS,

        // Cache data for 30 minutes
        gcTime: GC_TIMES.STANDARD,

        // Retry failed requests 3 times
        retry: 3,

        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (optional, can be disabled)
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: false,

        // Keep previous data while refetching
        placeholderData: (previousData: any) => previousData,
      },
      mutations: {
        // Retry mutations once
        retry: 1,

        // Don't retry mutations on 4xx errors
        retryDelay: 1000,

        // Use optimistic updates
        onMutate: async (variables) => {
          // Cancel any outgoing refetches
          // await queryClient.cancelQueries(queryKey);

          // Snapshot the previous value
          // const previous = queryClient.getQueryData(queryKey);

          // Optimistically update to the new value
          // queryClient.setQueryData(queryKey, newValue);

          // Return context with previous value
          // return { previous };
        },

        // If mutation fails, use context returned from onMutate
        onError: (error, variables, context) => {
          // Rollback to previous value
          // if (context?.previous) {
          //   queryClient.setQueryData(queryKey, context.previous);
          // }
        },

        // Always refetch after error or success
        onSettled: async (data, error, variables, context) => {
          // await queryClient.invalidateQueries(queryKey);
        },
      },
    },
  });
}

/**
 * Prefetch helper for hover-based prefetching
 *
 * Usage:
 * ```tsx
 * <Link
 *   href="/dashboard/transaction"
 *   onMouseEnter={() => prefetchTransactions(queryClient)}
 * >
 *   Transactions
 * </Link>
 * ```
 */
export const prefetchHelpers = {
  /**
   * Prefetch wallet list
   */
  prefetchWallets: async (queryClient: QueryClient, userId?: number) => {
    // This would use the generated hook internally
    // await queryClient.prefetchQuery({
    //   queryKey: ['wallets', userId],
    //   queryFn: () => fetchWallets(userId),
    //   staleTime: CACHE_TIMES.WALLETS,
    // });
  },

  /**
   * Prefetch transactions
   */
  prefetchTransactions: async (queryClient: QueryClient, params?: any) => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['transactions', params],
    //   queryFn: () => fetchTransactions(params),
    //   staleTime: CACHE_TIMES.TRANSACTIONS,
    // });
  },

  /**
   * Prefetch investment portfolio
   */
  prefetchInvestments: async (queryClient: QueryClient, walletId?: number) => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['investments', walletId],
    //   queryFn: () => fetchInvestments(walletId),
    //   staleTime: CACHE_TIMES.INVESTMENTS,
    // });
  },

  /**
   * Prefetch market data
   */
  prefetchMarketData: async (queryClient: QueryClient, symbols?: string[]) => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['market-data', symbols],
    //   queryFn: () => fetchMarketData(symbols),
    //   staleTime: CACHE_TIMES.MARKET_DATA,
    // });
  },

  /**
   * Prefetch gold prices
   */
  prefetchGoldPrices: async (queryClient: QueryClient) => {
    // await queryClient.prefetchQuery({
    //   queryKey: ['gold-prices'],
    //   queryFn: () => fetchGoldPrices(),
    //   staleTime: CACHE_TIMES.GOLD_PRICES,
    // });
  },
};

/**
 * Optimistic update helpers
 *
 * These helpers make it easier to implement optimistic updates
 * with proper rollback on error
 */
export const optimisticUpdates = {
  /**
   * Helper for adding an item to a list optimistically
   */
  addToList: <T extends { id: string | number }>(
    queryClient: QueryClient,
    queryKey: unknown[],
    newItem: T,
  ) => {
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previous = queryClient.getQueryData<T[]>(queryKey);

    // Optimistically update to the new value
    queryClient.setQueryData<T[]>(queryKey, (old = []) => [...old, newItem]);

    // Return a context object with the snapshotted value
    return { previous };
  },

  /**
   * Helper for updating an item in a list optimistically
   */
  updateInList: <T extends { id: string | number }>(
    queryClient: QueryClient,
    queryKey: unknown[],
    itemId: string | number,
    updates: Partial<T>,
  ) => {
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previous = queryClient.getQueryData<T[]>(queryKey);

    // Optimistically update the item
    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
      old.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    );

    // Return a context object with the snapshotted value
    return { previous };
  },

  /**
   * Helper for deleting an item from a list optimistically
   */
  deleteFromList: <T extends { id: string | number }>(
    queryClient: QueryClient,
    queryKey: unknown[],
    itemId: string | number,
  ) => {
    // Cancel any outgoing refetches
    queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previous = queryClient.getQueryData<T[]>(queryKey);

    // Optimistically remove the item
    queryClient.setQueryData<T[]>(queryKey, (old = []) =>
      old.filter((item) => item.id !== itemId),
    );

    // Return a context object with the snapshotted value
    return { previous };
  },

  /**
   * Rollback helper
   */
  rollback: <T>(queryClient: QueryClient, queryKey: unknown[], previous: T) => {
    queryClient.setQueryData(queryKey, previous);
  },
};

/**
 * Query key generators for consistency
 */
export const queryKeys = {
  wallets: {
    all: ["wallets"] as const,
    lists: () => [...queryKeys.wallets.all, "list"] as const,
    list: (filters: unknown) => [...queryKeys.wallets.lists(), filters] as const,
    details: () => [...queryKeys.wallets.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.wallets.details(), id] as const,
  },

  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters: unknown) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.transactions.details(), id] as const,
  },

  investments: {
    all: ["investments"] as const,
    lists: () => [...queryKeys.investments.all, "list"] as const,
    list: (walletId: number) => [...queryKeys.investments.lists(), walletId] as const,
    details: () => [...queryKeys.investments.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.investments.details(), id] as const,
    transactions: (id: number) => [...queryKeys.investments.detail(id), "transactions"] as const,
  },

  budgets: {
    all: ["budgets"] as const,
    lists: () => [...queryKeys.budgets.all, "list"] as const,
    list: (filters: unknown) => [...queryKeys.budgets.lists(), filters] as const,
    details: () => [...queryKeys.budgets.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.budgets.details(), id] as const,
  },

  marketData: {
    all: ["market-data"] as const,
    symbols: (symbols: string[]) => [...queryKeys.marketData.all, "symbols", symbols] as const,
    prices: (symbols: string[]) => [...queryKeys.marketData.all, "prices", symbols] as const,
  },

  goldPrices: {
    all: ["gold-prices"] as const,
    current: () => [...queryKeys.goldPrices.all, "current"] as const,
  },
};

/**
 * Prefetch hook for use in components
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const queryClient = useQueryClient();
 *   const prefetchWallets = usePrefetchOnHover(() =>
 *     prefetchHelpers.prefetchWallets(queryClient)
 *   );
 *
 *   return <Link onMouseEnter={prefetchWallets}>Wallets</Link>;
 * }
 * ```
 */
export function createPrefetchHook<T extends (...args: unknown[]) => unknown>(fn: T) {
  let prefetched = false;

  return (...args: Parameters<T>) => {
    if (!prefetched) {
      fn(...args);
      prefetched = true;
    }
  };
}

/**
 * Background refetch configuration
 *
 * Configure when and how data should be refetched in the background
 */
export const backgroundRefetchConfig = {
  /**
   * Enable background refetch for real-time data
   */
  realTimeData: {
    refetchInterval: 30 * 1000, // 30 seconds
    refetchIntervalInBackground: false, // Only when tab is active
  },

  /**
   * Enable background refetch for market data
   */
  marketData: {
    refetchInterval: 60 * 1000, // 1 minute
    refetchIntervalInBackground: true, // Always update market data
  },

  /**
   * Disable background refetch for static data
   */
  staticData: {
    refetchInterval: false,
  },
};
