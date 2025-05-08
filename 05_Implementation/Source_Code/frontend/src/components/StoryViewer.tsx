import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../components/Avatar';
import { AiOutlineEye } from 'react-icons/ai';
import { toggleStoryLike } from '../utils/api';
import Link from 'next/link';

interface StoryDetails {
  StoryID: number;
  MediaURL: string;
  CreatedAt: string;
  ExpiresAt: string;
  User: {
    UserID: number;
    Username: string;
    ProfilePicture: string;
    IsPrivate: boolean;
  };
  _count: {
    StoryLikes: number;
    StoryViews: number;
  };
  hasLiked: boolean;
}

interface StoryViewerProps {
  story: StoryDetails;
  currentUserId: number;
  onLike: (storyId: number) => void;
  onReply: (storyId: number, reply: string) => void;
  token: string;
  onPrev: () => void;
  onNext: () => void;
  totalStories: number;
  currentStoryIndex: number;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  currentUserId,
  onLike,
  onReply,
  token,
  onPrev,
  onNext,
  totalStories,
  currentStoryIndex,
  isPlaying,
  onTogglePlayPause,
}) => {
  const [replyText, setReplyText] = useState('');
  const isOwner = story.User.UserID === currentUserId;
  const progressRef = useRef<HTMLDivElement>(null);

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(story.StoryID, replyText);
      setReplyText('');
    }
  };

  return (
    <div className="story-viewer-wrapper">
      <div className="story-viewer-container">
        <div className="story-viewer-progress">
          <div className="progress-bar">
            {Array.from({ length: totalStories }, (_, i) => (
              <div
                key={`${story.StoryID}-${i}`}
                className="progress-bar__item"
              >
                <div
                  ref={i === currentStoryIndex ? progressRef : null}
                  className={`progress-bar__fill ${i === currentStoryIndex ? 'progress-bar__fill--active' : ''}`}
                  style={{
                    width: i < currentStoryIndex ? '100%' : i > currentStoryIndex ? '0%' : undefined,
                    backgroundColor: i <= currentStoryIndex ? 'white' : 'gray',
                    animationPlayState: i === currentStoryIndex ? (isPlaying ? 'running' : 'paused') : undefined,
                  }}
                />
              </div>
            ))}
          </div>
          <button className="play-pause-button" onClick={onTogglePlayPause}>
            <img
              src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'}
              alt={isPlaying ? 'Pause' : 'Play'}
              className="story-play-pause-icon"
            />
          </button>
        </div>
        <div className="story-viewer-image-wrapper">
          <img
            src={story.MediaURL}
            alt={`Story by ${story.User.Username}`}
            className="story-viewer-image"
            style={{ filter: 'brightness(0.8)' }}
          />
          <button
            className="story-nav-btn nav-button--prev"
            onClick={onPrev}
          >
            <img src="/icons/prev.svg" alt="Previous" className="story-nav-icon" />
          </button>
          <button
            className="story-nav-btn nav-button--next"
            onClick={onNext}
          >
            <img src="/icons/next.svg" alt="Next" className="story-nav-icon" />
          </button>
        </div>
        <Link href={`/profile/${story.User.Username}`}>
            <div className="story-viewer-header">
            <Avatar
              imageSrc={story.User.ProfilePicture || 'avatars/placeholder.png'}
              username={story.User.Username}
              size="small"
              showUsername={false}
            />
            <p className="story-viewer-username">{story.User.Username}</p>
        </div>
        </Link>
        <div className="story-viewer-actions">
          {isOwner ? (
            <div className="story-viewer-stats">
              <span>
                <AiOutlineEye className="story-viewer-icon" aria-hidden="true" />
                {story._count.StoryViews}
              </span>
              <span>
                <img
                  src="/icons/liked.svg"
                  alt="Likes"
                  className="story-viewer-icon"
                  loading="lazy"
                  aria-hidden="true"
                />
                {story._count.StoryLikes}
              </span>
            </div>
          ) : (
            <div className="story-viewer-interactions">
              <button
                onClick={() => onLike(story.StoryID)}
                className="story-viewer-like-btn"
                aria-label={story.hasLiked ? 'Unlike story' : 'Like story'}
              >
                <img
                  src={story.hasLiked ? '/icons/liked.svg' : '/icons/white-like.svg'}
                  alt={story.hasLiked ? 'Unlike' : 'Like'}
                  className="story-viewer-icon"
                  loading="lazy"
                />
              </button>
              <div className="story-viewer-reply">
                <input
                  type="text"
                  placeholder="Type a Message"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="story-viewer-reply-input"
                  aria-label="Reply to story"
                />
                <button
                  onClick={handleReplySubmit}
                  className="story-viewer-reply-btn"
                  aria-label="Send reply"
                  disabled={!replyText.trim()}
                >
                  <img
                    src="/icons/reply.svg"
                    alt="Reply"
                    className="story-viewer-icon"
                    loading="lazy"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;