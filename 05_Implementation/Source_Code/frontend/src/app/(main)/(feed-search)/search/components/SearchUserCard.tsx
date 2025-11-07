// app/(main)/(feed-search)/search/components/SearchUserCard.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaSpinner } from 'react-icons/fa';

import styles from '../search.module.css';

interface SearchUserCardProps {
  user: {
    userId: number;
    username: string;
    profilePicture?: string | null;
    bio?: string | null;
    /** true = followed, false = not followed, 'pending' = request sent */
    isFollowed: boolean | 'pending';
  };
  onFollow: (userId: number, isFollowed: boolean | 'pending') => void;
  isFollowingLoading: Record<number, boolean>;
  isUnfollowingLoading: Record<number, boolean>;
}

/**
 * SearchUserCard
 * Individual user result card in search results (People tab or All tab preview).
 * 
 * Features:
 * - Clickable profile link
 * - Follow/Unfollow button with loading & pending states
 * - Fully accessible with proper ARIA labels
 */
const SearchUserCard = memo(
  ({
    user,
    onFollow,
    isFollowingLoading,
    isUnfollowingLoading,
  }: SearchUserCardProps) => {
    const { userId, username, profilePicture, bio, isFollowed } = user;

    const isLoading = isFollowingLoading[userId] || isUnfollowingLoading[userId];
    const isFollowedState = isFollowed === true;
    const isPending = isFollowed === 'pending';

    return (
      <article
        className={styles.search__user}
        aria-labelledby={`search-user-name-${userId}`}
      >
        {/* Profile Link */}
        <Link
          href={`/${username}`}
          className={styles.search__user__link}
          prefetch={false}
          aria-label={`Visit profile of @${username}`}
        >
          <Image
            src={profilePicture || '/avatars/default-avatar.svg'}
            alt=""
            width={80}
            height={80}
            className={styles.search__user__avatar}
            loading="lazy"
            aria-hidden="true"
          />

          <div className={styles.search__user__info}>
            <h3
              id={`search-user-name-${userId}`}
              className={styles.search__user__name}
            >
              @{username}
            </h3>
            <p className={styles.search__user__bio}>
              {bio || 'No bio available'}
            </p>
          </div>
        </Link>

        {/* Follow / Unfollow Button */}
        <button
          onClick={() => onFollow(userId, isFollowed)}
          disabled={isLoading}
          className={`
            ${styles.search__user__follow}
            ${isFollowedState ? styles['search__user__follow--followed'] : ''}
            ${isPending ? styles['search__user__follow--pending'] : ''}
            ${isLoading ? styles['search__user__follow--loading'] : ''}
          `.trim()}
          aria-label={
            isFollowedState
              ? `Unfollow @${username}`
              : isPending
              ? `Follow request pending for @${username}`
              : `Follow @${username}`
          }
          aria-busy={isLoading}
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" aria-hidden="true" />
          ) : isFollowedState ? (
            'Unfollow'
          ) : isPending ? (
            'Requested'
          ) : (
            'Follow'
          )}
        </button>
      </article>
    );
  }
);

SearchUserCard.displayName = 'SearchUserCard';

export default SearchUserCard;