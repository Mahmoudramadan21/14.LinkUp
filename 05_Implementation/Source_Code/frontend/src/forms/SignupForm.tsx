'use client';
import React, { memo } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Link from 'next/link';
import { useSignup } from '@/hooks/useSignup';

const SignupForm: React.FC = () => {
  const {
    formData,
    errors,
    serverError,
    isLoading,
    handleChange,
    handleSubmit,
    hasErrors,
  } = useSignup();

  return (
    <section
      className="auth-form auth-form--signup"
      role="form"
      aria-labelledby="signup-form-title"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="signup-form-title" className="auth-form__title auth-form__title--signup">
          Sign up
        </h1>
        <p className="auth-form__subtitle auth-form__subtitle--signup">
          Sign up with your email address
        </p>
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Signup form" noValidate>
          <Input
            id="profileName"
            name="profileName"
            type="text"
            label="Profile name"
            placeholder="Enter your profile name"
            value={formData.profileName}
            onChange={handleChange}
            error={errors.profileName}
            required
            autoComplete="name"
          />
          <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
            autoComplete="username"
          />
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
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
            autoComplete="new-password"
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
          <p className="auth-form__info" aria-hidden="true">
            Use 8+ characters with letters, numbers, symbols
          </p>
          <Input
            id="gender"
            name="gender"
            type="select"
            label="What’s your gender?"
            value={formData.gender}
            onChange={handleChange}
            error={errors.gender}
            required
            options={[
              { value: '', label: 'Select gender', disabled: true },
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
            ]}
          />
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            label="What’s your date of birth?"
            value={formData.dateOfBirth}
            onChange={handleChange}
            error={errors.dateOfBirth}
            required
          />
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
                className="auth-form__checkbox-input"
              />
              <span className="auth-form__checkbox-label">
                Share data with content providers for marketing.
              </span>
            </label>
          </div>
          <p className="auth-form__info" aria-hidden="true">
            By signing up, you agree to the{' '}
            <Link href="/terms" className="auth-form__link" prefetch={false}>
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="auth-form__link" prefetch={false}>
              Privacy Policy
            </Link>.
          </p>
          {serverError && (
            <div className="auth-form__error" role="alert">
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || hasErrors}
            aria-label="Sign up"
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </Button>
          <p className="auth-form__signup">
            Have an account?{' '}
            <Link href="/login" className="auth-form__link" prefetch={false}>
              Log in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(SignupForm);