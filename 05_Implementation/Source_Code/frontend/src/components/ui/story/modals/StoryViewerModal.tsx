'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css';
import {
  FaHeart,
  FaTrash,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisH,
  FaFlag,
} from 'react-icons/fa';
import { AppDispatch, RootState } from '@/store';
import { recordStoryViewThunk } from '@/store/storySlice';
import { replyToStoryThunk } from '@/store/messageSlice';
import { StoryFeedItem } from '@/types/story';
import { SendIcon } from 'lucide-react';
import StoryViewerSkeletonModal from '../StoryViewerSkeletonModal';
import Link from 'next/link';

/* ==================== Types & Constants ==================== */
interface StoryViewerModalModals {
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
}

interface StoryViewerModalInteractions {
  onLike: (storyId: number) => void;
  onOpenViewersModal: (storyId: number) => void;
}

interface StoryViewerModalNavigation {
  onNext: () => void;
  onPrev: () => void;
  onSelectUser: (userId: number) => void;
}

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersListRef?: React.RefObject<HTMLDivElement | null>;
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
  hasMoreUsers?: boolean;

  loading: boolean;
  storyFeed: StoryFeedItem[];
  selectedUserId: number | null;
  currentIndex: number;

  navigation: StoryViewerModalNavigation;
  actions: {
    modals: StoryViewerModalModals;
    interactions: StoryViewerModalInteractions;
  };
}


/** Duration each story stays visible (15 seconds) */
const STORY_DURATION = 15000;

/**
 * Full-screen modal for viewing stories with navigation, replies, likes,
 * and user switching. Supports auto-progress, pause on interaction, and accessibility.
 */
const StoryViewerModal: React.FC<StoryViewerModalProps> = memo(

  ({ isOpen, onClose, usersListRef, sentinelRef, hasMoreUsers, loading, storyFeed, selectedUserId, currentIndex, navigation, actions }) => {
    const { onNext, onPrev, onSelectUser } = navigation;
    const { modals, interactions } = actions;
    const { setShowReportModal, setShowDeleteModal } = modals;
    const { onLike, onOpenViewersModal } = interactions;


    const dispatch = useDispatch<AppDispatch>();
    const { isAnyModalOpen } = useSelector((state: RootState) => state.ui);

    const menuRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const startTimeRef = useRef<number>(Date.now());

    const [showStoryMenu, setShowStoryMenu] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [isReplyInputFocused, setIsReplyInputFocused] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pausedAt, setPausedAt] = useState<number | null>(null);

    // Current active story data
    const currentStoryFeedItem = selectedUserId
      ? storyFeed.find((item) => item.userId === selectedUserId)
      : null;
    const currentStory = currentStoryFeedItem?.stories[currentIndex];

    const currentStoryFeedIndex = storyFeed.findIndex(
      (item) => item.userId === selectedUserId
    );

    /* ==================== Pause Handling ==================== */
    // Pause story progression when tab is hidden or window loses focus
    useEffect(() => {
      const handleVisibility = () => setIsPaused(document.hidden);
      const handleBlur = () => setIsPaused(true);
      const handleFocus = () => setIsPaused(false);

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
      };
    }, []);

    /* ==================== Auto-Progress Timer ==================== */
    useEffect(() => {
      if (!isOpen || !currentStory || loading) {
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      const shouldPause =
        isAnyModalOpen ||
        showStoryMenu ||
        isPaused ||
        replyText.trim().length > 0 ||
        isReplying ||
        isReplyInputFocused;

      if (shouldPause) {
        if (!pausedAt) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, STORY_DURATION - elapsed);
          setPausedAt(remaining);
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      // Resume from paused time or start fresh
      if (pausedAt !== null) {
        timerRef.current = setTimeout(onNext, pausedAt) as unknown as NodeJS.Timeout;
        setPausedAt(null);
      } else {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(onNext, STORY_DURATION) as unknown as NodeJS.Timeout;
      }

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [
      isOpen,
      currentStory,
      loading,
      isAnyModalOpen,
      showStoryMenu,
      isPaused,
      replyText,
      isReplying,
      isReplyInputFocused,
      currentIndex,
      onNext,
      pausedAt
    ]);

    /* ==================== Record Story View ==================== */
    useEffect(() => {
      if (isOpen && currentStory && !currentStory.isViewed && !loading) {
        dispatch(recordStoryViewThunk(currentStory.storyId));
      }
    }, [dispatch, currentStory, isOpen, loading]);

    /* ==================== Send Reply ==================== */
    const handleSendReply = useCallback(async () => {
      if (!replyText.trim() || isReplying || !currentStory) return;

      setIsReplying(true);
      try {
        await dispatch(
          replyToStoryThunk({
            storyId: currentStory.storyId.toString() as any,
            content: replyText.trim(),
          })
        ).unwrap();
        setReplyText('');
        textareaRef.current?.focus();
      } catch {
        // Error handled globally via Redux middleware
      } finally {
        setIsReplying(false);
      }
    }, [replyText, isReplying, currentStory, dispatch]);

    /* ==================== Auto-resize Textarea ==================== */
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const resize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      textarea.addEventListener('input', resize);
      resize();

      return () => textarea.removeEventListener('input', resize);
    }, [replyText]);

    /* ==================== Keyboard Navigation ==================== */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isOpen || loading) return;
        if (e.key === 'ArrowRight') onNext();
        if (e.key === 'ArrowLeft') onPrev();
        if (e.key === 'Escape') {
          onClose();
          setShowStoryMenu(false);
        }
      },
      [isOpen, onNext, onPrev, onClose, loading]
    );

    useEffect(() => {
      if (isOpen) window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, isOpen]);

    /* ==================== Close Menu on Outside Click ==================== */
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setShowStoryMenu(false);
        }
      };

      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    /* ==================== Focus Management ==================== */
    useEffect(() => {
      if (isOpen && modalRef.current) modalRef.current.focus();
    }, [isOpen]);

    /* ==================== Focus Management ==================== */
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, []);


    /* ==================== Loading State ==================== */
    if (isOpen && loading) return <StoryViewerSkeletonModal />;


    if (!isOpen || loading) return null;

    /* ==================== Error / Empty State ==================== */
    if (!currentStoryFeedItem || !currentStory || !currentStory.mediaUrl) {
      return (
        <div
          className={`${styles.stories__viewer_modal_overlay} bg-overlay`}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className={styles.stories__viewer_header}>
              <div className={styles.stories__viewer_user}>
                <span className={styles.stories__viewer_username}>Error</span>
              </div>
              <button onClick={onClose} className={styles.stories__viewer_close} aria-label="Close">
                <FaTimes size={20} />
              </button>
          </div>
          <div className={styles.stories__viewer_modal}>
            <div className={styles.stories__viewer_content}>
              <p className={styles.stories__error}>Unable to load highlight.</p>
            </div>
          </div>
        </div>
      );
    }

    /* ==================== Main Render ==================== */
    return (
      <div
        className={`${styles.stories__viewer_modal_overlay} bg-overlay`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-viewer-title"
        tabIndex={-1}
        ref={modalRef}
      >
        {/* Header */}
        <div className={styles.stories__viewer_header}>
          <div className={styles.stories__viewer_user}>
            <span id="story-viewer-title" className={styles.stories__viewer_username}>
              {currentStoryFeedItem.username || 'User'}
            </span>
            <button onClick={onClose} className={styles.stories__viewer_close} aria-label="Close modal">
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className={styles.stories__viewer_modal}>
          {/* Main Content */}
          <div className={styles.stories__viewer_main}>
            {/* User List Sidebar */}
            <div ref={usersListRef} className={styles.stories__viewer_users} role="navigation" aria-label="Story users">
              {storyFeed.map((item) => (
                <button
                  key={item.userId}
                  className={`${styles.stories__avatar_wrapper} ${selectedUserId === item.userId ? styles.stories__avatar_selected : ''}`}
                  onClick={() => onSelectUser(item.userId)}
                  aria-label={`View ${item.username}'s stories`}
                  aria-current={selectedUserId === item.userId}
                >
                  <div
                    className={`${styles.stories__avatar_ring} ${
                      item.hasUnviewedStories ? styles.stories__avatar_ring_unviewed : ''
                    }`}
                  >
                    <Image
                      src={item.profilePicture || '/avatars/default-avatar.svg'}
                      alt={`${item.username}'s profile picture`}
                      width={56}
                      height={56}
                      className={styles.stories__avatar}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="/avatars/default-avatar-blur.svg"
                    />
                  </div>
                  <span className={styles.stories__username}>{item.username}</span>
                </button>
              ))}
              {loading && storyFeed.length !== 0 && (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`hl-skeleton-${i}`} className={styles.stories__avatar_wrapper}>
                      <div className={`${styles.stories__avatar_ring} ${styles.stories__skeleton} bg-gray-700`}>
                        <div className={`${styles.stories__avatar} ${styles.stories__skeleton} bg-gray-600`} />
                      </div>
                      <div className={`${styles.stories__username} ${styles.stories__skeleton} bg-gray-700 w-12 h-3 mt-1`} />
                    </div>
                  ))}
                </>
              )}

              {hasMoreUsers && (
                <div
                  ref={sentinelRef}
                  className="flex-shrink-0 w-20 h-20"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Current Story */}
            <div className={styles.stories__viewer_story}>
              {/* Story Header */}
              <div className={styles.stories__viewer_story_header}>
                <div className="flex items-center">
                  <Link href={`/${currentStoryFeedItem.username}`}>
                    <Image
                      src={currentStoryFeedItem.profilePicture || '/avatars/default-avatar.svg'}
                      alt={`${currentStoryFeedItem.username}'s profile picture`}
                      width={32}
                      height={32}
                      className={styles.stories__viewer_avatar}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="/avatars/default-avatar-blur.svg"
                    />
                  </Link>
                  <Link href={`/${currentStoryFeedItem.username}`}>
                    <span className={`${styles.stories__viewer_username} ml-2`}>
                      {currentStoryFeedItem.username}
                    </span>
                  </Link>
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
                      {currentStory.isMine && (
                        <button
                          onClick={() => {
                            setShowDeleteModal(currentStory.storyId);
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                        >
                          <FaTrash /> Delete
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
                        <FaFlag /> Report
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className={styles.stories__viewer_progress} aria-label="Story progress">
                {currentStoryFeedItem.stories.map((_, i) => (
                  <div key={i} className={styles.stories__viewer_progress_bar}>
                    <div
                      className={styles.stories__viewer_progress_fill}
                      style={{
                        width: i < currentIndex ? '100%' : '0%',
                        animation:
                          i === currentIndex ? `progress ${STORY_DURATION}ms linear forwards` : 'none',
                        animationPlayState:
                          isPaused ||
                          !isOpen ||
                          loading ||
                          isAnyModalOpen ||
                          showStoryMenu ||
                          replyText.trim().length > 0 ||
                          isReplyInputFocused ||
                          isReplying
                            ? 'paused'
                            : 'running',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Media */}
              <div className={styles.stories__viewer_content}>
                <Image
                  src={currentStory.mediaUrl}
                  alt={`Story by ${currentStoryFeedItem.username}`}
                  fill
                  className={styles.stories__viewer_media}
                  priority={currentIndex === 0}
                  placeholder="blur"
                  blurDataURL="/default-story-blur.png"
                />
              </div>

              {/* Navigation Arrows */}
              <div className={styles.stories__viewer_nav}>
                <button
                  onClick={onPrev}
                  className={styles.stories__viewer_nav_prev}
                  disabled={currentIndex === 0 && currentStoryFeedIndex === 0}
                  aria-label="Previous story"
                >
                  <FaChevronLeft className={styles.stories__viewer_nav_hint} />
                </button>
                <button
                  onClick={onNext}
                  className={styles.stories__viewer_nav_next}
                  disabled={currentIndex === currentStoryFeedItem.stories.length - 1 && storyFeed.length === 1}
                  aria-label="Next story"
                >
                  <FaChevronRight className={styles.stories__viewer_nav_hint} />
                </button>
              </div>

              {/* Actions Bar */}
              <div className={styles.stories__viewer_actions}>
                {/* Viewers */}
                {currentStory.latestViewers && currentStory.latestViewers.length > 0 && (
                  <button
                    onClick={() => onOpenViewersModal(currentStory.storyId)}
                    className={styles.stories__viewer_latest_viewers}
                    aria-label={`View ${currentStory.viewCount} viewers`}
                  >
                    <div className={styles.stories__viewer_avatars_stack}>
                      {currentStory.latestViewers.slice(0, 3).map((viewer, i) => (
                        <Image
                          key={viewer.userId}
                          src={viewer.profilePicture || '/avatars/default-avatar.svg'}
                          alt={`${viewer.username}'s avatar`}
                          width={24}
                          height={24}
                          className={styles.stories__viewer_avatar_stack}
                          style={{ left: `${i * -8}px` }}
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="/avatars/default-avatar-blur.svg"
                        />
                      ))}
                    </div>
                    <span className={styles.stories__viewer_count}>
                      {currentStory.viewCount} {currentStory.viewCount === 1 ? 'view' : 'views'}
                    </span>
                  </button>
                )}

                {/* Reply Input */}
                {!currentStory.isMine && (
                  <div className={styles.stories__viewer_reply_container}>
                    <textarea
                      ref={textareaRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setIsReplyInputFocused(true)}
                      onBlur={() => setIsReplyInputFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Reply to story..."
                      className={styles.stories__viewer_reply_input}
                      aria-label="Reply to story"
                      rows={1}
                      disabled={isReplying}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={isReplying || !replyText.trim()}
                      className={styles.stories__viewer_reply_send}
                      aria-label="Send reply"
                    >
                      {isReplying ? (
                        <span className="text-xs text-gray-400">Sending...</span>
                      ) : (
                        <SendIcon size={20} strokeWidth={2.5} className="text-white" />
                      )}
                    </button>
                  </div>
                )}

                {/* Like Button */}
                <button
                  onClick={() => onLike(currentStory.storyId)}
                  className={`${styles.stories__viewer_action} ml-auto ${currentStory.isLiked ? styles.stories__viewer_like_animate : ''}`}
                  aria-label={currentStory.isLiked ? 'Unlike' : 'Like'}
                  aria-pressed={currentStory.isLiked}
                >
                  <FaHeart
                    size={24}
                    className={currentStory.isLiked ? 'text-[var(--error)]' : 'text-white'}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StoryViewerModal.displayName = 'StoryViewerModal';

export default StoryViewerModal;