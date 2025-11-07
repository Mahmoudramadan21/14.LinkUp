'use client';

import React, { useEffect, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import UserListModal from '@/components/ui/modal/UserListModal';
import { RootState } from '@/store';

/**
 * Dedicated page for displaying a user's followers list.
 * Acts as a full-screen modal route: /:username/followers
 *
 * Features:
 * - Access control: Redirects if profile is private and user has no access
 * - Proper loading state handling
 * - Clean, semantic, and accessible
 */
const FollowersPage: React.FC = memo(() => {
  const router = useRouter();
  const params = useParams();

  // Safely extract username from dynamic route
  const username = Array.isArray(params?.username)
    ? params.username[0]
    : params?.username ?? '';

  const { profiles, loading } = useSelector((state: RootState) => state.profile);
  const profile = username ? profiles[username] : null;

  // Redirect if:
  // - Profile loaded and user has no access (private account)
  // - Profile doesn't exist
  useEffect(() => {
    if (
      !loading.getProfile &&
      (!profile || (profile.isPrivate && !profile.hasAccess))
    ) {
      router.replace(`/${username}`);
    }
  }, [profile, loading.getProfile, username, router]);

  // Show nothing while checking access or redirecting
  // Prevents flash of content or layout shift
  if (loading.getProfile || !profile || !profile.hasAccess) {
    return null;
  }

  const handleClose = () => {
    router.push(`/${username}`, { scroll: false });
  };

  return (
    <UserListModal
      isOpen={true}
      onClose={handleClose}
      type="followers"
      id={username}
      title="Followers"
    />
  );
});

FollowersPage.displayName = 'FollowersPage';

export default FollowersPage;