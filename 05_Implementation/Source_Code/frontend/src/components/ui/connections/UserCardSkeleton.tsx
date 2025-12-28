// components/ui/connections/UserCard/UserCardSkeleton.tsx
import React, { memo } from "react";
import styles from "@/app/(main)/connections/connections.module.css"; 

const UserCardSkeleton = memo(() => (
  <div className={`${styles["connections__user-card"]}`}>
    {/* Avatar */}
    <div className="min-w-14 h-14 rounded-full bg-neutral-gray animate-pulse"></div>

    {/* Info */}
    <div className={styles["connections__user-card-info"]}>
      <div className="h-5 w-32 rounded bg-neutral-gray animate-pulse mb-2"></div>
      <div className="h-4 w-40 rounded bg-neutral-gray animate-pulse"></div>
    </div>

    {/* Button */}
    <div className="h-9 w-24 rounded-full bg-neutral-gray animate-pulse"></div>
  </div>
));

UserCardSkeleton.displayName = "UserCardSkeleton";

export default UserCardSkeleton;
