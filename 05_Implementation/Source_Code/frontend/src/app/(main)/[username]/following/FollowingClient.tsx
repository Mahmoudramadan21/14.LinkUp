'use client';

import React, { useEffect, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import UserListModal from '@/components/ui/modal/UserListModal';
import { RootState } from '@/store';

/**
 * Dedicated page for displaying who a user is following.
 * Route: /:username/following
 *
 * Features:
 * - Full access control for private accounts
 * - Safe username extraction (handles arrays from App Router)
 * - No flash of content during redirect
 * - Smooth navigation with preserved scroll position
 * - Proper loading and error states
 */
const FollowingPage: React.FC = memo(() => {
  const router = useRouter();
  const params = useParams();

  // Safely extract username from dynamic route (handles string | string[])
  const username = Array.isArray(params?.username)
    ? params.username[0]
    : (params?.username as string) ?? '';

  const { profiles, loading } = useSelector((state: RootState) => state.profile);
  const profile = username ? profiles[username] : null;

  // Redirect if profile is private and user has no access
  useEffect(() => {
    if (
      !loading.getProfile &&
      username &&
      (!profile || (profile.isPrivate && !profile.hasAccess))
    ) {
      router.replace(`/${username}`);
    }
  }, [profile, loading.getProfile, username, router]);

  // Prevent rendering during loading or redirect
  // Eliminates layout shift and flash of unauthorized content
  if (loading.getProfile || !username || !profile || !profile.hasAccess) {
    return null;
  }

  const handleClose = () => {
    router.push(`/${username}`, { scroll: false });
  };

  return (
    <UserListModal
      isOpen={true}
      onClose={handleClose}
      type="following"
      id={username}
      title="Following"
    />
  );
});

FollowingPage.displayName = 'FollowingPage';

export default FollowingPage;