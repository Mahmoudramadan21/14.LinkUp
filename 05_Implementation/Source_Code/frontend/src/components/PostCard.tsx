'use client';
import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Avatar from '../components/Avatar';
import api from '@/utils/api';
import { useAppStore } from '@/store/feedStore';
import { v4 as uuidv4 } from 'uuid';
import { API_ENDPOINTS } from '@/utils/constants';
import PostCardLoading from './PostCardLoading';

// Interface for user data
interface User {
  username: string;
  profilePicture: string;
}

// Interface for comment data
interface Comment {
  commentId: string;
  username: string;
  content: string;
  createdAt: string;
  profilePicture?: string;
  isLiked: boolean;
  likeCount: number;
  replies?: Comment[];
  isPending?: boolean;
  userId?: number;
  replyingToUsername?: string;
}

// Interface for app store
interface AppStore {
  authData: { userId: number; username: string; profilePicture: string } | null;
  setError: (error: string) => void;
}

// Interface for component props
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
  likedBy: User[];
  comments: Comment[];
  isLoading?: boolean;
  onPostUpdate: (postId: number, updatedFields: Partial<PostCardProps>) => void;
}

// Custom hook for debouncing input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/**
 * PostCard Component
 * Displays a social media post with media, likes, comments, and replies.
 * Supports optimistic updates for likes and comments with rollback on failure.
 * Shows a loading skeleton when isLoading is true.
 */
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
  isLoading = false,
  onPostUpdate,
}) => {
  if (isLoading) {
    return <PostCardLoading />;
  }

  const { authData, setError } = useAppStore() as AppStore;
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked);
  const [localLikeCount, setLocalLikeCount] = useState(initialLikeCount);
  const [localLikedBy, setLocalLikedBy] = useState<User[]>(initialLikedBy);
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments);
  const [localCommentCount, setLocalCommentCount] = useState(initialCommentCount);
  const debouncedNewComment = useDebounce(newComment, 300);

  // Initialize comment likes
  const commentLikes = useMemo(
    () =>
      initialComments.reduce(
        (acc, comment) => {
          acc[`comment-${comment.commentId}`] = {
            isLiked: comment.isLiked || false,
            likeCount: comment.likeCount || 0,
          };
          comment.replies?.forEach((reply) => {
            acc[`reply-${comment.commentId}-${reply.commentId}`] = {
              isLiked: reply.isLiked || false,
              likeCount: reply.likeCount || 0,
            };
          });
          return acc;
        },
        {} as { [key: string]: { isLiked: boolean; likeCount: number } }
      ),
    [initialComments]
  );
  const [localCommentLikes, setLocalCommentLikes] = useState(commentLikes);

  // Toggle post like
  const handleLikeToggle = useCallback(async () => {
    const previousIsLiked = localIsLiked;
    const previousLikeCount = localLikeCount;
    const previousLikedBy = localLikedBy;

    const currentUserData: User = {
      username: authData?.username || 'you',
      profilePicture: authData?.profilePicture || '/avatars/placeholder.jpg',
    };

    const newIsLiked = !localIsLiked;
    const newLikeCount = newIsLiked ? localLikeCount + 1 : localLikeCount - 1;
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
      const response = await api.post(API_ENDPOINTS.LIKE_POST.replace(':postId', postId.toString()));
      const action = response.data.action;
      if (action !== (newIsLiked ? 'liked' : 'unliked')) {
        throw new Error('Server response does not match optimistic update');
      }
    } catch (error: any) {
      setError('Failed to toggle like. Please try again.');
      setLocalIsLiked(previousIsLiked);
      setLocalLikeCount(previousLikeCount);
      setLocalLikedBy(previousLikedBy);
      onPostUpdate(postId, {
        isLiked: previousIsLiked,
        likeCount: previousLikeCount,
        likedBy: previousLikedBy,
      });
    }
  }, [authData, localIsLiked, localLikeCount, localLikedBy, postId, onPostUpdate, setError]);

  // Toggle comment like
  const handleCommentLikeToggle = useCallback(
    async (key: string, commentId: string, isReply: boolean) => {
      const previousState = localCommentLikes[key];
      const newIsLiked = !previousState.isLiked;
      const newLikeCount = newIsLiked ? previousState.likeCount + 1 : previousState.likeCount - 1;

      setLocalCommentLikes((prev) => ({
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
      } catch (error: any) {
        setError('Failed to toggle comment like. Please try again.');
        setLocalCommentLikes((prev) => ({
          ...prev,
          [key]: previousState,
        }));
        const revertComments = updateComments(
          localComments.map((c) =>
            c.commentId === commentId
              ? { ...c, isLiked: previousState.isLiked, likeCount: previousState.likeCount }
              : c
          )
        );
        setLocalComments(revertComments);
        onPostUpdate(postId, { comments: revertComments });
      }
    },
    [localCommentLikes, localComments, postId, onPostUpdate, setError]
  );

  // Submit comment
  const handleCommentSubmit = useCallback(async () => {
    if (!debouncedNewComment.trim()) return;

    const tempCommentId = `temp-${uuidv4()}`;
    const commentContent = debouncedNewComment;
    const currentUserData: User & { userId?: number } = {
      username: authData?.username || 'you',
      profilePicture: authData?.profilePicture || '/avatars/placeholder.jpg',
      userId: authData?.userId,
    };

    const newCommentObj: Comment = {
      commentId: tempCommentId,
      userId: currentUserData.userId,
      username: currentUserData.username,
      content: commentContent,
      createdAt: new Date().toISOString(),
      profilePicture: currentUserData.profilePicture,
      isLiked: false,
      likeCount: 0,
      replies: [],
      isPending: true,
    };

    setLocalComments((prev) => [...prev, newCommentObj]);
    setLocalCommentCount((prev) => prev + 1);
    setLocalCommentLikes((prev) => ({
      ...prev,
      [`comment-${tempCommentId}`]: { isLiked: false, likeCount: 0 },
    }));
    onPostUpdate(postId, {
      comments: [...localComments, newCommentObj],
      commentCount: localCommentCount + 1,
    });
    setNewComment('');

    try {
      const response = await api.post(
        API_ENDPOINTS.COMMENT_POST.replace(':postId', postId.toString()),
        { content: commentContent }
      );
      const newCommentData = response.data;
      const updatedComment: Comment = {
        commentId: newCommentData.commentId || newCommentData.CommentID || tempCommentId,
        userId: newCommentData.user?.userId || newCommentData.User?.UserID || currentUserData.userId,
        username:
          newCommentData.user?.username || newCommentData.User?.Username || currentUserData.username,
        content: newCommentData.content || newCommentData.Content || commentContent,
        createdAt:
          newCommentData.createdAt || newCommentData.CreatedAt || new Date().toISOString(),
        profilePicture:
          newCommentData.user?.profilePicture ||
          newCommentData.User?.ProfilePicture ||
          currentUserData.profilePicture,
        isLiked: false,
        likeCount: 0,
        replies: [],
        isPending: false,
      };

      setLocalComments((prev) =>
        prev.map((c) => (c.commentId === tempCommentId ? updatedComment : c))
      );
      setLocalCommentLikes((prev) => {
        const newLikes = { ...prev, [`comment-${updatedComment.commentId}`]: { isLiked: false, likeCount: 0 } };
        delete newLikes[`comment-${tempCommentId}`];
        return newLikes;
      });
      onPostUpdate(postId, {
        comments: localComments.map((c) => (c.commentId === tempCommentId ? updatedComment : c)),
        commentCount: localCommentCount + 1,
      });
    } catch (error: any) {
      setError('Failed to add comment. Please try again.');
      setLocalComments((prev) => prev.filter((c) => c.commentId !== tempCommentId));
      setLocalCommentCount(localCommentCount);
      setLocalCommentLikes((prev) => {
        const newLikes = { ...prev };
        delete newLikes[`comment-${tempCommentId}`];
        return newLikes;
      });
      onPostUpdate(postId, {
        comments: localComments.filter((c) => c.commentId !== tempCommentId),
        commentCount: localCommentCount,
      });
    }
  }, [
    debouncedNewComment,
    authData,
    postId,
    localComments,
    localCommentCount,
    onPostUpdate,
    setError,
  ]);

  // Submit reply
  const handleReplySubmit = useCallback(
    async (parentCommentId: string) => {
      if (!debouncedNewComment.trim()) return;

      const tempReplyId = `temp-${uuidv4()}`;
      const currentUserData: User & { userId?: number } = {
        username: authData?.username || 'you',
        profilePicture: authData?.profilePicture || '/avatars/placeholder.jpg',
        userId: authData?.userId,
      };

      const parentComment = localComments.find((comment) => comment.commentId === parentCommentId);
      if (!parentComment) {
        setError('Parent comment not found.');
        return;
      }
      const parentUsername = parentComment.username || 'Unknown';

      const newReplyObj: Comment = {
        commentId: tempReplyId,
        userId: currentUserData.userId,
        username: currentUserData.username,
        content: debouncedNewComment,
        createdAt: new Date().toISOString(),
        profilePicture: currentUserData.profilePicture,
        isLiked: false,
        likeCount: 0,
        isPending: true,
        replyingToUsername: parentUsername,
      };

      setLocalComments((prevComments) =>
        prevComments.map((comment) =>
          comment.commentId === parentCommentId
            ? { ...comment, replies: [...(comment.replies || []), newReplyObj] }
            : comment
        )
      );
      setLocalCommentCount((prev) => prev + 1);
      setLocalCommentLikes((prev) => ({
        ...prev,
        [`reply-${parentCommentId}-${tempReplyId}`]: { isLiked: false, likeCount: 0 },
      }));
      onPostUpdate(postId, {
        comments: localComments.map((comment) =>
          comment.commentId === parentCommentId
            ? { ...comment, replies: [...(comment.replies || []), newReplyObj] }
            : comment
        ),
        commentCount: localCommentCount + 1,
      });
      setNewComment('');
      setReplyingTo(null);

      try {
        const response = await api.post(`/posts/comments/${parentCommentId}/reply`, {
          content: debouncedNewComment,
        });
        const newReplyData = response.data;

        const updatedReply: Comment = {
          commentId: newReplyData.CommentID,
          userId: newReplyData.UserID,
          username: newReplyData.User.Username,
          content: newReplyData.Content,
          createdAt: newReplyData.CreatedAt,
          profilePicture: newReplyData.User.ProfilePicture,
          isLiked: false,
          likeCount: 0,
          isPending: false,
          replyingToUsername: parentUsername,
        };

        setLocalComments((prevComments) =>
          prevComments.map((comment) =>
            comment.commentId === parentCommentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).map((r) =>
                    r.commentId === tempReplyId ? updatedReply : r
                  ),
                }
              : comment
          )
        );
        setLocalCommentLikes((prev) => {
          const newLikes = {
            ...prev,
            [`reply-${parentCommentId}-${updatedReply.commentId}`]: { isLiked: false, likeCount: 0 },
          };
          delete newLikes[`reply-${parentCommentId}-${tempReplyId}`];
          return newLikes;
        });
        onPostUpdate(postId, {
          comments: localComments.map((comment) =>
            comment.commentId === parentCommentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).map((r) =>
                    r.commentId === tempReplyId ? updatedReply : r
                  ),
                }
              : comment
          ),
          commentCount: localCommentCount + 1,
        });
      } catch (error: any) {
        let errorMessage = 'Failed to add reply. Please try again.';
        if (error.status === 400) {
          errorMessage = 'Invalid input or content violation. Please check your reply.';
        } else if (error.status === 403) {
          errorMessage = 'Access to this post is denied. It might be private.';
        } else if (error.status === 404) {
          errorMessage = 'Comment not found. It may have been deleted.';
        } else if (error.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        }
        setError(errorMessage);

        setLocalComments((prevComments) =>
          prevComments.map((comment) =>
            comment.commentId === parentCommentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter((r) => r.commentId !== tempReplyId),
                }
              : comment
          )
        );
        setLocalCommentCount(localCommentCount);
        setLocalCommentLikes((prev) => {
          const newLikes = { ...prev };
          delete newLikes[`reply-${parentCommentId}-${tempReplyId}`];
          return newLikes;
        });
        onPostUpdate(postId, {
          comments: localComments.map((comment) =>
            comment.commentId === parentCommentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter((r) => r.commentId !== tempReplyId),
                }
              : comment
          ),
          commentCount: localCommentCount,
        });
      }
    },
    [
      debouncedNewComment,
      authData,
      localComments,
      localCommentCount,
      postId,
      onPostUpdate,
      setError,
    ]
  );

  // Toggle save post
  const handleSaveToggle = useCallback(async () => {
    try {
      const response = await api.post(API_ENDPOINTS.SAVE_POST.replace(':postId', postId.toString()));
      const action = response.data.action;
      setError(action === 'saved' ? 'Post saved successfully.' : 'Post unsaved.');
    } catch (error: any) {
      setError('Failed to toggle save. Please try again.');
    }
  }, [postId, setError]);

  // Toggle comments visibility
  const handleToggleComments = useCallback(() => {
    setShowComments((prev) => !prev);
  }, []);

  // Toggle video playback
  const handleVideoToggle = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = e.currentTarget.querySelector('video');
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch((error) => setError('Video playback failed.'));
      }
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying, setError]);

  // Format time ago
  const formatTimeAgo = useCallback((date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }, []);

  // Format count
  const formatCount = useCallback((count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  // Handle reply click
  const handleReplyClick = useCallback((commentId: string, username: string) => {
    setReplyingTo(commentId);
    setNewComment(`@${username} `);
  }, []);

  // Handle submit (comment or reply)
  const handleSubmit = useCallback(() => {
    if (replyingTo !== null) {
      handleReplySubmit(replyingTo);
    } else {
      handleCommentSubmit();
    }
  }, [handleCommentSubmit, handleReplySubmit, replyingTo]);

  return (
    <article
      className="post-card"
      data-testid="post-card"
      itemScope
      itemType="http://schema.org/SocialMediaPosting"
    >
      <div className="post-card__header">
        <Avatar
          imageSrc={profilePicture}
          username={username}
          size="small"
          showUsername={false}
          aria-hidden="true"
          width={32}
          height={32}
          loading="lazy"
        />
        <div className="post-card__header-info">
          <Link
            href={`/profile/${username}`}
            className="post-card__username"
            prefetch={false}
            itemProp="author"
          >
            @{username}
          </Link>
          <div className="post-card__meta">
            <span className="post-card__privacy" itemProp="accessMode">
              {privacy.charAt(0) + privacy.slice(1).toLowerCase()}
            </span>
            <span className="post-card__time">{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
        <div className="post-card__actions">
          <button
            type="button"
            className="post-card__button--more"
            aria-label="More options for post"
          >
            <span className="post-card__dots">⋯</span>
          </button>
        </div>
      </div>
      <div className="post-card__content">
        {content && (
          <p className="post-card__caption" itemProp="text">
            {content}
          </p>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Image posted by ${username}`}
            className="post-card__media"
            width={600}
            height={400}
            loading="lazy"
            itemProp="image"
          />
        )}
        {videoUrl && (
          <div
            className="post-card__video-wrapper"
            onClick={handleVideoToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            <video
              src={videoUrl}
              className="post-card__video"
              controls={false}
              playsInline
              preload="metadata"
              width={600}
              height={400}
              itemProp="video"
            />
            {!isPlaying && (
              <div
                className={`post-card__video-control ${isHovered ? 'post-card__video-control--visible' : ''}`}
              >
                <img
                  src="/icons/play.svg"
                  alt="Play"
                  className="post-card__video-control-icon"
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="post-card__actions-bar">
        <button
          type="button"
          className="post-card__button--like"
          onClick={handleLikeToggle}
          aria-label={localIsLiked ? 'Unlike post' : 'Like post'}
        >
          <img
            src={localIsLiked ? '/icons/liked.svg' : '/icons/like.svg'}
            alt={localIsLiked ? 'Unlike' : 'Like'}
            className="post-card__action-icon"
            width={20}
            height={20}
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(localLikeCount)}</span>
        </button>
        <button
          type="button"
          className="post-card__button--comment"
          onClick={handleToggleComments}
          aria-label="View comments"
        >
          <img
            src="/icons/comment.svg"
            alt="Comment"
            className="post-card__action-icon"
            width={20}
            height={20}
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(localCommentCount)}</span>
        </button>
        <button
          type="button"
          className="post-card__button--save"
          onClick={handleSaveToggle}
          aria-label="Save post"
        >
          <img
            src="/icons/save.svg"
            alt="Save"
            className="post-card__action-icon"
            width={20}
            height={20}
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
                className="post-card__avatar--like"
                width={24}
                height={24}
                loading="lazy"
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="post-card__likes-text">
            Liked by {localLikedBy[0].username}{' '}
            {localLikeCount > 1 ? `and ${localLikeCount - 1} others` : ''}
          </span>
        </div>
      )}
      {showComments && (
        <div className="post-card__comments" role="list" aria-live="polite">
          <div className="post-card__comments-list">
            {localComments.map((comment) => (
              <div
                key={comment.commentId}
                className={`post-card__comment ${
                  comment.isPending ? 'post-card__comment--pending' : ''
                }`}
                role="listitem"
              >
                <Avatar
                  imageSrc={comment.profilePicture || '/avatars/placeholder.jpg'}
                  username={comment.username}
                  size="xsmall"
                  showUsername={false}
                  aria-hidden="true"
                  width={24}
                  height={24}
                  loading="lazy"
                />
                <div className="post-card__comment-content">
                  <span className="post-card__comment-username">{comment.username}</span>
                  <p className="post-card__comment-text">{comment.content}</p>
                  <div className="post-card__comment-actions">
                    <button
                      type="button"
                      className="post-card__button--comment-like"
                      onClick={() =>
                        handleCommentLikeToggle(`comment-${comment.commentId}`, comment.commentId, false)
                      }
                      aria-label={
                        localCommentLikes[`comment-${comment.commentId}`]?.isLiked
                          ? 'Unlike comment'
                          : 'Like comment'
                      }
                    >
                      {localCommentLikes[`comment-${comment.commentId}`]?.isLiked ? 'Unlike' : 'Like'}
                      {localCommentLikes[`comment-${comment.commentId}`]?.likeCount > 0 && (
                        <span>
                          {' '}
                          ({formatCount(localCommentLikes[`comment-${comment.commentId}`].likeCount)})
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="post-card__button--reply"
                      onClick={() => handleReplyClick(comment.commentId, comment.username)}
                      aria-label="Reply to comment"
                    >
                      Reply
                    </button>
                    <span className="post-card__comment-time">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="post-card__replies" role="list">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.commentId}
                          className={`post-card__reply ${
                            reply.isPending ? 'post-card__reply--pending' : ''
                          }`}
                          role="listitem"
                        >
                          <Avatar
                            imageSrc={reply.profilePicture || '/avatars/placeholder.jpg'}
                            username={reply.username}
                            size="xsmall"
                            showUsername={false}
                            aria-hidden="true"
                            width={24}
                            height={24}
                            loading="lazy"
                          />
                          <div className="post-card__reply-content">
                            {reply.replyingToUsername && (
                              <span className="post-card__reply-to">
                                Replying to @{reply.replyingToUsername}
                              </span>
                            )}
                            <span className="post-card__reply-username">{reply.username}</span>
                            <p className="post-card__reply-text">{reply.content}</p>
                            <div className="post-card__reply-actions">
                              <button
                                type="button"
                                className="post-card__button--reply-like"
                                onClick={() =>
                                  handleCommentLikeToggle(
                                    `reply-${comment.commentId}-${reply.commentId}`,
                                    reply.commentId,
                                    true
                                  )
                                }
                                aria-label={
                                  localCommentLikes[
                                    `reply-${comment.commentId}-${reply.commentId}`
                                  ]?.isLiked
                                    ? 'Unlike reply'
                                    : 'Like reply'
                                }
                              >
                                {localCommentLikes[
                                  `reply-${comment.commentId}-${reply.commentId}`
                                ]?.isLiked
                                  ? 'Unlike'
                                  : 'Like'}
                                {localCommentLikes[
                                  `reply-${comment.commentId}-${reply.commentId}`
                                ]?.likeCount > 0 && (
                                  <span>
                                    {' '}
                                    (
                                    {formatCount(
                                      localCommentLikes[
                                        `reply-${comment.commentId}-${reply.commentId}`
                                      ].likeCount
                                    )}
                                    )
                                  </span>
                                )}
                              </button>
                              <span className="post-card__reply-time">
                                {formatTimeAgo(reply.createdAt)}
                              </span>
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
            <label htmlFor={`comment-input-${postId}`} className="sr-only">
              {replyingTo !== null ? 'Write a reply' : 'Write a comment'}
            </label>
            <input
              id={`comment-input-${postId}`}
              type="text"
              placeholder={replyingTo !== null ? 'Write a reply...' : 'Post a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="post-card__input--comment"
              aria-label={replyingTo !== null ? 'Write a reply' : 'Write a comment'}
            />
            {replyingTo !== null && (
              <button
                type="button"
                className="post-card__button--cancel"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment('');
                }}
                aria-label="Cancel reply"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="post-card__button--submit"
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

export default memo(PostCard);