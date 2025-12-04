// app/(main)/(feed-search)/feed/StoriesContent.tsx
'use client';

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';

import { getStoryFeedThunk, deleteStoryThunk } from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';

import styles from './stories.module.css';
import StoryAvatar from '@/components/ui/story/StoryAvatar';
import CreateStoryAvatar from '@/components/ui/story/CreateStoryAvatar';
import StoryViewersModal from '@/components/ui/story/modals/StoryViewersModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import StoryReportModal from '@/components/ui/story/modals/StoryReportModal';

/**
 * StoriesContent
 * Horizontal stories bar at the top of the feed.
 * Displays user's own story + friends' stories with infinite scroll support.
 * Fully accessible and optimized for performance.
 */
const StoriesContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { storyFeed, currentStory, loading, hasMore } = useSelector(
    (state: RootState) => state.story
  );

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  // Memoized story avatars list
  const storyAvatars = useMemo(
    () =>
      storyFeed.map((item) => (
        <Link
          key={item.userId}
          href={`/feed/stories/${item.username}`}
          scroll={false}
          prefetch={false}
        >
          <StoryAvatar
            user={item}
            hasUnviewed={item.hasUnviewedStories}
            onClick={() => router.push(`/feed/stories/${item.username}`, { scroll: false })}
            aria-label={`View stories from ${item.username}`}
          />
        </Link>
      )),
    [storyFeed]
  );

  // Initial fetch
  useEffect(() => {
    dispatch(getStoryFeedThunk({ limit, offset: 0 }));
  }, [dispatch, limit]);

  // Debounced infinite scroll fetch
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
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) observer.unobserve(sentinelRef.current);
      fetchNextPage.cancel();
    };
  }, [fetchNextPage]);

  // Close modals on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(null);
        setShowReportModal(null);
        setShowViewersModal(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Skeleton placeholder component
  const StorySkeleton = () => (
      <div className={`${styles.stories__avatar_wrapper} ${styles.secondary}`}>
        <div className={`${styles.stories__avatar} ${styles.stories__skeleton} bg-neutral-gray`} />
        <span className={`h-4 w-16 {${styles.stories__username} ${styles.stories__skeleton} bg-neutral-gray`}/>
      </div>
  );

  const skeletons = useMemo(
    () => Array.from({ length: 8 }, (_, i) => <StorySkeleton key={i} />),
    []
  );

  return (
    <section className={styles.stories__container} aria-label="Stories">
      <h2 className={styles.stories__title}>Stories</h2>

      <div className={styles.stories__feed}>
        <div
          className={styles.stories__bar}
          role="region"
          aria-label="Stories from people you follow"
        >
          {/* Create Story */}
          <CreateStoryAvatar />

          {/* Loading State */}
          {loading.getStoryFeed && storyFeed.length === 0 ? (
            skeletons
          ) : storyFeed.length === 0 ? (
            <p className={styles.stories__empty} aria-live="polite">
              No stories yet — create one or follow friends!
            </p>
          ) : (
            <>
              {storyAvatars}
              {hasMore && (
                <div ref={sentinelRef} className="h-1 shrink-0" aria-hidden="true" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showViewersModal && (
        <StoryViewersModal
          isOpen
          onClose={() => setShowViewersModal(null)}
          storyId={showViewersModal}
          viewCount={currentStory?.viewCount || 0}
          likeCount={currentStory?.likeCount || 0}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen
          entityType="story"
          entityId={showDeleteModal}
          actionThunk={deleteStoryThunk}
          onClose={() => setShowDeleteModal(null)}
          loadingState={loading.deleteStory}
        />
      )}

      {showReportModal && (
        <StoryReportModal
          isOpen
          storyId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}
    </section>
  );
};

StoriesContent.displayName = 'StoriesContent';

export default StoriesContent;