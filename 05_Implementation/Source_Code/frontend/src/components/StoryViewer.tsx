import React, { useState } from 'react';
import Avatar from '../components/Avatar';
import { AiOutlineEye } from 'react-icons/ai';

/*
 * StoryViewer Component
 * Displays a single story with interaction options like liking and replying.
 * Used in a modal or full-screen view to show a user's story with metadata.
 */
interface StoryDetails {
  StoryID: number; // Unique ID of the story
  MediaURL: string; // URL of the story media
  CreatedAt: string; // Timestamp of when the story was created
  ExpiresAt: string; // Timestamp of when the story expires
  User: {
    UserID: number; // ID of the user who created the story
    Username: string; // Username of the story creator
    ProfilePicture: string; // URL of the creator's profile picture
    IsPrivate: boolean; // Whether the user's profile is private
  };
  _count: {
    StoryLikes: number; // Number of likes on the story
    StoryViews: number; // Number of views on the story
  };
  hasLiked: boolean; // Whether the current user has liked the story
}

interface StoryViewerProps {
  story: StoryDetails; // The story to display
  currentUserId: number; // ID of the current user viewing the story
  onLike: (storyId: number) => void; // Callback for liking the story
  onReply: (storyId: number, reply: string) => void; // Callback for replying to the story
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, currentUserId, onLike, onReply }) => {
  const [replyText, setReplyText] = useState('');
  const [hasLiked, setHasLiked] = useState(story.hasLiked);

  const isOwner = story.User.UserID === currentUserId;

  // Handle liking the story
  const handleLike = () => {
    onLike(story.StoryID);
    setHasLiked(!hasLiked);
  };

  // Handle submitting a reply to the story
  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(story.StoryID, replyText);
      setReplyText('');
    }
  };

  return (
    <div className="story-viewer-container" data-testid="story-viewer">
      <div className="story-viewer-header">
        <Avatar
          imageSrc={story.User.ProfilePicture}
          username={story.User.Username}
          size="small"
          showUsername={false}
        />
        <p className="story-viewer-username">{story.User.Username}</p>
      </div>
      <img
        src={story.MediaURL}
        alt={`Story by ${story.User.Username}`}
        className="story-viewer-image"
        loading="lazy" // Lazy-load image for performance
      />
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
              onClick={handleLike}
              className="story-viewer-like-btn"
              aria-label={hasLiked ? 'Unlike story' : 'Like story'}
            >
              <img
                src={hasLiked ? '/icons/liked.svg' : '/icons/white-like.svg'}
                alt={hasLiked ? 'Unlike' : 'Like'}
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
                disabled={!replyText.trim()} // Disable button if reply is empty
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
  );
};

export default StoryViewer;