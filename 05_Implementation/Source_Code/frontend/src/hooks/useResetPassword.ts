'use client';
import { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import { getCsrfToken, getResetToken, clearResetStorage } from '@/utils/resetPasswordUtils';

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

export const useResetPassword = () => {
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
    const resetToken = getResetToken();
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
              'X-CSRF-Token': getCsrfToken(),
            },
          }
        );

        setServerSuccess('Password updated successfully.');
        clearResetStorage();
        setFormData({ resetToken: '', newPassword: '', confirmPassword: '' });

        setTimeout(() => {
          router.push('/password-reset-success');
        }, 1500);
      } catch (error: any) {
        if (error.response?.status === 400) {
          setErrors({ newPassword: 'New password must be at least 8 characters long' });
        } else if (error.response?.status === 401) {
          setServerError(
            'Invalid or expired reset token. Please start the password reset process again.'
          );
        } else if (error.response?.status === 500) {
          setServerError('Error updating password.');
        } else {
          setServerError(error.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, router, validateForm]
  );

  return {
    formData,
    errors,
    serverError,
    serverSuccess,
    isLoading,
    handleChange,
    handleSubmit,
    validationErrors,
    hasErrors,
  };
};