import React, { memo, useEffect, useRef, useMemo } from "react";
import { FollowRequestItem, FollowUser } from "@/types/profile";
import UserCard from "./UserCard";
import UserCardSkeleton from "./UserCardSkeleton";
import styles from "@/app/(main)/connections/connections.module.css";

/**
 * TabPanelProps interface defines the props for the TabPanel component.
 */
interface TabPanelProps {
  type: "suggestions" | "requests" | "followers" | "following";
  data: FollowUser[] | FollowRequestItem[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  isOwnProfile: boolean;
}

/**
 * TabPanel component displays a list of users or follow requests based on the tab type.
 * It supports infinite scrolling and shows loading skeletons or empty messages as needed.
 * 
 * @param {TabPanelProps} props - The props for the TabPanel component.
 * @returns {JSX.Element} The rendered tab panel.
 */
const TabPanel = memo(({ type, data, hasMore, loading, onLoadMore, isOwnProfile }: TabPanelProps) => {
  // Ref for IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Ref for the sentinel element used in infinite scrolling
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Set up IntersectionObserver for infinite scrolling
  useEffect(() => {
    if (sentinelRef.current && hasMore && !loading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(sentinelRef.current);
    }
    
    // Cleanup observer on unmount
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Memoized transformation of data into a consistent format for rendering
  const userData = useMemo(() => {
    if (type === "requests") {
      return (data as FollowRequestItem[]).map((item) => ({
        user: {
          userId: item.user.userId,
          username: item.user.username,
          profilePicture: item.user.profilePicture || null,
          bio: item.user.bio,
          profileName: item.user.username, // Fallback to username as profileName is not available
          isFollowed: "pending", // Default to "pending" for follow requests
        },
        requestId: item.requestId,
      }));
    }
    return (data as FollowUser[]).map((item) => ({
      user: {
        userId: item.userId,
        username: item.username,
        profileName: item.profileName,
        profilePicture: item.profilePicture,
        bio: item.bio,
        isFollowed: item.isFollowed,
      },
      requestId: undefined,
    }));
  }, [data, type]);

  return (
    <div className={styles["connections__tab-panel"]} role="tabpanel" aria-labelledby={type}>
      {userData.length === 0 && !loading ? (
        <p className={styles["connections__tab-panel-empty"]} aria-live="polite">
          {type === "suggestions" && "No suggestions available."}
          {type === "requests" && "No pending requests."}
          {type === "followers" && "No followers yet."}
          {type === "following" && "You are not following anyone."}
        </p>
      ) : (
        <ul className={styles["connections__user-list"]}>
          {userData.map(({ user, requestId }) => (
            <UserCard
              key={user.userId}
              user={user}
              requestId={requestId}
              isFollowed={user.isFollowed}
              isPending={type === "requests"}
              onFollowToggle={() => {}}
              onAccept={type === "requests" ? () => {} : undefined}
              onReject={type === "requests" ? () => {} : undefined}
              isOwnProfile={isOwnProfile}
            />
          ))}
          {loading && (
            <>
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </>
          )}
          {hasMore && <div ref={sentinelRef} className={styles["connections__sentinel"]} />}
        </ul>
      )}
    </div>
  );
});

TabPanel.displayName = "TabPanel";

export default TabPanel;