export const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const createdDate = new Date(date);
  const diffInMs = now.getTime() - createdDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

export const getNotificationLink = (notification: any): string | null => {
  const { type, metadata, sender } = notification;
  const postRelatedTypes = ['LIKE', 'COMMENT', 'COMMENT_LIKE', 'COMMENT_REPLY', 'STORY_LIKE'];
  const userRelatedTypes = ['FOLLOW', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'];

  // Link to post for post-related notifications
  if (postRelatedTypes.includes(type) && metadata?.postId) {
    return `/post/${metadata.postId}`;
  }
  // Link to user profile for user-related notifications
  if (userRelatedTypes.includes(type) && sender?.username) {
    return `/profile/${sender.username}`;
  }
  return null;
};