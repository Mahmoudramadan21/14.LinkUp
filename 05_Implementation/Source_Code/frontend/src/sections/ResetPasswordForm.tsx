import React, { memo, useState, useEffect, useCallback, useMemo, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import Link from 'next/link';

// Interface for form data
interface FormData {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

// Interface for form errors
interface FormErrors {
  resetToken?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Interface for API response
interface ResetPasswordResponse {
  message: string;
}

/**
 * ResetPasswordForm Component
 * Renders a form to reset the user's password with validation and API integration.
 */
const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [serverSuccess, setServerSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowPasswordConfirm] = useState<boolean>(false);

  // Validate password
  const validatePassword = useCallback((password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  }, []);

  // Validate form data
  const validateForm = useCallback(
    (data: FormData): FormErrors => {
      const errors: FormErrors = {};

      if (!data.resetToken) {
        errors.resetToken =
          'No valid reset token found. Please start the password reset process again.';
      }

      const passwordError = validatePassword(data.newPassword);
      if (passwordError) {
        errors.newPassword = passwordError;
      }

      if (data.newPassword !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      return errors;
    },
    [validatePassword]
  );

  // Memoized validation errors
  const validationErrors = useMemo(() => validateForm(formData), [formData, validateForm]);
  const hasErrors = Object.keys(validationErrors).length > 0 && !validationErrors.resetToken;

  // Retrieve resetToken from localStorage
  useEffect(() => {
    const resetToken = localStorage.getItem('resetToken') || '';
    const newErrors: FormErrors = {};

    if (!resetToken) {
      newErrors.resetToken =
        'No valid reset token found. Please start the password reset process again.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setFormData((prev) => ({ ...prev, resetToken }));
    }
  }, []);

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

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => setShowPassword((prev) => !prev), []);
  const toggleConfirmPasswordVisibility = useCallback(
    () => setShowPasswordConfirm((prev) => !prev),
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
        await api.post<ResetPasswordResponse>(
          API_ENDPOINTS.RESET_PASSWORD,
          { resetToken: formData.resetToken, newPassword: formData.newPassword },
          {
            headers: {
              'X-CSRF-Token':
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
          }
        );

        setServerSuccess('Password updated successfully.');
        localStorage.removeItem('resetToken');
        localStorage.removeItem('resetEmail');
        setFormData({ resetToken: '', newPassword: '', confirmPassword: '' });

        setTimeout(() => {
          router.push('/password-reset-success');
        }, 1500);
      } catch (error: any) {
        setIsLoading(false);
        if (error.status === 400) {
          setErrors({ newPassword: 'New password must be at least 8 characters long' });
        } else if (error.status === 401) {
          setServerError(
            'Invalid or expired reset token. Please start the password reset process again.'
          );
        } else if (error.status === 500) {
          setServerError('Error updating password.');
        } else {
          setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      }
    },
    [formData, router, validateForm]
  );

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
      itemscope
      itemtype="http://schema.org/Person"
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
              type={showPassword ? 'text' : 'password'}
              label="Enter new password"
              placeholder="Your password"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="auth-form__toggle-visibility"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="auth-form__input-group">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="auth-form__toggle-visibility"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
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