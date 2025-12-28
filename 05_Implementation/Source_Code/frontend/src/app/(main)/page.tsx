'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import AppLoader from "@/components/ui/common/AppLoader";

/**
 * HomePage Component
 * Redirects users based on authentication status:
 * - Authenticated → /feed
 * - Not authenticated → /login
 * Waits for auth initialization (handled by AuthInitializer) before redirect.
 */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  // Redirect after auth initialization completes
  useEffect(() => {
    if (loading.initialize) return;

    router.replace(isAuthenticated ? "/feed" : "/login");
  }, [loading.initialize, isAuthenticated, router]);

  // Loading state while waiting
  return (
    <AppLoader />
  );
}
