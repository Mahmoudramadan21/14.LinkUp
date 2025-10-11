import React, { memo } from "react";
import styles from "@/app/feed/feed.module.css";

const PostSkeleton: React.FC<{ ref?: React.Ref<HTMLDivElement> }> = ({ ref }) => {

  return (
    <article
      ref={ref}
      className={`${styles.feed__post} p-6`}
      aria-live="polite"
      aria-busy="true"
      role="article"
    >
      {/* Header Skeleton */}
      <div className={styles.feed__post_header}>
        <div
          className={`${styles.feed__post_avatar} ${styles.feed__skeleton} rounded-full`}
          style={{ width: "48px", height: "48px", animationDelay: "0s" }}
        />
        <div className="flex-1 space-y-2">
          <div
            className={`${styles.feed__skeleton} h-4 w-1/3 rounded`}
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className={`${styles.feed__skeleton} h-3 w-1/4 rounded`}
            style={{ animationDelay: "0.2s" }}
          />
        </div>
        <div
          className={`${styles.feed__skeleton} w-6 h-6 rounded-full`}
          style={{ animationDelay: "0.3s" }}
        />
      </div>

      {/* Content Skeleton */}
      <div className="mt-4 space-y-4">
        <div
          className={`${styles.feed__skeleton} h-4 w-full rounded`}
          style={{ animationDelay: "0.4s" }}
        />
        <div
          className={`${styles.feed__skeleton} h-64 rounded-lg`}
          style={{ animationDelay: "0.5s" }}
        />
      </div>

        {/* Actions Skeleton */}
        <div className={`${styles.feed__post_actions} mt-4 w-full`}>
            <div className={`${styles.feed__post_actions_interactions}`}>
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                key={index}
                className={`${styles.feed__skeleton} h-6 w-10 rounded`}
                style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                />
            ))}
            </div>
            <div className={`${styles.feed__post_actions_save}`}>
            <div
                className={`${styles.feed__skeleton} h-6 w-10 rounded`}
                style={{ animationDelay: "1.2s" }}
            />
            </div>
        </div>
    </article>    
)
};

PostSkeleton.displayName = "PostSkeleton";

export default memo(PostSkeleton);