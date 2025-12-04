'use client';

/**
 * Reset Password form component for the LinkUp application.
 * Renders a form for resetting the user's password with input fields, validation, and submission logic.
 * Supports accessibility and error handling.
 */

import { memo, useEffect, useRef } from 'react';
import Input from '@/components/ui/common/Input';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import type { JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ResetPasswordFormData, resetPasswordSchema } from '@/utils/validationSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { clearError, resetPasswordThunk } from '@/store/authSlice';
import styles from "../auth-layout.module.css"

/**
 * Renders the reset password form with input fields and submission logic.
 * @returns {JSX.Element} The reset password form component.
 */
const ResetPasswordForm= (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { resetPassword: isLoading },
    error: { resetPassword: serverError },
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await dispatch(
        resetPasswordThunk({
          newPassword: data.newPassword,
        })
      ).unwrap();
      router.push("/password-reset-success");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError("resetPassword"));
    };
  }, [dispatch]);


  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [serverError]);

  return (
    <section
      className={`${styles["auth-form"]} ${styles["auth-form--reset-password"]}`}
      role="form"
      aria-labelledby="reset-password-form-title"
      aria-describedby="reset-password-form-subtitle"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className={styles["auth-form__container"]}>
        <h1 id="reset-password-form-title" className={styles["auth-form__title"]}>
          Reset Password
        </h1>
        <p id="reset-password-form-subtitle" className={styles["auth-form__subtitle"]}>
          Set a new password for your account to access all features.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles["auth-form__form"]}
          aria-label="Reset password form"
          noValidate
        >
          <Input
            id="newPassword"
            type="password"
            label="New Password"
            placeholder="Enter new password"
            {...register('newPassword')}
            error={errors.newPassword?.message}
            required
            autoComplete="new-password"
          />
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm new password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            required
            autoComplete="new-password"
          />
          {serverError && (
            <div
              className={styles["auth-form__error"]}
              role="alert"
              aria-live="assertive"
              ref={errorRef}
              tabIndex={-1}
            >
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            aria-label="Update password"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
          <p className={styles["auth-form__signup"]}>
            <Link href="/login" className={styles["auth-form__link"]} prefetch={false}>
              Back to Sign In
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(ResetPasswordForm);