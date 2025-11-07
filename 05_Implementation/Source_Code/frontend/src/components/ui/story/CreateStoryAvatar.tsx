'use client';

import React from 'react';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css';

/**
 * CreateStoryAvatar component for displaying a button to create a new story.
 * Optimized for performance with memoization.
 */
const CreateStoryAvatar: React.FC = React.memo(() => {
  return (
    <Link href="/feed/stories/create" scroll={false} prefetch={false}>
      <button
        className={`${styles.stories__avatar_wrapper} ${styles.secondary}`}
        aria-label="Create new story"
        role="button"
        tabIndex={0}
      >
        <div className={`${styles.stories__avatar_ring_unviewed} avatar--ring`}>
          <div className="avatar--inner flex justify-center items-center bg-neutral-gray">
            <FaPlus size={24} className="text-gray-500 dark:text-gray-300" />
          </div>
        </div>
        <span className={styles.stories__username}>Your Story</span>
      </button>
    </Link>
  );
});

CreateStoryAvatar.displayName = 'CreateStoryAvatar';

export default CreateStoryAvatar;