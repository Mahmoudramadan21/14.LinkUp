import React, { memo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa";
import { RootState, AppDispatch } from "@/store";
import {
  followUserThunk,
  unfollowUserThunk,
  acceptFollowRequestThunk,
  rejectFollowRequestThunk,
  clearError,
} from "@/store/profileSlice";
import styles from "@/app/(main)/connections/connections.module.css";
import Link from "next/link";

/**
 * User interface defines the structure of a user object.
 */
interface User {
  userId: number;
  username: string;
  profileName?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  isFollowed?: boolean | "pending" | undefined;
}

/**
 * UserCardProps interface defines the props for the UserCard component.
 */
interface UserCardProps {
  user: User;
  requestId?: number;
  isFollowed?: boolean | "pending";
  isPending?: boolean;
  onFollowToggle?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  isOwnProfile?: boolean;
}

/**
 * UserCard component displays a user's information with follow/unfollow or accept/reject actions.
 * 
 * @param {UserCardProps} props - The props for the UserCard component.
 * @returns {JSX.Element} The rendered user card.
 */
const UserCard = memo(({ user, requestId, isFollowed = false, isPending = false, onFollowToggle, onAccept, onReject }: UserCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.profile);

  /**
   * Handles toggling follow/unfollow for the user.
   */
  const handleFollow = useCallback(() => {
    if (isFollowed === false) {
      dispatch(followUserThunk(user.userId));
    } else {
      dispatch(unfollowUserThunk(user.userId));
    }
    onFollowToggle?.();
  }, [dispatch, isFollowed, user.userId, onFollowToggle]);

  /**
   * Handles accepting a follow request.
   */
  const handleAccept = useCallback(() => {
    if (requestId !== undefined) {
      dispatch(acceptFollowRequestThunk(requestId));
      onAccept?.();
    }
  }, [dispatch, requestId, onAccept]);

  /**
   * Handles rejecting a follow request.
   */
  const handleReject = useCallback(() => {
    if (requestId !== undefined) {
      dispatch(rejectFollowRequestThunk(requestId));
      onReject?.();
    }
  }, [dispatch, requestId, onReject]);

  // Extract error values for cleaner dependency array
  const followError = error.followUser[user.userId];
  const unfollowError = error.unfollowUser[user.userId];
  const removeFollowerError = error.removeFollower[user.userId];

  // Clear errors when they occur
  useEffect(() => {
    if (followError) {
      dispatch(clearError("followUser"));
    }
    if (unfollowError) {
      dispatch(clearError("unfollowUser"));
    }
    if (removeFollowerError) {
      dispatch(clearError("removeFollower"));
    }
  }, [followError, unfollowError, removeFollowerError, dispatch]);

  return (
    <li
      className={styles["connections__user-card"]}
      aria-label={`User card for ${user.username}`}
    >
      <Link href={`/${user.username}`}>
        <Image
          src={user.profilePicture || "/avatars/default-avatar.svg"}
          alt={`${user.username}'s profile picture`}
          width={56}
          height={56}
          className={styles["connections__user-card-avatar"]}
          loading="lazy"
        />
      </Link>
      <div className={styles["connections__user-card-info"]}>
        <Link
          href={`/${user.username}`}
          className={`${styles["connections__user-card-name"]} hover:underline`}
        >
          @{user.username}
        </Link>
        <p className={styles["connections__user-card-bio"]}>{user.bio || "No bio available"}</p>
      </div>
      <div className={styles["connections__user-card-actions"]}>
        {isPending ? (
          <>
            <button
              onClick={handleAccept}
              className={styles["connections__user-card-button--accept"]}
              aria-label={`Accept follow request from ${user.username}`}
            >
              {loading.acceptRequest ? <FaSpinner className="animate-spin" /> : "Accept"}
            </button>
            <button
              onClick={handleReject}
              className={styles["connections__user-card-button--reject"]}
              aria-label={`Reject follow request from ${user.username}`}
            >
              {loading.rejectRequest ? <FaSpinner className="animate-spin" /> : "Reject"}
            </button>
          </>
        ) : (
          <button
            onClick={handleFollow}
            disabled={loading.followUser[user.userId] || loading.unfollowUser[user.userId]}
            className={
              isFollowed === true
                ? "btn-unfollow"
                : isFollowed === "pending"
                ? "btn-pending"
                : "btn-follow"
            }
            aria-label={
              isFollowed === true
                ? `Unfollow ${user.username}`
                : isFollowed === "pending"
                ? `Follow request pending for ${user.username}`
                : `Follow ${user.username}`
            }
          >
            {loading.followUser[user.userId] || loading.unfollowUser[user.userId] ? (
              <FaSpinner className="animate-spin" />
            ) : isFollowed === true ? (
              "Unfollow"
            ) : isFollowed === "pending" ? (
              "Requested"
            ) : (
              "Follow"
            )}
          </button>
        )}
      </div>
    </li>
  );
});

UserCard.displayName = "UserCard";

export default UserCard;