'use client';
import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Transition } from '@headlessui/react';
import Button from './Button';
import Loading from './Loading';
import { useProfileStore } from '@/store/profileStore';
import { FollowerFollowingDialogProps, ProfileStore } from '@/types';

// Custom hook for debouncing search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Custom hook for focus trapping
function useFocusTrap(dialogRef: React.RefObject<HTMLDialogElement>) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
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
}

const FollowerFollowingDialog: React.FC<FollowerFollowingDialogProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  showSearch,
  showRemove,
  data,
  loading = false,
  error = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { authData, removeFollower, unfollowUser, fetchFollowers, fetchFollowing, setError } =
    useProfileStore() as ProfileStore;

  const isOwnProfile = authData?.userId === userId;

  // Filter data based on debounced search query
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (item.profileName &&
          item.profileName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    );
  }, [data, debouncedSearchQuery]);

  // Open dialog and manage focus
  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  // Focus trap for accessibility
  useFocusTrap(dialogRef);

  // Close dialog on outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  // Close dialog on Escape key
  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Remove follower
  const handleRemoveFollower = async (followerId: number) => {
    if (!isOwnProfile) return;
    try {
      await removeFollower(followerId);
      await fetchFollowers(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove follower');
    }
  };

  // Unfollow user
  const handleUnfollow = async (followedUserId: number) => {
    if (!isOwnProfile) return;
    try {
      await unfollowUser(followedUserId);
      await fetchFollowing(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to unfollow');
    }
  };

  if (!isOpen) return null;

  return (
    <Transition
      show={isOpen}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="follower-following-dialog__backdrop"
        ref={backdropRef}
        onClick={handleBackdropClick}
        onKeyDown={handleBackdropKeyDown}
        tabIndex={0}
      >
        <dialog
          className="follower-following-dialog__content"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="follower-following-dialog-title"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="follower-following-dialog__title" id="follower-following-dialog-title">
            {type}
          </h2>
          {showSearch && (
            <div className="follower-following-dialog__search">
              <label htmlFor="search-input" className="follower-following-dialog__label">
                Search {type}
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="follower-following-dialog__search-input"
                aria-label={`Search ${type}`}
              />
            </div>
          )}
          {loading ? (
            <Loading />
          ) : error ? (
            <p
              className="follower-following-dialog__error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          ) : (
            <div className="follower-following-dialog__list">
              {filteredData.length === 0 ? (
                <p className="follower-following-dialog__empty">No {type} found</p>
              ) : (
                filteredData.map((item) => (
                  <div
                    key={item.userId}
                    className="follower-following-dialog__item"
                    itemProp="author"
                  >
                    <Link
                      href={`/profile/${item.username}`}
                      className="follower-following-dialog__user"
                      prefetch={false}
                    >
                      <div className="follower-following-dialog__avatar">
                        <Image
                          src={item.profilePicture || '/avatars/placeholder.jpg'}
                          alt={`${item.username}'s profile picture`}
                          width={48}
                          height={48}
                          className="follower-following-dialog__avatar-img"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/avatars/default.jpg';
                          }}
                        />
                      </div>
                      <div className="follower-following-dialog__info">
                        <p className="follower-following-dialog__name">
                          {item.profileName || item.username}
                        </p>
                        <p className="follower-following-dialog__username">
                          @{item.username}
                        </p>
                      </div>
                    </Link>
                    {isOwnProfile && showRemove && (
                      <div className="follower-following-dialog__action">
                        {type === 'followers' ? (
                          <Button
                            variant="primary"
                            size="small"
                            type="button"
                            onClick={() => handleRemoveFollower(item.userId)}
                            aria-label={`Remove ${item.username} from followers`}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="small"
                            type="button"
                            onClick={() => handleUnfollow(item.userId)}
                            aria-label={`Unfollow ${item.username}`}
                          >
                            Following
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          <Button
            variant="secondary"
            size="medium"
            type="button"
            onClick={onClose}
            className="follower-following-dialog__button--close"
            aria-label="Close dialog"
          >
            Close
          </Button>
        </dialog>
      </div>
    </Transition>
  );
};

export default memo(FollowerFollowingDialog);