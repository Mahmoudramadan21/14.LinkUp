'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { FaTimes, FaHeart } from 'react-icons/fa';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css';
import {
  getStoryViewersWithLikesThunk,
  getStoryByIdThunk,
  clearError,
} from '@/store/storySlice';
import { setIsAnyModalOpen } from '@/store/uiSlice';
import { RootState, AppDispatch } from '@/store';

/* ==================== Types ==================== */
interface StoryViewersModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: number;
  viewCount?: number;
  likeCount?: number;
}

/**
 * Modal displaying the list of users who viewed a specific story,
 * including who liked it. Supports infinite scroll and error handling.
 */
const StoryViewersModal: React.FC<StoryViewersModalProps> = memo(
  ({ isOpen, onClose, storyId, viewCount: propViewCount, likeCount: propLikeCount }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { storyFeed, currentStory, loading, error } = useSelector(
      (state: RootState) => state.story
    );

    const modalRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(0);
    const limit = 20;

    // Locate the story in feed or fallback to currentStory
    const selectedStory =
      storyFeed
        .flatMap((item) => item.stories)
        .find((story) => story.storyId === storyId) || currentStory;

    // Fallback to props if story data is not available
    const effectiveViewCount = selectedStory?.viewCount ?? propViewCount ?? 0;
    const effectiveLikeCount = selectedStory?.likeCount ?? propLikeCount ?? 0;

    /* ==================== Fetch Story if Missing ==================== */
    useEffect(() => {
      if (isOpen && storyId && !selectedStory) {
        dispatch(getStoryByIdThunk(storyId));
      }
    }, [isOpen, storyId, selectedStory, dispatch]);

    /* ==================== Initial Load & Reset ==================== */
    useEffect(() => {
      if (isOpen) {
        offsetRef.current = 0;
        dispatch(getStoryViewersWithLikesThunk({ storyId, limit, offset: 0 }));
      }
      return () => {
        dispatch(clearError('getStoryViewersWithLikes'));
      };
    }, [isOpen, storyId, dispatch]);

    /* ==================== Infinite Scroll ==================== */
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            !loading.getStoryViewersWithLikes &&
            selectedStory?.latestViewers &&
            selectedStory.latestViewers.length >= offsetRef.current + limit
          ) {
            offsetRef.current += limit;
            dispatch(
              getStoryViewersWithLikesThunk({
                storyId,
                limit,
                offset: offsetRef.current,
              })
            );
          }
        },
        { threshold: 0.1 }
      );

      if (sentinelRef.current) observer.observe(sentinelRef.current);

      return () => {
        if (sentinelRef.current) observer.unobserve(sentinelRef.current);
      };
    }, [
      dispatch,
      storyId,
      loading.getStoryViewersWithLikes,
      selectedStory?.latestViewers,
    ]);

    /* ==================== Keyboard Support ==================== */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, isOpen]);

    /* ==================== Accessibility & Modal State ==================== */
    useEffect(() => {
      if (isOpen && modalRef.current) {
        modalRef.current.focus();
        dispatch(setIsAnyModalOpen(true));
      }
      return () => {
        dispatch(setIsAnyModalOpen(false));
      };
    }, [isOpen, dispatch]);

    /* ==================== Focus Management ==================== */
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, []);

    if (!isOpen) return null;

    return (
      <div
        className={`${styles['story-viewers-modal__overlay']} bg-overlay`}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={styles['story-viewers-modal']}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-viewers-modal-title"
          tabIndex={-1}
          ref={modalRef}
        >
          {/* Header */}
          <div className={styles['story-viewers-modal__header']}>
            <div>
              <h2
                id="story-viewers-modal-title"
                className={styles['story-viewers-modal__title']}
              >
                Story Viewers
              </h2>
              <div className={styles['story-viewers-modal__counts']}>
                <span aria-label={`${effectiveViewCount} views`}>
                  {effectiveViewCount} {effectiveViewCount === 1 ? 'view' : 'views'}
                </span>
                <span aria-label={`${effectiveLikeCount} likes`}>
                  {effectiveLikeCount} {effectiveLikeCount === 1 ? 'like' : 'likes'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles['story-viewers-modal__close']}
              aria-label="Close viewers modal"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Viewers List */}
          <div
            className={styles['story-viewers-modal__list']}
            role="list"
            aria-label="List of story viewers and likers"
          >
            {loading.getStoryById ? (
              <p className={styles['story-viewers-modal__loading']} aria-live="polite">
                Loading story details...
              </p>
            ) : error.getStoryById ? (
              <div className="text-center py-8">
                <p className={styles['story-viewers-modal__error']} role="alert">
                  {error.getStoryById}
                </p>
                <button
                  onClick={() => dispatch(getStoryByIdThunk(storyId))}
                  className={styles['story-viewers-modal__retry-button']}
                  aria-label="Retry loading story"
                >
                  Retry
                </button>
              </div>
            ) : selectedStory?.latestViewers && selectedStory.latestViewers.length > 0 ? (
              <>
                {selectedStory.latestViewers.map((viewer) => (
                  <div
                    key={viewer.userId}
                    className={styles['story-viewers-modal__item']}
                    role="listitem"
                  >
                    <Image
                      src={viewer.profilePicture || '/avatars/default-avatar.svg'}
                      alt={`${viewer.username}'s profile picture`}
                      width={40}
                      height={40}
                      className={styles['story-viewers-modal__avatar']}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="/avatars/default-avatar-blur.svg"
                    />
                    <div className="flex-1">
                      {viewer.profileName && (
                        <p className={styles['story-viewers-modal__profile-name']}>
                          {viewer.profileName}
                        </p>
                      )}
                      <p className={styles['story-viewers-modal__username']}>
                        {viewer.username}
                      </p>
                    </div>
                    {viewer.isLiked && (
                      <div className={styles['story-viewers-modal__like-icon']}>
                        <FaHeart
                          size={16}
                          className="text-[var(--error)]"
                          aria-label={`${viewer.username} liked this story`}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="h-1" aria-hidden="true" />

                {/* Loading More */}
                {loading.getStoryViewersWithLikes && (
                  <p className={styles['story-viewers-modal__loading']} aria-live="polite">
                    Loading more viewers...
                  </p>
                )}

                {/* No More Data */}
                {!loading.getStoryViewersWithLikes &&
                  selectedStory.latestViewers.length >= effectiveViewCount && (
                    <p
                      className={styles['story-viewers-modal__empty']}
                      style={{ marginTop: '0.5rem' }}
                      aria-live="polite"
                    >
                      No more viewers to load.
                    </p>
                  )}
              </>
            ) : (
              <p className={styles['story-viewers-modal__empty']} aria-live="polite">
                No viewers yet.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

StoryViewersModal.displayName = 'StoryViewersModal';

export default StoryViewersModal;