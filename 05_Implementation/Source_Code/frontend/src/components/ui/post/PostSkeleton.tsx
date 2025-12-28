import React, { forwardRef, memo } from "react";
import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";

/**
 * Skeleton loader for a single post card.
 * Used during feed loading to provide visual feedback and improve perceived performance.
 * Supports forwardRef for IntersectionObserver usage in infinite scroll.
 */
const PostSkeleton = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <article
      ref={ref}
      className={`${styles.feed__post} p-6`}
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading post"
    >
      {/* Header Skeleton */}
      <div className={styles.feed__post_header}>
        {/* Avatar */}
        <div
          className={`$"avatar--md" bg-neutral-gray rounded-full animate-pulse`}
          style={{ width: "48px", height: "48px", animationDelay: "0s" }}
          aria-hidden="true"
        />

        {/* Username + Timestamp placeholder */}
        <div className="flex-1 space-y-2 ml-3">
          <div
            className={`bg-neutral-gray h-4 w-32 rounded animate-pulse`}
            style={{ animationDelay: "0.1s" }}
            aria-hidden="true"
          />
          <div
            className={`bg-neutral-gray h-3 w-24 rounded animate-pulse`}
            style={{ animationDelay: "0.2s" }}
            aria-hidden="true"
          />
        </div>

        {/* Menu button placeholder */}
        <div
          className={`bg-neutral-gray w-8 h-8 rounded-full animate-pulse`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden="true"
        />
      </div>

      {/* Content Skeleton */}
      <div className="mt-5 space-y-3">
        {/* Text lines */}
        <div
          className={`bg-neutral-gray h-4 w-full rounded animate-pulse`}
          style={{ animationDelay: "0.4s" }}
          aria-hidden="true"
        />
        <div
          className={`bg-neutral-gray h-4 w-11/12 rounded animate-pulse`}
          style={{ animationDelay: "0.5s" }}
          aria-hidden="true"
        />
        <div
          className={`bg-neutral-gray h-4 w-9/12 rounded animate-pulse`}
          style={{ animationDelay: "0.6s" }}
          aria-hidden="true"
        />

        {/* Media placeholder (image/video) */}
        <div
          className={`bg-neutral-gray h-64 rounded-lg animate-pulse`}
          style={{ animationDelay: "0.7s" }}
          aria-hidden="true"
        />
      </div>

      {/* Actions Skeleton */}
      <div className={`${styles.feed__post_actions} mt-5`}>
        <div className={styles.feed__post_actions_interactions}>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={`bg-neutral-gray h-8 w-16 rounded-lg animate-pulse`}
              style={{ animationDelay: `${0.9 + i * 0.1}s` }}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className={styles.feed__post_actions_save}>
          <div
            className={`bg-neutral-gray h-8 w-12 rounded-lg animate-pulse`}
            style={{ animationDelay: "1.2s" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </article>
  );
});

PostSkeleton.displayName = "PostSkeleton";

export default memo(PostSkeleton);