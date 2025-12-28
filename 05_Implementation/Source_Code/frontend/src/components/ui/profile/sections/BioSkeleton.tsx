'use client';

import React, { memo } from 'react';
import styles from '@/app/(main)/[username]/profile.module.css';

/**
 * Skeleton loader for the user bio section.
 * Displays a shimmering placeholder while the actual bio data is being fetched.
 * 
 * Uses animate-pulse (Tailwind) for the loading animation and proper ARIA attributes
 * for screen reader accessibility.
 * 
 * @component
 * @example
 * ```tsx
 * {isLoading ? <BioSkeleton /> : <BioContent {...data} />}
 * ```
 */
const BioSkeleton: React.FC = memo( () => {
  return (
    <div
      className={`${styles['profile-content__bio_card']}`}
      role="region"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading profile bio"
    >
      {/* Header: Title + Action Icon */}
      <div className={styles['profile_bio__header']}>
        <div className="h-6 w-20 rounded bg-neutral-gray animate-pulse" />
        <div className="h-6 w-6 rounded bg-neutral-gray animate-pulse" />
      </div>

      {/* Bio text placeholder */}
      <div className="mb-4 h-4 w-3/4 rounded bg-neutral-gray animate-pulse" />

      {/* Detail rows (e.g., location, website, join date) */}
      <div className={styles['profile_bio__details']}>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className={styles['profile_bio__detail_item']}
          >
            {/* Icon placeholder */}
            <div className="h-5 w-5 rounded bg-neutral-gray animate-pulse" />
            {/* Text placeholder */}
            <div className="h-4 w-1/2 rounded bg-neutral-gray animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Helpful display names for React DevTools and better debugging
BioSkeleton.displayName = 'BioSkeleton';

export default BioSkeleton;