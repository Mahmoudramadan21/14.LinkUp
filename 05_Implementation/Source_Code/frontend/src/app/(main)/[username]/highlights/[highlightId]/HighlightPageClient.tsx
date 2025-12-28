'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { RootState, AppDispatch } from '@/store';
import {
  getUserHighlightByIdThunk,
  updateHighlightThunk,
  deleteHighlightThunk,
  getUserHighlightsThunk,
} from '@/store/highlightSlice';
import { deleteStoryThunk } from '@/store/storySlice';

import HighlightViewerModal from '@/components/ui/profile/highlights/HighlightViewerModal';
import EditHighlightModal from '@/components/ui/profile/highlights/EditHighlightModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import StoryReportModal from '@/components/ui/story/modals/StoryReportModal';
import StoryViewersModal from '@/components/ui/story/modals/StoryViewersModal';

/**
 * Full-page route: /[username]/highlights/[highlightId]
 *
 * Features:
 * - Full highlight viewer with navigation between stories & highlights
 * - Edit, delete, remove story, like, report, viewers
 * - Smart local state updates (optimistic UI)
 * - Zero flash, perfect accessibility, keyboard navigation
 * - Works exactly like Instagram Highlights
 */
const HighlightModalPage: React.FC = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams<{ username: string; highlightId: string }>();

  const username = params.username ?? '';
  const highlightId = params.highlightId ? Number(params.highlightId) : null;

  const { highlightsByUsername, loading } = useSelector((state: RootState) => state.highlight);
  const highlightsData = highlightsByUsername[username] || { highlights: [], pagination: null };
  const highlights = highlightsData.highlights || [];

  const currentHighlight = highlights.find((h) => h.highlightId === highlightId);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const currentStory = currentHighlight?.stories[currentStoryIndex];

  const { loading: storyLoading } = useSelector((state: RootState) => state.story);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showDeleteHighlightModal, setShowDeleteHighlightModal] = useState<number | null>(null);
  const [showRemoveStoryModal, setShowRemoveStoryModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showViewersModal, setShowViewersModal] = useState<number | null>(null);

  const hasFetchedRef = useRef(false);
  const highlightListRef = useRef<HTMLDivElement>(null);
  const highlightSentinelRef = useRef<HTMLDivElement>(null);

  const hasMoreHighlights = highlights.length > 0;
  const hasMore = highlightsData.pagination
    ? highlightsData.pagination.page < highlightsData.pagination.totalPages
    : false;

  // Fetch highlight if not in store
  useEffect(() => {
    if (!username || !highlightId || hasFetchedRef.current) return;

    const exists = highlights.some((h) => h.highlightId === highlightId);
    if (!exists) {
      dispatch(getUserHighlightByIdThunk({ username, highlightId }));
    }
    hasFetchedRef.current = true;
  }, [username, highlightId, highlights, dispatch]);

  useEffect(() => {
    if (!hasMore || loading.getUserHighlights || !highlightSentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const limit = highlightsData.pagination?.limit || 15;
          const nextOffset = highlights.length;

          dispatch(
            getUserHighlightsThunk({
              username,
              params: { limit, offset: nextOffset },
            })
          );
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(highlightSentinelRef.current);

    return () => observer.disconnect();
  }, [dispatch, username, hasMore, loading.getUserHighlights, highlights.length, highlightsData.pagination]);

  useEffect(() => {
    const currentIdx = highlights.findIndex(h => h.highlightId === highlightId);

    if (currentIdx >= highlights.length - 2 && hasMore && !loading.getUserHighlights) {
      const limit = highlightsData.pagination?.limit || 15;
      const nextOffset = highlights.length;

      dispatch(
        getUserHighlightsThunk({
          username,
          params: { limit, offset: nextOffset },
        })
      );
    }
  }, [currentStoryIndex, currentHighlight, highlights, dispatch, username, hasMore, loading.getUserHighlights]);


  const handleClose = useCallback(() => {
    router.push(`/${username}`, { scroll: false });
  }, [router, username]);


  // Navigation: Next Story / Next Highlight
  const handleNext = useCallback(() => {
    if (!currentHighlight) return router.back();

    if (currentStoryIndex < currentHighlight.stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
    } else {
      const currentIdx = highlights.findIndex((h) => h.highlightId === highlightId);
      if (currentIdx < highlights.length - 1) {
        const next = highlights[currentIdx + 1];
        router.replace(`/${username}/highlights/${next.highlightId}`, { scroll: false });
      } else {
        handleClose();
      }
    }
  }, [currentHighlight, currentStoryIndex, highlights, highlightId, username, router, handleClose]);

  // Navigation: Previous Story / Previous Highlight
  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
    } else {
      const currentIdx = highlights.findIndex((h) => h.highlightId === highlightId);
      if (currentIdx > 0) {
        const prev = highlights[currentIdx - 1];
        router.replace(`/${username}/highlights/${prev.highlightId}`, { scroll: false });
      }
    }
  }, [currentStoryIndex, highlights, highlightId, username, router]);

  const handleSelectHighlight = useCallback(
    (newId: number) => {
      router.replace(`/${username}/highlights/${newId}`, { scroll: false });
      setCurrentStoryIndex(0);
    },
    [router, username]
  );

  useEffect(() => {
    const loadingFinished =
      !loading.getUserHighlights && !loading.getUserHighlightById;

    const noData =
      !highlightId || !currentHighlight;

    if (loadingFinished && noData) {
      router.replace(`/${username}`, { scroll: false });
    }
  }, [
    highlightId,
    currentHighlight,
    username,
    router,
    loading.getUserHighlights,
    loading.getUserHighlightById
  ]);

  // If no highlight found or invalid route
  if (!highlightId || !currentHighlight) {
    return null;
  }

  return (
    <>
      {/* Main Viewer */}
      <HighlightViewerModal
        isOpen={true}
        onClose={handleClose}
        highlights={highlights}
        selectedHighlightId={highlightId}
        currentIndex={currentStoryIndex}
        highlightListRef={highlightListRef}
        highlightSentinelRef={highlightSentinelRef}
        hasMoreHighlights={hasMoreHighlights}
        navigation={{
          onNext: handleNext,
          onPrev: handlePrev,
          onSelectHighlight: handleSelectHighlight,
        }}
        actions={{
          modals: {
            setShowReportModal,
            setShowDeleteHighlightModal,
            setShowRemoveStoryModal,
          },
          interactions: {
            onEditHighlight: () => setShowEditModal(true),
            onOpenViewersModal: setShowViewersModal,
        }
      }}
        loading={loading.getUserHighlights}
      />


      {/* Edit Highlight */}
      {showEditModal && (
        <EditHighlightModal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          highlight={currentHighlight}
        />
      )}

      {/* Viewers Modal */}
      {showViewersModal && currentStory && (
        <StoryViewersModal
          isOpen={true}
          storyId={showViewersModal}
          onClose={() => setShowViewersModal(null)}
          viewCount={currentStory.viewCount || 0}
          likeCount={currentStory.likeCount || 0}
        />
      )}

      {/* Delete Story */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={true}
          entityType="story"
          entityId={showDeleteModal}
          actionThunk={deleteStoryThunk}
          onClose={() => setShowDeleteModal(null)}
          loadingState={storyLoading.deleteStory}
        />
      )}

      {/* Delete Entire Highlight */}
      {showDeleteHighlightModal && (
        <ConfirmationModal
          isOpen={true}
          entityType="highlight"
          entityId={showDeleteHighlightModal}
          actionThunk={deleteHighlightThunk}
          onClose={() => setShowDeleteHighlightModal(null)}
          onSuccess={handleNext}
          loadingState={loading.deleteHighlight}
        />
      )}

      {/* Remove Story from Highlight */}
      {showRemoveStoryModal && (
        <ConfirmationModal
          isOpen={true}
          entityType="removeStoryFromHighlight"
          entityId={showRemoveStoryModal}
          actionThunk={() => {
            const updatedStories = currentHighlight.stories.filter(
              (s) => s.storyId !== showRemoveStoryModal
            );
            const updatedIds = updatedStories.map((s) => s.storyId);

            return dispatch(
              updateHighlightThunk({
                highlightId,
                data: { storyIds: updatedIds },
                username,
              })
            ).then(() => {
              if (updatedStories.length === 0) {
                router.back();
              } else {
                setCurrentStoryIndex((i) =>
                  i >= updatedStories.length ? updatedStories.length - 1 : i
                );
              }
            });
          }}
          onClose={() => setShowRemoveStoryModal(null)}
          loadingState={loading.updateHighlight}
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
    </>
  );
});

HighlightModalPage.displayName = 'HighlightModalPage';

export default HighlightModalPage;