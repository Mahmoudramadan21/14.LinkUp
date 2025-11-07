'use client';

import React, { memo } from "react";
import Image from "next/image";
import styles from "@/app/(main)/(feed-search)/feed/stories.module.css";
import { StoryFeedItem } from "@/types/story";

/**
 * Props for the StoryAvatar component
 */
interface StoryAvatarProps {
  user: StoryFeedItem;
  onClick: () => void;
  hasUnviewed: boolean;
  "aria-label": string;
}

/**
 * Interactive story avatar in the stories tray.
 * Shows a colored ring when there are unviewed stories.
 * Optimized with React.memo for performance in long horizontal lists.
 */
const StoryAvatar = memo<StoryAvatarProps>(
  ({ user, onClick, hasUnviewed, "aria-label": ariaLabel }) => {
    return (
      <button
        className={`${styles.stories__avatar_wrapper} ${styles.secondary}`}
        onClick={onClick}
        aria-label={ariaLabel}
        title={`${user.username}'s story`}
      >
        {/* Avatar Ring - changes color based on view status */}
        <div
          className={`${styles.stories__avatar_ring} ${
            hasUnviewed ? styles.stories__avatar_ring_unviewed : ""
          } avatar--ring`}
        >
          <Image
            src={user.profilePicture || "/avatars/default-avatar.svg"}
            alt={`${user.username}'s profile picture`}
            width={56}
            height={56}
            className={styles.stories__avatar}
            loading="lazy"
            placeholder="blur"
            blurDataURL="/avatars/default-avatar-blur.svg"
            quality={75}
          />
        </div>

        {/* Username label */}
        <span className={styles.stories__username}>{user.username}</span>
      </button>
    );
  }
);

StoryAvatar.displayName = "StoryAvatar";

export default StoryAvatar;