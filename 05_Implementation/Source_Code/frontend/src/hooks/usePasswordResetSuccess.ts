'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const usePasswordResetSuccess = () => {
  const router = useRouter();

  // Handle continue navigation
  const handleContinue = useCallback(() => {
    router.push('/login');
  }, [router]);

  return {
    handleContinue,
  };
};