'use client';

/**
 * Forgot Password form component for the LinkUp application.
 * Renders a form for requesting a password reset with input field, validation, and submission logic.
 * Supports accessibility and error handling.
 */

import { memo } from 'react';
import Input from '@/components/ui/common/Input';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import type { JSX } from 'react';


/**
 * Renders the forgot password form with input field and submission logic.
 * @returns {JSX.Element} The forgot password form component.
 */
const ForgotPasswordForm= (): JSX.Element => {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isLoading,
    serverError,
    resetCodeSent,
  } = useForgotPassword();

  return (
    <section
      className="auth-form auth-form--forgot-password"
      role="form"
      aria-labelledby="forgot-password-form-title"
      aria-describedby="forgot-password-form-subtitle"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="forgot-password-form-title" className="auth-form__title">
          Forgot Your Password?
        </h1>
        <p id="forgot-password-form-subtitle" className="auth-form__subtitle">
          Enter your email to request a new password
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form__form"
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
            <div className="auth-form__success" role="alert" aria-live="polite">
              Verification code sent to your email. Please check your inbox.
            </div>
          )}
          {serverError && (
            <div className="auth-form__error" role="alert" aria-live="assertive">
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
          <p className="auth-form__signup">
            <Link href="/login" className="auth-form__link" prefetch={false}>
              Back to Sign In
            </Link>
          </p>
          <p className="auth-form__signup">
            Don’t have an account?{' '}
            <Link href="/signup" className="auth-form__link" prefetch={false}>
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(ForgotPasswordForm);