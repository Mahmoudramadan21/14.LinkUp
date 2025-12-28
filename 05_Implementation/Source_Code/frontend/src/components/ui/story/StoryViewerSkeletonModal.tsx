'use client';

import React, { useMemo, useRef } from 'react';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css'; // Adjust the path to your CSS

interface StoryViewerSkeletonModalProps {
  storyFeedLength?: number; // Optional: how many skeleton avatars to show
}

/**
 * Skeleton Modal for Stories Viewer
 * - Displays loading placeholders while the story feed is being fetched
 * - Includes user list skeleton, story content skeleton, and action buttons
 * - Fully accessible with ARIA roles
 */
const StoryViewerSkeletonModal: React.FC<StoryViewerSkeletonModalProps> = ({ storyFeedLength = 5 }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Skeleton for the user list (avatars)
  const UserListSkeleton = useMemo(
    () => (
      <div className={styles.stories__viewer_users} role="navigation" aria-label="Loading story users">
        {Array.from({ length: storyFeedLength }).map((_, i) => (
          <div
            key={`hl-skeleton-${i}`}
            className={styles.stories__avatar_wrapper}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`${styles.stories__avatar_ring} ${styles.stories__skeleton} bg-gray-700`}>
              <div className={`${styles.stories__avatar} ${styles.stories__skeleton} bg-gray-600`} />
            </div>
            <div className={`${styles.stories__username} ${styles.stories__skeleton} bg-gray-700 w-12 h-3 mt-1`} />
          </div>
        ))}
      </div>
    ),
    [storyFeedLength]
  );

  // Skeleton for the main story content
  const StorySkeleton = useMemo(
    () => (
      <div className={styles.stories__viewer_story}>
        {/* Story Header */}
        <div className={styles.stories__viewer_story_header}>
          <div className="flex items-center">
            <div className={`${styles.stories__viewer_avatar} ${styles.stories__skeleton} bg-neutral-gray`} />
            <div className={`${styles.stories__viewer_username} ${styles.stories__skeleton} bg-neutral-gray ml-2 w-20 h-4`} />
          </div>
          <div className={`${styles.stories__viewer_menu_button} ${styles.stories__skeleton} bg-neutral-gray w-8 h-8 rounded-full`} />
        </div>

        {/* Progress Bars */}
        <div className={styles.stories__viewer_progress} aria-label="Loading progress">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`progress-${i}`} className={styles.stories__viewer_progress_bar}>
              <div
                className={`${styles.stories__viewer_progress_fill} ${styles.stories__skeleton} bg-neutral-gray`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            </div>
          ))}
        </div>

        {/* Media Skeleton */}
        <div className={styles.stories__viewer_content}>
          <div className={`${styles.stories__viewer_media} ${styles.stories__skeleton} bg-neutral-gray`} />
        </div>

        {/* Actions Skeleton */}
        <div className={styles.stories__viewer_actions}>
          <div className={`${styles.stories__viewer_latest_viewers} ${styles.stories__skeleton} bg-neutral-gray w-32 h-6 rounded`} />
          <div className={`${styles.stories__viewer_action} ${styles.stories__skeleton} bg-neutral-gray ml-auto mr-4 w-6 h-6 rounded-full`} />
        </div>
      </div>
    ),
    []
  );

  return (
    <div
      className={`${styles.stories__viewer_modal_overlay} bg-overlay`}
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      tabIndex={-1}
      ref={modalRef}
    >
      {/* Modal Header Skeleton */}
      <div className={styles.stories__viewer_header}>
        <div className={styles.stories__viewer_user}>
          <span className={`${styles.stories__viewer_username} ${styles.stories__skeleton} bg-neutral-gray w-24 h-5`} />
          <button
            className={`${styles.stories__viewer_close} ${styles.stories__skeleton} bg-neutral-gray w-5 h-5 rounded-full`}
            tabIndex={-1}
          />
        </div>
      </div>

      {/* Modal Body Skeleton */}
      <div className={styles.stories__viewer_modal}>
        <div className={styles.stories__viewer_main}>
          {UserListSkeleton}
          {StorySkeleton}
        </div>
      </div>
    </div>
  );
};

export default StoryViewerSkeletonModal;
