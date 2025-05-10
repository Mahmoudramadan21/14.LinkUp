'use client';
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import NavIcon from '../components/NavIcon';
import SearchBar from '../components/SearchBar';
import Notifications from '../components/Notifications';
import { useNotificationsStore } from '@/store/notificationStore';
import { getAuthData } from '@/utils/auth';

// Backend WebSocket URL
const BACKEND_WS_URL = 'http://localhost:3000';

const HeaderSection: React.FC = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();
  const authData = getAuthData();
  const userId = authData?.userId || 1; // Fallback to 1 if authData is not available

  // Fetch unread notifications count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Setup WebSocket connection
  useEffect(() => {
    const socket = io(BACKEND_WS_URL, {
      withCredentials: true,
    });

    socket.emit('joinRoom', `user_${userId}`);

    socket.on('unreadNotificationsCount', (data: { count: number }) => {
      useNotificationsStore.getState().setUnreadCount(data.count);
    });

    socket.on('notification', () => {
      useNotificationsStore.getState().setUnreadCount(unreadCount + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, unreadCount]);

  return (
    <header className="header-section" data-testid="header-section">
      <div className="header-section__logo">
        <img
          src="/svgs/logo.svg"
          alt="LinkUp Logo"
          className="header-section__logo-img"
          aria-label="LinkUp Logo"
          loading="lazy"
        />
      </div>
      <div className="header-section__center">
        {/* <SearchBar /> */}
        <div className="header-section__nav-group">
          <NavIcon
            iconSrc="/icons/home.svg"
            activeIconSrc="/icons/home-active.svg"
            alt="Home Icon"
            ariaLabel="Go to Home"
            to="/feed"
          />
          {/* <NavIcon
            iconSrc="/icons/video.svg"
            activeIconSrc="/icons/video-active.svg"
            alt="Video Icon"
            ariaLabel="Go to Videos"
            to="/video"
          /> */}
          {/* <NavIcon
            iconSrc="/icons/add-friend.svg"
            activeIconSrc="/icons/add-friend-active.svg"
            alt="Add Friend Icon"
            ariaLabel="Add Friend"
            to="/friends"
          /> */}
          <NavIcon
            iconSrc="/icons/profile.svg"
            activeIconSrc="/icons/profile-active.svg"
            alt="Profile Icon"
            ariaLabel="Go to Profile"
            to={`/profile/${authData?.username}`}
          />
        </div>
      </div>
      <nav className="header-section__nav" aria-label="Main navigation">
        <NavIcon
          iconSrc="/icons/search.svg"
          alt="Search Icon"
          ariaLabel="Open Search"
          to="#"
          variant="mobile"
        />
        <div className="header-section__nav-group">
          {/* <NavIcon
            iconSrc="/icons/message.svg"
            alt="Messages Icon"
            ariaLabel="Go to Messages"
            to="/messages"
          /> */}
          <NavIcon
            iconSrc="/icons/notification.svg"
            alt="Notifications Icon"
            ariaLabel="View Notifications"
            onClick={() => setIsNotificationsOpen(true)}
            badgeCount={unreadCount}
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
        onClose={() => setIsNotificationsOpen(false)}
        userId={userId}
      />
    </header>
  );
};

export default HeaderSection;