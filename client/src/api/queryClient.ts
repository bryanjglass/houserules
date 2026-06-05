import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

// One shared cache for all server reads. Defaults are tuned for this app:
// - staleTime 15s so back-and-forth navigation doesn't refetch, while mutations
//   still invalidate immediately to keep actioned data live.
// - no refetch-on-focus (this also runs in a Capacitor/PWA shell).
// - never retry a 4xx (esp. 401, which the axios interceptor already turns into
//   a logout); retry a transient error once.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
