'use client';
import React, { useState } from 'react';
import Avatar from '../components/Avatar';
import api from '@/utils/api';
import { useAppStore } from '@/store/feedStore';
import { v4 as uuidv4 } from 'uuid';

/*
 * PostCard Component
 * Displays a social media post with media, likes, comments, and interaction options.
 * Used in feeds to showcase user-generated content with nested comments and replies.
 */
interface Comment {
  commentId: number | string; // Allow string for temporary IDs
  username: string;
  content: string;
  createdAt: string;
  profilePicture?: string;
  isLiked: boolean;
  likeCount: number;
  replies?: Comment[];
  isPending?: boolean; // Track pending comments
}

interface PostCardProps {
  postId: number;
  userId: number;
  username: string;
  profilePicture: string;
  privacy: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  likedBy: { username: string; profilePicture: string }[];
  comments: Comment[];
  onPostUpdate: (postId: number, updatedFields: Partial<PostCardProps>) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  postId,
  userId,
  username,
  profilePicture,
  privacy,
  content,
  imageUrl,
  videoUrl,
  createdAt,
  likeCount: initialLikeCount,
  commentCount: initialCommentCount,
  isLiked: initialIsLiked,
  likedBy: initialLikedBy,
  comments: initialComments,
  onPostUpdate,
}) => {
  const { currentUser } = useAppStore(); // Assume useAppStore provides currentUser with username and profilePicture
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked);
  const [localLikeCount, setLocalLikeCount] = useState(initialLikeCount);
  const [localLikedBy, setLocalLikedBy] = useState(initialLikedBy);
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments);
  const [localCommentCount, setLocalCommentCount] = useState(initialCommentCount);
  const [commentLikes, setCommentLikes] = useState<{ [key: string]: { isLiked: boolean; likeCount: number } }>(
    initialComments.reduce((acc, comment) => {
      acc[`comment-${comment.commentId}`] = { isLiked: comment.isLiked, likeCount: comment.likeCount };
      comment.replies?.forEach((reply) => {
        acc[`reply-${comment.commentId}-${reply.commentId}`] = {
          isLiked: reply.isLiked,
          likeCount: reply.likeCount,
        };
      });
      return acc;
    }, {} as { [key: string]: { isLiked: boolean; likeCount: number } })
  );

  // Toggle like state for the post (Optimistic Update)
  const handleLikeToggle = async () => {
    const previousIsLiked = localIsLiked;
    const previousLikeCount = localLikeCount;
    const previousLikedBy = localLikedBy;

    // Optimistically update the UI
    const newIsLiked = !localIsLiked;
    const newLikeCount = newIsLiked ? localLikeCount + 1 : localLikeCount - 1;
    const currentUserData = {
      username: currentUser?.username || 'you',
      profilePicture: currentUser?.profilePicture || '/avatars/placeholder.jpg',
    };
    const newLikedBy = newIsLiked
      ? [...localLikedBy, currentUserData]
      : localLikedBy.filter((user) => user.username !== currentUserData.username);

    setLocalIsLiked(newIsLiked);
    setLocalLikeCount(newLikeCount);
    setLocalLikedBy(newLikedBy);
    onPostUpdate(postId, {
      isLiked: newIsLiked,
      likeCount: newLikeCount,
      likedBy: newLikedBy,
    });

    try {
      const response = await api.post(`/posts/${postId}/like`);
      const action = response.data.action;
      if (action !== (newIsLiked ? 'liked' : 'unliked')) {
        throw new Error('Server response does not match optimistic update');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert optimistic update
      setLocalIsLiked(previousIsLiked);
      setLocalLikeCount(previousLikeCount);
      setLocalLikedBy(previousLikedBy);
      onPostUpdate(postId, {
        isLiked: previousIsLiked,
        likeCount: previousLikeCount,
        likedBy: previousLikedBy,
      });
    }
  };

  // Toggle like state for a comment or reply
  const handleCommentLikeToggle = async (key: string, commentId: number, isReply: boolean) => {
    const previousState = commentLikes[key];
    const newIsLiked = !previousState.isLiked;
    const newLikeCount = newIsLiked ? previousState.likeCount + 1 : previousState.likeCount - 1;

    // Optimistically update comment like
    setCommentLikes((prev) => ({
      ...prev,
      [key]: { isLiked: newIsLiked, likeCount: newLikeCount },
    }));

    const updateComments = (commentsToUpdate: Comment[]): Comment[] =>
      commentsToUpdate.map((comment) =>
        comment.commentId === commentId
          ? { ...comment, isLiked: newIsLiked, likeCount: newLikeCount }
          : {
              ...comment,
              replies: comment.replies && isReply ? updateComments(comment.replies) : comment.replies,
            }
      );

    const newComments = updateComments(localComments);
    setLocalComments(newComments);
    onPostUpdate(postId, { comments: newComments });

    try {
      const response = await api.post(`/posts/comments/${commentId}/like`);
      const action = response.data.action;
      if (action !== (newIsLiked ? 'liked' : 'unliked')) {
        throw new Error('Server response does not match optimistic update');
      }
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      // Revert optimistic update
      setCommentLikes((prev) => ({
        ...prev,
        [key]: previousState,
      }));
      const revertComments = updateComments(localComments.map((c) =>
        c.commentId === commentId
          ? { ...c, isLiked: previousState.isLiked, likeCount: previousState.likeCount }
          : c
      ));
      setLocalComments(revertComments);
      onPostUpdate(postId, { comments: revertComments });
    }
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

  // Handle comment submission (Optimistic Update)
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    const tempCommentId = `temp-${uuidv4()}`;
    const commentContent = newComment;
    const currentUserData = {
      username: currentUser?.username || 'you',
      profilePicture: currentUser?.profilePicture || '/avatars/placeholder.jpg',
    };

    // Optimistically add comment
    const newCommentObj: Comment = {
      commentId: tempCommentId,
      username: currentUserData.username,
      content: commentContent,
      createdAt: new Date().toISOString(),
      profilePicture: currentUserData.profilePicture,
      isLiked: false,
      likeCount: 0,
      replies: [],
      isPending: true,
    };

    setLocalComments([...localComments, newCommentObj]);
    setLocalCommentCount(localCommentCount + 1);
    setCommentLikes((prev) => ({
      ...prev,
      [`comment-${tempCommentId}`]: { isLiked: false, likeCount: 0 },
    }));
    onPostUpdate(postId, {
      comments: [...localComments, newCommentObj],
      commentCount: localCommentCount + 1,
    });
    setNewComment('');

    try {
      const response = await api.post(`/posts/${postId}/comment`, { content: commentContent });
      const newCommentData = response.data;

      // Replace temporary comment with server response
      const updatedComment: Comment = {
        commentId: newCommentData.CommentID,
        username: newCommentData.User.Username,
        content: newCommentData.Content,
        createdAt: newCommentData.CreatedAt,
        profilePicture: newCommentData.User.ProfilePicture,
        isLiked: false,
        likeCount: 0,
        replies: [],
        isPending: false,
      };

      setLocalComments((prev) =>
        prev.map((c) => (c.commentId === tempCommentId ? updatedComment : c))
      );
      setCommentLikes((prev) => {
        const newLikes = { ...prev, [`comment-${newCommentData.CommentID}`]: { isLiked: false, likeCount: 0 } };
        delete newLikes[`comment-${tempCommentId}`];
        return newLikes;
      });
      onPostUpdate(postId, {
        comments: localComments.map((c) => (c.commentId === tempCommentId ? updatedComment : c)),
        commentCount: localCommentCount + 1,
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Remove optimistic comment
      setLocalComments((prev) => prev.filter((c) => c.commentId !== tempCommentId));
      setLocalCommentCount(localCommentCount);
      setCommentLikes((prev) => {
        const newLikes = { ...prev };
        delete newLikes[`comment-${tempCommentId}`];
        return newLikes;
      });
      onPostUpdate(postId, {
        comments: localComments.filter((c) => c.commentId !== tempCommentId),
        commentCount: localCommentCount,
      });
    }
  };

  // Handle reply submission (Optimistic Update)
  const handleReplySubmit = async (parentCommentId: number) => {
    if (!newComment.trim()) return;

    const tempReplyId = `temp-${uuidv4()}`;
    const currentUserData = {
      username: currentUser?.username || 'you',
      profilePicture: currentUser?.profilePicture || '/avatars/placeholder.jpg',
    };

    // Optimistically add reply
    const newReplyObj: Comment = {
      commentId: tempReplyId,
      username: currentUserData.username,
      content: newComment,
      createdAt: new Date().toISOString(),
      profilePicture: currentUserData.profilePicture,
      isLiked: false,
      likeCount: 0,
      isPending: true,
    };

    const updatedComments = localComments.map((comment) =>
      comment.commentId === parentCommentId
        ? { ...comment, replies: [...(comment.replies || []), newReplyObj] }
        : comment
    );

    setLocalComments(updatedComments);
    setLocalCommentCount(localCommentCount + 1);
    setCommentLikes((prev) => ({
      ...prev,
      [`reply-${parentCommentId}-${tempReplyId}`]: { isLiked: false, likeCount: 0 },
    }));
    onPostUpdate(postId, {
      comments: updatedComments,
      commentCount: localCommentCount + 1,
    });
    setNewComment('');
    setReplyingTo(null);

    try {
      const response = await api.post(`/posts/comments/${parentCommentId}/reply`, { content: newComment });
      const newReplyData = response.data;

      // Replace temporary reply with server response
      const updatedReply: Comment = {
        commentId: newReplyData.CommentID,
        username: newReplyData.User.Username,
        content: newReplyData.Content,
        createdAt: newReplyData.CreatedAt,
        profilePicture: newReplyData.User.ProfilePicture,
        isLiked: false,
        likeCount: 0,
        isPending: false,
      };

      const finalComments = localComments.map((comment) =>
        comment.commentId === parentCommentId
          ? {
              ...comment,
              replies: (comment.replies || []).map((r) =>
                r.commentId === tempReplyId ? updatedReply : r
              ),
            }
          : comment
      );

      setLocalComments(finalComments);
      setCommentLikes((prev) => {
        const newLikes = {
          ...prev,
          [`reply-${parentCommentId}-${newReplyData.CommentID}`]: { isLiked: false, likeCount: 0 },
        };
        delete newLikes[`reply-${parentCommentId}-${tempReplyId}`];
        return newLikes;
      });
      onPostUpdate(postId, {
        comments: finalComments,
        commentCount: localCommentCount + 1,
      });
    } catch (error) {
      console.error('Failed to add reply:', error);
      // Remove optimistic reply
      const revertComments = localComments.map((comment) =>
        comment.commentId === parentCommentId
          ? { ...comment, replies: (comment.replies || []).filter((r) => r.commentId !== tempReplyId) }
          : comment
      );
      setLocalComments(revertComments);
      setLocalCommentCount(localCommentCount);
      setCommentLikes((prev) => {
        const newLikes = { ...prev };
        delete newLikes[`reply-${parentCommentId}-${tempReplyId}`];
        return newLikes;
      });
      onPostUpdate(postId, {
        comments: revertComments,
        commentCount: localCommentCount,
      });
    }
  };

  // Handle save/unsave post
  const handleSaveToggle = async () => {
    try {
      const response = await api.post(`/posts/${postId}/save`);
      console.log('Save action:', response.data.action);
    } catch (error) {
      console.error('Failed to toggle save:', error);
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

  // Handle clicking the Reply button
  const handleReplyClick = (commentId: number, username: string) => {
    setReplyingTo(commentId);
    setNewComment(`@${username} `);
  };

  // Handle form submission (comment or reply)
  const handleSubmit = () => {
    if (replyingTo !== null) {
      handleReplySubmit(replyingTo);
    } else {
      handleCommentSubmit();
    }
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
            <span className="post-card__privacy">{privacy.charAt(0) + privacy.slice(1).toLowerCase()}</span>
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
        {content && <p className="post-card__caption">{content}</p>}
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
          aria-label={localIsLiked ? 'Unlike post' : 'Like post'}
        >
          <img
            src={localIsLiked ? '/icons/liked.svg' : '/icons/like.svg'}
            alt={localIsLiked ? 'Unlike' : 'Like'}
            className="post-card__action-icon"
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(localLikeCount)}</span>
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
          <span className="post-card__action-count">{formatCount(localCommentCount)}</span>
        </button>
        <button
          className="post-card__action share"
          onClick={handleSaveToggle}
          aria-label="Save post"
        >
          <img
            src="/icons/share.svg"
            alt="Share"
            className="post-card__action-icon"
            loading="lazy"
          />
        </button>
      </div>
      {localLikedBy.length > 0 && (
        <div className="post-card__likes">
          <div className="post-card__likes-avatars">
            {localLikedBy.slice(0, 3).map((user, index) => (
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
            Liked by {localLikedBy[0].username} {localLikeCount > 1 ? `and ${localLikeCount - 1} others` : ''}
          </span>
        </div>
      )}
      {showComments && (
        <div className="post-card__comments">
          <div className="post-card__comments-list">
            {localComments.map((comment) => (
              <div
                key={comment.commentId}
                className={`post-card__comment ${comment.isPending ? 'post-card__comment--pending' : ''}`}
              >
                <Avatar
                  imageSrc={comment.profilePicture || '/avatars/placeholder.jpg'}
                  username={comment.username}
                  size="xsmall"
                  showUsername={false}
                />
                <div className="post-card__comment-content">
                  <span className="post-card__comment-username">{comment.username}</span>
                  <p className="post-card__comment-text">{comment.content}</p>
                  <div className="post-card__comment-actions">
                    <button
                      className="post-card__comment-action like"
                      onClick={() => handleCommentLikeToggle(`comment-${comment.commentId}`, comment.commentId as number, false)}
                      aria-label={commentLikes[`comment-${comment.commentId}`]?.isLiked ? 'Unlike comment' : 'Like comment'}
                    >
                      {commentLikes[`comment-${comment.commentId}`]?.isLiked ? 'Unlike' : 'Like'}
                      {commentLikes[`comment-${comment.commentId}`]?.likeCount > 0 && (
                        <span> ({formatCount(commentLikes[`comment-${comment.commentId}`].likeCount)})</span>
                      )}
                    </button>
                    <button
                      className="post-card__comment-action reply"
                      onClick={() => handleReplyClick(comment.commentId as number, comment.username)}
                      aria-label="Reply to comment"
                    >
                      Reply
                    </button>
                    <span className="post-card__comment-time">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="post-card__replies">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.commentId}
                          className={`post-card__reply ${reply.isPending ? 'post-card__reply--pending' : ''}`}
                        >
                          <Avatar
                            imageSrc={reply.profilePicture || '/avatars/placeholder.jpg'}
                            username={reply.username}
                            size="xsmall"
                            showUsername={false}
                          />
                          <div className="post-card__reply-content">
                            <span className="post-card__reply-username">{reply.username}</span>
                            <p className="post-card__reply-text">{reply.content}</p>
                            <div className="post-card__reply-actions">
                              <button
                                className="post-card__reply-action like"
                                onClick={() => handleCommentLikeToggle(`reply-${comment.commentId}-${reply.commentId}`, reply.commentId as number, true)}
                                aria-label={commentLikes[`reply-${comment.commentId}-${reply.commentId}`]?.isLiked ? 'Unlike reply' : 'Like reply'}
                              >
                                {commentLikes[`reply-${comment.commentId}-${reply.commentId}`]?.isLiked ? 'Unlike' : 'Like'}
                                {commentLikes[`reply-${comment.commentId}-${reply.commentId}`]?.likeCount > 0 && (
                                  <span> ({formatCount(commentLikes[`reply-${comment.commentId}-${reply.commentId}`].likeCount)})</span>
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
              placeholder={replyingTo !== null ? 'Write a reply...' : 'Post a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="post-card__comment-input-field"
              aria-label={replyingTo !== null ? 'Write a reply' : 'Write a comment'}
            />
            <button
              className="post-card__comment-submit"
              onClick={handleSubmit}
              aria-label={replyingTo !== null ? 'Submit reply' : 'Submit comment'}
            >
              {replyingTo !== null ? 'Reply' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;