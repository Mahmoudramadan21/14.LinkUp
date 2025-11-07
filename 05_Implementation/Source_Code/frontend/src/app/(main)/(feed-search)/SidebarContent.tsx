// app/feed/SidebarContent.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { 
  getUserSuggestionsThunk, 
  getPendingFollowRequestsThunk, 
  followUserThunk, 
  unfollowUserThunk, 
  acceptFollowRequestThunk, 
  rejectFollowRequestThunk 
} from '@/store/profileSlice';
import { FollowUser, FollowRequestItem } from '@/types/profile';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './sidebar.module.css';
import { FaSpinner } from "react-icons/fa";

/**
 * SidebarContent
 * Renders the right sidebar on the feed page showing:
 * - "Suggested for you" user suggestions
 * - Pending follow requests (only for private accounts)
 */
const SidebarContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { suggestions, pendingRequests, loading } = useSelector(
    (state: RootState) => state.profile
  );

  const [suggestionsLimit] = useState(4);

  // Fetch user suggestions (limited to 4 by default)
  const fetchSuggestions = useCallback(() => {
    dispatch(getUserSuggestionsThunk({ limit: suggestionsLimit }));
  }, [dispatch, suggestionsLimit]);

  // Initial data load when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      fetchSuggestions();

      // Load pending follow requests only for private accounts
      if (user.isPrivate) {
        dispatch(getPendingFollowRequestsThunk());
      }
    }
  }, [isAuthenticated, user, fetchSuggestions, dispatch]);

  const sidebarSections = useMemo(() => {
    return [
      {
        id: 'suggestions',
        title: 'SUGGESTED FOR YOU',
        data: suggestions as FollowUser[],
        loading: loading.getSuggestions,
        emptyMessage: 'No suggestions yet. Follow more people!',
        seeAllUrl: '/connections?tab=suggestions',
      },
      ...(user?.isPrivate
        ? [{
            id: 'requests',
            title: 'Follow Requests',
            data: pendingRequests as FollowRequestItem[],
            loading: loading.getPendingRequests,
            emptyMessage: 'No pending requests.',
            seeAllUrl: '/connections?tab=requests',
          }]
        : []),
    ];
  }, [suggestions, pendingRequests, user, loading]);

  // Toggle follow/unfollow for suggested users
  const handleFollowOrUnfollow = useCallback(
    (userId: number, isFollowed: boolean) => {
      if (isFollowed) {
        dispatch(unfollowUserThunk(userId));
      } else {
        dispatch(followUserThunk(userId));
      }
    },
    [dispatch]
  );

  // Accept incoming follow request
  const handleConfirm = useCallback(
    (requestId: number) => {
      dispatch(acceptFollowRequestThunk(requestId));
    },
    [dispatch]
  );

  // Reject/delete incoming follow request
  const handleReject = useCallback(
    (requestId: number) => {
      dispatch(rejectFollowRequestThunk(requestId));
    },
    [dispatch]
  );

  // Navigate to full list page
  const handleSeeAll = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router]
  );

  return (
    <div className={styles.sidebar} role="complementary" aria-label="Connection Suggestions and Requests">
      {sidebarSections.map((section) => (
        <section
          key={section.id}
          className={styles['sidebar__section']}
          aria-labelledby={`${section.id}-title`}
        >
          {/* Section Header */}
          <div className={styles['sidebar__header']}>
            <h2 id={`${section.id}-title`} className={styles['sidebar__title']}>
              {section.title}
            </h2>
            <button
              className={styles['sidebar__see-all']}
              onClick={() => handleSeeAll(section.seeAllUrl)}
              aria-label={`See all ${section.title.toLowerCase()}`}
            >
              See All
            </button>
          </div>
          
          {/* Loading State */}
          {section.loading ? (
            <div className={styles['sidebar__loading']}>Loading...</div>
          ) : section.data.length > 0 ? (
            /* List of Users / Requests */
            <ul className={styles['sidebar__list']}>
              {section.data.slice(0, 4).map((item) => (
                <li key={item.userId || (item as FollowRequestItem).requestId} className={styles['sidebar__item']}>
                  {section.id === 'suggestions' ? (
                    /* === Suggestion Item === */
                    <>
                      <Link href={`/${item.username}`}>
                        <Image
                          src={item.profilePicture || '/avatars/default-avatar.svg'}
                          alt={`${item.username}'s profile`}
                          width={40}
                          height={40}
                          className={styles['sidebar__avatar']}
                        />
                      </Link>
                      <div className={styles['sidebar__info']}>
                        <Link href={`/${item.username}`} className={`${styles['sidebar__username']} hover:underline`}>
                          @{item.username.length > 15 ? item.username.slice(0, 15) + "..." : item.username}
                        </Link>
                        <p className={styles['sidebar__bio']}>{item.bio || 'No bio available'}</p>
                      </div>
                      <button
                        className={styles['sidebar__follow-button']}
                        onClick={() => handleFollowOrUnfollow(item.userId, item.isFollowed || false)}
                        aria-label={`${item.isFollowed ? 'Unfollow' : 'Follow'} ${item.username}`}
                        disabled={loading.followUser[item.userId] || loading.unfollowUser[item.userId]}
                      >
                        {loading.followUser[item.userId] || loading.unfollowUser[item.userId]
                          ? <FaSpinner className="animate-spin" />
                          : item.isFollowed ? 'Unfollow' : 'Follow'}
                      </button>
                    </>
                  ) : (
                   /* === Follow Request Item === */
                    <>
                      <Link href={`/${item.user.username}`}>
                        <Image
                          src={item.user.profilePicture || '/avatars/default-avatar.svg'}
                          alt={`${item.user.username}'s profile`}
                          width={40}
                          height={40}
                          className={styles['sidebar__avatar']}
                        />
                      </Link>
                      <div className={styles['sidebar__info']}>
                        <Link href={`/${item.user.username}`} className={`${styles['sidebar__username']} hover:underline`}>
                          @{item.user.username.length > 15 ? item.user.username.slice(0, 15) + "..." : item.user.username}
                        </Link>
                        <p className={styles['sidebar__bio']}>{item.user.bio || 'No bio available'}</p>
                      </div>
                      <div className={styles['sidebar__actions']}>
                        <button
                          className={styles['sidebar__confirm-button']}
                          onClick={() => handleConfirm((item as FollowRequestItem).requestId)}
                          aria-label={`Confirm follow request from ${item.user.username}`}
                          disabled={loading.acceptRequest[item.requestId]}
                        >
                          {loading.acceptRequest[item.requestId]
                            ? <FaSpinner className="animate-spin" />
                            : 'Confirm'}
                        </button>
                        <button
                          className={styles['sidebar__reject-button']}
                          onClick={() => handleReject((item as FollowRequestItem).requestId)}
                          aria-label={`Reject follow request from ${item.user.username}`}
                          disabled={loading.rejectRequest[item.requestId]}
                        >
                          {loading.rejectRequest[item.requestId]
                            ? <FaSpinner className="animate-spin" />
                            : 'Delete'}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            /* Empty State */
            <p className={styles['sidebar__empty']}>{section.emptyMessage}</p>
          )}
        </section>
      ))}
    </div>
  );
};

export default SidebarContent;
