'use client';

/**
 * Client component for the reset password page in the LinkUp application.
 * Renders the reset password form and an illustration for visual appeal.
 */

import Image from 'next/image';
import ResetPasswordForm from './ResetPasswordForm';
import type { JSX } from 'react';
import styles from "../auth-layout.module.css"

/**
 * Renders the reset password client component with form and illustration.
 * @returns {JSX.Element} The reset password client component.
 */
const ResetPasswordClient = (): JSX.Element => {
  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-page__container"]}>
        <div className={styles["auth-page__form"]}>
          <ResetPasswordForm />
        </div>
        <div className={styles["auth-page__illustration"]} aria-hidden="true">
          <Image
            src="/illustrations/auth-security-illustration.svg"
            alt="Illustration of a person resetting their password securely"
            width={500}
            height={500}
            className={styles["auth-page__image--illustration"]}
            loading="lazy"
            sizes="(max-width: 1024px) 50vw, 500px"
          />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordClient;