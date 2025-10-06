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
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import type { JSX } from 'react';


/**
 * Renders the reset password form with input fields and submission logic.
 * @returns {JSX.Element} The reset password form component.
 */
const ResetPasswordForm= (): JSX.Element => {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isLoading,
    serverError,
   } = useResetPassword();

  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [serverError]);

  return (
    <section
      className="auth-form auth-form--reset-password"
      role="form"
      aria-labelledby="reset-password-form-title"
      aria-describedby="reset-password-form-subtitle"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="reset-password-form-title" className="auth-form__title">
          Reset Password
        </h1>
        <p id="reset-password-form-subtitle" className="auth-form__subtitle">
          Set a new password for your account to access all features.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form__form"
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
              className="auth-form__error"
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
          <p className="auth-form__signup">
            <Link href="/login" className="auth-form__link" prefetch={false}>
              Back to Sign In
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(ResetPasswordForm);