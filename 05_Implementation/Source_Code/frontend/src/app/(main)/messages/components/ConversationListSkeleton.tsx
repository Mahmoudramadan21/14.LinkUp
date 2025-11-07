import { memo } from 'react';

import styles from '../messages.module.css';

/**
 * ConversationListSkeleton
 * Loading placeholder for the conversations sidebar.
 * Displays 5 shimmering skeleton items during initial data fetch.
 *
 * Uses Tailwind's `animate-pulse` for smooth loading animation.
 * Fully accessible with proper ARIA attributes.
 */
const ConversationListSkeleton = memo(() => {
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className={`${styles['messages__conversation_item']} animate-pulse`}
          role="status"
          aria-label="Loading conversation"
        >
          {/* Avatar Skeleton */}
          <div className="avatar--lg bg-neutral-gray rounded-full" />

          {/* Text Content Skeleton */}
          <div className={styles['messages__conversation_info']}>
            <div className="h-4 w-32 bg-neutral-gray rounded-md mb-2" />
            <div className="h-3 w-48 bg-neutral-gray rounded-md" />
          </div>

          {/* Timestamp Skeleton */}
          <div className="h-3 w-12 bg-neutral-gray rounded-md" />
        </div>
      ))}
    </>
  );
});

ConversationListSkeleton.displayName = 'ConversationListSkeleton';

export default ConversationListSkeleton;