'use client';
import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { setAuthData } from '@/utils/auth';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';

// Interface for form data
interface FormData {
  profileName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: 'MALE' | 'FEMALE' | '';
  dateOfBirth: string;
  marketingConsent: boolean;
}

// Interface for form errors
interface FormErrors {
  profileName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  gender?: string;
  dateOfBirth?: string;
  marketingConsent?: string;
}

// Interface for API response
interface SignupResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    profileName: string;
    profilePicture: string;
  };
}

export const useSignup = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    profileName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dateOfBirth: '',
    marketingConsent: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {};
    const profileNameRegex = /^[a-zA-Z\s]{2,50}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!data.profileName.trim()) {
      errors.profileName = 'Profile name is required';
    } else if (!profileNameRegex.test(data.profileName)) {
      errors.profileName = 'Profile name: 2-50 letters/spaces';
    }

    if (!data.username.trim()) {
      errors.username = 'Username is required';
    } else if (!usernameRegex.test(data.username)) {
      errors.username = 'Username: 3-30 letters/numbers/underscores';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(data.email)) {
      errors.email = 'Invalid email address';
    }

    if (!data.password.trim()) {
      errors.password = 'Password is required';
    } else if (!passwordRegex.test(data.password)) {
      errors.password = 'Password: 8+ chars, upper, lower, number, special';
    }

    if (!data.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password';
    } else if (data.confirmPassword !== data.password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!data.gender) {
      errors.gender = 'Gender is required';
    } else if (!['MALE', 'FEMALE'].includes(data.gender)) {
      errors.gender = 'Select Male or Female';
    }

    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth required';
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Invalid date of birth';
      } else if (adjustedAge < 13) {
        errors.dateOfBirth = 'Must be 13+';
      } else if (dob > today) {
        errors.dateOfBirth = 'Date cannot be future';
      }
    }

    return errors;
  }, []);

  // Memoized validation errors
  const validationErrors = useMemo(() => validateForm(formData), [formData, validateForm]);
  const hasErrors = Object.keys(validationErrors).length > 0;

  // Handle input changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setFormData((prev) => ({ ...prev, [name]: newValue }));
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
        const formattedDateOfBirth = new Date(formData.dateOfBirth).toISOString().split('T')[0];
        const response = await api.post<SignupResponse>(
          API_ENDPOINTS.SIGNUP,
          {
            profileName: formData.profileName,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            gender: formData.gender,
            dateOfBirth: formattedDateOfBirth,
          },
          {
            headers: {
              'X-CSRF-Token':
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
          }
        );
        const { accessToken, refreshToken, userId, username, profileName, profilePicture } =
          response.data.data;

        setAuthData({
          accessToken,
          refreshToken,
          userId,
          username,
          profileName,
          profilePicture,
        });

        router.push('/feed');
      } catch (error: any) {
        if (error.response?.status === 400 && error.response?.data?.errors) {
          const newErrors: FormErrors = {};
          error.response.data.errors.forEach((err: { path: string; msg: string }) => {
            const field = err.path === 'profilename' ? 'profileName' : err.path;
            newErrors[field as keyof FormErrors] = err.msg;
          });
          setErrors(newErrors);
        } else if (error.response?.status === 409) {
          setServerError('Email or username already exists');
        } else if (error.response?.status === 400) {
          setServerError('Invalid data. Check inputs.');
        } else {
          setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
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
    handleChange,
    handleSubmit,
    validationErrors,
    hasErrors,
  };
};