import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized React Query client configuration
 *
 * Key settings:
 * - staleTime: 5 min - data considered fresh, won't refetch
 * - gcTime: 10 min - keep in cache for instant back navigation
 * - refetchOnWindowFocus: false - don't refetch when tab regains focus
 * - retry with exponential backoff for network resilience
 */
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes - prevents unnecessary refetches
      staleTime: 5 * 60 * 1000,

      // Keep in garbage collection cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Don't refetch when window regains focus (mobile app behavior)
      refetchOnWindowFocus: false,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Retry with exponential backoff (1s, 2s, 4s max 3 attempts)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Cache time presets for different data types
 * Import and use in individual queries for fine-grained control
 */
export const CACHE_PRESETS = {
  // User data - long cache, rarely changes
  user: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  // Appointments - moderate cache, changes throughout day
  appointments: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  // Reference data (clients, horses, yards) - longer cache
  referenceData: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  // Treatments - shorter cache, actively being edited
  treatments: {
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  },
  // Invoices - moderate cache
  invoices: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
};
