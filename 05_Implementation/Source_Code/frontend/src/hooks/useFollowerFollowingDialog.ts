'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useProfileStore } from '@/store/profileStore';
import { FollowerFollowingDialogProps, ProfileStore } from '@/types';
import { filterUsers, getFocusableElements } from '@/utils/followerFollowingUtils';

// Custom hook for debouncing search input
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Custom hook for focus trapping
const useFocusTrap = (dialogRef: React.RefObject<HTMLDialogElement>) => {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = getFocusableElements(dialog);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialogRef]);
};

export const useFollowerFollowingDialog = ({
  isOpen,
  onClose,
  userId,
  type,
  data,
}: FollowerFollowingDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { authData, removeFollower, unfollowUser, fetchFollowers, fetchFollowing, setError } =
    useProfileStore() as ProfileStore;

  const isOwnProfile = authData?.userId === userId;

  // Filter data based on debounced search query
  const filteredData = useMemo(
    () => filterUsers(data, debouncedSearchQuery),
    [data, debouncedSearchQuery]
  );

  // Open dialog
  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  // Focus trap for accessibility
  useFocusTrap(dialogRef);

  // Close dialog on outside click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  }, [onClose]);

  // Close dialog on Escape key
  const handleBackdropKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Remove follower
  const handleRemoveFollower = useCallback(
    async (followerId: number) => {
      if (!isOwnProfile) return;
      try {
        await removeFollower(followerId);
        await fetchFollowers(userId);
      } catch (err: any) {
        setError(err.message || 'Failed to remove follower');
      }
    },
    [isOwnProfile, removeFollower, fetchFollowers, userId, setError]
  );

  // Unfollow user
  const handleUnfollow = useCallback(
    async (followedUserId: number) => {
      if (!isOwnProfile) return;
      try {
        await unfollowUser(followedUserId);
        await fetchFollowing(userId);
      } catch (err: any) {
        setError(err.message || 'Failed to unfollow');
      }
    },
    [isOwnProfile, unfollowUser, fetchFollowing, userId, setError]
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    dialogRef,
    backdropRef,
    isOwnProfile,
    handleBackdropClick,
    handleBackdropKeyDown,
    handleRemoveFollower,
    handleUnfollow,
  };
};