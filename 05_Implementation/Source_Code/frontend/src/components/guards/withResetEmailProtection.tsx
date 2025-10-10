/**
 * Higher-Order Component (HOC) to protect pages requiring a resetEmail in the Redux store.
 * Redirects to /forgot-password if resetEmail is absent after auth initialization.
 * @param WrappedComponent - The component to protect.
 * @returns A protected component that renders only if resetEmail is present.
 */
'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import type { RootState } from '@/store';

const withResetEmailProtection = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    const router = useRouter();
    const resetEmail = useSelector((state: RootState) => state.auth.resetEmail as string | null);
    const isAuthLoading = useSelector((state: RootState) => state.auth.loading.initialize);

    useEffect(() => {
      // Redirect to /forgot-password if resetEmail is missing and auth initialization is complete
      if (!resetEmail && !isAuthLoading) {
        router.replace('/forgot-password');
      }
    }, [resetEmail, isAuthLoading, router]);

    // Loading state
    if (isAuthLoading) {
      return (
        <div className="auth-page__loading" role="status" aria-live="polite">
          Loading...
        </div>
      );
    }

    // Render the wrapped component only if resetEmail is present
    return resetEmail ? <WrappedComponent {...props} /> : null;
  };

  ProtectedComponent.displayName = `WithResetEmailProtection(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ProtectedComponent;
};

export default withResetEmailProtection;