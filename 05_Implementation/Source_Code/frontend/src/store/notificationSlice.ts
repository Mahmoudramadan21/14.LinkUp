// store/notificationSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
} from "@/services/notificationService";
import {
  Notification,
  NewNotificationEvent,
  UnreadCountUpdateEvent,
} from "@/types/notification";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  loading: {
    fetch: boolean;
    markAsRead: boolean;
    markAllAsRead: boolean;
    delete: boolean;
    count: boolean;
  };
  error: {
    fetch: string | null;
    markAsRead: string | null;
    markAllAsRead: string | null;
    delete: string | null;
    count: string | null;
  };
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  hasMore: true,
  currentPage: 1,
  totalPages: 1,
  loading: {
    fetch: false,
    markAsRead: false,
    markAllAsRead: false,
    delete: false,
    count: false,
  },
  error: {
    fetch: null,
    markAsRead: null,
    markAllAsRead: null,
    delete: null,
    count: null,
  },
};

// Thunks
export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async (params: { page?: number; limit?: number; readStatus?: "ALL" | "READ" | "UNREAD" }, { getState }) => {
    const state = getState() as { notification: NotificationState };
    const page = params.page !== undefined ? params.page : state.notification.currentPage + 1;
    return await getNotifications({ ...params, page });
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notification/fetchUnreadCount",
  async () => {
    return await getUnreadNotificationsCount();
  }
);

export const markAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (notificationId: number) => {
    await markNotificationAsRead(notificationId);
    return notificationId;
  }
);

export const markAllAsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async () => {
    await markAllNotificationsAsRead();
    return null;
  }
);

export const removeNotification = createAsyncThunk(
  "notification/removeNotification",
  async (notificationId: number) => {
    await deleteNotification(notificationId);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Real-time: New notification received via Socket.IO
    receiveNewNotification(state, action: PayloadAction<NewNotificationEvent>) {
      const notification = action.payload.notification;
      state.notifications.unshift(notification);
    },

    // Real-time: Unread count updated from server
    receiveUnreadCountUpdate(state, action: PayloadAction<UnreadCountUpdateEvent>) {
      state.unreadCount = action.payload.count;
    },

    removeNotificationsByIds(state, action: PayloadAction<{ notificationIds: number[] }>) {
    const idsToRemove = action.payload.notificationIds;

    const removedUnreadCount = state.notifications.reduce((count, n) => {
        return idsToRemove.includes(n.notificationId) && !n.isRead ? count + 1 : count;
    }, 0);

    state.notifications = state.notifications.filter(
        (n) => !idsToRemove.includes(n.notificationId)
    );

    state.unreadCount = Math.max(0, state.unreadCount - removedUnreadCount);
    },

    clearNotifications(state) {
      state.notifications = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.fetch = false;
        const { notifications, totalPages, page } = action.payload;
        if (page === 1) {
          state.notifications = notifications;
        } else {
          state.notifications.push(...notifications);
        }
        state.currentPage = page;
        state.totalPages = totalPages;
        state.hasMore = page < totalPages;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.error.message || "Failed to fetch notifications";
      })

      // Fetch Unread Count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading.count = true;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.loading.count = false;
        state.unreadCount = action.payload.count;
      })

      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.notifications.find(n => n.notificationId === id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      })

      // Delete Notification
      .addCase(removeNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.notifications.findIndex(n => n.notificationId === id);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].isRead;
          state.notifications.splice(index, 1);
          if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const {
  receiveNewNotification,
  receiveUnreadCountUpdate,
  clearNotifications,
  removeNotificationsByIds,
} = notificationSlice.actions;

export default notificationSlice.reducer;