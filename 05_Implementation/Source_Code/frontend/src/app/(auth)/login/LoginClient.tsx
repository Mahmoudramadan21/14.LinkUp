'use client';

/**
 * Client component for the login page in the LinkUp application.
 * Renders the login form with an illustration for visual appeal.
 */

import LoginForm from './LoginForm';
import Image from 'next/image';
import type { JSX } from 'react';
import styles from "../auth-layout.module.css"

/**
 * Renders the login client component with form and illustration.
 * @returns {JSX.Element} The login client component.
 */
const LoginClient = (): JSX.Element => {
  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-page__container"]}>
        <div className={styles["auth-page__form"]}>
          <LoginForm />
        </div>
        <div className={styles["auth-page__illustration"]} aria-hidden="true">
          <Image
            src="/illustrations/login-illustration.svg"
            alt="People connecting on LinkUp"
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

export default LoginClient;