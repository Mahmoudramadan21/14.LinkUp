// services/notificationService.ts

import api from "./api";
import {
  GetNotificationsResponse,
  UnreadNotificationsCountResponse,
  SimpleSuccessResponse,
} from "@/types/notification";

/**
 * Generic API request helper (use your existing one or this simplified version)
 */
const apiRequest = async <T>(
  method: "get" | "post" | "put" | "delete",
  endpoint: string,
  data?: unknown
): Promise<T> => {
  try {
    const response = await api[method]<T>(endpoint, { params: data });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches paginated notifications for the authenticated user
 * @param params Pagination and filter options
 */
export const getNotifications = async (params: {
  page?: number;
  limit?: number;
  readStatus?: "ALL" | "READ" | "UNREAD";
}): Promise<GetNotificationsResponse> => {
  return apiRequest<GetNotificationsResponse>("get", "/notifications", params);
};

/**
 * Marks a single notification as read
 * @param notificationId ID of the notification to mark as read
 */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<SimpleSuccessResponse> => {
  return apiRequest<SimpleSuccessResponse>(
    "put",
    `/notifications/${notificationId}/read`
  );
};

/**
 * Marks all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<SimpleSuccessResponse> => {
  return apiRequest<SimpleSuccessResponse>("put", "/notifications/read");
};

/**
 * Deletes a notification
 * @param notificationId ID of the notification to delete
 */
export const deleteNotification = async (
  notificationId: number
): Promise<SimpleSuccessResponse> => {
  return apiRequest<SimpleSuccessResponse>(
    "delete",
    `/notifications/${notificationId}`
  );
};

/**
 * Gets the count of unread notifications
 */
export const getUnreadNotificationsCount = async (): Promise<UnreadNotificationsCountResponse> => {
  return apiRequest<UnreadNotificationsCountResponse>(
    "get",
    "/notifications/unread-count"
  );
};