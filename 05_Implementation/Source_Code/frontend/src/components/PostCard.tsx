import React, { useState } from 'react';
import Avatar from '../components/Avatar';

/*
 * PostCard Component
 * Displays a social media post with media, likes, comments, and interaction options.
 * Used in feeds to showcase user-generated content with nested comments and replies.
 */
interface Comment {
  username: string; // Commenter's username
  content: string; // Comment text
  createdAt: string; // Timestamp of when the comment was created
  profilePicture?: string; // URL of the commenter's profile picture
  isLiked: boolean; // Whether the comment is liked by the user
  likeCount: number; // Number of likes on the comment
  replies?: Comment[]; // Nested replies to the comment
}

interface PostCardProps {
  postId: number; // Unique ID of the post
  userId: number; // ID of the user who created the post
  username: string; // Username of the post creator
  profilePicture: string; // URL of the post creator's profile picture
  privacy: string; // Privacy setting of the post (e.g., PUBLIC)
  content: string; // Text content of the post
  imageUrl?: string | null; // URL of the post image (optional)
  videoUrl?: string | null; // URL of the post video (optional)
  createdAt: string; // Timestamp of when the post was created
  likeCount: number; // Number of likes on the post
  commentCount: number; // Number of comments on the post
  isLiked: boolean; // Whether the post is liked by the user
  likedBy: { username: string; profilePicture: string }[]; // List of users who liked the post
  comments?: Comment[]; // List of comments on the post
}

const PostCard: React.FC<PostCardProps> = ({
  postId = 26,
  userId = 42,
  username = 'mahmoud10',
  profilePicture = 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746179840/profile_pictures/user_2_profile.jpg',
  privacy = 'PUBLIC',
  content = 'اللهم صل وسلم على سيدنا محمد',
  imageUrl = null,
  videoUrl = 'https://res.cloudinary.com/duw4x8iqq/video/upload/v1746362228/posts/a7xpedjjrgwxbidadojd.mp4',
  createdAt = '2025-05-04T12:37:09.195Z',
  likeCount = 1,
  commentCount = 3,
  isLiked = true,
  likedBy = [
    {
      username: 'mahmoud',
      profilePicture: 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746179840/profile_pictures/user_2_profile.jpg',
    },
  ],
  comments = [
    {
      username: 'mahmoud',
      content: 'Hello',
      createdAt: '2025-05-04T12:38:32.673Z',
      profilePicture: 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746179840/profile_pictures/user_2_profile.jpg',
      isLiked: false,
      likeCount: 0,
      replies: [
        {
          username: 'mahmoud10',
          content: 'string',
          createdAt: '2025-05-04T12:38:54.086Z',
          profilePicture: 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746179840/profile_pictures/user_2_profile.jpg',
          isLiked: false,
          likeCount: 0,
        },
        {
          username: 'mahmoud10',
          content: 'string',
          createdAt: '2025-05-04T12:39:03.754Z',
          profilePicture: 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746179840/profile_pictures/user_2_profile.jpg',
          isLiked: false,
          likeCount: 0,
        },
      ],
    },
  ],
}) => {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: { isLiked: boolean; likeCount: number } }>(
    comments.reduce((acc, _, index) => {
      acc[`comment-${index}`] = { isLiked: comments[index].isLiked, likeCount: comments[index].likeCount };
      comments[index].replies?.forEach((_, replyIndex) => {
        acc[`reply-${index}-${replyIndex}`] = {
          isLiked: comments[index].replies![replyIndex].isLiked,
          likeCount: comments[index].replies![replyIndex].likeCount,
        };
      });
      return acc;
    }, {} as { [key: string]: { isLiked: boolean; likeCount: number } })
  );

  // Toggle like state for the post
  const handleLikeToggle = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  // Toggle like state for a comment or reply
  const handleCommentLikeToggle = (key: string) => {
    setCommentLikes((prev) => ({
      ...prev,
      [key]: {
        isLiked: !prev[key].isLiked,
        likeCount: prev[key].isLiked ? prev[key].likeCount - 1 : prev[key].likeCount + 1,
      },
    }));
  };

  // Toggle comments visibility
  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  // Toggle video play/pause on click
  const handleVideoToggle = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch((error) => console.error('Video playback failed:', error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Format the time since the post was created
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Format counts (e.g., 2000 -> 2.0K)
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <article className="post-card" data-testid="post-card">
      <div className="post-card__header">
        <Avatar
          imageSrc={profilePicture}
          username={username}
          size="small"
          showUsername={false}
        />
        <div className="post-card__header-info">
          <span className="post-card__username">@{username}</span>
          <div className="post-card__meta">
            <span className="post-card__privacy">{privacy.substring(0, 1)}{privacy.slice(1).toLocaleLowerCase()}</span>
            <span className="post-card__time">{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
        <div className="post-card__actions">
          <button className="post-card__action-button" aria-label="More options for post">
            <span className="post-card__dots">⋯</span>
          </button>
        </div>
      </div>
      <div className="post-card__content">
        <p className="post-card__caption">{content}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Post image"
            className="post-card__media"
            loading="lazy"
          />
        )}
        {videoUrl && (
          <div
            className="post-card__video-wrapper"
            onClick={handleVideoToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <video
              src={videoUrl}
              className="post-card__video"
              controls={false}
            />
            {!isPlaying && (
              <div
                className={`post-card__video-control ${isHovered ? 'visible' : ''}`}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                <img
                  src="/icons/play.svg"
                  alt={isPlaying ? 'Pause' : 'Play'}
                  className="post-card__video-control-icon"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="post-card__actions-bar">
        <button
          className="post-card__action like"
          onClick={handleLikeToggle}
          aria-label={liked ? 'Unlike post' : 'Like post'}
        >
          <img
            src={liked ? '/icons/liked.svg' : '/icons/like.svg'}
            alt={liked ? 'Unlike' : 'Like'}
            className="post-card__action-icon"
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(likes)}</span>
        </button>
        <button
          className="post-card__action comment"
          onClick={handleToggleComments}
          aria-label="View comments"
        >
          <img
            src="/icons/comment.svg"
            alt="Comment"
            className="post-card__action-icon"
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(commentCount)}</span>
        </button>
        <button className="post-card__action share" aria-label="Share post">
          <img
            src="/icons/share.svg"
            alt="Share"
            className="post-card__action-icon"
            loading="lazy"
          />
        </button>
      </div>
      {likedBy.length > 0 && (
        <div className="post-card__likes">
          <div className="post-card__likes-avatars">
            {likedBy.slice(0, 3).map((user, index) => (
              <img
                key={index}
                src={user.profilePicture}
                alt={`${user.username}'s avatar`}
                className="post-card__likes-avatar"
                style={{ zIndex: 3 - index, marginLeft: index > 0 ? '-10px' : '0' }}
                loading="lazy"
              />
            ))}
          </div>
          <span className="post-card__likes-text">
            Liked by {likedBy[0].username} and {likes - 1} others
          </span>
        </div>
      )}
      {showComments && (
        <div className="post-card__comments">
          <div className="post-card__comments-list">
            {comments.map((comment, index) => (
              <div key={index} className="post-card__comment">
                <Avatar
                  imageSrc={comment.profilePicture || '/avatars/placeholder.jpg'}
                  username={comment.username}
                  size="small"
                  showUsername={false}
                />
                <div className="post-card__comment-content">
                  <span className="post-card__comment-username">{comment.username}</span>
                  <p className="post-card__comment-text">{comment.content}</p>
                  <div className="post-card__comment-actions">
                    <button
                      className="post-card__comment-action like"
                      onClick={() => handleCommentLikeToggle(`comment-${index}`)}
                      aria-label={commentLikes[`comment-${index}`].isLiked ? 'Unlike comment' : 'Like comment'}
                    >
                      {commentLikes[`comment-${index}`].isLiked ? 'Unlike' : 'Like'}
                      {commentLikes[`comment-${index}`].likeCount > 0 && (
                        <span> ({formatCount(commentLikes[`comment-${index}`].likeCount)})</span>
                      )}
                    </button>
                    <button className="post-card__comment-action reply" aria-label="Reply to comment">
                      Reply
                    </button>
                    <span className="post-card__comment-time">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="post-card__replies">
                      {comment.replies.map((reply, replyIndex) => (
                        <div key={replyIndex} className="post-card__reply">
                          <Avatar
                            imageSrc={reply.profilePicture || '/avatars/placeholder.jpg'}
                            username={reply.username}
                            size="small"
                            showUsername={false}
                          />
                          <div className="post-card__reply-content">
                            <span className="post-card__reply-username">{reply.username}</span>
                            <p className="post-card__reply-text">{reply.content}</p>
                            <div className="post-card__reply-actions">
                              <button
                                className="post-card__reply-action like"
                                onClick={() => handleCommentLikeToggle(`reply-${index}-${replyIndex}`)}
                                aria-label={commentLikes[`reply-${index}-${replyIndex}`].isLiked ? 'Unlike reply' : 'Like reply'}
                              >
                                {commentLikes[`reply-${index}-${replyIndex}`].isLiked ? 'Unlike' : 'Like'}
                                {commentLikes[`reply-${index}-${replyIndex}`].likeCount > 0 && (
                                  <span> ({formatCount(commentLikes[`reply-${index}-${replyIndex}`].likeCount)})</span>
                                )}
                              </button>
                              <span className="post-card__reply-time">{formatTimeAgo(reply.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="post-card__comment-input">
            <input
              type="text"
              placeholder="Post a comment..."
              className="post-card__comment-input-field"
              aria-label="Write a comment"
            />
            <button className="post-card__comment-submit" aria-label="Submit comment">
              Post
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;