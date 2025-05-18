'use client';
import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Avatar from './Avatar';
import { AiOutlineEye } from 'react-icons/ai';
import Link from 'next/link';
import { StoryViewerProps } from '@/types';

/**
 * StoryViewer Component
 * Displays a story with a progress bar, navigation, and like/reply actions.
 * Supports keyboard navigation and dynamic progress animation.
 */
const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  currentUserId,
  onLike,
  onReply,
  onPrev,
  onNext,
  totalStories,
  currentStoryIndex,
  isPlaying,
  onTogglePlayPause,
  duration = 15000, // Default 15s
}) => {
  const [replyText, setReplyText] = useState('');
  const debouncedReplyText = useDebounce(replyText, 300);
  const isOwner = story.User.UserID === currentUserId;
  const progressRef = useRef<HTMLDivElement>(null);

  // Handle reply submission
  const handleReplySubmit = useCallback(() => {
    if (debouncedReplyText.trim()) {
      onReply(story.StoryID, debouncedReplyText);
      setReplyText('');
    }
  }, [debouncedReplyText, onReply, story.StoryID]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlayPause();
      }
    },
    [onPrev, onNext, onTogglePlayPause]
  );

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Memoize progress bar items
  const progressBars = useMemo(
    () =>
      Array.from({ length: totalStories }, (_, i) => ({
        id: `${story.StoryID}-${i}`,
        isActive: i === currentStoryIndex,
        isCompleted: i < currentStoryIndex,
        isPending: i > currentStoryIndex,
      })),
    [story.StoryID, totalStories, currentStoryIndex]
  );

  return (
    <article
      className="story-viewer__wrapper"
      role="region"
      aria-labelledby="story-viewer-title"
      aria-modal="false"
      itemscope
      itemtype="http://schema.org/CreativeWork"
    >
      <h2 id="story-viewer-title" className="sr-only">
        Story by {story.User.Username}
      </h2>
      <div className="story-viewer__container">
        <div className="story-viewer__progress">
          <div className="story-viewer__progress-bar" role="progressbar" aria-valuenow={currentStoryIndex + 1} aria-valuemin={1} aria-valuemax={totalStories}>
            {progressBars.map((bar, i) => (
              <div key={bar.id} className="story-viewer__progress-bar--item">
                <div
                  ref={bar.isActive ? progressRef : null}
                  className={`story-viewer__progress-bar--fill ${
                    bar.isActive
                      ? 'story-viewer__progress-bar--fill-active'
                      : bar.isCompleted
                      ? 'story-viewer__progress-bar--fill-completed'
                      : 'story-viewer__progress-bar--fill-pending'
                  }`}
                  style={{ animationDuration: bar.isActive ? `${duration}ms` : undefined }}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="story-viewer__button--play-pause"
            onClick={onTogglePlayPause}
            aria-label={isPlaying ? 'Pause story' : 'Play story'}
          >
            <img
              src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'}
              alt=""
              className="story-viewer__icon--play-pause"
              aria-hidden="true"
              width={16}
              height={16}
              loading="lazy"
            />
          </button>
        </div>
        <div className="story-viewer__image-wrapper">
          <img
            src={story.MediaURL}
            alt={`Story by ${story.User.Username} at ${new Date(story.CreatedAt).toLocaleString()}`}
            className="story-viewer__image"
            width={460}
            height={818}
            loading="lazy"
            itemProp="image"
          />
          <button
            type="button"
            className="story-viewer__button--prev"
            onClick={onPrev}
            aria-label="Go to previous story"
            disabled={currentStoryIndex === 0}
          >
            <img
              src="/icons/prev.svg"
              alt=""
              className="story-viewer__icon--nav"
              aria-hidden="true"
              width={24}
              height={24}
              loading="lazy"
            />
          </button>
          <button
            type="button"
            className="story-viewer__button--next"
            onClick={onNext}
            aria-label="Go to next story"
            disabled={currentStoryIndex === totalStories - 1}
          >
            <img
              src="/icons/next.svg"
              alt=""
              className="story-viewer__icon--nav"
              aria-hidden="true"
              width={24}
              height={24}
              loading="lazy"
            />
          </button>
        </div>
        <Link href={`/profile/${story.User.Username}`} prefetch={false} itemProp="creator">
          <div className="story-viewer__header">
            <Avatar
              imageSrc={story.User.ProfilePicture || '/avatars/placeholder.png'}
              username={story.User.Username}
              size="small"
              showUsername={false}
              aria-hidden="true"
              width={32}
              height={32}
              loading="lazy"
            />
            <p className="story-viewer__username">{story.User.Username}</p>
          </div>
        </Link>
        <div className="story-viewer__actions">
          {isOwner ? (
            <div className="story-viewer__stats">
              <span itemProp="interactionCount">
                <AiOutlineEye
                  className="story-viewer__icon"
                  aria-label={`${story._count.StoryViews} views`}
                />
                {story._count.StoryViews}
              </span>
              <span itemProp="interactionCount">
                <img
                  src="/icons/liked.svg"
                  alt=""
                  className="story-viewer__icon"
                  aria-hidden="true"
                  width={24}
                  height={24}
                  loading="lazy"
                />
                {story._count.StoryLikes}
              </span>
            </div>
          ) : (
            <div className="story-viewer__interactions">
              <button
                type="button"
                onClick={() => onLike(story.StoryID)}
                className="story-viewer__button--like"
                aria-label={story.hasLiked ? 'Unlike story' : 'Like story'}
              >
                <img
                  src={story.hasLiked ? '/icons/liked.svg' : '/icons/white-like.svg'}
                  alt=""
                  className="story-viewer__icon"
                  aria-hidden="true"
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </button>
              <div className="story-viewer__reply">
                <label htmlFor={`reply-input-${story.StoryID}`} className="sr-only">
                  Reply to story
                </label>
                <input
                  id={`reply-input-${story.StoryID}`}
                  type="text"
                  placeholder="Type a Message"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="story-viewer__input--reply"
                  aria-label="Reply to story"
                />
                <button
                  type="button"
                  onClick={handleReplySubmit}
                  className="story-viewer__button--reply"
                  aria-label="Send reply"
                  disabled={!debouncedReplyText.trim()}
                >
                  <img
                    src="/icons/reply.svg"
                    alt=""
                    className="story-viewer__icon"
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
  );
};

// Custom hook for debouncing input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default memo(StoryViewer);