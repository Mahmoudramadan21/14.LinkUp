'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';
import { UserX } from 'lucide-react';
import styles from '@/app/(main)/[username]/profile.module.css';

interface ProfileNotFoundProps {
  /** The username that was not found (used for display and accessibility) */
  username: string;
}

/**
 * Full-page error state displayed when a user profile cannot be found.
 * Features a clean, accessible design with clear call-to-action.
 */
const ProfileNotFound: React.FC<ProfileNotFoundProps> = memo(({ username }) => {
  return (
    <div
      className={styles['profile-not-found__container']}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Visual Icon */}
      <UserX
        aria-hidden="true"
        focusable="false"
        className={styles['profile-not-found__icon']}
        size={96}
        strokeWidth={1.5}
      />

      {/* Screen reader description */}
      <span className="sr-only">
        Profile not found illustration: A person with a crossed-out silhouette indicating the user does not exist.
      </span>

      {/* Main Title */}
      <h1 className={styles['profile-not-found__title']}>
        @{username} Not Found
      </h1>

      {/* Helpful Message */}
      <p className={styles['profile-not-found__message']}>
        Sorry, this page isn&apos;t available. The link may be broken, or the profile has been removed.
      </p>

      {/* Primary Action */}
      <Link
        href="/"
        className={styles['profile-not-found__link']}
        aria-label="Return to home feed"
        prefetch={false}
      >
        <FaHome aria-hidden="true" className="mr-2" />
        Back to Home
      </Link>
    </div>
  );
});

ProfileNotFound.displayName = 'ProfileNotFound';

export default ProfileNotFound;