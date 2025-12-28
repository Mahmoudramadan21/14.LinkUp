// app/(main)/(feed-search)/feed/stories/[username]/page.tsx
'use client';

import { Suspense, useEffect, useState, useCallback, memo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';

import StoryViewerModal from '@/components/ui/story/modals/StoryViewerModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import StoryReportModal from '@/components/ui/story/modals/StoryReportModal';
import StoryViewersModal from '@/components/ui/story/modals/StoryViewersModal';

import {
  getUserStoriesThunk,
  toggleStoryLikeThunk,
  deleteStoryThunk,
  getStoryFeedThunk,
} from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';

/**
 * Loading fallback for Suspense boundary
 */
const Loading = memo(() => (
  <div className="flex items-center justify-center h-screen text-gray-400" aria-live="polite">
    Loading stories...
  </div>
));
Loading.displayName = 'StoryViewerLoading';

/**
 * FullStoryViewerPage
 * Full-screen story viewer accessed via /feed/stories/@username
 * Supports:
 * - Swipe/arrow navigation between stories & users
 * - Like, delete, report, view viewers
 * - Keyboard navigation (← → Esc)
 * - Auto-focus for accessibility
 */
const FullStoryViewerPage = memo(() => {
  const params = useParams();
  const username = params.username as string;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { storyFeed, hasMore, loading } = useSelector((state: RootState) => state.story);

  const currentStoryFeedIndex = storyFeed.findIndex((item) => item.username === username);
  const currentStoryFeedItem = storyFeed[currentStoryFeedIndex];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  const usersListRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch user stories if not already loaded
  useEffect(() => {
    if (!currentStoryFeedItem) {
      dispatch(getUserStoriesThunk(username));
    }
  }, [dispatch, username, currentStoryFeedItem]);

  // Jump to first unviewed story when user stories load
  useEffect(() => {
    if (currentStoryFeedItem?.stories) {
      const firstUnviewedIndex = currentStoryFeedItem.stories.findIndex(
        (story) => !story.isViewed
      );
      if (firstUnviewedIndex !== -1) {
        setCurrentIndex(firstUnviewedIndex);
      }
    }
  }, [currentStoryFeedItem]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading.getStoryFeed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading.getStoryFeed) {
          dispatch(
            getStoryFeedThunk({
              offset: storyFeed.length,
              limit: 15,
            })
          );
        }
      },
      {
        root: usersListRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading.getStoryFeed, storyFeed.length, dispatch]);

  useEffect(() => {
    if (!hasMore || loading.getStoryFeed) return;

    if (currentStoryFeedIndex >= storyFeed.length - 2) {
      dispatch(
        getStoryFeedThunk({
          offset: storyFeed.length,
          limit: 15,
        })
      );
    }
  }, [currentStoryFeedIndex, storyFeed.length, hasMore, loading.getStoryFeed, dispatch]);

  useEffect(() => {
    if (username && (!loading.getUserStories || !loading.deleteStory) && currentStoryFeedItem === undefined) {
      router.replace('/feed', { scroll: false });
    }
  }, [username, router, loading.getUserStories, loading.deleteStory]);

  // Close viewer and return to feed
  const handleClose = useCallback(() => {
    router.push('/feed', { scroll: false });
  }, [router]);

  // Navigate to next story or next user
  const handleNext = useCallback(() => {
    if (!currentStoryFeedItem?.stories) return;

    if (currentIndex < currentStoryFeedItem.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (currentStoryFeedIndex < storyFeed.length - 1) {
      const nextUser = storyFeed[currentStoryFeedIndex + 1];
      router.replace(`/feed/stories/${nextUser.username}`, { scroll: false });
    } else {
      handleClose();
    }
  }, [currentStoryFeedItem, currentIndex, currentStoryFeedIndex, storyFeed, router, handleClose]);

  // Navigate to previous story or previous user
  const handlePrev = useCallback(() => {
    if (!currentStoryFeedItem?.stories) return;

    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else if (currentStoryFeedIndex > 0) {
      const prevUser = storyFeed[currentStoryFeedIndex - 1];
      router.replace(`/feed/stories/${prevUser.username}`, { scroll: false });
    }
  }, [currentStoryFeedItem, currentIndex, currentStoryFeedIndex, storyFeed, router]);

  // Global keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    },
    [handleClose, handleNext, handlePrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      aria-label={`Viewing stories from @${username}`}
    >
      <Suspense fallback={<Loading />}>
        <StoryViewerModal
          isOpen={true}
          onClose={handleClose}
          storyFeed={storyFeed}
          selectedUserId={currentStoryFeedItem?.userId || null}
          currentIndex={currentIndex}

          // Infinity Scroll Props
          usersListRef={usersListRef}
          sentinelRef={sentinelRef}
          hasMoreUsers={hasMore}

          loading={loading.getStoryFeed}
          navigation={{
            onNext: handleNext,
            onPrev: handlePrev,
            onSelectUser: (newUserId) => {
              const user = storyFeed.find((u) => u.userId === newUserId);
              if (user) {
                router.replace(`/feed/stories/${user.username}`, { scroll: false });
                setCurrentIndex(0);
              }
            },
          }}
          actions={{
            modals: {
              setShowReportModal,
              setShowDeleteModal,
            },
            interactions: {
              onLike: (storyId) => dispatch(toggleStoryLikeThunk(storyId)),
              onOpenViewersModal: setShowViewersModal,
            },
          }}
        />

        {/* Modals */}
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

        {showViewersModal && currentStoryFeedItem?.stories[currentIndex] && (
          <StoryViewersModal
            isOpen
            storyId={showViewersModal}
            onClose={() => setShowViewersModal(null)}
            viewCount={currentStoryFeedItem.stories[currentIndex].viewCount || 0}
            likeCount={currentStoryFeedItem.stories[currentIndex].likeCount || 0}
          />
        )}
      </Suspense>
    </div>
  );
});

FullStoryViewerPage.displayName = 'FullStoryViewerPage';

export default FullStoryViewerPage;