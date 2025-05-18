'use client';
import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIconProps } from '@/types';

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

  // Icon and badge content
  const content = (
    <>
      <img
        src={isActive && activeIconSrc ? activeIconSrc : iconSrc}
        alt={alt}
        className="nav-icon__icon"
        loading="lazy"
      />
      {badgeCount && badgeCount > 0 ? (
        <span className="nav-icon__badge" aria-hidden="true">
          {badgeCount}
        </span>
      ) : null}
    </>
  );

  // BEM class with variant and active state
  const className = `nav-icon__wrapper nav-icon__wrapper--${variant} ${isActive ? 'nav-icon__wrapper--active' : ''}`;

  if (to) {
    return (
      <Link
        href={to}
        className={className}
        aria-label={ariaLabel}
        aria-current={isActive ? 'page' : undefined}
        data-testid="nav-icon"
        onClick={onClick}
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

export default memo(NavIcon);