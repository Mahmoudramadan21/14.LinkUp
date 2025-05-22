'use client';
import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { setAuthData } from '@/utils/auth';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';

// Interface for form data
interface FormData {
  usernameOrEmail: string;
  password: string;
}

// Interface for form errors
interface FormErrors {
  usernameOrEmail?: string;
  password?: string;
}

// Interface for API response
interface LoginResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    profileName: string;
    profilePicture: string;
    email: string;
  };
}

export const useLogin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    usernameOrEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!data.usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Email or username is required';
    } else if (!emailRegex.test(data.usernameOrEmail) && !usernameRegex.test(data.usernameOrEmail)) {
      errors.usernameOrEmail = 'Please enter a valid email or username (minimum 3 characters)';
    }

    if (!data.password.trim()) {
      errors.password = 'Password is required';
    } else if (!passwordRegex.test(data.password)) {
      errors.password =
        'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)';
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

      try {
        const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGIN, formData, {
          headers: {
            'X-CSRF-Token':
              document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        });
        const { accessToken, refreshToken, userId, username, profileName, profilePicture, email } =
          response.data.data;

        setAuthData({
          accessToken,
          refreshToken,
          userId,
          username,
          profileName,
          profilePicture,
          email,
        });

        router.push('/feed');
      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.errors) {
          const newErrors: FormErrors = {};
          error.response.data.errors.forEach((err: { field: string; message: string }) => {
            newErrors[err.field as keyof FormErrors] = err.message;
          });
          setErrors(newErrors);
        } else if (error.response?.status === 401) {
          setServerError('Invalid email/username or password');
        } else if (error.response?.status === 429) {
          setServerError('Too many login attempts. Please try again later.');
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
    isLoading,
    rememberMe,
    setRememberMe,
    handleChange,
    handleSubmit,
    validationErrors,
    hasErrors,
  };
};