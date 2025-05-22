'use client';
import React, { memo } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/useForgotPassword';

const ForgotPasswordForm: React.FC = () => {
  const {
    formData,
    errors,
    serverError,
    serverSuccess,
    isLoading,
    handleChange,
    handleSubmit,
    hasErrors,
  } = useForgotPassword();

  return (
    <section
      className="auth-form auth-form--forgot-password"
      role="form"
      aria-labelledby="forgot-password-form-title"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="forgot-password-form-title" className="auth-form__title">
          Forgot Your Password?
        </h1>
        <p className="auth-form__subtitle">To request a new password, enter your email</p>
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Forgot password form" noValidate>
          <Input
            id="email"
            name="email"
            type="email"
            label="Enter your email"
            placeholder="Your email address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
          />
          {serverSuccess && (
            <div className="auth-form__success" role="alert" aria-live="polite">
              {serverSuccess}
            </div>
          )}
          {serverError && (
            <div className="auth-form__error" role="alert">
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || hasErrors}
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