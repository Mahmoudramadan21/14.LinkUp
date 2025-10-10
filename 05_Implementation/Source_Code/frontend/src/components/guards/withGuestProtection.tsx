/**
 * Higher-Order Component (HOC) to protect guest-only pages (e.g., login, signup).
 * Redirects authenticated users to /feed and displays a loading state during auth check.
 * @param WrappedComponent - The component to protect.
 * @returns A protected component that renders only for unauthenticated users.
 */
'use client';
import { ComponentType, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { checkAuthThunk } from '@/store/authSlice';
import type { RootState, AppDispatch } from '@/store';

const withGuestProtection = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const GuestProtected: React.FC<P> = (props) => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
      // Check auth status if not yet determined
      if (isAuthenticated === null) {
        dispatch(checkAuthThunk());
      }
      // Redirect if authenticated and auth check is complete
      else if (!loading.checkAuth && isAuthenticated) {
        router.replace('/feed');
      }
    }, [dispatch, isAuthenticated, loading.checkAuth, router]);

    // Loading state
    if (loading.checkAuth) {
      return (
        <div className="auth-page__loading" role="status" aria-live="polite">
          Loading...
        </div>
      );
    }

    // Render wrapped component only if not authenticated
    if (isAuthenticated === false && !loading.checkAuth) {
      return <WrappedComponent {...props} />;
    }

    return null;
  };

  GuestProtected.displayName = `WithGuestProtection(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return GuestProtected;
};

export default withGuestProtection;