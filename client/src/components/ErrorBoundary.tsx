import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface State {
  hasError: boolean;
}

// Contains a render-time error so a component throw shows a recoverable fallback
// instead of unmounting the whole app to a white screen.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <p className="text-lg font-bold text-ink-900">Something went wrong.</p>
          <p className="text-sm text-ink-500 mt-1">Reloading usually fixes it.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
