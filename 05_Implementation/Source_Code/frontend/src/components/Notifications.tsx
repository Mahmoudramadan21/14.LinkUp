'use client';
import React, { useEffect, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import { Dialog, Transition } from '@headlessui/react';
import Avatar from '../components/Avatar';
import Link from 'next/link';
import { useNotificationsStore } from '../store/notificationStore';

// Backend WebSocket URL
const BACKEND_WS_URL = 'http://localhost:3000';

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const Notifications: React.FC<NotificationsProps> = ({ isOpen, onClose, userId }) => {
  // Access notification store
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

  // Reference for dialog to manage focus
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
  }, [userId]); // Only reconnect if userId changes

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

  // Memoize notifications rendering to optimize performance
  const renderedNotifications = useMemo(
    () =>
      notifications.map((notification) => {
        const linkTo = getNotificationLink(notification);
        return (
          <article
            key={notification.notificationId}
            className="notifications__item"
            aria-labelledby={`notification-${notification.notificationId}`}
          >
            {linkTo ? (
              <Link href={linkTo} className="notifications__link">
                <Avatar
                  imageSrc={notification.sender?.profilePicture || '/avatars/placeholder.jpg'}
                  username={notification.sender?.username || 'Unknown'}
                  size="medium"
                  showUsername={false}
                  loading="lazy"
                />
                <div className="notifications__content">
                  <p
                    id={`notification-${notification.notificationId}`}
                    className="notifications__text"
                  >
                    {notification.content}
                    {!notification.isRead && (
                      <span
                        className="notifications__unread"
                        aria-label="Unread notification"
                      />
                    )}
                  </p>
                  <time className="notifications__time">
                    {formatTimeAgo(notification.createdAt)}
                  </time>
                </div>
              </Link>
            ) : (
              <div className="notifications__static">
                <Avatar
                  imageSrc={notification.sender?.profilePicture || '/avatars/placeholder.jpg'}
                  username={notification.sender?.username || 'Unknown'}
                  size="medium"
                  showUsername={false}
                  loading="lazy"
                />
                <div className="notifications__content">
                  <p
                    id={`notification-${notification.notificationId}`}
                    className="notifications__text"
                  >
                    {notification.content}
                    {!notification.isRead && (
                      <span
                        className="notifications__unread"
                        aria-label="Unread notification"
                      />
                    )}
                  </p>
                  <time className="notifications__time">
                    {formatTimeAgo(notification.createdAt)}
                  </time>
                </div>
              </div>
            )}
            <div className="notifications__actions">
              {!notification.isRead && (
                <button
                  onClick={() => markNotificationAsRead(notification.notificationId)}
                  className="notifications__action notifications__action--mark-read"
                  aria-label="Mark notification as read"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={() => deleteNotification(notification.notificationId)}
                className="notifications__action notifications__action--delete"
                aria-label="Delete notification"
              >
                Delete
              </button>
            </div>
          </article>
        );
      }),
    [notifications, markNotificationAsRead, deleteNotification]
  );

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="notifications"
        onClose={onClose}
        initialFocus={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        {/* Overlay with blur effect */}
        <Transition.Child
          as={React.Fragment}
          enter="notifications__overlay-enter"
          enterFrom="notifications__overlay-enter-from"
          enterTo="notifications__overlay-enter-to"
          leave="notifications__overlay-leave"
          leaveFrom="notifications__overlay-leave-from"
          leaveTo="notifications__overlay-leave-to"
        >
          <div
            className="notifications__overlay"
            onClick={onClose}
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="notifications__wrapper">
          <div className="notifications__content">
            <Transition.Child
              as={React.Fragment}
              enter="notifications__panel-enter"
              enterFrom="notifications__panel-enter-from"
              enterTo="notifications__panel-enter-to"
              leave="notifications__panel-leave"
              leaveFrom="notifications__panel-leave-from"
              leaveTo="notifications__panel-leave-to"
            >
              <Dialog.Panel
                className="notifications__panel"
                ref={dialogRef}
                tabIndex={-1}
              >
                <header className="notifications__header">
                  <Dialog.Title
                    as="h2"
                    id="notifications-title"
                    className="notifications__title"
                  >
                    Notifications
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="notifications__close"
                    aria-label="Close notifications dialog"
                  >
                    <svg
                      className="notifications__close-icon"
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
                </header>
                <div
                  className="notifications__container"
                  onScroll={handleScroll}
                  data-testid="notifications"
                  aria-live="polite"
                >
                  {notifications.length === 0 && !loading ? (
                    <p className="notifications__empty">
                      No notifications yet.
                    </p>
                  ) : (
                    renderedNotifications
                  )}
                  {loading && (
                    <div className="notifications__loading">
                      Loading...
                    </div>
                  )}
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