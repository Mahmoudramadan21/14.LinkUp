'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import { useDispatch } from 'react-redux';
import Image from 'next/image';
import styles from '@/app/feed/stories.module.css';
import { FaHeart, FaTrash, FaTimes, FaChevronLeft, FaChevronRight, FaEllipsisH, FaFlag } from 'react-icons/fa';
import { AppDispatch } from '@/store';
import { recordStoryViewThunk } from '@/store/storySlice';
import { StoryFeedItem } from '@/types/story';

/**
 * Props for the StoryViewerModal component.
 */
interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyFeed: StoryFeedItem[];
  currentUserId: number;
  selectedUserId: number | null;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onLike: (storyId: number) => void;
  onDelete: (storyId: number) => void;
  onSelectUser: (userId: number) => void;
  onOpenViewersModal: (storyId: number) => void;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  loading: boolean;
}

/**
 * Duration for each story in milliseconds.
 */
const STORY_DURATION = 5000; // 5 seconds per story

/**
 * StoryViewerModal component for viewing stories with navigation and interaction features.
 * Optimized for performance, accessibility, and best practices.
 */
const StoryViewerModal: React.FC<StoryViewerModalProps> = memo(
  ({
    isOpen,
    onClose,
    storyFeed,
    selectedUserId,
    currentIndex,
    onNext,
    onPrev,
    onLike,
    onSelectUser,
    onOpenViewersModal,
    setShowReportModal,
    setShowDeleteModal,
    loading,
  }) => {
    const dispatch = useDispatch<AppDispatch>();
    const progressBarRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [showStoryMenu, setShowStoryMenu] = useState(false);

    const currentStoryFeedItem = selectedUserId
      ? storyFeed.find((item) => item.userId === selectedUserId)
      : null;
    const currentStory = currentStoryFeedItem?.stories[currentIndex];

    // Debug logging (remove in production)
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('StoryViewerModal Props:', {
          isOpen,
          storyFeedLength: storyFeed.length,
          selectedUserId,
          currentIndex,
          currentStoryFeedItem,
          currentStory,
          loading,
        });
      }
    }, [isOpen, storyFeed, selectedUserId, currentIndex, currentStoryFeedItem, currentStory, loading]);

    // Start timer and reset progress bar
    useEffect(() => {
      if (isOpen && currentStory && progressBarRef.current && !loading) {
        // Reset animation
        progressBarRef.current.style.animation = 'none';
        void progressBarRef.current.offsetWidth; // Trigger reflow
        progressBarRef.current.style.animation = `progressBar ${STORY_DURATION}ms linear forwards`;

        // Start timer for auto-advance
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onNext();
        }, STORY_DURATION);

        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
        };
      }
    }, [currentIndex, isOpen, onNext, currentStory, loading]);

    // Record story view if not viewed and not owned by current user
    useEffect(() => {
      if (isOpen && currentStory && !currentStory.isViewed && !loading) {
        dispatch(recordStoryViewThunk(currentStory.storyId));
      }
    }, [dispatch, currentStory, isOpen, loading]);

    // Keyboard navigation handler
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isOpen || loading) return;
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
      [isOpen, onNext, onPrev, onClose, loading]
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
    const UserListSkeleton = useMemo(() => (
      <div className={styles.stories__viewer_users} role="navigation" aria-label="Loading story users list">
        {Array.from({ length: storyFeed.length || 5 }).map((_, index) => (
          <div
            key={`skeleton-user-${index}`}
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
    ), [storyFeed.length]);

    const StorySkeleton = useMemo(() => (
      <div className={styles.stories__viewer_story}>
        {/* Story Header Skeleton */}
        <div className={styles.stories__viewer_story_header}>
          <div className="flex items-center">
            <div className={`${styles.stories__viewer_avatar} ${styles.stories__skeleton}`} />
            <div className={`${styles.stories__viewer_username} ${styles.stories__skeleton} ml-2 w-20 h-4`} />
          </div>
          <div className={`${styles.stories__viewer_menu_button} ${styles.stories__skeleton} w-8 h-8 rounded-full`} />
        </div>

        {/* Progress Bars Skeleton */}
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

        {/* Story Content Skeleton */}
        <div className={styles.stories__viewer_content}>
          <div
            className={`${styles.stories__viewer_media} ${styles.stories__skeleton}`}
            style={{ animationDelay: '0.3s' }}
          />
        </div>

        {/* Actions Skeleton */}
        <div className={styles.stories__viewer_actions}>
          <div className={`${styles.stories__viewer_latest_viewers} ${styles.stories__skeleton} w-32 h-6 rounded`} />
          <div className={`${styles.stories__viewer_action} ${styles.stories__skeleton} ml-auto mr-4 w-6 h-6 rounded-full`} />
        </div>
      </div>
    ), []);

    // Loading Skeleton Modal
    if (isOpen && loading) {
      return (
        <div
          className={styles.stories__viewer_modal_overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-viewer-loading-title"
          aria-busy="true"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className={styles.stories__viewer_modal}>
            {/* Header Skeleton */}
            <div className={styles.stories__viewer_header}>
              <div className={styles.stories__viewer_user}>
                <span id="story-viewer-loading-title" className={`${styles.stories__viewer_username} ${styles.stories__skeleton} w-24 h-5`} />
                <button
                  className={`${styles.stories__viewer_close} ${styles.stories__skeleton} w-5 h-5 rounded-full`}
                  aria-label="Close story viewer modal"
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Main Content: Skeleton Left and Right */}
            <div className={styles.stories__viewer_main}>
              {UserListSkeleton}
              {StorySkeleton}
            </div>
          </div>
        </div>
      );
    }

    if (!isOpen || loading) return null;

    // Fallback UI if no story or storyFeedItem
    if (!currentStoryFeedItem || !currentStory || !currentStory.mediaUrl) {
      return (
        <div
          className={styles.stories__viewer_modal_overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-viewer-error-title"
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
                aria-label="Close story viewer modal"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className={styles.stories__viewer_content}>
              <p id="story-viewer-error-title" className={styles.stories__error}>
                Unable to load story. Please try again.
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
        aria-labelledby="story-viewer-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className={styles.stories__viewer_modal}>
          {/* Header */}
          <div className={styles.stories__viewer_header}>
            <div className={styles.stories__viewer_user}>
              <span id="story-viewer-title" className={styles.stories__viewer_username}>
                {currentStoryFeedItem.username || 'User'}
              </span>
              <button
                onClick={onClose}
                className={styles.stories__viewer_close}
                aria-label="Close story viewer modal"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Main Content: Left for Users, Right for Story */}
          <div className={styles.stories__viewer_main}>
            {/* Left Panel: User Avatars */}
            <div className={styles.stories__viewer_users} role="navigation" aria-label="Story users list">
              {storyFeed.map((item) => (
                <button
                  key={item.userId}
                  className={`${styles.stories__avatar_wrapper} ${
                    selectedUserId === item.userId ? styles.stories__avatar_selected : ''
                  }`}
                  onClick={() => onSelectUser(item.userId)}
                  aria-label={`View ${item.username}'s stories`}
                  aria-current={selectedUserId === item.userId ? 'true' : 'false'}
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
                      loading="lazy" // Performance: lazy load images
                      placeholder="blur" // UX: add blur placeholder
                      blurDataURL="/avatars/default-avatar-blur.svg" // Optional: provide low-res placeholder
                    />
                  </div>
                  <span className={styles.stories__username}>{item.username}</span>
                </button>
              ))}
            </div>

            {/* Right Panel: Current Story */}
            <div className={styles.stories__viewer_story}>
              {/* Story Header: Profile Picture, Username, and Menu */}
              <div className={styles.stories__viewer_story_header}>
                <div className="flex items-center">
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
                  <span className={`${styles.stories__viewer_username} ml-2`}>
                    {currentStoryFeedItem.username}
                  </span>
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
                      {currentStory.isMine && (
                        <button
                          onClick={() => {
                            setShowDeleteModal(currentStory.storyId);
                            setShowStoryMenu(false);
                          }}
                          className={styles.stories__viewer_menu_item}
                          role="menuitem"
                          aria-label="Delete story"
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
                        aria-label="Report story"
                      >
                        <FaFlag /> Report
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className={styles.stories__viewer_progress} aria-label="Story progress">
                {currentStoryFeedItem.stories.map((_, index) => (
                  <div
                    key={index}
                    className={styles.stories__viewer_progress_bar}
                    aria-label={`Story ${index + 1} progress`}
                  >
                    <div
                      className={styles.stories__viewer_progress_fill}
                      style={{
                        animationPlayState: index === currentIndex ? 'running' : 'paused',
                        width: index < currentIndex ? '100%' : index === currentIndex ? '0%' : '0%',
                      }}
                      ref={index === currentIndex ? progressBarRef : null}
                    />
                  </div>
                ))}
              </div>

              {/* Story Content */}
              <div className={styles.stories__viewer_content}>
                <Image
                  src={currentStory.mediaUrl || '/default-story.png'}
                  alt={`Story by ${currentStoryFeedItem.username}`}
                  fill
                  className={styles.stories__viewer_media}
                  priority={currentIndex === 0} // Load first story with priority
                  placeholder="blur" // UX: add blur placeholder
                  blurDataURL="/default-story-blur.png" // Optional: provide low-res placeholder
                  onError={() => {
                    console.error('Failed to load story image:', currentStory.mediaUrl);
                  }}
                />
              </div>

              {/* Navigation */}
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
                  disabled={
                    currentIndex === currentStoryFeedItem.stories.length - 1 && storyFeed.length === 1
                  }
                  aria-label="Next story"
                  aria-disabled={
                    currentIndex === currentStoryFeedItem.stories.length - 1 && storyFeed.length === 1
                  }
                >
                  <FaChevronRight className={styles.stories__viewer_nav_hint} />
                </button>
              </div>

              {/* Actions */}
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
                <button
                  onClick={() => onLike(currentStory.storyId)}
                  className={`${styles.stories__viewer_action} ml-auto mr-4 ${
                    currentStory.isLiked ? styles.stories__viewer_like_animate : ''
                  }`}
                  aria-label={currentStory.isLiked ? 'Unlike story' : 'Like story'}
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