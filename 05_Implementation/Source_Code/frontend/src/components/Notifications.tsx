'use client';
import React, { useEffect } from 'react';
import io from 'socket.io-client';
import { Dialog, Transition } from '@headlessui/react';
import Avatar from '../components/Avatar';
import Link from 'next/link';
import { useNotificationsStore } from '@/store/notificationsStore';

// Backend WebSocket URL
const BACKEND_WS_URL = 'http://localhost:3000';

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const Notifications: React.FC<NotificationsProps> = ({ isOpen, onClose, userId }) => {
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

  // Setup WebSocket connection
  useEffect(() => {
    const socket = io(BACKEND_WS_URL, {
      withCredentials: true,
    });

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

  // Handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
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
  };

  // Format timestamp to "time ago"
  const formatTimeAgo = (date: string): string => {
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

  // Determine link destination based on notification type
  const getNotificationLink = (notification: any): string | null => {
    const { type, metadata, sender } = notification;
    const postRelatedTypes = ['LIKE', 'COMMENT', 'COMMENT_LIKE', 'COMMENT_REPLY', 'STORY_LIKE'];
    const userRelatedTypes = ['FOLLOW', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'];

    if (postRelatedTypes.includes(type) && metadata?.postId) {
      return `/post/${metadata.postId}`;
    }
    if (userRelatedTypes.includes(type) && sender?.userId) {
      return `/profile/${sender.userId}`;
    }
    return null;
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="dialog-overlay" aria-hidden="true" />
        </Transition.Child>

        <div className="dialog-wrapper">
          <div className="dialog-content">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-full"
            >
              <Dialog.Panel className="notifications-dialog">
                <Dialog.Title as="h3" className="dialog-title">
                  Notifications
                  <button
                    onClick={onClose}
                    className="close-button"
                    aria-label="Close notifications dialog"
                  >
                    <svg
                      className="close-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </Dialog.Title>

                <div className="notifications-container" onScroll={handleScroll} data-testid="notifications">
                  {notifications.length === 0 && !loading ? (
                    <p className="empty-message">No notifications yet.</p>
                  ) : (
                    notifications.map((notification) => {
                      const linkTo = getNotificationLink(notification);
                      return (
                        <div key={notification.notificationId} className="notification-item">
                          {linkTo ? (
                            <Link href={linkTo} className="notification-link">
                              <Avatar
                                imageSrc={notification.sender?.profilePicture || '/avatars/placeholder.jpg'}
                                username={notification.sender?.username || 'Unknown'}
                                size="medium"
                                showUsername={false}
                              />
                              <div className="notification-content">
                                <p className="notification-text">
                                  {notification.content}
                                  {!notification.isRead && (
                                    <span className="notification-unread" aria-label="Unread notification" />
                                  )}
                                </p>
                                <p className="notification-time">{formatTimeAgo(notification.createdAt)}</p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-start space-x-3">
                              <Avatar
                                imageSrc={notification.sender?.profilePicture || '/avatars/placeholder.jpg'}
                                username={notification.sender?.username || 'Unknown'}
                                size="medium"
                                showUsername={false}
                              />
                              <div className="notification-content">
                                <p className="notification-text">
                                  {notification.content}
                                  {!notification.isRead && (
                                    <span className="notification-unread" aria-label="Unread notification" />
                                  )}
                                </p>
                                <p className="notification-time">{formatTimeAgo(notification.createdAt)}</p>
                              </div>
                            </div>
                          )}
                          <div className="notification-actions">
                            {!notification.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(notification.notificationId)}
                                className="mark-read-button"
                                aria-label="Mark as read"
                              >
                                Mark as Read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.notificationId)}
                              className="delete-button"
                              aria-label="Delete notification"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {loading && <div className="loading-text">Loading...</div>}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Notifications;