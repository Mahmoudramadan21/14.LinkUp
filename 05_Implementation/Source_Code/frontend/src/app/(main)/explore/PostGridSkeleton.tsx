// components/ui/skeleton/PostGridSkeleton.tsx
import React from "react";
import styles from "@/app/(main)/explore/explore.module.css";

// Random but realistic aspect ratios (like real photos/videos)
const ASPECT_RATIOS = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[1/1]",
  "aspect-[5/4]",
  "aspect-[16/9]",
  "aspect-[9/16]",
  "aspect-[3/5]",
  "aspect-[5/3]",
];

const PostGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className={styles.explore__posts_grid} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const ratioClass = ASPECT_RATIOS[index % ASPECT_RATIOS.length];

        return (
          <div
            key={`skeleton-${index}`}
            className={`${styles.explore__post_tile} overflow-hidden rounded-lg`}
          >
            <div className={`relative w-full ${ratioClass} bg-neutral-gray animate-pulse`}>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PostGridSkeleton;