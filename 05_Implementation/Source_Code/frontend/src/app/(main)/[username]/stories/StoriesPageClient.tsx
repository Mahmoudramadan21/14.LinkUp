'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  memo,
} from 'react';
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
 * Full-screen story viewer page: /feed/stories/:username
 *
 * Features:
 * - Full navigation between users and stories (like Instagram)
 * - Auto-advance, keyboard navigation, swipe support (via modal)
 * - Like, delete, report, viewers
 * - Smart index handling (starts from first unviewed story)
 * - Protected from flash, errors, and bad routing
 */
const FullStoryViewerPage: React.FC = memo(() => {
  const params = useParams<{ username: string }>();
  const username = params.username ?? '';
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { storyFeed, loading, error } = useSelector((state: RootState) => state.story);

  const currentStoryFeedIndex = storyFeed.findIndex((item) => item.username === username);
  const currentStoryFeedItem = storyFeed[currentStoryFeedIndex];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  // Fetch stories if not already loaded
  useEffect(() => {
    if (username && !currentStoryFeedItem && !error.getUserStories) {
      dispatch(getUserStoriesThunk(username));
    }
  }, [dispatch, username, currentStoryFeedItem, error.getUserStories]);

  // Set initial story index (first unviewed, or 0)
  useEffect(() => {
    if (!currentStoryFeedItem?.stories) return;

    if (currentStoryFeedItem.stories.length === 0) {
      setCurrentIndex(-1); // No stories
      return;
    }

    const firstUnviewed = currentStoryFeedItem.stories.findIndex((s) => !s.isViewed);
    setCurrentIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
  }, [currentStoryFeedItem]);

  // Handle navigation to next story/user
  const handleNext = useCallback(() => {
    if (!currentStoryFeedItem?.stories) return;

    if (currentIndex < currentStoryFeedItem.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (currentStoryFeedIndex < storyFeed.length - 1) {
      const nextUser = storyFeed[currentStoryFeedIndex + 1];
      router.push(`/feed/stories/${nextUser.username}`, { scroll: false });
      setCurrentIndex(0);
    } else {
      router.push('/feed', { scroll: false });
    }
  }, [currentIndex, currentStoryFeedItem, currentStoryFeedIndex, storyFeed, router]);

  // Handle navigation to previous story/user
  const handlePrev = useCallback(() => {
    if (!currentStoryFeedItem?.stories) return;

    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else if (currentStoryFeedIndex > 0) {
      const prevUser = storyFeed[currentStoryFeedIndex - 1];
      router.push(`/feed/stories/${prevUser.username}`, { scroll: false });
      setCurrentIndex(prevUser.stories.length - 1);
    }
  }, [currentIndex, currentStoryFeedItem, currentStoryFeedIndex, storyFeed, router]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    },
    [handleNext, handlePrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleClose = useCallback(() => {
    router.push(`/${username}`, { scroll: false });
  }, [router, username]);

  useEffect(() => {
    if (username && !loading.getUserStories && currentStoryFeedItem === undefined) {
      router.replace(`/${username}`, { scroll: false });
    }
  }, [username, currentStoryFeedItem, router, loading.getUserStories]);

  console.log(currentStoryFeedItem)

  const currentStory = currentStoryFeedItem?.stories[currentIndex];

  return (
      <>
        {/* Story Viewer Modal */}
          <StoryViewerModal
            isOpen={true}
            onClose={handleClose}
            storyFeed={storyFeed}
            selectedUserId={currentStoryFeedItem?.userId ?? 0}
            currentIndex={currentIndex}
            loading={loading.getUserStories}
            navigation={{
              onNext: handleNext,
              onPrev: handlePrev,
              onSelectUser: (newUserId) => {
                const newUser = storyFeed.find((item) => item.userId === newUserId);
                if (newUser) {
                  router.push(`/feed/stories/${newUser.username}`, { scroll: false });
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

        {/* Confirmation: Delete Story */}
        {showDeleteModal && (
          <ConfirmationModal
            isOpen={true}
            entityType="story"
            entityId={showDeleteModal}
            actionThunk={deleteStoryThunk}
            onClose={() => setShowDeleteModal(null)}
            loadingState={loading.deleteStory}
          />
        )}

        {/* Report Story */}
        {showReportModal && (
          <StoryReportModal
            isOpen={true}
            storyId={showReportModal}
            onClose={() => setShowReportModal(null)}
          />
        )}

        {/* Viewers List */}
        {showViewersModal && currentStory && (
          <StoryViewersModal
            isOpen={true}
            storyId={showViewersModal}
            onClose={() => setShowViewersModal(null)}
            viewCount={currentStory.viewCount || 0}
            likeCount={currentStory.likeCount || 0}
          />
        )}
    </>
  );
});

FullStoryViewerPage.displayName = 'FullStoryViewerPage';

export default FullStoryViewerPage;