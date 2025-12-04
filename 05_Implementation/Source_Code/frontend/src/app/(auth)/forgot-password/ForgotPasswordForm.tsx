'use client';

/**
 * Forgot Password form component for the LinkUp application.
 * Renders a form for requesting a password reset with input field, validation, and submission logic.
 * Supports accessibility and error handling.
 */

import { memo, useEffect } from 'react';
import Input from '@/components/ui/common/Input';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import type { JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ForgotPasswordFormData, forgotPasswordSchema } from '@/utils/validationSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordThunk } from '@/store/authSlice';
import styles from "../auth-layout.module.css"

/**
 * Renders the forgot password form with input field and submission logic.
 * @returns {JSX.Element} The forgot password form component.
 */
const ForgotPasswordForm= (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { forgotPassword: isLoading },
    error: { forgotPassword: serverError },
    resetCodeSent,
    resetEmail,
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await dispatch(forgotPasswordThunk(data)).unwrap();
      // Redirect is handled in useEffect below
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    if (resetCodeSent && resetEmail) {
      router.push("/verify-code");
    }
  }, [resetCodeSent, resetEmail, router]);

  return (
    <section
      className={`${styles["auth-form"]} ${styles["auth-form--forgot-password"]}`}
      role="form"
      aria-labelledby="forgot-password-form-title"
      aria-describedby="forgot-password-form-subtitle"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className={styles["auth-form__container"]}>
        <h1 id="forgot-password-form-title" className={styles["auth-form__title"]}>
          Forgot Your Password?
        </h1>
        <p id="forgot-password-form-subtitle" className={styles["auth-form__subtitle"]}>
          Enter your email to request a new password
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles["auth-form__form"]}
          aria-label="Forgot password form"
          noValidate
        >
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="Enter your email address"
            {...register('email')}
            error={errors.email?.message}
            required
            autoComplete="email"
            disabled={resetCodeSent}
          />
          {resetCodeSent && (
            <div className={styles["auth-form__success"]} role="alert" aria-live="polite">
              Verification code sent to your email. Please check your inbox.
            </div>
          )}
          {serverError && (
            <div className={styles["auth-form__error"]} role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || resetCodeSent}
            aria-label="Continue with password reset request"
          >
            {isLoading ? 'Sending...' : 'Continue'}
          </Button>
          <p className={styles["auth-form__signup"]}>
            <Link href="/login" className={styles["auth-form__link"]} prefetch={false}>
              Back to Sign In
            </Link>
          </p>
          <p className={styles["auth-form__signup"]}>
            Don’t have an account?{' '}
            <Link href="/signup" className={styles["auth-form__link"]} prefetch={false}>
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(ForgotPasswordForm);