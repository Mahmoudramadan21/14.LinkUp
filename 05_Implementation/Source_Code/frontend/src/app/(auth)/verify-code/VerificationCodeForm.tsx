'use client';

/**
 * Verification code form component for the LinkUp application.
 * Renders a form for verifying the code sent to the user's email.
 * Includes input fields, validation, submission logic, and accessibility features.
 */

import { memo, useEffect, useRef } from 'react';
import CodeInput from '@/components/ui/common/CodeInput';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import { useVerifyCode } from '@/hooks/auth/useVerifyCode';
import type {  JSX } from 'react';


/**
 * Renders the verification code form with input and submission logic.
 * @returns {JSX.Element} The verification code form component.
 */
const VerificationCodeForm = (): JSX.Element => {
  const {
    code,
    setCode,
    handleSubmit,
    onSubmit,
    isLoading,
    serverError,
    timeLeft,
    handleResend,
    isResendDisabled,
    email,
  } = useVerifyCode();

  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [serverError]);

  return (
    <section
      className="auth-form auth-form--verify-code"
      aria-labelledby="verify-code-form-title"
      aria-describedby="verify-code-form-subtitle"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="verify-code-form-title" className="auth-form__title">
          Verification
        </h1>
        <p id="verify-code-form-subtitle" className="auth-form__subtitle">
          Enter the 4-digit code sent to {email || 'your email'}.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form__form"
          aria-label="Verification code form"
          noValidate
        >
          <CodeInput length={4} onChange={setCode} />
          <div className="auth-form__timer" aria-live="polite">
            {timeLeft > 0 ? `Resend available in ${timeLeft} seconds` : ''}
          </div>
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
            disabled={isLoading || code.length !== 4}
            aria-label="Verify code"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <p className="auth-form__resend">
            Didn’t receive a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendDisabled}
              className="auth-form__resend-link"
              aria-label="Resend verification code"
            >
              Resend
            </button>
          </p>
          <p className="auth-form__signup">
            <Link href="/forgot-password" className="auth-form__link" prefetch={false}>
              Back to Forgot Password
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(VerificationCodeForm);