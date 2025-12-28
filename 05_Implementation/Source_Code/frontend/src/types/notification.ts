// types/notification.ts

export enum NotificationType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  FOLLOW = "FOLLOW",
  FOLLOW_REQUEST = "FOLLOW_REQUEST",
  FOLLOW_ACCEPTED = "FOLLOW_ACCEPTED",
  STORY_REPLY = "STORY_REPLY",
  MENTION = "MENTION",
  MESSAGE = "MESSAGE",
  SHARE = "SHARE",
  NEW_STORY = "NEW_STORY",
  STORY_LIKE = "STORY_LIKE",
  SYSTEM = "SYSTEM",
}

export interface NotificationSender {
  userId: number;
  username: string;
  profilePicture: string | null;
}

export interface Notification {
  notificationId: number;
  type: NotificationType;
  content: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  sender: NotificationSender | null;
  metadata: Record<string, any>;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface UnreadNotificationsCountResponse {
  count: number;
}

// WebSocket Events (Real-time)
export interface NewNotificationEvent {
  notification: Notification;
}

export interface UnreadCountUpdateEvent {
  count: number;
}

export interface SimpleSuccessResponse {
  success: boolean;
  message: string;
}