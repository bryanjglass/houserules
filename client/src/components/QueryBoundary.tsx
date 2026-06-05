import type { ReactNode } from 'react';
import Loading from './Loading';

// Wraps a screen's primary query state: shows the shared loader while pending,
// an error card with a retry on failure, else the children. Keeps every page's
// loading/error handling consistent instead of ad-hoc `if (loading)` blocks and
// silent `.catch(() => null)`.
export default function QueryBoundary({
  isPending,
  isError,
  onRetry,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (isPending) return <Loading />;
  if (isError) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-16 text-center">
        <p className="text-ink-500">Something went wrong loading this page.</p>
        <button onClick={onRetry} className="btn-primary mt-3 mx-auto">
          Try again
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
