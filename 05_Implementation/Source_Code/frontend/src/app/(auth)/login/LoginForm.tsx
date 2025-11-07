'use client';

/**
 * Login form component for the LinkUp application.
 * Renders a form for user authentication with input fields, validation, and submission logic.
 * Supports accessibility and error handling.
 */

import { memo, useEffect, useState } from 'react';
import Input from '@/components/ui/common/Input';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import type { JSX, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/utils/validationSchemas';
import { clearError, loginThunk } from '@/store/authSlice';
import styles from "../auth-layout.module.css"

/**
 * Renders the login form with input fields and submission logic.
 * @returns {JSX.Element} The login form component.
 */
const LoginForm = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    loading: { login: isLoading },
    error: { login: serverError },
  } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(loginThunk(data)).unwrap();
      router.replace("/feed");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError("login"));
    };
  }, [dispatch]);
  
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  return (
    <section
      className={styles["auth-form"]}
      role="form"
      aria-labelledby="login-form-title"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className={styles["auth-form__container"]}>
        <h1 id="login-form-title" className={styles["auth-form__title"]}>
          Sign in
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles["auth-form__form"]}
          aria-label="Login form"
          noValidate
        >
          <Input
            id="usernameOrEmail"
            type="text"
            label="Email or username"
            placeholder="Enter your email or username"
            {...register('usernameOrEmail')}
            error={errors.usernameOrEmail?.message}
            required
            autoComplete="username"
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
            required
            autoComplete="current-password"
          />
          <p className={styles["auth-form__info"]}>
            Password must be at least 8 characters long, include an uppercase
            letter, a lowercase letter, a number, and a special character (@$!%*?&).
          </p>
          {serverError && (
            <div className={styles["auth-form__error"]} role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className={styles["auth-form__options"]}>
            <label className={styles["auth-form__checkbox"]}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                className={styles["auth-form__checkbox-input"]}
              />
              <span className={styles["auth-form__checkbox-label"]}>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className={`${styles["auth-form__link"]} ${styles["auth-form__forgot-password-link"]}`}
              prefetch={false}
            >
              Forgot password?
            </Link>
          </div>
          <p className={styles["auth-form__signup"]}>
            Don’t have an account?{' '}
            <Link href="/signup" className={styles["auth-form__link"]} prefetch={false}>
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(LoginForm);