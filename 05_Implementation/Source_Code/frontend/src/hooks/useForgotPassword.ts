'use client';
import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import { getCsrfToken, storeResetEmail } from '@/utils/forgotPasswordUtils';

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

export const useForgotPassword = () => {
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
            'X-CSRF-Token': getCsrfToken(),
          },
        });

        storeResetEmail(formData.email);
        setServerSuccess('If the email exists, a verification code has been sent.');
        setFormData({ email: '' });

        setTimeout(() => {
          router.push('/verify-code');
        }, 1500);
      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.errors) {
          const newErrors: FormErrors = {};
          error.response.data.errors.forEach((err: { field: string; error: string }) => {
            newErrors.email = err.error;
          });
          setErrors(newErrors);
        } else if (error.response?.status === 500) {
          setServerError('Error processing request.');
        } else {
          setServerError(error.response?.data?.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, router]
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