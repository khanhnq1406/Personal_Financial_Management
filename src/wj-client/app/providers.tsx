"use client";

/**
 * Providers Component
 * Wraps the application with necessary React providers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="system" storageKey="wealthjourney-theme">
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </NotificationProvider>
      </ThemeProvider>
      {/* Performance Monitor - Development Mode Only */}
      <PerformanceMonitor
        enabled={process.env.NODE_ENV === 'development'}
        logToConsole={true}
        showBadge={true}
        sampleRate={1}
      />
    </Provider>
  );
}
