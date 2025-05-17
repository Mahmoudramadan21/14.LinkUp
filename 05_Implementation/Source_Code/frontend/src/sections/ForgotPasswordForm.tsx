import React, { memo, useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import Link from 'next/link';

// Interface for form data
interface FormData {
  email: string;
}

// Interface for form errors
interface FormErrors {
  email?: string;
}

// Interface for API response
interface ForgotPasswordResponse {
  message: string;
  codeSent: boolean;
}

/**
 * ForgotPasswordForm Component
 * Renders a forgot password form with validation, API integration, and error handling.
 */
const ForgotPasswordForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [serverSuccess, setServerSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return errors;
  }, []);

  // Memoized validation errors
  const validationErrors = useMemo(() => validateForm(formData), [formData, validateForm]);
  const hasErrors = Object.keys(validationErrors).length > 0;

  // Handle input changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      setServerError('');
      setServerSuccess('');
    },
    []
  );

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
        await api.post<ForgotPasswordResponse>(API_ENDPOINTS.FORGOT_PASSWORD, formData, {
          headers: {
            'X-CSRF-Token':
              document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        });

        localStorage.setItem('resetEmail', formData.email);
        setServerSuccess('If the email exists, a verification code has been sent.');
        setFormData({ email: '' });

        setTimeout(() => {
          router.push('/verify-code');
        }, 1500);
      } catch (error: any) {
        setIsLoading(false);
        if (error.status === 400 && error.errors) {
          const newErrors: FormErrors = {};
          error.errors.forEach((err: { field: string; error: string }) => {
            newErrors.email = err.error;
          });
          setErrors(newErrors);
        } else if (error.status === 500) {
          setServerError('Error processing request.');
        } else {
          setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      }
    },
    [formData, router]
  );

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