'use client';
import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import Avatar from '../components/Avatar';
import Link from 'next/link';

// Interface for user data
interface User {
  name: string;
  username: string;
  profilePicture: string | null;
}

// Interface for component props
interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

/**
 * UserMenu Component
 * A collapsible menu displaying user info and navigation options.
 * Supports toggling visibility and logout functionality.
 */
const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Toggle menu visibility
  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = document.querySelectorAll('.user-menu__item, .user-menu__button--logout');
      const active = document.activeElement as HTMLElement;
      const index = Array.from(items).indexOf(active);
      const nextIndex = e.key === 'ArrowDown' ? index + 1 : index - 1;
      if (nextIndex >= 0 && nextIndex < items.length) {
        (items[nextIndex] as HTMLElement).focus();
      }
    }
  }, []);

  // Add keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Memoize menu items
  const menuItems = useMemo(
    () => [
      { label: 'Saved', icon: '/icons/save.svg', href: '/saved' },
      { label: 'Explore', icon: '/icons/explore.svg', href: '/explore' },
      { label: 'Settings', icon: '/icons/settings.svg', href: '/settings' },
    ],
    []
  );

  return (
    <nav
      className="user-menu__container"
      data-testid="user-menu"
      role="navigation"
      aria-labelledby="user-menu-title"
      itemScope
      itemType="http://schema.org/Person"
    >
      <h2 id="user-menu-title" className="sr-only">
        User Menu
      </h2>
      <div className="user-menu__header">
        <Avatar
          imageSrc={user.profilePicture || '/avatars/placeholder.png'}
          username={user.username}
          size="medium"
          showUsername={false}
          aria-hidden="true"
          width={48}
          height={48}
          loading="lazy"
        />
        <div className="user-menu__info">
          <p className="user-menu__name" itemProp="name">
            {user.name}
          </p>
          <p className="user-menu__username" itemProp="alternateName">
            @{user.username}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMenu}
          className="user-menu__button--toggle"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <img
            src="/icons/open-menu.svg"
            alt=""
            className={`user-menu__icon--toggle ${isOpen ? 'user-menu__icon--toggle-open' : ''}`}
            aria-hidden="true"
            width={20}
            height={20}
            loading="lazy"
          />
        </button>
      </div>
      {isOpen && (
        <>
          <hr className="user-menu__divider" />
          <h3 className="user-menu__title">MENU</h3>
          <ul className="user-menu__list">
            {menuItems.map((item, index) => (
              <li key={`item-${index}`} className="user-menu__item">
                <Link href={item.href} className="user-menu__link" prefetch={false}>
                  <img
                    src={item.icon}
                    alt=""
                    className="user-menu__icon--item"
                    aria-hidden="true"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            <li className="user-menu__item">
              <button
                type="button"
                onClick={onLogout}
                className="user-menu__button--logout"
                aria-label="Log out of account"
              >
                <img
                  src="/icons/logout.svg"
                  alt=""
                  className="user-menu__icon--item"
                  aria-hidden="true"
                  width={20}
                  height={20}
                  loading="lazy"
                />
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </>
      )}
    </nav>
  );
};

export default memo(UserMenu);