'use client';

/**
 * Verification code form component for the LinkUp application.
 * Renders a form for verifying the code sent to the user's email.
 * Includes input fields, validation, submission logic, and accessibility features.
 */

import { memo, useEffect, useRef, useState } from 'react';
import CodeInput from '@/components/ui/common/CodeInput';
import Button from '@/components/ui/common/Button';
import Link from 'next/link';
import type {  JSX } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { VerifyCodeFormData, verifyCodeSchema } from '@/utils/validationSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { clearError, forgotPasswordThunk, verifyCodeThunk } from '@/store/authSlice';
import styles from "../auth-layout.module.css"

/**
 * Renders the verification code form with input and submission logic.
 * @returns {JSX.Element} The verification code form component.
 */
const VerificationCodeForm = (): JSX.Element => {

  const RESEND_TIMER = 60; // seconds

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    resetEmail,
    loading: { verifyCode: isLoading },
    error: { verifyCode: serverError },
  } = useSelector((state: RootState) => state.auth);

  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMER);

  const { handleSubmit, setValue } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { email: resetEmail || "", code },
  });

  useEffect(() => {
    setValue("code", code);
  }, [code, setValue]);

  const onSubmit = async () => {
    if (!resetEmail || code.length !== 4) {
      return;
    }
    try {
      await dispatch(
        verifyCodeThunk({ email: resetEmail, code })
      ).unwrap();
      router.push("/reset-password");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (!serverError) {
        dispatch({
          type: "auth/verifyCode/rejected",
          payload: "Failed to verify code",
        });
      }
    }
  };

  const handleResend = async () => {
    if (!resetEmail) {
      router.push("/forgot-password");
      return;
    }
    try {
      await dispatch(forgotPasswordThunk({ email: resetEmail })).unwrap();
      setTimeLeft(RESEND_TIMER);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled in store
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      dispatch(clearError("verifyCode"));
    };
  }, [dispatch]);

  const isResendDisabled = timeLeft > 0 || isLoading;


  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (serverError && errorRef.current) {
      errorRef.current.focus();
    }
  }, [serverError]);

  return (
    <section
      className={`${styles["auth-form"]} ${styles["auth-form--verify-code"]}`}
      aria-labelledby="verify-code-form-title"
      aria-describedby="verify-code-form-subtitle"
      itemScope
      itemType="http://schema.org/Person"
    >
      <div className={styles["auth-form__container"]}>
        <h1 id="verify-code-form-title" className={styles["auth-form__title"]}>
          Verification
        </h1>
        <p id="verify-code-form-subtitle" className={styles["auth-form__subtitle"]}>
          Enter the 4-digit code sent to {resetEmail || 'your email'}.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles["auth-form__form"]}
          aria-label="Verification code form"
          noValidate
        >
          <CodeInput length={4} onChange={setCode} />
          <div className={styles["auth-form__timer"]} aria-live="polite">
            {timeLeft > 0 ? `Resend available in ${timeLeft} seconds` : ''}
          </div>
          {serverError && (
            <div
              className={styles["auth-form__error"]}
              role="alert"
              aria-live="assertive"
              ref={errorRef}
              tabIndex={-1}
            >
              {serverError}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || code.length !== 4}
            aria-label="Verify code"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <p className={styles["auth-form__resend"]}>
            Didn’t receive a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendDisabled}
              className={styles["auth-form__resend-link"]}
              aria-label="Resend verification code"
            >
              Resend
            </button>
          </p>
          <p className={styles["auth-form__signup"]}>
            <Link href="/forgot-password" className={styles["auth-form__link"]} prefetch={false}>
              Back to Forgot Password
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default memo(VerificationCodeForm);