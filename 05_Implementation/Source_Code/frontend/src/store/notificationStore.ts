import { create } from 'zustand';
import api from '@/utils/api';
import {
  NotificationMetadata,
  NotificationSender,
  Notification,
  NotificationsResponse,
  NotificationsState,
} from '@/types';

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  totalCount: 0,
  totalPages: 1,
  page: 1,
  unreadCount: 0,
  loading: false,
  error: null,

  setNotifications: (notifications) => set({ notifications }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setPage: (page) => set({ page }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchNotifications: async (page: number, limit = 10, readStatus = 'ALL') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<NotificationsResponse>('/notifications', {
        params: { page, limit, readStatus },
      });
      const { notifications, totalCount, totalPages } = response.data;
      set((state) => ({
        notifications: page === 1 ? notifications : [...state.notifications, ...notifications],
        totalCount,
        totalPages,
        page,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch notifications' });
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<{ count: number }>('/notifications/unread-count');
      set({ unreadCount: response.data.count });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch unread count' });
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read');
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to mark notifications as read' });
    }
  },

  markNotificationAsRead: async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(state.unreadCount - 1, 0),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to mark notification as read' });
    }
  },

  deleteNotification: async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      set((state) => ({
        notifications: state.notifications.filter(
          (notification) => notification.notificationId !== notificationId
        ),
        totalCount: state.totalCount - 1,
        unreadCount: state.notifications.find(
          (notification) => notification.notificationId === notificationId && !notification.isRead
        )
          ? state.unreadCount - 1
          : state.unreadCount,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete notification' });
    }
  },
}));