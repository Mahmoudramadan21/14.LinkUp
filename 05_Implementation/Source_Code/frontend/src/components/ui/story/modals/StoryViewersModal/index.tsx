'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { FaTimes, FaHeart } from 'react-icons/fa';
import styles from '@/app/feed/stories.module.css';
import { getStoryViewersWithLikesThunk, getStoryByIdThunk, clearError } from '@/store/storySlice';
import { RootState, AppDispatch } from '@/store';
import { toast } from 'react-toastify';

/**
 * Props for the StoryViewersModal component.
 */
interface StoryViewersModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: number;
  viewCount?: number;
  likeCount?: number;
}

/**
 * StoryViewersModal component for displaying viewers and likes of a story.
 * Optimized for performance, accessibility, and best practices.
 */
const StoryViewersModal: React.FC<StoryViewersModalProps> = memo(
  ({ isOpen, onClose, storyId, viewCount: propViewCount, likeCount: propLikeCount }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { storyFeed, currentStory, loading, error } = useSelector((state: RootState) => state.story);
    const modalRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(0);
    const limit = 20;

    // Find the story in storyFeed or fall back to currentStory
    const selectedStory = storyFeed
      .flatMap((item) => item.stories)
      .find((story) => story.storyId === storyId) || currentStory;

    // Use viewCount and likeCount from selectedStory if available, else fall back to props
    const effectiveViewCount = selectedStory?.viewCount ?? propViewCount ?? 0;
    const effectiveLikeCount = selectedStory?.likeCount ?? propLikeCount ?? 0;

    // Fetch story details if not in storyFeed or currentStory
    useEffect(() => {
      if (isOpen && storyId && !selectedStory) {
        dispatch(getStoryByIdThunk(storyId));
      }
    }, [isOpen, storyId, selectedStory, dispatch]);

    // Fetch initial viewers and reset offset
    useEffect(() => {
      if (isOpen) {
        offsetRef.current = 0;
        dispatch(getStoryViewersWithLikesThunk({ storyId, limit, offset: 0 }));
      }
      return () => {
        dispatch(clearError('getStoryViewersWithLikes'));
      };
    }, [isOpen, storyId, dispatch]);

    // Infinite scroll observer
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            !loading.getStoryViewersWithLikes &&
            selectedStory?.latestViewers &&
            selectedStory.latestViewers.length >= offsetRef.current
          ) {
            offsetRef.current += limit;
            dispatch(getStoryViewersWithLikesThunk({ storyId, limit, offset: offsetRef.current }));
          }
        },
        { threshold: 0.1 }
      );

      if (sentinelRef.current) {
        observer.observe(sentinelRef.current);
      }

      return () => {
        if (sentinelRef.current) {
          observer.unobserve(sentinelRef.current);
        }
      };
    }, [dispatch, storyId, loading.getStoryViewersWithLikes, selectedStory?.latestViewers]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleKeyDown, isOpen]);

    // Focus management for accessibility
    useEffect(() => {
      if (isOpen && modalRef.current) {
        modalRef.current.focus();
      }
    }, [isOpen]);

    // Handle errors with toast notifications
    useEffect(() => {
      if (error.getStoryViewersWithLikes) {
        toast.error(error.getStoryViewersWithLikes);
      }
      if (error.getStoryById) {
        toast.error(error.getStoryById);
      }
    }, [error.getStoryViewersWithLikes, error.getStoryById]);

    if (!isOpen) {
      return null;
    }

    return (
      <div
        className={styles['story-viewers-modal__overlay']}
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
                <span aria-label={`${effectiveLikeCount} likes`} className={styles['story-viewers-modal__counts']}>
                  {effectiveLikeCount} {effectiveLikeCount === 1 ? 'like' : 'likes'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles['story-viewers-modal__close']}
              aria-label="Close story viewers modal"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <div className={styles['story-viewers-modal__list']} role="list" aria-label="List of story viewers">
            {loading.getStoryById ? (
              <p className={styles['story-viewers-modal__loading']} aria-live="polite">
                Loading story details...
              </p>
            ) : error.getStoryById ? (
              <div>
                <p className={styles['story-viewers-modal__error']} role="alert">
                  {error.getStoryById}
                </p>
                <button
                  onClick={() => dispatch(getStoryByIdThunk(storyId))}
                  className={styles['story-viewers-modal__retry-button']}
                  aria-label="Retry loading story details"
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
                      loading="lazy" // Performance: lazy load images
                      placeholder="blur" // UX: add blur placeholder
                      blurDataURL="/avatars/default-avatar-blur.svg" // Optional: low-res placeholder
                    />
                    <div className="flex-1">
                      {viewer.profileName && (
                        <p className={styles['story-viewers-modal__profile-name']}>
                          {viewer.profileName}
                        </p>
                      )}
                      <p className={styles['story-viewers-modal__username']}>{viewer.username}</p>
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
                <div ref={sentinelRef} className="h-1" aria-hidden="true" />
                {loading.getStoryViewersWithLikes && (
                  <p className={styles['story-viewers-modal__loading']} aria-live="polite">
                    Loading more viewers...
                  </p>
                )}
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
});

StoryViewersModal.displayName = 'StoryViewersModal';

export default StoryViewersModal;