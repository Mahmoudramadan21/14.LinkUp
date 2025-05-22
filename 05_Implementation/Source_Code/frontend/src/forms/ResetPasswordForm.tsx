'use client';
import React, { memo } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/useResetPassword';

const ResetPasswordForm: React.FC = () => {
  const {
    formData,
    errors,
    serverError,
    serverSuccess,
    isLoading,
    handleChange,
    handleSubmit,
    hasErrors,
  } = useResetPassword();

  // Render error state for invalid resetToken
  if (errors.resetToken) {
    return (
      <section
        className="auth-form auth-form--reset-password"
        role="region"
        aria-labelledby="reset-password-error-title"
        itemScope
        itemType="http://schema.org/Person"
      >
        <div className="auth-form__container">
          <h1 id="reset-password-error-title" className="auth-form__title">
            Reset Password
          </h1>
          <div className="auth-form__error" role="alert">
            {errors.resetToken}
          </div>
          <p className="auth-form__signup">
            <Link href="/forgot-password" className="auth-form__link" prefetch={false}>
              Start the password reset process again
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="auth-form auth-form--reset-password"
      role="form"
      aria-labelledby="reset-password-form-title"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="reset-password-form-title" className="auth-form__title">
          Reset Password
        </h1>
        <p className="auth-form__subtitle" aria-hidden="true">
          Set the new password for your account so you can login and access all features.
        </p>
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Reset password form" noValidate>
          <div className="auth-form__input-group">
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              label="Enter new password"
              placeholder="Your password"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="auth-form__input-group">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>
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
            aria-label="Reset password"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default memo(ResetPasswordForm);