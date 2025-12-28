'use client';

import { ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import AppLoader from '../ui/common/AppLoader';

interface GuestProps {
  children: ReactNode;
}

const Guest = ({ children }: GuestProps) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (!loading.initialize && isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, loading.initialize, router]);

  if (loading.initialize) {
    return <AppLoader />;
  }

  // Guest
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};

export default Guest;
