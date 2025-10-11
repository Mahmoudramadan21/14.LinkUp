'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import { useDispatch } from 'react-redux';
import Image from 'next/image';
import styles from '@/app/feed/stories.module.css';
import { FaTrash, FaTimes, FaChevronLeft, FaChevronRight, FaEllipsisH, FaFlag, FaEdit } from 'react-icons/fa';
import { AppDispatch } from '@/store';
import { recordStoryViewThunk } from '@/store/storySlice';
import { Highlight } from '@/types/highlight';

/**
 * Props for the HighlightViewerModal component.
 */
interface HighlightViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  selectedHighlightId: number | null;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onLike: (storyId: number) => void;
  onDelete: (storyId: number) => void;
  onSelectHighlight: (highlightId: number) => void;
  onOpenViewersModal: (storyId: number) => void;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  onDeleteHighlight: (highlightId: number) => void;
  onRemoveStory: (storyId: number, highlightId: number) => void;
  onEditHighlight: () => void;
  loading: boolean;
  isAnyModalOpen: boolean; // New prop to indicate if any modal is open
}

/**
 * Duration for each story in milliseconds.
 */
const STORY_DURATION = 5000;

/**
 * HighlightViewerModal component for viewing highlights with navigation and interaction features.
 */
const HighlightViewerModal: React.FC<HighlightViewerModalProps> = memo(
  ({
    isOpen,
    onClose,
    highlights,
    selectedHighlightId,
    currentIndex,
    onNext,
    onPrev,
    onSelectHighlight,
    onOpenViewersModal,
    setShowReportModal,
    onDeleteHighlight,
    onRemoveStory,
    onEditHighlight,
    loading,
    isAnyModalOpen,
  }) => {
    const dispatch = useDispatch<AppDispatch>();
    const progressBarRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [showStoryMenu, setShowStoryMenu] = useState(false);

    const currentHighlight = selectedHighlightId
      ? highlights.find((item) => item.highlightId === selectedHighlightId)
      : null;
    const currentStory = currentHighlight?.stories[currentIndex];

    // Debug logging (remove in production)
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('HighlightViewerModal Props:', {
          isOpen,
          highlightsLength: highlights.length,
          selectedHighlightId,
          currentIndex,
          currentHighlight,
          currentStory,
          loading,
          isAnyModalOpen,
        });
      }
    }, [isOpen, highlights, selectedHighlightId, currentIndex, currentHighlight, currentStory, loading, isAnyModalOpen]);

    // Start or pause timer and reset progress bar based on isAnyModalOpen
    useEffect(() => {
      if (!isOpen || !currentStory || !progressBarRef.current || loading || isAnyModalOpen) {
        // Pause or prevent timer from starting
        if (timerRef.current) {
          console.log('Clearing timer due to modal open or invalid state', { isAnyModalOpen });
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (progressBarRef.current) {
          progressBarRef.current.style.animationPlayState = 'paused';
        }
        return;
      }

      // Start timer and animation
      console.log('Starting timer for story', { currentIndex, highlightId: selectedHighlightId });
      progressBarRef.current.style.animation = 'none';
      void progressBarRef.current.offsetWidth;
      progressBarRef.current.style.animation = `progressBar ${STORY_DURATION}ms linear forwards`;

      if (timerRef.current) {
        console.log('Clearing stale timer before setting new one');
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        console.log('Timer triggered onNext', { currentIndex, highlightId: selectedHighlightId });
        if(!isAnyModalOpen) onNext();
      }, STORY_DURATION);

      console.log(isAnyModalOpen)

      return () => {
        if (timerRef.current) {
          console.log('Cleaning up timer on unmount or dependency change');
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [currentIndex, isOpen, onNext, selectedHighlightId, currentStory, loading, isAnyModalOpen]);

    // Record story view if not viewed and not owned by current user
    useEffect(() => {
      if (isOpen && currentStory && !currentStory.isViewed && !currentStory.isMine && !loading) {
        dispatch(recordStoryViewThunk(currentStory.storyId));
      }
    }, [dispatch, currentStory, isOpen, loading]);

    // Keyboard navigation handler
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isOpen || loading || isAnyModalOpen) return;
        switch (e.key) {
          case 'ArrowRight':
            onNext();
            break;
          case 'ArrowLeft':
            onPrev();
            break;
          case 'Escape':
            onClose();
            setShowStoryMenu(false);
            break;
        }
      },
      [isOpen, onNext, onPrev, onClose, loading, isAnyModalOpen]
    );

    useEffect(() => {
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleKeyDown, isOpen]);

    // Click outside to close menu
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setShowStoryMenu(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Focus management for accessibility
    useEffect(() => {
      if (isOpen && modalRef.current) {
        modalRef.current.focus();
      }
    }, [isOpen]);

    // Skeleton components (memoized for performance)
    const HighlightListSkeleton = useMemo(
      () => (
        <div className={styles.stories__viewer_users} role="navigation" aria-label="Loading highlight list">
          {Array.from({ length: highlights.length || 5 }).map((_, index) => (
            <div
              key={`skeleton-highlight-${index}`}
              className={`${styles.stories__avatar_wrapper} ${styles.stories__skeleton}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`${styles.stories__avatar_ring} ${styles.stories__skeleton}`}>
                <div className={`${styles.stories__avatar} ${styles.stories__skeleton}`} />
              </div>
              <div className={`${styles.stories__username} ${styles.stories__skeleton}`} />
            </div>
          ))}
        </div>
      ),
      [highlights.length]
    );

    const StorySkeleton = useMemo(
      () => (
        <div className={styles.stories__viewer_story}>
          <div className={styles.stories__viewer_story_header}>
            <div className="flex items-center">
              <div className={`${styles.stories__viewer_avatar} ${styles.stories__skeleton}`} />
              <div className={`${styles.stories__viewer_username} ${styles.stories__skeleton} ml-2 w-20 h-4`} />
            </div>
            <div className={`${styles.stories__viewer_menu_button} ${styles.stories__skeleton} w-8 h-8 rounded-full`} />
          </div>
          <div className={styles.stories__viewer_progress} aria-label="Loading story progress">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`progress-skeleton-${index}`}
                className={styles.stories__viewer_progress_bar}
                aria-label={`Loading story ${index + 1} progress`}
              >
                <div
                  className={`${styles.stories__viewer_progress_fill} ${styles.stories__skeleton}`}
                  style={{
                    animation: 'none',
                    width: '100%',
                    animationDelay: `${index * 0.2}s`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className={styles.stories__viewer_content}>
            <div
              className={`${styles.stories__viewer_media} ${styles.stories__skeleton}`}
              style={{ animationDelay: '0.3s' }}
            />
          </div>
          <div className={styles.stories__viewer_actions}>
            <div className={`${styles.stories__viewer_latest_viewers} ${styles.stories__skeleton} w-32 h-6 rounded`} />
            <div className={`${styles.stories__viewer_action} ${styles.stories__skeleton} ml-auto mr-4 w-6 h-6 rounded-full`} />
          </div>
        </div>
      ),
      []
    );

    // Loading Skeleton Modal
    if (isOpen && loading) {
      return (
        <div
          className={styles.stories__viewer_modal_overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="highlight-viewer-loading-title"
          aria-busy="true"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className={styles.stories__viewer_modal}>
            <div className={styles.stories__viewer_header}>
              <div className={styles.stories__viewer_user}>
                <span
                  id="highlight-viewer-loading-title"
                  className={`${styles.stories__viewer_username} ${styles.stories__skeleton} w-24 h-5`}
                />
                <button
                  className={`${styles.stories__viewer_close} ${styles.stories__skeleton} w-5 h-5 rounded-full`}
                  aria-label="Close highlight viewer modal"
                  tabIndex={-1}
                />
              </div>
            </div>
            <div className={styles.stories__viewer_main}>
              {HighlightListSkeleton}
              {StorySkeleton}
            </div>
          </div>
        </div>
      );
    }

    if (!isOpen || !currentHighlight || !currentStory || !currentStory.mediaUrl) {
      return (
        <div
          className={styles.stories__viewer_modal_overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="highlight-viewer-error-title"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className={styles.stories__viewer_modal}>
            <div className={styles.stories__viewer_header}>
              <div className={styles.stories__viewer_user}>
                <span className={styles.stories__viewer_username}>Error</span>
              </div>
              <button
                onClick={onClose}
                className={styles.stories__viewer_close}
                aria-label="Close highlight viewer modal"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className={styles.stories__viewer_content}>
              <p id="highlight-viewer-error-title" className={styles.stories__error}>
                Unable to load highlight. Please try again.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={styles.stories__viewer_modal_overlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="highlight-viewer-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className={styles.stories__viewer_modal}>
          <div className={styles.stories__viewer_header}>
            <div className={styles.stories__viewer_user}>
              <span id="highlight-viewer-title" className={styles.stories__viewer_username}>
                {currentHighlight.title || 'Highlight'}
              </span>
              <button
                onClick={onClose}
                className={styles.stories__viewer_close}
                aria-label="Close highlight viewer modal"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>
          <div className={styles.stories__viewer_main}>
            <div className={styles.stories__viewer_users} role="navigation" aria-label="Highlight list">
              {highlights.map((item) => (
                <button
                  key={item.highlightId}
                  className={`${styles.stories__avatar_wrapper} ${
                    selectedHighlightId === item.highlightId ? styles.stories__avatar_selected : ''
                  }`}
                  onClick={() => onSelectHighlight(item.highlightId)}
                  aria-label={`View ${item.title}'s stories`}
                  aria-current={selectedHighlightId === item.highlightId ? 'true' : 'false'}
                >
                  <div
                    className={`${styles.stories__avatar_ring} ${
                      item.stories.some((s) => !s.isViewed) ? styles.stories__avatar_ring_unviewed : ''
                    }`}
                  >
                    <Image
                      src={item.coverImage || '/default-highlight.png'}
                      alt={item.title}
                      width={56}
                      height={56}
                      className={styles.stories__avatar}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="/default-highlight-blur.png"
                    />
                  </div>
                  <span className={styles.stories__username}>{item.title}</span>
                </button>
              ))}
            </div>
            <div className={styles.stories__viewer_story}>
              <div className={styles.stories__viewer_story_header}>
                <div className="flex items-center">
                  <Image
                    src={currentHighlight.coverImage || '/default-highlight.png'}
                    alt={currentHighlight.title}
                    width={32}
                    height={32}
                    className={styles.stories__viewer_avatar}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="/default-highlight-blur.png"
                  />
                  <span className={`${styles.stories__viewer_username} ml-2`}>{currentHighlight.title}</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowStoryMenu(!showStoryMenu)}
                    className={styles.stories__viewer_menu_button}
                    aria-label="Toggle story options menu"
                    aria-expanded={showStoryMenu}
                  >
                    <FaEllipsisH size={20} />
                  </button>
                  {showStoryMenu && (
                    <div
                      ref={menuRef}
                      className={styles.stories__viewer_menu}
                      role="menu"
                      aria-label="Story options menu"
                    >
                      {currentHighlight.isMine && (
                        <button
                          onClick={() => {
                            onEditHighlight();
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                          aria-label="Edit highlight"
                        >
                          <FaEdit /> Edit Highlight
                        </button>
                      )}
                      {currentHighlight.isMine && (
                        <button
                          onClick={() => {
                            onDeleteHighlight(currentHighlight.highlightId);
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                          aria-label="Delete highlight"
                        >
                          <FaTrash /> Delete Highlight
                        </button>
                      )}
                      {currentHighlight.stories.length > 1 && currentStory.isMine && (
                        <button
                          onClick={() => {
                            onRemoveStory(currentStory.storyId, currentHighlight.highlightId);
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                          aria-label="Remove story from highlight"
                        >
                          <FaTrash /> Remove Story
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowReportModal(currentStory.storyId);
                          setShowStoryMenu(false);
                        }}
                        className={styles.stories__viewer_menu_item}
                        role="menuitem"
                        aria-label="Report story"
                      >
                        <FaFlag /> Report Story
                        </button>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.stories__viewer_progress} aria-label="Story progress">
                {currentHighlight.stories.map((_, index) => (
                  <div
                    key={index}
                    className={styles.stories__viewer_progress_bar}
                    aria-label={`Story ${index + 1} progress`}
                  >
                    <div
                      className={styles.stories__viewer_progress_fill}
                      style={{
                        animationPlayState: index === currentIndex && !isAnyModalOpen ? 'running' : 'paused',
                        width: index < currentIndex ? '100%' : index === currentIndex ? '0%' : '0%',
                      }}
                      ref={index === currentIndex ? progressBarRef : null}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.stories__viewer_content}>
                <Image
                  src={currentStory.mediaUrl || '/default-story.png'}
                  alt={`Story in ${currentHighlight.title}`}
                  fill
                  className={styles.stories__viewer_media}
                  priority={currentIndex === 0}
                  placeholder="blur"
                  blurDataURL="/default-story-blur.png"
                  onError={() => {
                    console.error('Failed to load story image:', currentStory.mediaUrl);
                  }}
                />
              </div>
              <div className={styles.stories__viewer_nav}>
                <button
                  onClick={onPrev}
                  className={styles.stories__viewer_nav_prev}
                  disabled={currentIndex === 0}
                  aria-label="Previous story"
                  aria-disabled={currentIndex === 0}
                >
                  <FaChevronLeft className={styles.stories__viewer_nav_hint} />
                </button>
                <button
                  onClick={onNext}
                  className={styles.stories__viewer_nav_next}
                  disabled={currentIndex === currentHighlight.stories.length - 1 && highlights.length === 1}
                  aria-label="Next story"
                  aria-disabled={currentIndex === currentHighlight.stories.length - 1 && highlights.length === 1}
                >
                  <FaChevronRight className={styles.stories__viewer_nav_hint} />
                </button>
              </div>
              <div className={styles.stories__viewer_actions}>
                {currentStory.latestViewers && currentStory.latestViewers.length > 0 && (
                  <button
                    onClick={() => onOpenViewersModal(currentStory.storyId)}
                    className={styles.stories__viewer_latest_viewers}
                    aria-label={`View ${currentStory.viewCount} story viewers`}
                  >
                    <div className={styles.stories__viewer_avatars_stack}>
                      {currentStory.latestViewers.slice(0, 3).map((viewer, index) => (
                        <Image
                          key={viewer.userId}
                          src={viewer.profilePicture || '/avatars/default-avatar.svg'}
                          alt={`${viewer.username}'s profile picture`}
                          width={24}
                          height={24}
                          className={styles.stories__viewer_avatar_stack}
                          style={{ left: `${index * -8}px` }}
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="/avatars/default-avatar-blur.svg"
                        />
                      ))}
                    </div>
                    <span className={styles.stories__viewer_count}>
                      {currentStory.viewCount || 0} {currentStory.viewCount === 1 ? 'view' : 'views'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

HighlightViewerModal.displayName = 'HighlightViewerModal';

export default HighlightViewerModal;