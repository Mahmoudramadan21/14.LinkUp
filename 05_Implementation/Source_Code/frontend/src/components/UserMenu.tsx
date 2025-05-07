'use client';
import React, { useState } from 'react';
import Avatar from '../components/Avatar';
import { removeAuthData } from '@/utils/auth';

/*
 * UserMenu Component
 * A collapsible menu displaying user info and navigation options with logout functionality.
 * Used in sidebars or headers for quick access to user-related actions.
 */
interface UserMenuProps {
  user: {
    name: string; // User's display name
    username: string; // User's unique handle
    profilePicture: string; // URL of the user's profile picture
  };
  onLogout: () => void; // Callback for logging out the user
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle the menu visibility
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="user-menu-container" data-testid="user-menu">
      <div className="user-menu-header">
        <Avatar
          imageSrc={user.profilePicture}
          username={user.username}
          size="medium"
          showUsername={false}
        />
        <div className="user-menu-info">
          <p className="user-menu-name">{user.name}</p>
          <p className="user-menu-username">@{user.username}</p>
        </div>
        <button
          onClick={toggleMenu}
          className="user-menu-toggle"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <img
            src="/icons/open-menu.svg"
            alt={isOpen ? 'Close menu' : 'Open menu'}
            className={`user-menu-icon ${isOpen ? 'rotate' : ''}`}
            loading="lazy"
          />
        </button>
      </div>
      {isOpen && (
        <>
          <div className="user-menu-divider" />
          <h3 className="user-menu-title">MENU</h3>
          <ul className="user-menu-list">
            <li className="user-menu-item">
              <img
                src="/icons/save.svg"
                alt="Saved"
                className="user-menu-item-icon"
                loading="lazy"
              />
              <span>Saved</span>
            </li>
            <li className="user-menu-item">
              <img
                src="/icons/explore.svg"
                alt="Explore"
                className="user-menu-item-icon"
                loading="lazy"
              />
              <span>Explore</span>
            </li>
            <li className="user-menu-item">
              <img
                src="/icons/settings.svg"
                alt="Settings"
                className="user-menu-item-icon"
                loading="lazy"
              />
              <span>Settings</span>
            </li>
            <li className="user-menu-item logout" onClick={onLogout}>
              <img
                src="/icons/logout.svg"
                alt="Log Out"
                className="user-menu-item-icon"
                loading="lazy"
              />
              <span>Log Out</span>
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default UserMenu;