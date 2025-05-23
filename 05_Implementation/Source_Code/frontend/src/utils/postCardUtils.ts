import { Comment } from '@/types';

export const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

export const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const updateCommentsForLike = (
  comments: Comment[],
  commentId: string,
  isLiked: boolean,
  likeCount: number,
  isReply: boolean
): Comment[] => {
  return comments.map((comment) =>
    comment.commentId === commentId
      ? { ...comment, isLiked, likeCount }
      : {
          ...comment,
          replies: comment.replies && isReply ? updateCommentsForLike(comment.replies, commentId, isLiked, likeCount, isReply) : comment.replies,
        }
  );
};