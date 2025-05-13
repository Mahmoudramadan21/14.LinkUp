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

/**
 * LoginForm Component
 * Renders a login form with validation, API integration, and error handling.
 */
const LoginForm: React.FC = () => {
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

  // Handle input changes with debouncing
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
        setIsLoading(false);
        if (error.status === 400 && error.errors) {
          const newErrors: FormErrors = {};
          error.errors.forEach((err: { field: string; message: string }) => {
            newErrors[err.field as keyof FormErrors] = err.message;
          });
          setErrors(newErrors);
        } else if (error.status === 401) {
          setServerError('Invalid email/username or password');
        } else if (error.status === 429) {
          setServerError('Too many login attempts. Please try again later.');
        } else {
          setServerError(error.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      }
    },
    [formData, router]
  );

  return (
    <section
      className="auth-form"
      role="form"
      aria-labelledby="login-form-title"
      itemscope
      itemtype="http://schema.org/Person"
    >
      <div className="auth-form__container">
        <h1 id="login-form-title" className="auth-form__title">
          Sign in
        </h1>
        <form onSubmit={handleSubmit} className="auth-form__form" aria-label="Login form">
          <Input
            id="usernameOrEmail"
            name="usernameOrEmail"
            type="text"
            label="Email or username"
            placeholder="Enter your email or username"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            error={errors.usernameOrEmail}
            required
            autoComplete="username"
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
            autoComplete="current-password"
          />
          <p className="auth-form__info" aria-hidden="true">
            Password must be at least 8 characters long, include an uppercase letter, a lowercase
            letter, a number, and a special character (@$!%*?&).
          </p>
          {serverError && (
            <div className="auth-form__error" role="alert">
              {serverError}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={isLoading || hasErrors}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="auth-form__options">
            <label className="auth-form__checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-form__checkbox-input"
              />
              <span className="auth-form__checkbox-label">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="auth-form__link auth-form__forgot-password-link"
              prefetch={false}
            >
              Forgot password?
            </Link>
          </div>
          <p className="auth-form__signup">
            Don’t have an account?{' '}
            <Link href="/signup" className="auth-form__link" prefetch={false}>
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(LoginForm);