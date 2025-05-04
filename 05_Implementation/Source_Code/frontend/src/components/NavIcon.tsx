import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
 * NavIcon Component
 * A navigation icon with an optional badge for notifications, supporting active states.
 * Used in navigation bars or menus for routing to different sections of the app.
 */
interface NavIconProps {
  iconSrc: string; // URL of the default icon
  activeIconSrc?: string; // URL of the icon when active (optional)
  alt: string; // Alt text for the icon
  ariaLabel: string; // Accessibility label for the link
  to: string; // Destination URL for navigation
  badgeCount?: number; // Optional badge count for notifications
  variant?: 'default' | 'mobile'; // Style variant for different layouts
}

const NavIcon: React.FC<NavIconProps> = ({
  iconSrc,
  activeIconSrc,
  alt,
  ariaLabel,
  to,
  badgeCount,
  variant = 'default',
}) => {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <Link
      href={to}
      className={`nav-icon ${variant} ${isActive ? 'active' : ''}`}
      aria-label={ariaLabel}
      data-testid="nav-icon"
    >
      <img
        src={isActive && activeIconSrc ? activeIconSrc : iconSrc}
        alt={alt}
        className="nav-icon__icon"
        loading="lazy" // Lazy-load icons for performance
      />
      {badgeCount && badgeCount > 0 ? (
        <span className="nav-icon__badge" aria-hidden="true">
          {badgeCount}
        </span>
      ) : null}
    </Link>
  );
};

export default NavIcon;