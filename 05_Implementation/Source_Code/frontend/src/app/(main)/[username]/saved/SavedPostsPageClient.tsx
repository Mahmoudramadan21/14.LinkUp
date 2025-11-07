'use client';

import React, { useEffect, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';

/**
 * Protected route: /:username/saved
 *
 * Purpose:
 * - Only the profile owner can access their own saved posts tab
 * - Acts as a silent redirector — no UI rendered here
 * - Works seamlessly with the main profile layout (which renders PostsGrid based on active tab)
 *
 * Security:
 * - Instantly redirects non-owners
 * - Prevents flash of saved content
 * - Clears profile errors on mount (UX polish)
 */
const SavedPostsPageClient: React.FC = memo(() => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ username: string }>();

  const username = params.username ?? '';
  const { profiles, loading, error } = useSelector((state: RootState) => state.profile);
  const profile = username ? profiles[username] : null;

  // Optional: Clear any previous profile errors when entering this route
  useEffect(() => {
    if (error.getProfile) {
      dispatch({ type: 'profile/clearError', payload: 'getProfile' } as const);
    }
  }, [error.getProfile, dispatch]);

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

  // This page renders nothing — layout.tsx handles showing PostsGrid with type="saved"
  // We return null to avoid any flash or unnecessary DOM
  return null;
});

SavedPostsPageClient.displayName = 'SavedPostsPageClient';

export default SavedPostsPageClient;