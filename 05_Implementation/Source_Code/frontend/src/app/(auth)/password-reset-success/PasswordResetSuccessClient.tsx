'use client';

/**
 * Client component for the password reset success page in the LinkUp application.
 * Renders a success message, continue button, and illustration with accessibility support.
 */
import { memo, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Image from 'next/image';
import Button from '@/components/ui/common/Button';
import { clearResetState } from "@/store/authSlice";
import type { JSX } from 'react';
import styles from "../auth-layout.module.css"

/**
 * Renders the password reset success UI with message and illustration.
 * @returns {JSX.Element} The password reset success client component.
 */
const PasswordResetSuccessClient = (): JSX.Element => {

  const router = useRouter();
  const dispatch = useDispatch();
  
  const handleContinue = () => {
    router.replace("/login");
  };
  
  useEffect(() => {
    return () => {
      dispatch(clearResetState());
    }
  }, [dispatch])
  
  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-page__container"]}>
        <div className={styles["auth-page__form"]}>
          <section
            className={`${styles["auth-form"]} ${styles["auth-form--password-reset-success"]}`}
            role="region"
            aria-labelledby="password-reset-success-title"
            aria-describedby="password-reset-success-subtitle"
          >
            <div className={styles["auth-form__container"]}>
              <Image
                src="/svgs/success-checkmark.svg"
                alt="Success checkmark"
                width={64}
                height={64}
                className={styles["auth-form__image--success"]}
                loading="lazy"
                sizes="64px"
                aria-hidden="true"
              />
              <h1 id="password-reset-success-title" className={styles["auth-form__title"]}>
                Password Reset Successful
              </h1>
              <p id="password-reset-success-subtitle" className={styles["auth-form__subtitle"]}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Button
                type="button"
                onClick={handleContinue}
                variant="primary"
                aria-label="Continue to login"
              >
                Continue to Login
              </Button>
            </div>
          </section>
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

export default memo(PasswordResetSuccessClient);