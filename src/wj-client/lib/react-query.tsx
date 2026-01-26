/**
 * Optimized React Query Configuration
 *
 * Implements Vercel React Best Practices:
 * - client-swr-dedup: Configure React Query for automatic request deduplication
 * - async-parallel: Enable parallel queries by default
 * - server-cache-react: Use queryClient cache effectively
 */

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

/**
 * Create optimized QueryClient with best practice defaults
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
        // Data is considered fresh for 1 minute
        staleTime: 60 * 1000,

        // Cache data for 5 minutes
        gcTime: 5 * 60 * 1000,

        // Retry failed requests once
        retry: 1,

        // Don't refetch on window focus (reduces unnecessary requests)
        refetchOnWindowFocus: false,

        // Refetch on mount only if data is stale
        refetchOnMount: true,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Enable parallel queries (async-parallel)
        networkMode: "online",
      },
      mutations: {
        // Retry mutations once
        retry: 1,

        // Network mode for mutations
        networkMode: "online",
      },
    },
  });
}

/**
 * Query key factories for type-safe cache management
 * Implements server-cache-react pattern
 */
export const queryKeys = {
  // Wallet queries
  wallets: {
    all: ["wallets"] as const,
    lists: () => ["wallets", "list"] as const,
    list: (filters: Record<string, any>) =>
      ["wallets", "list", filters] as const,
    details: () => ["wallets", "detail"] as const,
    detail: (id: number) => ["wallets", "detail", id] as const,
    balance: (walletId: number) => ["wallets", walletId, "balance"] as const,
    balanceHistory: (walletId: number, params: any) =>
      ["wallets", walletId, "balance-history", params] as const,
    monthlyDominance: (walletId: number, params: any) =>
      ["wallets", walletId, "monthly-dominance", params] as const,
  },

  // Transaction queries
  transactions: {
    all: ["transactions"] as const,
    lists: () => ["transactions", "list"] as const,
    list: (filters: Record<string, any>) =>
      ["transactions", "list", filters] as const,
    details: () => ["transactions", "detail"] as const,
    detail: (id: number) => ["transactions", "detail", id] as const,
  },

  // Investment queries
  investments: {
    all: ["investments"] as const,
    lists: () => ["investments", "list"] as const,
    list: (filters: Record<string, any>) =>
      ["investments", "list", filters] as const,
    details: () => ["investments", "detail"] as const,
    detail: (id: number) => ["investments", "detail", id] as const,
    transactions: (investmentId: number, filters: any) =>
      ["investments", investmentId, "transactions", filters] as const,
    portfolioSummary: (walletId: number) =>
      ["investments", "portfolio-summary", walletId] as const,
  },

  // Category queries
  categories: {
    all: ["categories"] as const,
    lists: () => ["categories", "list"] as const,
  },

  // User queries
  user: {
    all: ["user"] as const,
    profile: () => ["user", "profile"] as const,
    availableYears: () => ["user", "available-years"] as const,
  },
};

/**
 * Optimistic update helpers
 * Implements async-dependencies pattern for partial updates
 */
export const optimisticUpdateHelpers = {
  // Update wallet list optimistically
  updateWalletList: (
    queryClient: QueryClient,
    newWallet: any,
    action: "add" | "update" | "delete"
  ) => {
    queryClient.setQueryData(
      queryKeys.wallets.list({}),
      (oldData: any) => {
        if (!oldData) return oldData;

        if (action === "add") {
          return {
            ...oldData,
            wallets: [...(oldData.wallets || []), newWallet],
          };
        }

        if (action === "update") {
          return {
            ...oldData,
            wallets: oldData.wallets.map((w: any) =>
              w.id === newWallet.id ? newWallet : w
            ),
          };
        }

        if (action === "delete") {
          return {
            ...oldData,
            wallets: oldData.wallets.filter((w: any) => w.id !== newWallet.id),
          };
        }

        return oldData;
      }
    );
  },

  // Update transaction list optimistically
  updateTransactionList: (
    queryClient: QueryClient,
    newTransaction: any,
    action: "add" | "update" | "delete"
  ) => {
    queryClient.setQueryData(
      queryKeys.transactions.list({}),
      (oldData: any) => {
        if (!oldData) return oldData;

        if (action === "add") {
          return {
            ...oldData,
            transactions: [
              newTransaction,
              ...(oldData.transactions || []),
            ],
          };
        }

        if (action === "update") {
          return {
            ...oldData,
            transactions: oldData.transactions.map((t: any) =>
              t.id === newTransaction.id ? newTransaction : t
            ),
          };
        }

        if (action === "delete") {
          return {
            ...oldData,
            transactions: oldData.transactions.filter(
              (t: any) => t.id !== newTransaction.id
            ),
          };
        }

        return oldData;
      }
    );
  },

  // Update investment list optimistically
  updateInvestmentList: (
    queryClient: QueryClient,
    newInvestment: any,
    action: "add" | "update" | "delete"
  ) => {
    queryClient.setQueryData(
      queryKeys.investments.list({}),
      (oldData: any) => {
        if (!oldData) return oldData;

        if (action === "add") {
          return {
            ...oldData,
            data: [...(oldData.data || []), newInvestment],
          };
        }

        if (action === "update") {
          return {
            ...oldData,
            data: oldData.data.map((i: any) =>
              i.id === newInvestment.id ? newInvestment : i
            ),
          };
        }

        if (action === "delete") {
          return {
            ...oldData,
            data: oldData.data.filter((i: any) => i.id !== newInvestment.id),
          };
        }

        return oldData;
      }
    );
  },
};

/**
 * Selectors for extracting specific data from queries
 * Implements rerender-derived-state pattern
 */
export const querySelectors = {
  // Get only investment wallets
  getInvestmentWallets: (data: any) => {
    if (!data?.wallets) return [];
    return data.wallets.filter(
      (wallet: any) => wallet.type === "INVESTMENT"
    );
  },

  // Get only basic wallets
  getBasicWallets: (data: any) => {
    if (!data?.wallets) return [];
    return data.wallets.filter(
      (wallet: any) => wallet.type === "BASIC"
    );
  },

  // Calculate total balance
  getTotalBalance: (data: any) => {
    if (!data?.wallets) return 0;
    return data.wallets.reduce(
      (sum: number, wallet: any) => sum + (wallet.balance || 0),
      0
    );
  },

  // Get portfolio metrics
  getPortfolioMetrics: (data: any) => {
    if (!data) return null;
    return {
      totalValue: data.totalValue || 0,
      totalCost: data.totalCost || 0,
      totalPnl: data.totalPnl || 0,
      totalInvestments: data.totalInvestments || 0,
    };
  },
};

/**
 * Prefetch helpers for loading data in advance
 * Implements bundle-preload for data
 */
export const prefetchHelpers = {
  // Prefetch wallet list
  prefetchWalletList: async (queryClient: QueryClient, fetchFn: any) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.wallets.list({}),
      queryFn: fetchFn,
      staleTime: 30 * 1000, // 30 seconds
    });
  },

  // Prefetch investment data
  prefetchInvestmentData: async (
    queryClient: QueryClient,
    walletId: number,
    fetchFns: { summary: any; investments: any }
  ) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.investments.portfolioSummary(walletId),
        queryFn: fetchFns.summary,
        staleTime: 30 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.investments.list({ walletId }),
        queryFn: fetchFns.investments,
        staleTime: 30 * 1000,
      }),
    ]);
  },
};
