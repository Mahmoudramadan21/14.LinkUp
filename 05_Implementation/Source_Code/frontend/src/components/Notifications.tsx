import React from 'react';
import Avatar from '../components/Avatar';

/*
 * Notifications Component
 * Displays a list of user notifications with sender avatars and timestamps.
 * Used in notification feeds to inform users of recent activities.
 */
interface NotificationMetadata {
  postId?: number; // ID of the related post
  commentId?: number; // ID of the related comment
  replierId?: number; // ID of the user who replied
  replierUsername?: string; // Username of the replier
  requestId?: number; // ID of the follow request
  requesterId?: number; // ID of the requester
  requesterUsername?: string; // Username of the requester
  followerId?: number; // ID of the follower
  followerUsername?: string; // Username of the follower
  reason?: string; // Reason for the notification (e.g., report reason)
  reporterId?: number; // ID of the reporter
  reporterUsername?: string; // Username of the reporter
  signupDate?: string; // User's signup date
}

interface Sender {
  userId: number; // ID of the sender
  username: string; // Sender's username
  profilePicture: string | null; // URL of the sender's profile picture
}

interface Notification {
  notificationId: number; // Unique ID of the notification
  type: string; // Type of notification (e.g., like, comment)
  content: string; // Notification message
  isRead: boolean; // Whether the notification has been read
  createdAt: string; // Timestamp of when the notification was created
  sender: Sender | null; // Sender of the notification
  metadata: NotificationMetadata; // Additional metadata for the notification
}

interface NotificationsProps {
  data: {
    notifications: Notification[]; // List of notifications
    totalCount: number; // Total number of notifications
    page: number; // Current page number
    totalPages: number; // Total number of pages
  };
}

const Notifications: React.FC<NotificationsProps> = ({ data }) => {
  // Format the time since the notification was created
  const formatTimeAgo = (date: string) => {
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

  return (
    <div className="notifications-container" data-testid="notifications">
      {data.notifications.map((notification) => (
        <div key={notification.notificationId} className="notification-item">
          <Avatar
            imageSrc={notification.sender?.profilePicture || '/avatars/placeholder.jpg'}
            username={notification.sender?.username || 'Unknown'}
            size="medium"
            showUsername={false}
          />
          <div className="notification-content">
            <p className="notification-text">
              {notification.content}
              {!notification.isRead && <span className="notification-unread" aria-label="Unread notification" />}
            </p>
            <p className="notification-time">{formatTimeAgo(notification.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;