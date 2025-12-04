'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css';
import {
  FaTrash,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisH,
  FaFlag,
  FaEdit,
} from 'react-icons/fa';
import { AppDispatch, RootState } from '@/store';
import { recordStoryViewThunk } from '@/store/storySlice';
import { Highlight } from '@/types/highlight';

/**
 * Props for the HighlightViewerModal component.
 */
interface HighlightViewerModalActions {
  modals: {
    setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
    setShowDeleteHighlightModal: React.Dispatch<React.SetStateAction<number | null>>;
    setShowRemoveStoryModal: React.Dispatch<React.SetStateAction<number | null>>;
  };
  interactions: {
    onEditHighlight: () => void;
    onOpenViewersModal: (storyId: number) => void;
  };
}

interface HighlightViewerModalProps {
  // UI state
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;

  // Selection state
  selectedHighlightId: number | null;
  currentIndex: number;
  highlights: Highlight[];

  // Navigation
  navigation: {
    onNext: () => void;
    onPrev: () => void;
    onSelectHighlight: (highlightId: number) => void;
  };

  // Actions / interactions
  actions: HighlightViewerModalActions;
}


/**
 * Auto-advance duration for each story (15 seconds).
 */
const STORY_DURATION = 15000;

/**
 * Full-screen modal for viewing highlights with auto-advance, navigation,
 * progress bars, and contextual actions (edit, delete, report, etc.).
 */
const HighlightViewerModal: React.FC<HighlightViewerModalProps> = memo(
  ({ isOpen, loading, onClose, highlights, selectedHighlightId, currentIndex, navigation, actions }) => {
  
    const { onNext, onPrev, onSelectHighlight } = navigation;
    const { modals, interactions } = actions;
    const { setShowReportModal, setShowDeleteHighlightModal, setShowRemoveStoryModal } = modals;
    const { onEditHighlight, onOpenViewersModal } = interactions;

    const dispatch = useDispatch<AppDispatch>();
    const { isAnyModalOpen } = useSelector((state: RootState) => state.ui);

    const modalRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [showStoryMenu, setShowStoryMenu] = useState(false);

    const currentHighlight = selectedHighlightId
      ? highlights.find((h) => h.highlightId === selectedHighlightId)
      : null;

    const currentStory = currentHighlight?.stories[currentIndex];

    /**
     * Auto-advance to next story with progress bar control.
     * Pauses when any modal is open or menu is shown.
     */
    useEffect(() => {
      if (!isOpen || !currentStory || loading || isAnyModalOpen || showStoryMenu) {
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      timerRef.current = setTimeout(onNext, STORY_DURATION);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [
      isOpen,
      currentIndex,
      currentStory,
      loading,
      isAnyModalOpen,
      showStoryMenu,
      onNext,
    ]);

    /**
     * Record story view when a new unviewed story is displayed.
     */
    useEffect(() => {
      if (
        isOpen &&
        currentStory &&
        !currentStory.isViewed &&
        !currentStory.isMine &&
        !loading
      ) {
        dispatch(recordStoryViewThunk(currentStory.storyId));
      }
    }, [dispatch, currentStory, isOpen, loading]);

    /**
     * Keyboard navigation: Left Arrow → Prev, Right Arrow → Next, Escape → Close.
     */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isOpen || loading || isAnyModalOpen) return;

        if (e.key === 'ArrowRight') onNext();
        else if (e.key === 'ArrowLeft') onPrev();
        else if (e.key === 'Escape') {
          onClose();
          setShowStoryMenu(false);
        }
      },
      [isOpen, loading, isAnyModalOpen, onNext, onPrev, onClose]
    );

    useEffect(() => {
      if (isOpen) window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, isOpen]);

    /**
     * Close story options menu when clicking outside.
     */
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setShowStoryMenu(false);
        }
      };

      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    /**
     * Focus modal on open for accessibility.
     */
    useEffect(() => {
      if (isOpen && modalRef.current) modalRef.current.focus();
    }, [isOpen]);

    // Prevent body scroll while viewer is open
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, []);

    // Memoized skeleton loaders
    const HighlightListSkeleton = useMemo(
      () =>
        Array.from({ length: highlights.length || 5 }).map((_, i) => (
          <div
            key={i}
            className={`${styles.stories__avatar_wrapper} ${styles.stories__skeleton} bg-neutral-gray`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`${styles.stories__avatar_ring} ${styles.stories__skeleton} bg-neutral-gray`}>
              <div className={`${styles.stories__avatar} ${styles.stories__skeleton} bg-neutral-gray`} />
            </div>
            <div className={`${styles.stories__username} ${styles.stories__skeleton} bg-neutral-gray`} />
          </div>
        )),
      [highlights.length]
    );

    const StorySkeleton = useMemo(
      () => (
        <div className={styles.stories__viewer_story}>
          <div className={styles.stories__viewer_story_header}>
            <div className="flex items-center">
              <div className={`${styles.stories__viewer_avatar} ${styles.stories__skeleton} bg-neutral-gray`} />
              <div className={`${styles.stories__viewer_username} ${styles.stories__skeleton} bg-neutral-gray ml-2 w-20 h-4`} />
            </div>
          </div>
          <div className={styles.stories__viewer_progress}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.stories__viewer_progress_bar}>
                <div className={`${styles.stories__viewer_progress_fill} ${styles.stories__skeleton} bg-neutral-gray`} />
              </div>
            ))}
          </div>
          <div className={styles.stories__viewer_content}>
            <div className={`${styles.stories__viewer_media} ${styles.stories__skeleton} bg-neutral-gray`} />
          </div>
        </div>
      ),
      []
    );

    // Loading state
    if (isOpen && loading) {
      return (
        <div
          className={`${styles.stories__viewer_modal_overlay} bg-overlay`}
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className={styles.stories__viewer_modal}>
            <div className={styles.stories__viewer_header}>
              <div className={styles.stories__viewer_user}>
                <span className={`${styles.stories__viewer_username} ${styles.stories__skeleton} bg-neutral-gray w-24 h-5`} />
                <button className={`${styles.stories__viewer_close} ${styles.stories__skeleton} bg-neutral-gray w-5 h-5 rounded-full`} tabIndex={-1} />
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

    // Error / invalid state
    if (!isOpen || !currentHighlight || !currentStory?.mediaUrl) {
      return (
        <div
          className={`${styles.stories__viewer_modal_overlay} bg-overlay`}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className={styles.stories__viewer_modal}>
            <div className={styles.stories__viewer_header}>
              <div className={styles.stories__viewer_user}>
                <span className={styles.stories__viewer_username}>Error</span>
              </div>
              <button onClick={onClose} className={styles.stories__viewer_close} aria-label="Close">
                <FaTimes size={20} />
              </button>
            </div>
            <div className={styles.stories__viewer_content}>
              <p className={styles.stories__error}>Unable to load highlight.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`${styles.stories__viewer_modal_overlay} bg-overlay modal-overlay`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="highlight-viewer-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className={styles.stories__viewer_modal}>
          {/* Header */}
          <div className={styles.stories__viewer_header}>
            <div className={styles.stories__viewer_user}>
              <span id="highlight-viewer-title" className={styles.stories__viewer_username}>
                {currentHighlight.title || 'Highlight'}
              </span>
              <button onClick={onClose} className={styles.stories__viewer_close} aria-label="Close modal">
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.stories__viewer_main}>
            {/* Highlight List */}
            <div className={styles.stories__viewer_users} role="navigation" aria-label="Highlights">
              {highlights.map((h) => (
                <button
                  key={h.highlightId}
                  className={`${styles.stories__avatar_wrapper} ${
                    selectedHighlightId === h.highlightId ? styles.stories__avatar_selected : ''
                  }`}
                  onClick={() => onSelectHighlight(h.highlightId)}
                  aria-label={`View ${h.title}`}
                  aria-current={selectedHighlightId === h.highlightId}
                >
                  <div
                    className={`${styles.stories__avatar_ring} ${
                      h.stories.some((s) => !s.isViewed) ? styles.stories__avatar_ring_unviewed : ''
                    }`}
                  >
                    <Image
                      src={h.coverImage || '/default-highlight.png'}
                      alt={h.title}
                      width={56}
                      height={56}
                      className={styles.stories__avatar}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="/default-highlight-blur.png"
                    />
                  </div>
                  <span className={styles.stories__username}>{h.title}</span>
                </button>
              ))}
            </div>

            {/* Current Story Viewer */}
            <div className={styles.stories__viewer_story}>
              {/* Story Header */}
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
                  <span className={`${styles.stories__viewer_username} ml-2`}>
                    {currentHighlight.title}
                  </span>
                </div>

                {/* Options Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowStoryMenu((v) => !v)}
                    className={styles.stories__viewer_menu_button}
                    aria-label="Story options"
                    aria-expanded={showStoryMenu}
                  >
                    <FaEllipsisH size={20} />
                  </button>

                  {showStoryMenu && (
                    <div ref={menuRef} className={styles.stories__viewer_menu} role="menu">
                      {currentHighlight.isMine && (
                        <button
                          onClick={() => {
                            onEditHighlight();
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                        >
                          <FaEdit /> Edit Highlight
                        </button>
                      )}
                      {currentHighlight.isMine && (
                        <button
                          onClick={() => {
                            setShowDeleteHighlightModal(currentHighlight.highlightId);
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                        >
                          <FaTrash /> Delete Highlight
                        </button>
                      )}
                      {currentHighlight.stories.length > 1 && currentStory.isMine && (
                        <button
                          onClick={() => {
                            setShowRemoveStoryModal(currentStory.storyId);
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
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
                      >
                        <FaFlag /> Report Story
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className={styles.stories__viewer_progress} aria-label="Story progress">
                {currentHighlight.stories.map((_, i) => (
                  <div key={i} className={styles.stories__viewer_progress_bar}>
                    <div
                      className={styles.stories__viewer_progress_fill}
                      style={{
                        width: i < currentIndex ? '100%' : i === currentIndex ? '0%' : '0%',
                        animation:
                          i === currentIndex
                            ? `progress ${STORY_DURATION}ms linear forwards`
                            : 'none',
                        animationPlayState:
                          !isOpen || loading || isAnyModalOpen || showStoryMenu ? 'paused' : 'running',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Media */}
              <div className={styles.stories__viewer_content}>
                <Image
                  src={currentStory.mediaUrl}
                  alt={`Story in ${currentHighlight.title}`}
                  fill
                  className={styles.stories__viewer_media}
                  priority={currentIndex === 0}
                  placeholder="blur"
                  blurDataURL="/default-story-blur.png"
                />
              </div>

              {/* Navigation */}
              <div className={styles.stories__viewer_nav}>
                <button
                  onClick={onPrev}
                  disabled={currentIndex === 0}
                  className={styles.stories__viewer_nav_prev}
                  aria-label="Previous story"
                >
                  <FaChevronLeft className={styles.stories__viewer_nav_hint} />
                </button>
                <button
                  onClick={onNext}
                  disabled={currentIndex === currentHighlight.stories.length - 1 && highlights.length === 1}
                  className={styles.stories__viewer_nav_next}
                  aria-label="Next story"
                >
                  <FaChevronRight className={styles.stories__viewer_nav_hint} />
                </button>
              </div>
              
              <div className={styles.stories__viewer_actions}>
               {/* Viewers */}
                {currentStory.isMine && currentStory.latestViewers && currentStory.latestViewers.length > 0 && (
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