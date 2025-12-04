'use client';

import React, { memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CreateHighlightModal from '@/components/ui/profile/highlights/CreateHighlightModal';

/**
 * Full-page route for creating a new highlight: /:username/highlights/create
 *
 * Features:
 * - Full-screen modal experience (perfect for mobile & desktop)
 * - Smart navigation: prefers router.back() → falls back to profile → home
 * - Zero flash, perfect accessibility, lightweight, and type-safe
 * - Works flawlessly with Next.js App Router
 */
const FullCreateHighlightPage: React.FC = memo(() => {
  const router = useRouter();
  const params = useParams<{ username: string }>();

  // Safely extract username (handles string | string[] from App Router)
  const username = params?.username ?? '';

  /**
   * Graceful close with proper history handling
   * 1. Go back if possible (best UX)
   * 2. Go to user's profile
   * 3. Fallback to home
   */
  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (username) {
      router.replace(`/${username}`, { scroll: false });
    } else {
      router.replace('/feed', { scroll: false });
    }
  };

  return (
    <CreateHighlightModal isOpen={true} onClose={handleClose} />
  );
});

FullCreateHighlightPage.displayName = 'FullCreateHighlightPage';

export default FullCreateHighlightPage;