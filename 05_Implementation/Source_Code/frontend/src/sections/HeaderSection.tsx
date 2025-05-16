import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import io from 'socket.io-client';
import NavIcon from '../components/NavIcon';
import Notifications from '../components/Notifications';
import { useNotificationsStore } from '@/store/notificationStore';
import { getAuthData } from '@/utils/auth';

// Backend WebSocket URL
const BACKEND_WS_URL = 'http://localhost:3000';

/**
 * HeaderSection Component
 * Renders the main header with logo, navigation icons, and notifications.
 */
const HeaderSection: React.FC = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const authData = getAuthData();
  const userId = authData?.userId;
  const username = authData?.username;

  // Toggle notifications visibility
  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen((prev) => !prev);
  }, []);

  // Fetch unread notifications count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Setup WebSocket connection
  const socket = useMemo(() => {
    if (!userId) return null;
    const socketInstance = io(BACKEND_WS_URL, {
      withCredentials: true,
    });

    socketInstance.emit('joinRoom', `user_${userId}`);

    socketInstance.on('unreadNotificationsCount', (data: { count: number }) => {
      useNotificationsStore.getState().setUnreadCount(data.count);
    });

    socketInstance.on('notification', () => {
      useNotificationsStore.getState().setUnreadCount(unreadCount + 1);
    });

    return socketInstance;
  }, [userId, unreadCount]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  return (
    <header
      className="header-section"
      data-testid="header-section"
      role="banner"
      itemScope
      itemType="http://schema.org/Person"
    >
    <div className="header-section__container">
            <div className="header-section__logo">
        <img
          src="/svgs/logo.svg"
          alt="LinkUp Logo"
          className="header-section__logo-img"
          aria-hidden="true"
          width={176}
          height={44}
        />
      </div>
      <div className="header-section__center">
        <div className="header-section__nav-group">
          <NavIcon
            iconSrc="/icons/home.svg"
            activeIconSrc="/icons/home-active.svg"
            alt="Home Icon"
            ariaLabel="Go to Home"
            to="/feed"
          />
          <NavIcon
            iconSrc="/icons/profile.svg"
            activeIconSrc="/icons/profile-active.svg"
            alt="Profile Icon"
            ariaLabel="Go to Profile"
            to={username ? `/profile/${username}` : '/profile'}
          />
        </div>
      </div>
      <nav className="header-section__nav" aria-label="Main navigation" role="navigation">
        <NavIcon
          iconSrc="/icons/search.svg"
          alt="Search Icon"
          ariaLabel="Open Search"
          to="#"
          variant="mobile"
        />
        <div className="header-section__nav-group">
          <NavIcon
            iconSrc="/icons/notification.svg"
            alt="Notifications Icon"
            ariaLabel="View Notifications"
            onClick={toggleNotifications}
            badgeCount={unreadCount}
            aria-expanded={isNotificationsOpen}
          />
          <NavIcon
            iconSrc="/icons/hamburger.svg"
            alt="Menu Icon"
            ariaLabel="Open Menu"
            to="#"
            variant="mobile"
          />
        </div>
      </nav>
      <Notifications
        isOpen={isNotificationsOpen}
        onClose={toggleNotifications}
        userId={userId || 0}
      />
    </div>
    </header>
  );
};

export default memo(HeaderSection);