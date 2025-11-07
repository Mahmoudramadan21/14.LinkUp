// app/(main)/feed/stories/[username]/pageClient.tsx
'use client';

import { Suspense, useEffect, useState, useCallback, useRef, memo } from 'react';
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
} from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';

/**
 * Loading fallback component displayed during Suspense boundary transitions.
 */
const Loading = memo(() => (
  <div className="flex items-center justify-center h-screen text-gray-400" aria-live="polite">
    Loading stories...
  </div>
));
Loading.displayName = 'StoryViewerLoading';

/**
 * Client-side full-screen story viewer.
 * 
 * Features:
 * - Full keyboard navigation (← → Esc)
 * - Seamless user-to-user transitions
 * - Auto-jump to first unviewed story
 * - Like, delete, report, and viewers modals
 * - Accessible focus management
 * - Optimized with memo, useCallback, and proper dependency arrays
 */
const StoryViewerClient = memo(({ username: initialUsername }: { username: string }) => {
  const params = useParams();
  const username = (params.username as string).replace(/^@/, '') || initialUsername;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { storyFeed, loading } = useSelector((state: RootState) => state.story);

  const currentStoryFeedIndex = storyFeed.findIndex((item) => item.username === username);
  const currentStoryFeedItem = storyFeed[currentStoryFeedIndex];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch stories for target user if not already in feed
  useEffect(() => {
    if (!currentStoryFeedItem && username) {
      dispatch(getUserStoriesThunk(username));
    }
  }, [dispatch, username, currentStoryFeedItem]);

  // Auto-advance to first unviewed story when loaded
  useEffect(() => {
    if (currentStoryFeedItem?.stories) {
      const firstUnviewed = currentStoryFeedItem.stories.findIndex(s => !s.isViewed);
      if (firstUnviewed !== -1) setCurrentIndex(firstUnviewed);
    }
  }, [currentStoryFeedItem]);

  // Redirect to feed if user has no stories (after loading)
  useEffect(() => {
    if (username && currentStoryFeedItem === undefined && !loading.getUserStories) {
      router.replace('/feed', { scroll: false });
    }
  }, [username, currentStoryFeedItem, loading.getUserStories, router]);

  const handleClose = useCallback(() => router.push('/feed', { scroll: false }), [router]);

  const handleNext = useCallback(() => {
  if (!currentStoryFeedItem?.stories) return;

  const isLastStory = currentIndex >= currentStoryFeedItem.stories.length - 1;
  const isLastUser = currentStoryFeedIndex >= storyFeed.length - 1;

  if (!isLastStory) {
      setCurrentIndex(i => i + 1);
      return;
  }

  if (!isLastUser) {
      const next = storyFeed[currentStoryFeedIndex + 1];
      router.push(`/feed/stories/${next.username}`, { scroll: false });
      setCurrentIndex(0);
      return;
  }

  handleClose();
  }, [
  currentIndex,
  currentStoryFeedItem,
  currentStoryFeedIndex,
  storyFeed,
  router,
  handleClose
  ]);


  const handlePrev = useCallback(() => {
    if (!currentStoryFeedItem?.stories) return;

    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    } else if (currentStoryFeedIndex > 0) {
      const prev = storyFeed[currentStoryFeedIndex - 1];
      router.push(`/feed/stories/${prev.username}`, { scroll: false });
      setCurrentIndex(prev.stories.length - 1);
    }
  }, [currentStoryFeedItem, currentIndex, currentStoryFeedIndex, storyFeed, router]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    else if (e.key === 'ArrowRight') handleNext();
    else if (e.key === 'ArrowLeft') handlePrev();
  }, [handleClose, handleNext, handlePrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Accessibility: Ensure container is focusable
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div ref={containerRef} tabIndex={-1} aria-label={`Viewing stories from @${username}`}>
      <Suspense fallback={<Loading />}>
        <StoryViewerModal
          isOpen={true}
          onClose={handleClose}
          storyFeed={storyFeed}
          selectedUserId={currentStoryFeedItem?.userId || null}
          currentIndex={currentIndex}
          loading={loading.getStoryFeed || loading.getUserStories}
          navigation={{
            onNext: handleNext,
            onPrev: handlePrev,
            onSelectUser: (userId) => {
              const user = storyFeed.find(u => u.userId === userId);
              if (user) {
                router.push(`/feed/stories/${user.username}`, { scroll: false });
                setCurrentIndex(0);
              }
            },
          }}
          actions={{
            modals: { setShowReportModal, setShowDeleteModal },
            interactions: {
              onLike: (storyId) => dispatch(toggleStoryLikeThunk(storyId)),
              onOpenViewersModal: setShowViewersModal,
            },
          }}
        />

        {/* Action Modals */}
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
          <StoryReportModal isOpen storyId={showReportModal} onClose={() => setShowReportModal(null)} />
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

StoryViewerClient.displayName = 'StoryViewerClient';
export default StoryViewerClient;