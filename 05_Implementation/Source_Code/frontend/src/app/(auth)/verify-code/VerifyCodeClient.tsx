'use client';

/**
 * Client component for the verify code page in the LinkUp application.
 * Renders the verification code form and an illustration for visual appeal.
 */

import Image from 'next/image';
import VerificationCodeForm from './VerificationCodeForm';
import type { JSX } from 'react';
import styles from "../auth-layout.module.css"

/**
 * Renders the verify code client component with form and illustration.
 * @returns {JSX.Element} The verify code client component.
 */
const VerifyCodeClient = (): JSX.Element => {
  return (
    <div className={styles["auth-page__container"]}>
      <div className={styles["auth-page__form"]}>
        <VerificationCodeForm />
      </div>
      <div className={styles["auth-page__illustration"]} aria-hidden="true">
        <Image
          src="/illustrations/auth-security-illustration.svg"
          alt="Illustration of a person verifying a code securely"
          width={500}
          height={500}
          className={styles["auth-page__image--illustration"]}
          loading="lazy"
          sizes="(max-width: 1024px) 50vw, 500px"
        />
      </div>
    </div>
  );
};

export default VerifyCodeClient;