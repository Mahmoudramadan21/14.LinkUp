'use client';

import React, { memo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
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
  const username = params.username ?? '';
  const { profiles, loading } = useSelector((state: RootState) => state.profile);
  const profile = username ? profiles[username] : null;


  // Redirect if:
  // - Username is invalid
  // - Profile loaded and user is not the owner
  useEffect(() => {
    if (!username) {
      router.replace('/');
      return;
    }

    if (!loading.getProfile && profile && !profile.isMine) {
      router.replace(`/${username}`, { scroll: false });
    }
  }, [profile, loading.getProfile, username, router]);
  
  /**
   * Graceful close with proper history handling
   * 1. Go to user's profile
   * 2. Fallback to home
   */
  const handleClose = () => {
    if (username) {
      router.replace(`/${username}`, { scroll: false });
    } else {
      router.replace('/feed', { scroll: false });
    }
  };

  if (!loading.getProfile && profile && profile.isMine) {
    return (
      <CreateHighlightModal isOpen={true} onClose={handleClose} />
    );
  }
});

FullCreateHighlightPage.displayName = 'FullCreateHighlightPage';

export default FullCreateHighlightPage;