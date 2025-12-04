'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css';

/**
 * Avatar button that allows the user to create a new story highlight.
 * Appears in the highlights tray with a plus icon and "New Highlight" label.
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
const CreateHighlightAvatar: React.FC = React.memo(() => {
  const { username } = useParams();

  return (
    <Link href={`/${username}/highlights/create`} scroll={false} prefetch={false}>
      <button
        className="flex flex-col items-center gap-xs"
        aria-label="Create new highlight"
        role="button"
        tabIndex={0}
      >
        {/* Avatar with plus icon */}
        <div className="avatar--ring">
          <div className="avatar--inner flex justify-center items-center bg-neutral-gray">
            <FaPlus size={24} className="text-gray-500 dark:text-gray-300" />
          </div>
        </div>

        {/* Label below the avatar */}
        <span className={styles.stories__username}>New Highlight</span>
      </button>
    </Link>
  );
});

CreateHighlightAvatar.displayName = 'CreateHighlightAvatar';

export default CreateHighlightAvatar;