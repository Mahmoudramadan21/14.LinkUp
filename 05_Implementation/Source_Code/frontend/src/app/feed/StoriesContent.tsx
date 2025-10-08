'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import { getStoryFeedThunk, deleteStoryThunk,clearError } from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';
import styles from './stories.module.css';
import StoryAvatar from '@/components/ui/story/StoryAvatar';
import CreateStoryAvatar from '@/components/ui/story/CreateStoryAvatar';
import StoryViewersModal from '@/components/ui/story/modals/StoryViewersModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import StoryReportModal from '@/components/ui/story/modals/StoryReportModal';

/**
 * StoriesContent component for displaying the stories feed with infinite scroll and modals.
 * Optimized for performance, accessibility, SEO, and best practices.
 */
const StoriesContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { storyFeed, currentStory, loading, error, hasMore } = useSelector(
    (state: RootState) => state.story
  );

  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const limit = useMemo(() => 10, []);

  // Memoized story avatars
  const storyAvatars = useMemo(
    () =>
      storyFeed.map((item) => (
        <Link
          key={item.userId}
          href={`/feed/stories/${item.username}`}
          scroll={false}
          prefetch={false} // Performance: disable prefetch for non-critical links
        >
          <StoryAvatar
            user={item}
            hasUnviewed={item.hasUnviewedStories}
            onClick={() => router.push(`/feed/stories/${item.username}`, { scroll: false })}
            aria-label={`View ${item.username}'s stories`}
          />
        </Link>
      )),
    [storyFeed, router]
  );

  // Handle errors with toast and clear
  useEffect(() => {
    const errorKeys: Array<keyof typeof error> = [
      'getStoryFeed',
      'createStory',
      'getStoryViewersWithLikes',
    ];

    errorKeys.forEach((key) => {
      if (error[key]) {
        toast.error(error[key] as string);
        dispatch(clearError(key));
      }
    });
  }, [error, dispatch]);

  // Fetch initial story feed
  useEffect(() => {
    dispatch(getStoryFeedThunk({ limit, offset: 0 }));
  }, [dispatch, limit]);

  // Debounced fetchNextPage function for infinite scroll
  const fetchNextPage = useCallback(
    debounce(() => {
      if (hasMore && !loading.getStoryFeed) {
        dispatch(getStoryFeedThunk({ limit, offset: storyFeed.length }));
      }
    }, 300),
    [dispatch, hasMore, loading.getStoryFeed, storyFeed.length, limit]
  );

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
      fetchNextPage.cancel();
    };
  }, [fetchNextPage]);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(null);
        setShowReportModal(null);
        setShowViewersModal(null);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Skeleton loader component (memoized for performance)
  const StoryAvatarSkeleton = useMemo(() => {
    const Skeleton = () => (
      <div className={styles.stories__avatar_wrapper}>
          <div className={`${styles.stories__avatar} ${styles.stories__skeleton}`} />
      </div>
    );
    Skeleton.displayName = "StoryAvatarSkeleton";
    return Skeleton;
  }, []);


  // Render skeletons during loading (e.g., 8 placeholders to match typical initial load)
  const skeletons = useMemo(() => Array.from({ length: 8 }).map((_, index) => (
    <StoryAvatarSkeleton key={`skeleton-${index}`} />
  )), [StoryAvatarSkeleton]);

  return (
    <div className={styles.stories__container}>
      <h2 className={styles.stories__title}>Your Stories</h2>

      <div className={styles.stories__wrapper}>
          <div className={styles.stories__feed}>        
        {loading.getStoryFeed ? (
          <div className={styles.stories__feed} aria-live="polite" aria-busy="true">
            <div
              className={styles.stories__bar}
              role="region"
              aria-label="Loading stories feed"
            >
              {skeletons}
            </div>
          </div>
        ) : storyFeed.length === 0 ? (
          <p className={styles.stories__empty} aria-live="polite">
            No stories yet — create or follow friends!
          </p>
        ) : (
            <div
              className={styles.stories__bar}
              role="region"
              aria-label="Stories feed"
            >
              <CreateStoryAvatar />
              {storyAvatars}
              <div
                ref={sentinelRef}
                className="h-1"
                aria-hidden="true"
              />
            </div>
        )}
          </div>

        {showViewersModal && (
          <StoryViewersModal
            isOpen={!!showViewersModal}
            onClose={() => setShowViewersModal(null)}
            storyId={showViewersModal}
            viewCount={currentStory?.viewCount || 0}
            likeCount={currentStory?.likeCount || 0}
          />
        )}

        {showDeleteModal && (
          <ConfirmationModal
            isOpen={!!showDeleteModal}
            entityType="story"
            entityId={showDeleteModal}
            actionThunk={deleteStoryThunk}
            onClose={() => setShowDeleteModal(null)}
          />
        )}

        {showReportModal && (
          <StoryReportModal
            isOpen={!!showReportModal}
            storyId={showReportModal}
            onClose={() => setShowReportModal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default StoriesContent;