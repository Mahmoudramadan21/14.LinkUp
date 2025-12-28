'use client';

import React, { memo } from 'react';
import styles from '@/app/(main)/[username]/profile.module.css';

/**
 * Comprehensive skeleton loader for the entire profile header.
 * Displays animated placeholders for:
 * - Cover photo + edit button
 * - Profile picture
 * - Name & username
 * - Stats (posts, followers, following)
 * - Action buttons (Follow/Edit Profile)
 * - Highlights reel
 * - Bottom tabs (Posts / Saved)
 *
 * Uses animate-pulse for smooth loading feedback and proper ARIA attributes.
 */
const ProfileHeaderSkeleton: React.FC = memo(() => {
  return (
    <div
      className={`${styles['profile-header__container']}`}
      role="region"
      aria-label="Loading profile header"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Cover Photo Section */}
      <div className={styles['profile-header__header']}>
        <div className={styles['profile-header__cover']}>
          {/* Cover Image Placeholder */}
          <div className={`${styles['profile-header__cover-placeholder']} bg-neutral-gray animate-pulse`} />
        </div>

        {/* Profile Picture */}
        <div className={styles['profile-header__info']}>
          <div className={styles['profile-header__profile-pic']}>
            <div className={`${styles['profile-header__profile-placeholder']} bg-neutral-gray animate-pulse`} />
          </div>
        </div>
      </div>

      {/* Main Content: Name, Stats, Actions */}
      <div className={styles['profile-header__content']}>
        {/* Name & Username */}
        <div className={styles['profile-header__details']}>
          <div className="h-8 w-48 bg-neutral-gray animate-pulse rounded-lg mb-3 mx-auto lg:mx-0" />
          <div className="h-5 w-32 bg-neutral-gray animate-pulse rounded mx-auto lg:mx-0" />
        </div>

        {/* Stats: Posts, Followers, Following */}
        <div className={styles['profile-header__stats']}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={styles['profile-header__stat__item']}>
              <div className="h-7 w-16 bg-neutral-gray animate-pulse rounded mx-auto" />
              <div className="h-4 w-20 bg-neutral-gray animate-pulse rounded mx-auto mt-2" />
            </div>
          ))}
        </div>

        {/* Action Buttons (Follow / Edit Profile / Share) */}
        <div className={styles['profile-header__actions']}>
          <div className="h-11 w-32 bg-neutral-gray animate-pulse rounded-full" />
          <div className="h-11 w-11 bg-neutral-gray animate-pulse rounded-full" />
        </div>
      </div>

      {/* Highlights Reel */}
      <div className={styles['profile-header__highlights']}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles['profile-header__highlight-item']}>
            <div className="w-16 h-16 bg-neutral-gray animate-pulse rounded-full ring-4 ring-[var(--section-bg)]" />
            <div className="h-4 w-16 bg-neutral-gray animate-pulse rounded mt-2 mx-auto" />
          </div>
        ))}
      </div>

      {/* Bottom Navigation Tabs */}
      <div className={styles['profile-header__tabs']}>
        {['Posts', 'Saved'].map((_, i) => (
          <div key={i} className={styles['profile-header__tab']}>
            <div className="w-8 h-8 bg-neutral-gray animate-pulse rounded mx-auto" />
            <div className="h-4 w-14 bg-neutral-gray animate-pulse rounded mt-2 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
});

ProfileHeaderSkeleton.displayName = 'ProfileHeaderSkeleton';

export default ProfileHeaderSkeleton;