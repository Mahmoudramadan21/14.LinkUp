// components/ErrorBoundary.tsx
/**
 * ErrorBoundary Component
 * 
 * A reusable error boundary to catch and display errors gracefully.
 * Supports retry functionality.
 * 
 * - Performance: Lightweight, no heavy dependencies.
 * - Accessibility: ARIA alert for error messages.
 * - Best Practices: Uses useCallback for memoized handlers.
 */

import { useCallback } from 'react';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  error: string;
  retry: () => void;
  children?: React.ReactNode;
}

/**
 * ErrorBoundary Component
 * 
 * @param {ErrorBoundaryProps} props - Component props
 */
function ErrorBoundary({ error, retry, children }: ErrorBoundaryProps) {
  const handleRetry = useCallback(() => retry(), [retry]);
  
  return children ? children : (
    <div className="text-center p-4">
      <p className="text-red-500" role="alert">{error}</p>
      <button onClick={handleRetry} className="btn-primary mt-2" aria-label="Retry">
        Retry
      </button>
    </div>
  );
}

ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;