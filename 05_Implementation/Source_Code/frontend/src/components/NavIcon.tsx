import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
 * NavIcon Component
 * A navigation icon with an optional badge for notifications, supporting active states.
 * Used in navigation bars or menus for routing to different sections of the app or triggering actions.
 */
interface NavIconProps {
  iconSrc: string; // URL of the default icon
  activeIconSrc?: string; // URL of the icon when active (optional)
  alt: string; // Alt text for the icon
  ariaLabel: string; // Accessibility label for the link or button
  to?: string; // Destination URL for navigation (optional)
  badgeCount?: number; // Optional badge count for notifications
  variant?: 'default' | 'mobile'; // Style variant for different layouts
  onClick?: () => void; // Optional click handler for actions
}

const NavIcon: React.FC<NavIconProps> = ({
  iconSrc,
  activeIconSrc,
  alt,
  ariaLabel,
  to,
  badgeCount,
  variant = 'default',
  onClick,
}) => {
  const pathname = usePathname();
  const isActive = to ? pathname === to : false;

  const content = (
    <>
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
    </>
  );

  const className = `nav-icon ${variant} ${isActive ? 'active' : ''}`;

  if (to) {
    return (
      <Link
        href={to}
        className={className}
        aria-label={ariaLabel}
        data-testid="nav-icon"
        onClick={onClick} // Support onClick even with Link
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      aria-label={ariaLabel}
      data-testid="nav-icon"
      onClick={onClick}
    >
      {content}
    </button>
  );
};

export default NavIcon;