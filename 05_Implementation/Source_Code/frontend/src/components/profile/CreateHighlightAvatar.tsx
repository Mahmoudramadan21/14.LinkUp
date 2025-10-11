'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import styles from '@/app/feed/stories.module.css';

/**
 * CreateHighlightAvatar component for displaying a button to create a new highlight.
 * Optimized for performance with memoization.
 */
const CreateHighlightAvatar: React.FC = React.memo(() => {
  const { username } = useParams();
  
  return (
    <Link href={`${username}/highlights/create`} scroll={false} prefetch={false}>
      <button
        className={styles.stories__avatar_wrapper}
        aria-label="Create new highlight"
        role="button"
        tabIndex={0}
      >
        <div className={`${styles.stories__avatar_ring} ${styles.stories__avatar_ring_viewed}`}>
          <div className="w-[var(--avatar-inner-size)] h-[var(--avatar-inner-size)] flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
            <FaPlus size={24} className="text-gray-500 dark:text-gray-300" />
          </div>
        </div>
        <span className={styles.stories__username}>New Highlight</span>
      </button>
    </Link>
  );
});

CreateHighlightAvatar.displayName = 'CreateHighlightAvatar';

export default CreateHighlightAvatar;
