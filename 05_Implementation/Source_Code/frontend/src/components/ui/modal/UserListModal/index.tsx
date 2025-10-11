'use client';

import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { getPostLikersThunk, clearError as clearPostError } from '@/store/postSlice';
import { getFollowersThunk, getFollowingThunk, followUserThunk, unfollowUserThunk, clearError as clearProfileError } from '@/store/profileSlice';
import { RootState, AppDispatch } from '@/store';
import styles from '@/app/feed/feed.module.css'; // Reuse existing styles

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'likes' | 'followers' | 'following';
  id: number | string | null; // postId or username
  title: string;
}

const UserListModal: React.FC<UserListModalProps> = memo(({ isOpen, onClose, type, id, title }) => {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);

  // Selectors based on type
  const { list, loading, error, hasMore} = useSelector((state: RootState) => {
    if (type === 'likes') {
      const post = state.post.posts.find(p => p.PostID === id) || state.post.currentPost;
      console.log(post)
      return {
        list: post?.Likes || [],
        loading: state.post.loading.getPostLikers,
        error: state.post.error.getPostLikers,
        hasMore: (post?.Likes || []).length < (post?.likeCount || 0),
        pagination: null, // Likes may not have pagination object, handle differently
        totalCount: post?.likeCount || 0,
      };
    } else {
      const profile = state.profile.profiles[id as string];
      const key = type === 'followers' ? 'followers' : 'following';
      const paginationKey = type === 'followers' ? 'followersPagination' : 'followingPagination';
      return {
        list: profile?.[key] || [],
        loading: state.profile.loading[`get${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof state.profile.loading],
        error: state.profile.error[`get${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof state.profile.error],
        hasMore: state.profile[`hasMore${type.charAt(0).toUpperCase() + type.slice(1)}`][id as string] ?? true,
        pagination: profile?.[paginationKey as keyof typeof profile],
        totalCount: profile?.[`${type}Count`] || 0,
      };
    }
  });

  const [page, setPage] = useState(1);
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});
  const [followError, setFollowError] = useState<string | null>(null);
  const limit = 20;
  const observerRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial data if needed
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      const params = { page: 1, limit };
      if (type === 'likes') {
        dispatch(getPostLikersThunk({ postId: id as number, params }));
      } else if (type === 'followers') {
        dispatch(getFollowersThunk({ username: id as string, params }));
      } else {
        dispatch(getFollowingThunk({ username: id as string, params }));
      }
    }
    return () => {
      if (type === 'likes') {
        dispatch(clearPostError('getPostLikers'));
      } else if (type === 'followers') {
        dispatch(clearProfileError('getFollowers'));
      } else if (type === 'following') {
        dispatch(clearProfileError('getFollowing'));
      }
      setFollowError(null);
    };
  }, [isOpen, dispatch, type, id]);

  // Infinite scroll
  useEffect(() => {
    if (!isOpen || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [isOpen, loading, hasMore]);

  // Fetch next page
  useEffect(() => {
    if (page > 1 && hasMore) {
      const params = { page, limit };
      if (type === 'likes') {
        dispatch(getPostLikersThunk({ postId: id as number, params }));
      } else if (type === 'followers') {
        dispatch(getFollowersThunk({ username: id as string, params }));
      } else {
        dispatch(getFollowingThunk({ username: id as string, params }));
      }
    }
  }, [page, hasMore, dispatch, type, id]);

  // Handle follow/unfollow with optimistic update
  const handleFollowToggle = useCallback(async (userId: number, isFollowed: boolean) => {
    setFollowLoading((prev) => ({ ...prev, [userId]: true }));
    setFollowError(null);

    // Optimistic update: Update list locally first
    // Note: This requires mutable list, but since Redux is immutable, we'd need to dispatch an action. For simplicity, assume we update UI state temporarily.
    // For full optimistic, add extra reducers in slices.

    try {
      if (isFollowed) {
        await dispatch(unfollowUserThunk(userId)).unwrap();
      } else {
        await dispatch(followUserThunk(userId)).unwrap();
      }
      toast.success(isFollowed ? 'Unfollowed' : 'Followed');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setFollowError('Failed to update follow status');
      toast.error('Failed to update follow status');
      // Rollback optimistic update (reverse in UI)
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }, [dispatch]);

  // Keyboard handling for accessibility (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus(); // Trap focus
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap (simple version; use react-focus-lock for advanced)
  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableElements?.[0] as HTMLElement;
      const last = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      const trap = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      };
      window.addEventListener('keydown', trap);
      return () => window.removeEventListener('keydown', trap);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.feed__post_modal_overlay} onClick={onClose} role="presentation">
      <div
        className={styles.feed__post_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.feed__post_modal_header}>
          <h2 id="modal-title" className={styles.feed__post_modal_title}>{title}</h2>
          <button
            onClick={onClose}
            className={styles.feed__post_modal_close}
            aria-label={`Close ${title} Modal`}
          >
            <FaTimes />
          </button>
        </div>
        <div className={styles.feed__post_modal_content}>
          {followError && <p className={styles.feed__error} role="alert">{followError}</p>}
          {error ? (
            <div className="text-center">
              <p className={styles.feed__error}>{error}</p>
              <button
                onClick={() => {
                  const params = { page: 1, limit };
                  if (type === 'likes') dispatch(getPostLikersThunk({ postId: id as number, params }));
                  else if (type === 'followers') dispatch(getFollowersThunk({ username: id as string, params }));
                  else dispatch(getFollowingThunk({ username: id as string, params }));
                }}
                className={styles.feed__retry_button}
                aria-label="Retry loading"
              >
                Retry
              </button>
            </div>
          ) : loading && list.length === 0 ? (
            <p className={styles.feed__loading} aria-live="polite">Loading...</p>
          ) : list.length === 0 ? (
            <p className={styles.feed__empty} aria-live="polite">No {type} yet.</p>
          ) : (
            <ul className={styles.feed__likes_list} role="list" aria-live="polite">
              {list.map((user) => (
                <li key={user.userId} className={styles.feed__likes_item}>
                  <Image
                    src={user.profilePicture || '/avatars/default-avatar.svg'}
                    alt={`${user.username}'s avatar`}
                    width={40}
                    height={40}
                    className={styles.feed__likes_avatar}
                  />
                  <div>
                    <p className={styles.feed__likes_username}>{user.username || user.profileName}</p>
                    {type === 'likes' && user.likedAt && (
                      <p className={styles.feed__likes_timestamp}>
                        Liked {formatDistanceToNow(new Date(user.likedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  {authUser?.userId !== user.userId && (
                    <button
                      onClick={() => handleFollowToggle(user.userId, user.isFollowed || false)}
                      className={`${styles.feed__likes_follow_button} ${
                        user.isFollowed ? styles.feed__likes_unfollow : styles.feed__likes_follow
                      } ${followLoading[user.userId] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={followLoading[user.userId]}
                      aria-label={user.isFollowed ? `Unfollow ${user.username}` : `Follow ${user.username}`}
                    >
                      {followLoading[user.userId] ? '⏳' : user.isFollowed ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </li>
              ))}
              <div ref={observerRef} className="h-1" aria-hidden="true" />
              {loading && <p className={styles.feed__loading}>Loading more...</p>}
              {!loading && !hasMore && <p className="text-center text-gray-600 dark:text-gray-400 text-lg mt-2">No more to load.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
});

UserListModal.displayName = 'UserListModal';

export default UserListModal;