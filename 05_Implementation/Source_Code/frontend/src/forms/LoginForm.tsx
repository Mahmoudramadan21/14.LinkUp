'use client';
import React, { memo } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Link from 'next/link';
import { useLogin } from '@/hooks/useLogin';

const LoginForm: React.FC = () => {
  const {
    formData,
    errors,
    serverError,
    isLoading,
    rememberMe,
    setRememberMe,
    handleChange,
    handleSubmit,
    hasErrors,
  } = useLogin();

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
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Login form">
          <Input
            id="usernameOrEmail"
            name="usernameOrEmail"
            type="text"
            label="Email or username"
            placeholder="Enter your email or username"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            error={errors.usernameOrEmail}
            required
            autoComplete="username"
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            autoComplete="current-password"
          />
          <p className="auth-form__info" aria-hidden="true">
            Password must be at least 8 characters long, include an uppercase
            letter, a lowercase letter, a number, and a special character (@$!%*?&).
          </p>
          {serverError && (
            <div className="auth-form__error" role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={isLoading || hasErrors}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
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