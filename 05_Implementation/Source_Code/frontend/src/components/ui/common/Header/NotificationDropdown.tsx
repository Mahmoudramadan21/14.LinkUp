// components/ui/notification/NotificationDropdown.tsx
'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  AtSign,
  Share2,
  Sparkles,
  Bell,
} from 'lucide-react';

import { RootState, AppDispatch } from '@/store';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  fetchUnreadCount,
} from '@/store/notificationSlice';
import { Notification, NotificationType } from '@/types/notification';

import BellIcon from '/public/icons/BellIcon.svg';
import styles from './notification.module.css';
import OverlayPortal from './OverlayPortal';

/* -------------------------------------------------------------------------- */
/*                           Notification Item Component                      */
/* -------------------------------------------------------------------------- */
const NotificationItem = memo(
  ({ notification }: { notification: Notification }) => {
    const dispatch = useDispatch<AppDispatch>();

    const handleMarkAsRead = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!notification.isRead) {
          dispatch(markAsRead(notification.notificationId));
        }
      },
      [dispatch, notification.notificationId, notification.isRead]
    );

    const getIcon = () => {
      const iconClass = 'w-5 h-5';
      switch (notification.type) {
        case NotificationType.LIKE:
        case NotificationType.STORY_LIKE:
          return <Heart className={iconClass} fill="currentColor" />;
        case NotificationType.COMMENT:
        case NotificationType.STORY_REPLY:
        case NotificationType.MESSAGE:
          return <MessageCircle className={iconClass} />;
        case NotificationType.FOLLOW:
          return <UserPlus className={iconClass} />;
        case NotificationType.FOLLOW_REQUEST:
        case NotificationType.FOLLOW_ACCEPTED:
          return <UserCheck className={iconClass} />;
        case NotificationType.MENTION:
          return <AtSign className={iconClass} />;
        case NotificationType.SHARE:
          return <Share2 className={iconClass} />;
        case NotificationType.NEW_STORY:
          return <Sparkles className={iconClass} />;
        default:
          return <Bell className={iconClass} />;
      }
    };

    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
      locale: navigator.language.startsWith('ar') ? ar : enUS,
    });

    const targetUrl = notification.metadata.postId
      ? `/feed?postId=${notification.metadata.postId}`
      : notification.metadata.storyId
      ? `/stories/${notification.sender?.username}`
      : `/${notification.sender?.username}`;

    return (
      <Link
        href={targetUrl}
        className={`${styles['notif-item']} ${!notification.isRead ? styles['notif-item--unread'] : ''}`}
      >
        <div className={styles['notif-avatar-wrapper']}>
          <Image
            src={notification.sender?.profilePicture || '/avatars/default-avatar.svg'}
            alt={notification.sender?.username || 'User'}
            width={40}
            height={40}
            className={styles['notif-avatar']}
          />
          <span className={styles['notif-type-icon']}>{getIcon()}</span>
        </div>

        <div className={styles['notif-content']}>
          <p
            className={styles['notif-text']}
            dangerouslySetInnerHTML={{ __html: notification.content }}
          />
          <span className={styles['notif-time']}>{timeAgo}</span>
        </div>

        {!notification.isRead && (
          <button
            onClick={handleMarkAsRead}
            className={styles['notif-mark-read']}
            aria-label="Mark as read"
            title="Mark as read"
          >
            <span className={styles['notif-unread-dot']} />
          </button>
        )}
      </Link>
    );
  }
);
NotificationItem.displayName = 'NotificationItem';

/* -------------------------------------------------------------------------- */
/*                           Main Dropdown Component                          */
/* -------------------------------------------------------------------------- */
const NotificationDropdown = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, unreadCount, loading, hasMore, currentPage } = useSelector(
    (state: RootState) => state.notification
  );

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track unread notifications when dropdown opens
  const unreadWhenOpened = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      unreadWhenOpened.current = unreadCount;
      dispatch(fetchUnreadCount());
      if (currentPage === 1 && notifications.length === 0) {
        dispatch(fetchNotifications({ page: 1, limit: 15 }));
      }
    }
  }, [isOpen, dispatch, currentPage, notifications.length, unreadCount]);

  // Close on click outside + Mark all as read if there were unread
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (isOpen && unreadWhenOpened.current > 0) {
          dispatch(markAllAsRead());
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, dispatch]);

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading.fetch) {
      dispatch(fetchNotifications({ page: currentPage + 1, limit: 15 }));
    }
  }, [dispatch, hasMore, loading.fetch, currentPage]);

  return (
    <div className={styles['notif-dropdown']} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={styles['notif-bell']}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className={styles['notif-badge']}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
        <OverlayPortal>
        <div
            className={styles['notif-overlay']}
            onClick={() => setIsOpen(false)}
        />
        </OverlayPortal>

          <div className={styles['notif-panel']} role="menu" aria-label="Notifications">
            {/* Header */}
            <div className={styles['notif-header']}>
                <h3 className={styles['notif-title']}>Notifications</h3>
                <button
                onClick={() => setIsOpen(false)}
                className={styles['notif-close']}
                aria-label="Close notifications"
                >
                <X className="w-5 h-5" />
                </button>
            </div>

            {/* Notifications List */}
            <div className={styles['notif-list']} role="list">
                {loading.fetch && notifications.length === 0 ? (
                <div className={styles['notif-loading']}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                <div className={styles['notif-empty']}>
                    <BellIcon className="w-12 h-12 text-[var(--text-muted)] mb-3" />
                    <p>No notifications yet</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                    When someone interacts with you, you&apos;ll see it here.
                    </p>
                </div>
                ) : (
                <>
                    {notifications.map((notif) => (
                    <NotificationItem key={notif.notificationId} notification={notif} />
                    ))}

                    {hasMore && (
                    <button
                        onClick={loadMore}
                        disabled={loading.fetch}
                        className={styles['notif-load-more']}
                    >
                        {loading.fetch ? 'Loading...' : 'Load more'}
                    </button>
                    )}
                </>
                )}
            </div>

            {/* Footer */}
            {unreadCount > 0 && (
                <div className={styles['notif-footer']}>
                <button
                    onClick={handleMarkAllRead}
                    className={styles['notif-mark-all-footer']}
                >
                    Mark all as read
                </button>
                </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
NotificationDropdown.displayName = 'NotificationDropdown';

export default NotificationDropdown;