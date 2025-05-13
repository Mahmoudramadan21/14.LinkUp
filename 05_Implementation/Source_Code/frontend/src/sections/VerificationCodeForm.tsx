import React, { memo, useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/router';
import CodeInput from '@/components/CodeInput';
import Button from '@/components/Button';
import api from '@/utils/api';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import Link from 'next/link';

// Interface for form data
interface FormData {
  email: string;
  code: string;
}

// Interface for form errors
interface FormErrors {
  email?: string;
  code?: string;
}

// Interface for API response
interface VerifyCodeResponse {
  message: string;
  resetToken: string;
}

/**
 * VerificationCodeForm Component
 * Renders a form to verify a 4-digit code for password reset.
 */
const VerificationCodeForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({ email: '', code: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [serverSuccess, setServerSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.email || !emailRegex.test(data.email)) {
      errors.email = 'No valid email found. Please start the password reset process.';
    }
    if (!data.code || data.code.length !== 4) {
      errors.code = 'Please enter a 4-digit code';
    }

    return errors;
  }, []);

  // Memoized validation errors
  const validationErrors = useMemo(() => validateForm(formData), [formData, validateForm]);
  const hasErrors = Object.keys(validationErrors).length > 0;

  // Retrieve email from localStorage
  useEffect(() => {
    const email = localStorage.getItem('resetEmail') || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setErrors({ email: 'No valid email found. Please start the password reset process.' });
    } else {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, []);

  // Handle timer logic
  const handleTimer = useCallback(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    handleTimer();
  }, [handleTimer]);

  // Handle code input change
  const handleCodeChange = useCallback((code: string) => {
    setFormData((prev) => ({ ...prev, code }));
    setErrors((prev) => ({ ...prev, code: undefined }));
    setServerError('');
    setServerSuccess('');
  }, []);

  // Handle resend code
  const handleResend = useCallback(async () => {
    if (!canResend) return;

    setIsLoading(true);
    setServerError('');
    setServerSuccess('');

    try {
      await api.post(
        API_ENDPOINTS.FORGOT_PASSWORD,
        { email: formData.email },
        {
          headers: {
            'X-CSRF-Token':
              document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        }
      );
      setServerSuccess('A new verification code has been sent to your email.');
      setTimer(30);
      setCanResend(false);
    } catch (error: any) {
      setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [canResend, formData.email]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      const errors = validateForm(formData);
      setErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsLoading(true);
      setServerError('');
      setServerSuccess('');

      try {
        const response = await api.post<VerifyCodeResponse>(
          API_ENDPOINTS.VERIFY_CODE,
          { email: formData.email, code: formData.code },
          {
            headers: {
              'X-CSRF-Token':
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
          }
        );

        localStorage.setItem('resetToken', response.data.resetToken);
        setServerSuccess('Code verified successfully.');

        setTimeout(() => {
          router.push('/reset-password');
        }, 1500);
      } catch (error: any) {
        setIsLoading(false);
        if (error.status === 400) {
          setErrors({ code: 'Invalid or expired verification code' });
        } else if (error.status === 500) {
          setServerError('Error verifying code.');
        } else {
          setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      }
    },
    [formData, router, validateForm]
  );

  // Format timer as MM:SS
  const formatTimer = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Render error state for invalid email
  if (errors.email) {
    return (
      <section
        className="auth-form auth-form--verify-code"
        role="region"
        aria-labelledby="verify-code-error-title"
        itemscope
        itemtype="http://schema.org/Person"
      >
        <div className="auth-form__container">
          <h1 id="verify-code-error-title" className="auth-form__title auth-form__title--verify-code">
            Verification
          </h1>
          <div className="auth-form__error" role="alert">
            {errors.email}
          </div>
          <p className="auth-form__signup">
            <Link href="/forgot-password" className="auth-form__link" prefetch={false}>
              Go back to Forgot Password
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="auth-form auth-form--verify-code"
      role="form"
      aria-labelledby="verify-code-form-title"
      itemscope
      itemtype="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="verify-code-form-title" className="auth-form__title auth-form__title--verify-code">
          Verification
        </h1>
        <p className="auth-form__subtitle auth-form__subtitle--verify-code" aria-hidden="true">
          Enter your 4-digit code that you received on your email
        </p>
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Verification code form" noValidate>
          <CodeInput length={4} onChange={handleCodeChange} error={errors.code} />
          <div className="auth-form__timer" aria-live="polite">
            {formatTimer(timer)}
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
            disabled={isLoading || formData.code.length !== 4}
            aria-label="Continue with verification code"
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </Button>
          <p className="auth-form__resend">
            If you didn’t receive a code!{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="auth-form__resend-link"
              aria-label="Resend verification code"
            >
              Resend
            </button>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(VerificationCodeForm);