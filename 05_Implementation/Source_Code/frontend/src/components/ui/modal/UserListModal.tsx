'use client';

import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { getPostLikersThunk, clearError as clearPostError } from '@/store/postSlice';
import { getFollowersThunk, getFollowingThunk, followUserThunk, unfollowUserThunk, clearError as clearProfileError } from '@/store/profileSlice';
import { RootState, AppDispatch } from '@/store';
import { createPortal } from 'react-dom';
import styles from '@/app/(main)/(feed-search)/feed/feed.module.css'; // Reuse existing styles
import Link from 'next/link';

type PostSource = 'posts' | 'usersPosts' | 'flicks' | 'explorePosts' | 'savedPosts' | 'searchedPosts';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'likes' | 'followers' | 'following';
  id: number | string | null; // postId or username
  title: string;
  postSource?: PostSource;
}

const UserListModal: React.FC<UserListModalProps> = memo(({ isOpen, onClose, type, id, title, postSource }) => {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);

  // Selectors based on type
  const { list, loading, error, hasMore} = useSelector((state: RootState) => {
    if (type === 'likes') {
      let post;
        // Select post based on postSource
        switch (postSource) {
          case 'posts':
            post = state.post.posts.find(p => p.PostID === id) || state.post.currentPost;
            break;
          case 'usersPosts':
            post = state.post.usersPosts.flatMap(up => up.posts).find(p => p.PostID === id);
            break;
          case 'flicks':
            post = state.post.flicks.find(p => p.PostID === id);
            break;
          case 'explorePosts':
            post = state.post.explorePosts.find(p => p.PostID === id);
            break;
          case 'savedPosts':
            post = state.post.savedPosts.find(p => p.PostID === id);
          case 'searchedPosts':
            post = state.post.searchPostResults.find(p => p.PostID === id);
            break;
          default:
            post = state.post.posts.find(p => p.PostID === id) || state.post.currentPost; // Fallback
        }
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setFollowError('Failed to update follow status');
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

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div className={`${styles.feed__likes_modal_overlay} bg-overlay`} onClick={onClose} role="presentation">
      <div
        className={styles.feed__likes_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.feed__likes_modal_header}>
          <h2 id="modal-title" className={styles.feed__likes_modal_title}>{title}</h2>
          <button
            onClick={onClose}
            className={styles.feed__likes_modal_close}
            aria-label={`Close ${title} Modal`}
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className={styles.feed__likes_modal_content}>
          {followError && <p className={styles.feed__error} role="alert">{followError}</p>}
          {error ? (
            <div className="text-center">
              <p className={styles.feed__error}>{(error as string) || 'Something went wrong.'}</p>
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
                  <Link href={`/${user?.username }`}>
                    <Image
                      src={user.profilePicture || '/avatars/default-avatar.svg'}
                      alt={`${user.username}'s avatar`}
                      width={40}
                      height={40}
                      className={styles.feed__likes_avatar}
                    />
                  </Link>
                  <div>
                    <Link href={`/${user?.username }`} className='hover:underline'>
                      <p className={styles.feed__likes_username}>{user.username || user.profileName}</p>
                    </Link>
                    {type === 'likes' && user.likedAt && (
                      <p className={styles.feed__likes_timestamp}>
                        Liked {formatDistanceToNow(new Date(user.likedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  {authUser?.userId !== user.userId && (
                    <button
                      onClick={() => handleFollowToggle(user.userId, user.isFollowed || false)}
                      className={
                        user.isFollowed === true
                          ? "btn-unfollow"
                          : user.isFollowed === "pending"
                          ? "btn-pending"
                          : "btn-follow"
                      }
                      disabled={followLoading[user.userId]}
                      aria-label={
                        user.isFollowed === true
                          ? `Unfollow ${user.username}`
                          : user.isFollowed === "pending"
                          ? `Follow request pending for ${user.username}`
                          : `Follow ${user.username}`
                      }
                    >
                      {followLoading[user.userId] ? 
                        <FaSpinner className="animate-spin mx-auto" aria-label="Loading more comments" />
                      : user.isFollowed === "pending"
                        ? "Requested"
                        : user.isFollowed
                        ? "Unfollow"
                        : "Follow"
                      }
                    </button>
                  )}
                </li>
              ))}
              <div ref={observerRef} className="h-1" aria-hidden="true" />
              {loading && <p className={styles.feed__loading}>Loading more...</p>}
              {!loading && !hasMore && <p className="text-center text-secondary mt-2">No more to load.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
});

UserListModal.displayName = 'UserListModal';

export default UserListModal;