'use client';
import React, { useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Avatar from './Avatar';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { formatTimeAgo, getNotificationLink } from '@/utils/notificationsUtils';
import { NotificationsProps } from '@/types';

const Notifications: React.FC<NotificationsProps> = ({ isOpen, onClose, userId }) => {
  const {
    notifications,
    loading,
    dialogRef,
    handleScroll,
    markNotificationAsRead,
    deleteNotification,
  } = useNotifications({ isOpen, onClose, userId });

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
                data-testid={`delete-notification-${notification.notificationId}`}
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
                    data-testid="close-notifications"
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