'use client';

import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from '@/store';
import {
  getProfileByUsernameThunk,
  setCurrentProfileUsername,
  clearError,
  followUserThunk,
  unfollowUserThunk,
} from '@/store/profileSlice';
import { getUserHighlightsThunk, clearError as clearHighlightError } from '@/store/highlightSlice';
import { clearError as clearStoryError } from '@/store/storySlice';
import { Profile } from '@/types/profile';
import styles from '@/components/profile/ProfileHeader.module.css';
import storiesStyles from '@/app/feed/stories.module.css';
import CreateHighlightAvatar from '@/components/profile/CreateHighlightAvatar';

function LoadingFallback() {
  return <div className="text-center text-lg py-10">Loading...</div>;
}

export default function ProfileLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const { username } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    profiles,
    currentProfileUsername,
    loading: profileLoading,
    error: profileError,
  } = useSelector((state: RootState) => state.profile);
  const { highlightsByUsername, loading: highlightLoading, error: highlightError } = useSelector(
    (state: RootState) => state.highlight
  );
  const { error: storyError } = useSelector((state: RootState) => state.story);
  const profile: Profile | null = currentProfileUsername
    ? profiles[currentProfileUsername] || null
    : null;
  const highlightsData = highlightsByUsername[username as string] || { highlights: [], pagination: null };
  const highlights = highlightsData.highlights || [];
  const hasMoreHighlights = highlightsData.pagination
    ? highlightsData.pagination.page < highlightsData.pagination.totalPages
    : false;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(getProfileByUsernameThunk(username as string));
    dispatch(getUserHighlightsThunk({ username: username as string, params: { limit: 15, offset: 0 } }));
    return () => {
      dispatch(clearError('getProfile'));
      dispatch(clearHighlightError('getUserHighlights'));
      dispatch(setCurrentProfileUsername(null));
    };
  }, [dispatch, username]);

  // Infinite scroll setup
  useEffect(() => {
    if (!hasMoreHighlights || highlightLoading.getUserHighlights) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          dispatch(
            getUserHighlightsThunk({
              username: username as string,
              params: {
                limit: highlightsData.pagination?.limit || 15,
                offset: (highlightsData.pagination?.page || 0) * (highlightsData.pagination?.limit || 15),
              },
            })
          );
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current && sentinelRef.current) {
        observerRef.current.unobserve(sentinelRef.current);
      }
    };
  }, [dispatch, username, hasMoreHighlights, highlightLoading.getUserHighlights, highlightsData.pagination]);

  // Error handling with toast
  useEffect(() => {
    if (profileError.getProfile) {
      toast.error(profileError.getProfile);
      dispatch(clearError('getProfile'));
    }
    if (highlightError.getUserHighlights) {
      toast.error(highlightError.getUserHighlights);
      dispatch(clearHighlightError('getUserHighlights'));
    }
    if (storyError.toggleStoryLike) {
      toast.error(storyError.toggleStoryLike);
      dispatch(clearStoryError('toggleStoryLike'));
    }
    if (storyError.deleteStory) {
      toast.error(storyError.deleteStory);
      dispatch(clearStoryError('deleteStory'));
    }
  }, [
    profileError.getProfile,
    highlightError.getUserHighlights,
    storyError.toggleStoryLike,
    storyError.deleteStory,
    dispatch,
  ]);

  const handleFollowToggle = () => {
    if (!profile) return;
    dispatch(followUserThunk(profile.userId));
  };

  const handleUnfollowToggle = () => {
    if (!profile) return;
    dispatch(unfollowUserThunk(profile.userId));
  };

  const handleEditProfile = () => {
    router.push('/edit');
  };

  const handleViewHighlight = (highlightId: number) => {
    router.push(`/${username}/highlights/${highlightId}`);
  };

  const handleNavigateToPosts = () => {
    router.push(`/${username}/posts`);
  };

  const handleNavigateToFollowers = () => {
    router.push(`/${username}/followers`);
  };

  const handleNavigateToFollowing = () => {
    router.push(`/${username}/following`);
  };

  // Skeleton loader component (memoized for performance)
  const StoryAvatarSkeleton = useMemo(() => {
    const Skeleton = () => (
      <div className={storiesStyles.stories__avatar_wrapper}>
        <div className={`${storiesStyles.stories__avatar} ${storiesStyles.stories__skeleton}`} />
      </div>
    );
    Skeleton.displayName = 'StoryAvatarSkeleton';
    return Skeleton;
  }, []);

  // Skeletons for initial load (8 placeholders)
  const initialSkeletons = useMemo(
    () => Array.from({ length: 8 }).map((_, index) => <StoryAvatarSkeleton key={`init-skeleton-${index}`} />),
    [StoryAvatarSkeleton]
  );

  // Skeletons for "load more" (2 placeholders)
  const loadMoreSkeletons = useMemo(
    () => Array.from({ length: 3 }).map((_, index) => <StoryAvatarSkeleton key={`more-skeleton-${index}`} />),
    [StoryAvatarSkeleton]
  );

  return (
    <div className="min-h-screen bg-[var(--gray-bg)] dark:bg-[var(--gray-dark-bg)]">
      {/* Header */}
      <header>
        <Suspense fallback={<LoadingFallback />}>
          {profileLoading.getProfile ? (
            <div className={styles['profile-header__loading']}>Loading...</div>
          ) : profileError.getProfile || !profile ? (
            <div className={styles['profile-header__not-found']}>
              <p className={styles['profile-header__not-found-text']}>
                {profileError.getProfile || 'Profile not found'}
              </p>
            </div>
          ) : (
            <div className={styles['profile-header__container']}>
              <div className={styles['profile-header__header']}>
                <div className={styles['profile-header__cover']}>
                  {profile.coverPicture ? (
                    <Image
                      src={profile.coverPicture || '/images/default-cover.jpg'}
                      alt="Cover"
                      fill
                      priority
                      className={styles['profile-header__cover-image']}
                    />
                  ) : (
                    <div className={styles['profile-header__cover-placeholder']} />
                  )}
                  {profile.isMine && (
                    <button
                      onClick={handleEditProfile}
                      className={styles['profile-header__edit-btn']}
                      aria-label="Edit Profile"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                <div className={styles['profile-header__info']}>
                  {profile.hasActiveStories ? (
                    <Link
                      href={`/${username}/stories`}
                      className={`${storiesStyles.stories__avatar_ring} 
                      ${profile.hasUnViewedStories && profile.hasActiveStories ? storiesStyles.stories__avatar_ring_unviewed : ''}
                      ${styles['profile-header__profile-pic']}`}
                      data-unviewed={profile.hasUnViewedStories && profile.hasActiveStories ? 'true' : 'false'}
                      aria-label={`View ${profile.username}'s stories`}
                      prefetch={false}
                    >
                      <Image
                        src={profile.profilePicture || '/avatars/default-avatar.svg'}
                        alt={profile.username}
                        width={150}
                        height={150}
                        priority
                        className={`
                          ${styles['profile-header__profile-image']}
                          ${profile.hasActiveStories && !profile.hasUnViewedStories ? storiesStyles.stories__avatar : ''}
                        `}
                      />
                    </Link>
                  ) : (
                    <div
                      className={`${storiesStyles.stories__avatar_ring} 
                      ${profile.hasUnViewedStories && profile.hasActiveStories ? storiesStyles.stories__avatar_ring_unviewed : ''}
                      ${styles['profile-header__profile-pic']}`}
                    >
                      <Image
                        src={profile.profilePicture || '/avatars/default-avatar.svg'}
                        alt={profile.username}
                        width={150}
                        height={150}
                        priority
                        className={`${styles['profile-header__profile-image']} ${
                          profile.hasActiveStories && !profile.hasUnViewedStories
                            ? storiesStyles.stories__avatar
                            : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className={styles['profile-header__content']}>
                <div className={styles['profile-header__details']}>
                  <h1 className={styles['profile-header__name']}>
                    {profile.profileName || profile.username}
                  </h1>
                  <p className={styles['profile-header__username']}>
                    @{profile.username}
                  </p>
                  {profile.followedBy.length > 0 && (
                    <div className={styles['profile-header__followed-by']}>
                      <span>Followed by </span>
                      {profile.followedBy.slice(0, 2).map((follower, index) => (
                        <span key={follower.userId}>
                          <a
                            href={`/profile/${follower.username}`}
                            className={styles['profile-header__followed-by-link']}
                            aria-label={`View ${follower.profileName || follower.username}'s profile`}
                          >
                            {follower.profileName || follower.username}
                          </a>
                          {index < profile.followedBy.length - 1 && index < 1 && ', '}
                        </span>
                      ))}
                      {profile.followedBy.length > 2 && (
                        <span> and {profile.followedBy.length - 2} others</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles['profile-header__stats']}>
                  <div className={styles['profile-header__stat--item']}>
                    <button
                      className={styles['profile-header__stat-value']}
                      onClick={handleNavigateToPosts}
                      aria-label="View posts"
                    >
                      {profile.postCount}
                    </button>
                    <span className={styles['profile-header__stat-label']}>Posts</span>
                  </div>
                  <div className={styles['profile-header__stat--item']}>
                    <button
                      className={styles['profile-header__stat-value']}
                      onClick={handleNavigateToFollowers}
                      aria-label="View followers"
                    >
                      {profile.followerCount}
                    </button>
                    <span className={styles['profile-header__stat-label']}>Followers</span>
                  </div>
                  <div className={styles['profile-header__stat--item']}>
                    <button
                      className={styles['profile-header__stat-value']}
                      onClick={handleNavigateToFollowing}
                      aria-label="View following"
                    >
                      {profile.followingCount}
                    </button>
                    <span className={styles['profile-header__stat-label']}>Following</span>
                  </div>
                </div>
                {!profile.isMine && (
                  <div className={styles['profile-header__actions']}>
                    <button
                      onClick={profile.isFollowing ? handleUnfollowToggle : handleFollowToggle}
                      className={styles['profile-header__follow-btn']}
                      disabled={profileLoading.followUser || profileLoading.unfollowUser}
                      aria-label={profile.isFollowing ? 'Unfollow' : 'Follow'}
                    >
                      {profile.isFollowing
                        ? 'Unfollow'
                        : profile.followStatus === 'PENDING'
                        ? 'Requested'
                        : 'Follow'}
                    </button>
                    <button
                      className={styles['profile-header__message-btn']}
                      aria-label="Send Message"
                    >
                      <svg
                        className={styles['profile-header__message-icon']}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className={styles['profile-header__highlights']}>
                {profile.isMine && <CreateHighlightAvatar />}

                {highlightLoading.getUserHighlights && highlights.length === 0 && (
                  <div className={storiesStyles.stories__feed} aria-live="polite" aria-busy="true">
                    <div
                      className={storiesStyles.stories__bar}
                      role="region"
                      aria-label="Loading stories feed"
                    >
                      {initialSkeletons }
                    </div>
                  </div>
                )}
                
                {highlights.length > 0 && (
                  <>
                    {highlights.map((highlight) => (
                      <button
                        key={highlight.highlightId}
                        className={styles['profile-header__highlight-item']}
                        onClick={() => handleViewHighlight(highlight.highlightId)}
                        aria-label={`View highlight: ${highlight.title}`}
                      >
                        <Image
                          src={highlight.coverImage || '/default-highlight.png'}
                          alt={highlight.title}
                          className={styles['profile-header__highlight-image']}
                          width={70}
                          height={70}
                        />
                        <span className={styles['profile-header__highlight-title']}>
                          {highlight.title}
                        </span>
                      </button>
                    ))}
                    {hasMoreHighlights && (
                      <div
                        ref={sentinelRef}
                        className="h-10 w-full"
                        aria-hidden="true"
                      />
                    )}
                    {highlightLoading.getUserHighlights && highlights.length > 0 && (
                      <div className={storiesStyles.stories__feed} aria-live="polite" aria-busy="true">
                        <div
                          className={storiesStyles.stories__bar}
                          role="region"
                          aria-label="Loading stories feed"
                        >
                            {loadMoreSkeletons }
                          </div>
                      </div>
                    )}
                  </>
                )}
                {highlightError.getUserHighlights && (
                  <div className={styles['profile-header__error']}>
                    <p>{highlightError.getUserHighlights}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Suspense>
      </header>

      {/* Main content */}
      <main className="relative">
        {children}
        {modal}
      </main>
    </div>
  );
}