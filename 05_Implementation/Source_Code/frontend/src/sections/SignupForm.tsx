import React, { memo, useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';
import { setAuthData } from '@/utils/auth';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';
import Link from 'next/link';

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

/**
 * SignupForm Component
 * Renders a signup form with validation, API integration, and error handling.
 */
const SignupForm: React.FC = () => {
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
        setIsLoading(false);
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

  return (
    <section
      className="auth-form auth-form--signup"
      role="form"
      aria-labelledby="signup-form-title"
      itemscope
      itemtype="http://schema.org/Person"
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