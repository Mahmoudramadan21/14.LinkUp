'use client';

import { memo } from 'react';
import styles from '@/app/(main)/(feed-search)/search/search.module.css';

/**
 * UserSkeleton
 * A lightweight, accessible skeleton loader for user items in lists
 * (e.g., suggestions, follow requests, search results).
 * 
 * Uses CSS-only animations (via Tailwind or custom module) for smooth pulsing effect.
 */
const UserSkeleton = memo(() => {
  {
  return (
    <div
      className={styles.skeleton__user}
      role="status"
      aria-live="polite"
      aria-label="Loading user information"
    >
      {/* Avatar placeholder */}
      <div className={`${styles.skeleton__avatar} bg-neutral-gray`} aria-hidden="true" />

      {/* Username + bio placeholder */}
      <div className={styles.skeleton__info}>
        <div className={`${styles.skeleton__line} bg-neutral-gray`} aria-hidden="true" />
        <div className={`${styles.skeleton__line_short} bg-neutral-gray`} aria-hidden="true" />
      </div>

      {/* Follow button placeholder */}
      <div className={`${styles.skeleton__button} bg-neutral-gray`} aria-hidden="true" />
    </div>
  );
}});

UserSkeleton.displayName = 'UserSkeleton';

export default UserSkeleton;