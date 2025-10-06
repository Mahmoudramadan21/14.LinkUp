'use client';

/**
 * Login form component for the LinkUp application.
 * Renders a form for user authentication with input fields, validation, and submission logic.
 * Supports accessibility and error handling.
 */

import { memo, useState } from 'react';
import Input from '@/components/ui/common/Input';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import { useLogin } from '@/hooks/auth/useLogin';
import type { JSX, ChangeEvent } from 'react';

/**
 * Renders the login form with input fields and submission logic.
 * @returns {JSX.Element} The login form component.
 */
const LoginForm = (): JSX.Element => {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    isLoading,
    serverError,
  } = useLogin();
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  return (
    <section
      className="auth-form"
      role="form"
      aria-labelledby="login-form-title"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="login-form-title" className="auth-form__title">
          Sign in
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form__form"
          aria-label="Login form"
          noValidate
        >
          <Input
            id="usernameOrEmail"
            type="text"
            label="Email or username"
            placeholder="Enter your email or username"
            {...register('usernameOrEmail')}
            error={errors.usernameOrEmail?.message}
            required
            autoComplete="username"
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
            required
            autoComplete="current-password"
          />
          <p className="auth-form__info">
            Password must be at least 8 characters long, include an uppercase
            letter, a lowercase letter, a number, and a special character (@$!%*?&).
          </p>
          {serverError && (
            <div className="auth-form__error" role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                className="auth-form__checkbox-input"
              />
              <span className="auth-form__checkbox-label">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="auth-form__link auth-form__forgot-password-link"
              prefetch={false}
            >
              Forgot password?
            </Link>
          </div>
          <p className="auth-form__signup">
            Don’t have an account?{' '}
            <Link href="/signup" className="auth-form__link" prefetch={false}>
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(LoginForm);