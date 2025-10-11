'use client';

import { StoryFeedItem } from '@/types/story';
import Image from 'next/image';
import React from 'react';
import styles from '@/app/feed/stories.module.css';

/**
 * Props for the StoryAvatar component.
 */
interface StoryAvatarProps {
  user: StoryFeedItem;
  onClick: () => void;
  hasUnviewed: boolean;
  'aria-label': string;
}

/**
 * StoryAvatar component for displaying a user's story avatar with a clickable button.
 * Optimized with memoization to prevent unnecessary re-renders.
 */
const StoryAvatar: React.FC<StoryAvatarProps> = React.memo(
  ({ user, onClick, hasUnviewed, 'aria-label': ariaLabel }) => {
    return (
      <button
        className={styles.stories__avatar_wrapper}
        onClick={onClick}
        aria-label={ariaLabel}
        tabIndex={0}
      >
        <div
          className={`${styles.stories__avatar_ring} ${
            hasUnviewed ? styles.stories__avatar_ring_unviewed : ''
          }`}
        >
          <Image
            src={user.profilePicture || '/avatars/default-avatar.svg'}
            alt={`${user.username}'s profile picture`}
            width={56}
            height={56}
            className={styles.stories__avatar}
            loading="lazy" // Performance: lazy load images
            priority={false} // No priority since these are likely not above-the-fold
            placeholder="blur" // Optional: add blur placeholder for better UX
            blurDataURL="/avatars/default-avatar-blur.svg" // Optional: provide a low-res placeholder
          />
        </div>
        <span className={styles.stories__username}>{user.username}</span>
      </button>
    );
  }
);

StoryAvatar.displayName = 'StoryAvatar';

export default StoryAvatar;