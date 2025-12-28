// app/(main)/(feed-search)/feed/StoriesContent.tsx
'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debounce } from 'lodash';

import { getStoryFeedThunk } from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';

import styles from './stories.module.css';
import StoryAvatar from '@/components/ui/story/StoryAvatar';
import CreateStoryAvatar from '@/components/ui/story/CreateStoryAvatar';

/**
 * StoriesContent
 * Horizontal stories bar at the top of the feed.
 * Displays user's own story + friends' stories with infinite scroll support.
 * Fully accessible and optimized for performance.
 */
const StoriesContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { storyFeed,  loading, hasMore } = useSelector(
    (state: RootState) => state.story
  );


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

  // Skeleton placeholder component
  const StorySkeleton = () => (
      <div className={`${styles.stories__avatar_wrapper} ${styles.secondary}`}>
        <div className={`avatar--lg rounded-full bg-neutral-gray animate-pulse`} />
        <span className={`h-4 w-16 mt-2 {${styles.stories__username} ${styles.stories__skeleton} bg-neutral-gray`}/>
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
              {loading.getStoryFeed && storyFeed.length > 0 && (
                Array.from({ length: 3 }, (_, i) => <StorySkeleton key={i} />)
              )}
              {hasMore && (
                <div ref={sentinelRef} className="h-1 shrink-0" aria-hidden="true" />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

StoriesContent.displayName = 'StoriesContent';

export default StoriesContent;