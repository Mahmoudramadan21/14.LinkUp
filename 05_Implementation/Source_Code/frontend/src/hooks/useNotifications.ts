'use client';
import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useNotificationsStore } from '@/store/notificationStore';
import { NotificationsProps } from '@/types';

// Backend WebSocket URL
const BACKEND_WS_URL = 'http://localhost:3000';

export const useNotifications = ({ isOpen, onClose, userId }: NotificationsProps) => {
  const {
    notifications,
    totalPages,
    page,
    loading,
    fetchNotifications,
    markAllAsRead,
    markNotificationAsRead,
    deleteNotification,
    setPage,
  } = useNotificationsStore();
  
  const dialogRef = useRef<HTMLDivElement>(null);

  // Setup WebSocket connection
  useEffect(() => {
    const socket = io(BACKEND_WS_URL, { withCredentials: true });
    socket.emit('joinRoom', `user_${userId}`);

    socket.on('notification', (newNotification) => {
      useNotificationsStore.getState().setNotifications([newNotification, ...notifications]);
      useNotificationsStore.getState().setTotalCount(notifications.length + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, notifications]);

  // Fetch notifications and mark as read when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchNotifications(1);
      markAllAsRead();
    }
  }, [isOpen, fetchNotifications, markAllAsRead, setPage]);

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      if (
        target.scrollHeight - target.scrollTop <= target.clientHeight + 50 &&
        !loading &&
        page < totalPages
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage);
      }
    },
    [loading, page, totalPages, setPage, fetchNotifications]
  );

  return {
    notifications,
    loading,
    dialogRef,
    handleScroll,
    markNotificationAsRead,
    deleteNotification,
  };
};