'use client';
import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import Link from 'next/link';
import { AiOutlineEye } from 'react-icons/ai';
import Avatar from './Avatar';
import { toggleStoryLike } from '../utils/api';
import { useAppStore } from '@/store/feedStore';
import {
  StoriesDialogSectionProps,
  StoryDetails,
  ToggleStoryLikeResponse,
  UserStory,
} from '@/types';

/**
 * StoriesModal Component
 * Renders a modal for viewing stories with a list of users and a story viewer.
 * Supports navigation, likes, replies, and accessibility features.
 */
const StoriesModal: React.FC<StoriesDialogSectionProps> = ({
  stories,
  initialStoryId,
  currentUserId,
  onClose,
  token,
}) => {
  const { authData } = useAppStore();
  const [selectedStory, setSelectedStory] = useState<StoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [userStoryIds, setUserStoryIds] = useState<number[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const storyDuration = 15000; // 15s

  // Debounce reply text
  const debouncedReplyText = useDebounce(replyText, 300);
  const isOwner = selectedStory?.User.UserID === (authData?.userId || currentUserId);

  // Select a story
  const handleStorySelect = useCallback(
    (storyId: number) => {
      try {
        setLoading(true);
        const selected = stories
          .flatMap((user) => user.stories)
          .find((story) => story.storyId === storyId);
        if (selected) {
          const userIndex = stories.findIndex((user) =>
            user.stories.some((s) => s.storyId === storyId)
          );
          const user = stories[userIndex];
          setSelectedStory({
            StoryID: selected.storyId,
            MediaURL: selected.mediaUrl,
            CreatedAt: selected.createdAt,
            ExpiresAt: selected.expiresAt,
            User: {
              UserID: user.userId,
              Username: user.username,
              ProfilePicture: user.profilePicture || '/avatars/placeholder.jpg',
              IsPrivate: false,
            },
            _count: { StoryLikes: 0, StoryViews: 0 },
            hasLiked: false,
          });
          setActiveUserId(user.userId);
          setCurrentUserIndex(userIndex >= 0 ? userIndex : 0);
          setUserStoryIds(user.stories.map((s) => s.storyId));
          setCurrentStoryIndex(user.stories.findIndex((s) => s.storyId === storyId));
          setError(null);
        } else {
          setError('Story not found');
        }
      } catch (err: any) {
        setError('Failed to load story');
      } finally {
        setLoading(false);
      }
    },
    [stories]
  );

  // Handle story click from list
  const handleStoryClick = useCallback(
    (user: UserStory) => {
      const firstUnviewedStory = user.stories.find((story) => !story.isViewed);
      const storyToSelect = firstUnviewedStory || user.stories[0];
      if (storyToSelect) {
        handleStorySelect(storyToSelect.storyId);
      }
    },
    [handleStorySelect]
  );

  // Navigate to next story
  const handleNextStory = useCallback(() => {
    if (currentStoryIndex !== null && currentUserIndex !== null) {
      const currentUser = stories[currentUserIndex];
      if (currentStoryIndex + 1 < userStoryIds.length) {
        setCurrentStoryIndex(currentStoryIndex + 1);
        handleStorySelect(userStoryIds[currentStoryIndex + 1]);
      } else if (currentUserIndex + 1 < stories.length) {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
        const nextUser = stories[currentUserIndex + 1];
        setUserStoryIds(nextUser.stories.map((s) => s.storyId));
        if (nextUser.stories.length > 0) {
          handleStorySelect(nextUser.stories[0].storyId);
        }
      } else {
        setCurrentUserIndex(0);
        setCurrentStoryIndex(0);
        const firstUser = stories[0];
        setUserStoryIds(firstUser.stories.map((s) => s.storyId));
        if (firstUser.stories.length > 0) {
          handleStorySelect(firstUser.stories[0].storyId);
        }
      }
    }
  }, [currentStoryIndex, currentUserIndex, stories, userStoryIds, handleStorySelect]);

  // Navigate to previous story
  const handlePrevStory = useCallback(() => {
    if (currentStoryIndex !== null && currentUserIndex !== null) {
      if (currentStoryIndex > 0) {
        setCurrentStoryIndex(currentStoryIndex - 1);
        handleStorySelect(userStoryIds[currentStoryIndex - 1]);
      } else if (currentUserIndex > 0) {
        setCurrentUserIndex(currentUserIndex - 1);
        const prevUser = stories[currentUserIndex - 1];
        setUserStoryIds(prevUser.stories.map((s) => s.storyId));
        setCurrentStoryIndex(prevUser.stories.length - 1);
        if (prevUser.stories.length > 0) {
          handleStorySelect(prevUser.stories[prevUser.stories.length - 1].storyId);
        }
      }
    }
  }, [currentStoryIndex, currentUserIndex, stories, userStoryIds, handleStorySelect]);

  // Load initial story
  const loadInitialStory = useCallback(() => {
    try {
      setLoading(true);
      const initialStory = stories
        .flatMap((user) => user.stories)
        .find((story) => story.storyId === initialStoryId);
      if (initialStory) {
        const userIndex = stories.findIndex((user) =>
          user.stories.some((s) => s.storyId === initialStoryId)
        );
        const user = stories[userIndex];
        setSelectedStory({
          StoryID: initialStory.storyId,
          MediaURL: initialStory.mediaUrl,
          CreatedAt: initialStory.createdAt,
          ExpiresAt: initialStory.expiresAt,
          User: {
            UserID: user.userId,
            Username: user.username,
            ProfilePicture: user.profilePicture || '/avatars/placeholder.jpg',
            IsPrivate: false,
          },
          _count: { StoryLikes: 0, StoryViews: 0 },
          hasLiked: false,
        });
        setActiveUserId(user.userId);
        setCurrentUserIndex(userIndex >= 0 ? userIndex : 0);
        setUserStoryIds(user.stories.map((s) => s.storyId));
        setCurrentStoryIndex(user.stories.findIndex((s) => s.storyId === initialStoryId));
        setError(null);
      } else {
        setError('Story not found');
      }
    } catch (err: any) {
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  }, [initialStoryId, stories]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle like action
  const handleLike = useCallback(
    async (storyId: number) => {
      try {
        const result: ToggleStoryLikeResponse = await toggleStoryLike(storyId, token);
        setSelectedStory((prev) =>
          prev
            ? {
                ...prev,
                hasLiked: result.action === 'liked',
                _count: {
                  ...prev._count,
                  StoryLikes:
                    result.action === 'liked'
                      ? prev._count.StoryLikes + 1
                      : prev._count.StoryLikes - 1,
                },
              }
            : prev
        );
      } catch (err: any) {
        setError('Failed to toggle like');
      }
    },
    [token]
  );

  // Handle reply submission
  const handleReplySubmit = useCallback(() => {
    if (debouncedReplyText.trim()) {
      // TODO: Implement reply logic with API call
      setReplyText('');
    }
  }, [debouncedReplyText]);

  // Close dialog on outside click
  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Load initial story on mount
  useEffect(() => {
    loadInitialStory();
  }, [loadInitialStory]);

  // Handle story timer
  useEffect(() => {
    if (isPlaying && selectedStory && userStoryIds.length > 0) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + 100 / (storyDuration / 200);
        });
      }, 200);
    } else if (!isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedStory, userStoryIds, handleNextStory]);

  // Reset progress on story change
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
        if (e.key === 'Escape') {
          onClose();
        }
        if (e.key === 'ArrowRight') {
          handleNextStory();
        }
        if (e.key === 'ArrowLeft') {
          handlePrevStory();
        }
        if (e.key === ' ') {
          e.preventDefault();
          togglePlayPause();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [onClose, handleNextStory, handlePrevStory, togglePlayPause]);

  // Memoize progress bar items
  const progressBars = useMemo(
    () =>
      Array.from({ length: userStoryIds.length }, (_, i) => ({
        id: `${selectedStory?.StoryID || 'story'}-${i}`,
        isActive: i === currentStoryIndex,
        isCompleted: i < (currentStoryIndex || 0),
        isPending: i > (currentStoryIndex || 0),
      })),
    [selectedStory, userStoryIds, currentStoryIndex]
  );

  return (
    <div
      className="stories-modal__overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stories-modal-title"
      itemScope
      itemType="http://schema.org/CreativeWork"
      data-testid="stories-modal"
    >
      <div
        className="stories-modal__wrapper"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        <Transition
          show={true}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="stories-modal__panel">
            <div className="stories-modal__header">
              <h2 id="stories-modal-title" className="stories-modal__title">
                Stories
              </h2>
              <button
                className="stories-modal__close-button"
                onClick={onClose}
                aria-label="Close stories modal"
              >
                <span className="stories-modal__close-icon">✖</span>
              </button>
            </div>
            <div className="stories-modal__body">
              {/* Stories List */}
              <section
                className="stories-modal__list-container"
                itemScope
                itemType="http://schema.org/ItemList"
              >
                <h3 className="stories-modal__list-title">Stories</h3>
                <div className="stories-modal__list-items" role="list">
                  {stories.map((user) => (
                    <button
                      type="button"
                      key={`${user.userId}-${user.username}`}
                      className={`stories-modal__list-button--item ${
                        activeUserId === user.userId
                          ? 'stories-modal__list-button--item-active'
                          : ''
                      }`}
                      onClick={() => handleStoryClick(user)}
                      aria-label={`View stories by ${user.username}`}
                      aria-current={activeUserId === user.userId ? 'true' : undefined}
                      role="listitem"
                      itemProp="itemListElement"
                    >
                      <Avatar
                        imageSrc={user.profilePicture || '/avatars/placeholder.jpg'}
                        username={user.username}
                        size="medium"
                        showUsername={false}
                        className={user.hasUnviewedStories ? 'stories-modal__avatar--active' : ''}
                        aria-hidden="true"
                        width={48}
                        height={48}
                        loading="lazy"
                      />
                      <div className="stories-modal__list-details">
                        <Link
                          href={`/profile/${user.username}`}
                          className="stories-modal__list-username"
                          prefetch={false}
                          itemProp="name"
                        >
                          {user.username}
                        </Link>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              {/* Story Viewer */}
              <div className="stories-modal__viewer">
                {error && (
                  <div className="stories-modal__error" aria-live="polite">
                    {error}
                  </div>
                )}
                {loading ? (
                  <div className="stories-modal__loading" aria-live="polite">
                    Loading...
                  </div>
                ) : selectedStory ? (
                  <article
                    className="stories-modal__viewer-wrapper"
                    role="region"
                    aria-labelledby="story-viewer-title"
                    itemScope
                    itemType="http://schema.org/CreativeWork"
                  >
                    <h3 id="story-viewer-title" className="sr-only">
                      Story by {selectedStory.User.Username}
                    </h3>
                    <div className="stories-modal__viewer-container">
                      <div className="stories-modal__viewer-progress">
                        <div
                          className="stories-modal__viewer-progress-bar"
                          role="progressbar"
                          aria-valuenow={(currentStoryIndex || 0) + 1}
                          aria-valuemin={1}
                          aria-valuemax={userStoryIds.length}
                        >
                          {progressBars.map((bar, i) => (
                            <div
                              key={bar.id}
                              className="stories-modal__viewer-progress-bar--item"
                            >
                              <div
                                ref={bar.isActive ? progressRef : null}
                                className={`stories-modal__viewer-progress-bar--fill ${
                                  bar.isActive
                                    ? 'stories-modal__viewer-progress-bar--fill-active'
                                    : bar.isCompleted
                                    ? 'stories-modal__viewer-progress-bar--fill-completed'
                                    : 'stories-modal__viewer-progress-bar--fill-pending'
                                }`}
                                style={{
                                  animationDuration: bar.isActive ? `${storyDuration}ms` : undefined,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="stories-modal__viewer-button--play-pause"
                          onClick={togglePlayPause}
                          aria-label={isPlaying ? 'Pause story' : 'Play story'}
                        >
                          <img
                            src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'}
                            alt=""
                            className="stories-modal__viewer-icon--play-pause"
                            aria-hidden="true"
                            width={16}
                            height={16}
                            loading="lazy"
                          />
                        </button>
                      </div>
                      <div className="stories-modal__viewer-image-wrapper">
                        <img
                          src={selectedStory.MediaURL}
                          alt={`Story by ${selectedStory.User.Username} at ${new Date(
                            selectedStory.CreatedAt
                          ).toLocaleString()}`}
                          className="stories-modal__viewer-image"
                          width={460}
                          height={818}
                          loading="lazy"
                          itemProp="image"
                        />
                        <button
                          type="button"
                          className="stories-modal__viewer-button--prev"
                          onClick={handlePrevStory}
                          aria-label="Go to previous story"
                          disabled={currentStoryIndex === 0}
                        >
                          <img
                            src="/icons/prev.svg"
                            alt=""
                            className="stories-modal__viewer-icon--nav"
                            aria-hidden="true"
                            width={24}
                            height={24}
                            loading="lazy"
                          />
                        </button>
                        <button
                          type="button"
                          className="stories-modal__viewer-button--next"
                          onClick={handleNextStory}
                          aria-label="Go to next story"
                          disabled={currentStoryIndex === userStoryIds.length - 1}
                        >
                          <img
                            src="/icons/next.svg"
                            alt=""
                            className="stories-modal__viewer-icon--nav"
                            aria-hidden="true"
                            width={24}
                            height={24}
                            loading="lazy"
                          />
                        </button>
                      </div>
                      <Link
                        href={`/profile/${selectedStory.User.Username}`}
                        prefetch={false}
                        itemProp="creator"
                      >
                        <div className="stories-modal__viewer-header">
                          <Avatar
                            imageSrc={
                              selectedStory.User.ProfilePicture || '/avatars/placeholder.png'
                            }
                            username={selectedStory.User.Username}
                            size="small"
                            showUsername={false}
                            aria-hidden="true"
                            width={32}
                            height={32}
                            loading="lazy"
                          />
                          <p className="stories-modal__viewer-username">
                            {selectedStory.User.Username}
                          </p>
                        </div>
                      </Link>
                      <div className="stories-modal__viewer-actions">
                        {isOwner ? (
                          <div className="stories-modal__viewer-stats">
                            <span itemProp="interactionCount">
                              <AiOutlineEye
                                className="stories-modal__viewer-icon"
                                aria-label={`${selectedStory._count.StoryViews} views`}
                              />
                              {selectedStory._count.StoryViews}
                            </span>
                            <span itemProp="interactionCount">
                              <img
                                src="/icons/liked.svg"
                                alt=""
                                className="stories-modal__viewer-icon"
                                aria-hidden="true"
                                width={24}
                                height={24}
                                loading="lazy"
                              />
                              {selectedStory._count.StoryLikes}
                            </span>
                          </div>
                        ) : (
                          <div className="stories-modal__viewer-interactions">
                            <button
                              type="button"
                              onClick={() => handleLike(selectedStory.StoryID)}
                              className="stories-modal__viewer-button--like"
                              aria-label={
                                selectedStory.hasLiked ? 'Unlike story' : 'Like story'
                              }
                            >
                              <img
                                src={
                                  selectedStory.hasLiked
                                    ? '/icons/liked.svg'
                                    : '/icons/white-like.svg'
                                }
                                alt=""
                                className="stories-modal__viewer-icon"
                                aria-hidden="true"
                                width={24}
                                height={24}
                                loading="lazy"
                              />
                            </button>
                            <div className="stories-modal__viewer-reply">
                              <label
                                htmlFor={`reply-input-${selectedStory.StoryID}`}
                                className="sr-only"
                              >
                                Reply to story
                              </label>
                              <input
                                id={`reply-input-${selectedStory.StoryID}`}
                                type="text"
                                placeholder="Type a Message"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="stories-modal__viewer-input--reply"
                                aria-label="Reply to story"
                              />
                              <button
                                type="button"
                                onClick={handleReplySubmit}
                                className="stories-modal__viewer-button--reply"
                                aria-label="Send reply"
                                disabled={!debouncedReplyText.trim()}
                              >
                                <img
                                  src="/icons/reply.svg"
                                  alt=""
                                  className="stories-modal__viewer-icon"
                                  aria-hidden="true"
                                  width={24}
                                  height={24}
                                  loading="lazy"
                                />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ) : (
                  <div className="stories-modal__loading" aria-live="polite">
                    Select a story to view
                  </div>
                )}
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

// Custom hook for debouncing input
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default memo(StoriesModal);
