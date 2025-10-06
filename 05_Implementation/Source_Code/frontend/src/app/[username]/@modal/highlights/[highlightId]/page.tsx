'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RootState, AppDispatch } from '@/store';
import {
  getUserHighlightByIdThunk,
  updateHighlightThunk,
  deleteHighlightThunk,
  clearError as clearHighlightError,
} from '@/store/highlightSlice';
import {
  toggleStoryLikeThunk,
  deleteStoryThunk,
  clearError as clearStoryError,
} from '@/store/storySlice';

import HighlightViewerModal from '@/components/profile/HighlightViewerModal';
import EditHighlightModal from '@/components/profile/EditHighlightModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import StoryReportModal from '@/components/ui/story/modals/StoryReportModal';
import StoryViewersModal from '@/components/ui/story/modals/StoryViewersModal';

const HighlightModalPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { username, highlightId } = useParams();

  const { highlightsByUsername, loading: highlightLoading, error: highlightError } = useSelector(
    (state: RootState) => state.highlight
  );
  const { error: storyError } = useSelector((state: RootState) => state.story);

  const highlightsData = highlightsByUsername[username as string] || { highlights: [], pagination: null };
  const highlights = highlightsData.highlights || [];
  const currentHighlight = highlights.find(h => h.highlightId === Number(highlightId));

  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showDeleteHighlightModal, setShowDeleteHighlightModal] = useState<number | null>(null);
  const [showRemoveStoryModal, setShowRemoveStoryModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);



  // 🔹 Fetch highlight if not loaded
  useEffect(() => {
    const numericId = Number(highlightId);
    const hasHighlight = highlights.some(h => h.highlightId === numericId);
    if (!hasHighlight) {
      dispatch(getUserHighlightByIdThunk({ username: username as string, highlightId: numericId }));
    }
  }, [dispatch, username, highlightId, highlights]);

  // 🔹 Handle errors (show toast + clear)
  useEffect(() => {
    const highlightKeys: Array<keyof typeof highlightError> = [
      'getUserHighlightById',
      'updateHighlight',
      'deleteHighlight',
    ];
    const storyKeys: Array<keyof typeof storyError> = ['toggleStoryLike', 'deleteStory'];

    highlightKeys.forEach(key => {
      if (highlightError[key]) {
        toast.error(highlightError[key] as string);
        dispatch(clearHighlightError(key));
      }
    });

    storyKeys.forEach(key => {
      if (storyError[key]) {
        toast.error(storyError[key] as string);
        dispatch(clearStoryError(key));
      }
    });
  }, [highlightError, storyError, dispatch]);

  // =========================
  // 🔹 Handlers
  // =========================

  const handleNext = useCallback(() => {
    if (isAnyModalOpen) {
      console.log('handleNext blocked due to isAnyModalOpen', { isAnyModalOpen });
      return;
    }
    const currentHighlight = highlights.find((h) => h.highlightId === Number(highlightId));
    if (!currentHighlight) {
      console.log('No current highlight, navigating back');
      return router.back();
    }

    if (currentStoryIndex < currentHighlight.stories.length - 1) {
      console.log('Advancing to next story', { currentStoryIndex, highlightId });
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      const currentIndex = highlights.findIndex((h) => h.highlightId === Number(highlightId));
      if (currentIndex < highlights.length - 1) {
        console.log('Advancing to next highlight', { currentIndex, nextHighlightId: highlights[currentIndex + 1].highlightId });
        router.push(`/${username}/highlights/${highlights[currentIndex + 1].highlightId}`);
        setCurrentStoryIndex(0);
      } else {
        console.log('No more highlights, navigating back');
        router.back();
      }
    }
  }, [highlights, currentStoryIndex, highlightId, router, username, isAnyModalOpen]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      const currentIndex = highlights.findIndex(h => h.highlightId === Number(highlightId));
      if (currentIndex > 0) {
        const prevHighlight = highlights[currentIndex - 1];
        router.push(`/${username}/highlights/${prevHighlight.highlightId}`);
        setCurrentStoryIndex(prevHighlight.stories.length - 1);
      }
    }
  }, [currentStoryIndex, highlights, highlightId, router, username]);

  const handleSelectHighlight = useCallback(
    (newId: number) => {
      router.push(`/${username}/highlights/${newId}`);
      setCurrentStoryIndex(0);
    },
    [router, username]
  );

  const handleLike = useCallback(
    (storyId: number) => {
      dispatch(toggleStoryLikeThunk(storyId));
    },
    [dispatch]
  );

  const handleDeleteStory = useCallback(
    (storyId: number) => {
      dispatch(deleteStoryThunk(storyId)).then(() => router.back());
    },
    [dispatch, router]
  );

  const handleDeleteHighlight = useCallback(
    (highlightId: number) => {
      dispatch(deleteHighlightThunk({ highlightId, username: username as string })).then(() => router.back());
    },
    [dispatch, router, username]
  );

  const handleRemoveStory = useCallback(
    (storyId: number, highlightId: number) => {
      const highlight = highlights.find(h => h.highlightId === highlightId);
      if (!highlight) return;

      const updatedStoryIds = highlight.stories
        .filter(s => s.storyId !== storyId)
        .map(s => s.storyId);

      dispatch(
        updateHighlightThunk({
          highlightId,
          data: { storyIds: updatedStoryIds },
          username: username as string,
        })
      ).then(() => router.back());
    },
    [dispatch, router, username, highlights]
  );

  // =========================
  // 🔹 Render
  // =========================
  return (
    <>
      <HighlightViewerModal
        isOpen={true}
        onClose={() => router.back()}
        highlights={highlights}
        selectedHighlightId={Number(highlightId)}
        currentIndex={currentStoryIndex}
        onNext={handleNext}
        onPrev={handlePrev}
        onLike={handleLike}
        onDelete={handleDeleteStory}
        onSelectHighlight={handleSelectHighlight}
        onOpenViewersModal={setShowViewersModal}
        onDeleteHighlight={handleDeleteHighlight}
        onRemoveStory={handleRemoveStory}
        onEditHighlight={() => setShowEditModal(true)}
        setShowReportModal={setShowReportModal}
        setShowDeleteModal={setShowDeleteModal}
        loading={highlightLoading.getUserHighlightById}
        isAnyModalOpen={isAnyModalOpen}
      />

      {showEditModal && currentHighlight && (
        <EditHighlightModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          highlight={currentHighlight}
          setIsAnyModalOpen={setIsAnyModalOpen}
        />
      )}

      {showViewersModal && (
        <StoryViewersModal
          isOpen={!!showViewersModal}
          onClose={() => setShowViewersModal(null)}
          storyId={showViewersModal}
          viewCount={0}
          likeCount={0}
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

      {showDeleteHighlightModal && (
        <ConfirmationModal
          isOpen={!!showDeleteHighlightModal}
          entityType="highlight"
          entityId={showDeleteHighlightModal}
          actionThunk={(id) => deleteHighlightThunk({ highlightId: id, username: username as string })}
          onClose={() => setShowDeleteHighlightModal(null)}
        />
      )}

      {showRemoveStoryModal && (
        <ConfirmationModal
          isOpen={!!showRemoveStoryModal}
          entityType="removeStoryFromHighlight"
          entityId={showRemoveStoryModal}
          actionThunk={(id) => {
            const numericHighlightId = Number(highlightId);
            const highlight = highlights.find(h => h.highlightId === numericHighlightId);
            const updatedIds =
              highlight?.stories.filter(s => s.storyId !== id).map(s => s.storyId) || [];
            return updateHighlightThunk({
              highlightId: numericHighlightId,
              data: { storyIds: updatedIds },
              username: username as string,
            });
          }}
          onClose={() => setShowRemoveStoryModal(null)}
        />
      )}

      {showReportModal && (
        <StoryReportModal
          isOpen={!!showReportModal}
          storyId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}
    </>
  );
};

export default HighlightModalPage;
