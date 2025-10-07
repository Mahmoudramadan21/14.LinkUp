'use client';

import { Suspense, useEffect, useState, useCallback, memo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import StoryViewerModal from '@/components/ui/story/modals/StoryViewerModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import StoryReportModal from '@/components/ui/story/modals/StoryReportModal';
import StoryViewersModal from '@/components/ui/story/modals/StoryViewersModal';
import { getUserStoriesThunk, toggleStoryLikeThunk, deleteStoryThunk } from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';

const Loading = memo(() => (
  <div className="text-center text-gray-500" aria-live="polite">
    Loading story...
  </div>
));

Loading.displayName = 'Loading';

const StoryViewerModalPage = memo(() => {
  const params = useParams();
  const username = params.username as string;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { storyFeed, loading, error } = useSelector((state: RootState) => state.story);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentStoryFeedIndex = storyFeed.findIndex((item) => item.username === username);
  const currentStoryFeedItem = storyFeed[currentStoryFeedIndex];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  

  // Fetch user stories if not already in state
  useEffect(() => {
    if (!currentStoryFeedItem && !loading.getUserStories) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching stories for username: ${username}`);
      }
      dispatch(getUserStoriesThunk(username));
    }
  }, [dispatch, username, currentStoryFeedItem, loading.getUserStories]);

  // Handle fetch errors with user feedback
  useEffect(() => {
    if (error.getUserStories) {
      toast.error(error.getUserStories || 'Failed to load stories');
    }
  }, [error.getUserStories]);

  useEffect(() => {
  if (currentStoryFeedItem?.stories) {
    const firstUnviewedIndex = currentStoryFeedItem.stories.findIndex(
      (story) => story.isViewed === false
    );

    if (firstUnviewedIndex !== -1) {
      setCurrentIndex(firstUnviewedIndex);
    }
  }
}, [currentStoryFeedItem]);

  // Close handler with history fallback
  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed', { scroll: false });
    }
  }, [router]);
  

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!currentStoryFeedItem || !currentStoryFeedItem.stories) return;
    if (currentIndex < currentStoryFeedItem.stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (currentStoryFeedIndex < storyFeed.length - 1) {
      const nextUser = storyFeed[currentStoryFeedIndex + 1];
      router.push(`/feed/stories/${nextUser.username}`, { scroll: false });
      setCurrentIndex(0);
    } else {
      handleClose();
    }
  }, [currentStoryFeedItem, currentIndex, currentStoryFeedIndex, storyFeed, router, handleClose]);

  const handlePrev = useCallback(() => {
    if (!currentStoryFeedItem || !currentStoryFeedItem.stories) return;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (currentStoryFeedIndex > 0) {
      const prevUser = storyFeed[currentStoryFeedIndex - 1];
      router.push(`/feed/stories/${prevUser.username}`, { scroll: false });
      setCurrentIndex(prevUser.stories.length - 1);
    }
  }, [currentStoryFeedItem, currentIndex, currentStoryFeedIndex, storyFeed, router]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
        setShowDeleteModal(null);
        setShowReportModal(null);
        setShowViewersModal(null);
      } else if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        handlePrev();
      }
    },
    [handleClose, handleNext, handlePrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Log state for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering StoryViewerModalPage:', {
      username,
      currentStoryFeedItem,
      currentIndex,
      loading: loading.getUserStories,
      stories: currentStoryFeedItem?.stories,
    });
  }

  return (
    <div ref={containerRef} tabIndex={-1} role="region" aria-label="Story viewer modal">
      <Suspense fallback={<Loading />}>
        <StoryViewerModal
          isOpen={true}
          onClose={handleClose}
          storyFeed={storyFeed}
          currentUserId={currentUser?.userId || 0}
          selectedUserId={currentStoryFeedItem?.userId || null}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrev={handlePrev}
          onLike={(storyId) => dispatch(toggleStoryLikeThunk(storyId))}
          onDelete={(storyId) => setShowDeleteModal(storyId)}
          onSelectUser={(newUserId) => {
            const newUser = storyFeed.find((item) => item.userId === newUserId);
            if (newUser) {
              router.push(`/feed/stories/${newUser.username}`, { scroll: false });
              setCurrentIndex(0);
            }
          }}
          onOpenViewersModal={(storyId) => setShowViewersModal(storyId)}
          setShowReportModal={(storyId) => setShowReportModal(storyId)}
          setShowDeleteModal={(storyId) => setShowDeleteModal(storyId)}
          loading={loading.getUserStories}
        />
        {showDeleteModal && (
          <ConfirmationModal
            isOpen={true}
            entityType="story"
            entityId={showDeleteModal}
            actionThunk={deleteStoryThunk} 
            onClose={() => setShowDeleteModal(null)}
          />
        )}
        {showReportModal && (
          <StoryReportModal
            isOpen={true}
            storyId={showReportModal}
            onClose={() => setShowReportModal(null)}
          />
        )}
        {showViewersModal && currentStoryFeedItem?.stories[currentIndex] && (
          <StoryViewersModal
            isOpen={true}
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

StoryViewerModalPage.displayName = 'StoryViewerModalPage';

export default StoryViewerModalPage;