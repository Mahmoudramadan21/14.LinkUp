'use client';

/**
 * Signup form component for the LinkUp application.
 * Renders a form for user registration with input fields, validation, and submission logic.
 * Supports accessibility and error handling.
 */

import { memo, useState } from 'react';
import Input from '@/components/ui/common/Input';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import { useSignup } from '@/hooks/auth/useSignup';


/**
 * Renders the signup form with input fields and submission logic.
 * @returns {JSX.Element} The signup form component.
 */
const SignupForm: React.FC = () => {
const {
  register,
  handleSubmit,
  errors,
  onSubmit,
  isLoading,
  serverError,
} = useSignup();

  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);

  return (
    <section
      className="auth-form auth-form--signup"
      role="form"
      aria-labelledby="signup-form-title"
      aria-describedby="signup-form-subtitle"
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form__form"
          aria-label="Signup form"
          noValidate
        >
          <Input
            id="profileName"
            type="text"
            label="Profile name"
            placeholder="Enter your profile name"
            {...register('profileName')}
            error={errors.profileName?.message}
            required
            autoComplete="name"
          />
          <Input
            id="username"
            type="text"
            label="Username"
            placeholder="Enter your username"
            {...register('username')}
            error={errors.username?.message}
            required
            autoComplete="username"
          />
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="Enter your email address"
            {...register('email')}
            error={errors.email?.message}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
            required
            autoComplete="new-password"
          />
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            required
            autoComplete="new-password"
          />
          <p className="auth-form__info">
            Password must be at least 8 characters long, include an uppercase
            letter, a lowercase letter, a number, and a special character (@$!%*?&).
          </p>
          <Input
            id="gender"
            type="select"
            label="What’s your gender?"
            {...register('gender')}
            error={errors.gender?.message}
            required
            options={[
              { value: '', label: 'Select gender', disabled: true },
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
          <Input
            id="dateOfBirth"
            type="date"
            label="What’s your date of birth?"
            {...register('dateOfBirth')}
            error={errors.dateOfBirth?.message}
            required
          />
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMarketingConsent(e.target.checked)
                }
                className="auth-form__checkbox-input"
              />
              <span className="auth-form__checkbox-label">
                Share data with content providers for marketing.
              </span>
            </label>
          </div>
          <p className="auth-form__info">
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
            <div className="auth-form__error" role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
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