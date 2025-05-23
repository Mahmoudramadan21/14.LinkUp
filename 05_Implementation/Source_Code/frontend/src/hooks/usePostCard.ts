'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/feedStore';
import api from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { PostCardProps, PostCardAppStore } from '@/types';
import { updateCommentsForLike } from '@/utils/postCardUtils';

// Custom hook for debouncing input
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const usePostCard = ({
  postId,
  initialLikeCount,
  initialCommentCount,
  initialIsLiked,
  initialLikedBy,
  initialComments,
  onPostUpdate,
  authData,
  setError,
}: PostCardProps & Pick<PostCardAppStore, 'authData' | 'setError'>) => {
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked);
  const [localLikeCount, setLocalLikeCount] = useState(initialLikeCount);
  const [localLikedBy, setLocalLikedBy] = useState(initialLikedBy);
  const [localComments, setLocalComments] = useState(initialComments);
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

    const currentUserData = {
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

      const newComments = updateCommentsForLike(localComments, commentId, newIsLiked, newLikeCount, isReply);
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
        const revertComments = updateCommentsForLike(
          localComments,
          commentId,
          previousState.isLiked,
          previousState.likeCount,
          isReply
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
    const currentUserData = {
      username: authData?.username || 'you',
      profilePicture: authData?.profilePicture || '/avatars/placeholder.jpg',
      userId: authData?.userId,
    };

    const newCommentObj = {
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
      const updatedComment = {
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
      const currentUserData = {
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

      const newReplyObj = {
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

        const updatedReply = {
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
    } catch (error) {
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

  return {
    showComments,
    isPlaying,
    isHovered,
    setIsHovered,
    newComment,
    setNewComment,
    replyingTo,
    setReplyingTo,
    localIsLiked,
    localLikeCount,
    localLikedBy,
    localComments,
    localCommentCount,
    localCommentLikes,
    handleLikeToggle,
    handleCommentLikeToggle,
    handleCommentSubmit,
    handleReplySubmit,
    handleSaveToggle,
    handleToggleComments,
    handleVideoToggle,
    handleReplyClick,
    handleSubmit,
  };
};