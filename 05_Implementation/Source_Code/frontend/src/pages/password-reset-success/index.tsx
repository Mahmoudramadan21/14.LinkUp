import React, { memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '@/layout/AuthLayout';
import Image from 'next/image';
import { PasswordResetSuccessProps } from '@/types';
import Button from '@/components/Button';


/**
 * PasswordResetSuccess Component
 * Renders the password reset success page with a message and an illustration within the AuthLayout.
 */
const PasswordResetSuccess: React.FC<PasswordResetSuccessProps> = () => {
  const router = useRouter();

  // Handle continue navigation
  const handleContinue = useCallback(() => {
    router.push('/login');
  }, [router]);

  return (
    <AuthLayout title="LinkUp | Password Reset Success">
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__form">
              <section
                className="auth-form auth-form--password-reset-success"
                role="region"
                aria-labelledby="password-reset-success-title"
              >
                <div className="auth-form__container">
                  <Image
                    src="svgs/success-checkmark.svg"
                    alt=""
                    width={64}
                    height={64}
                    className="auth-form__image--success"
                    loading="lazy"
                    sizes="64px"
                    aria-hidden="true"
                  />
                  <h1 id="password-reset-success-title" className="auth-form__title auth-form__title--password-reset-success">
                    Successfully
                  </h1>
                  <p className="auth-form__subtitle auth-form__subtitle--password-reset-success" aria-hidden="true">
                    Your password has been reset successfully
                  </p>
                  <Button
                    type="button"
                    onClick={handleContinue}
                    variant="primary"
                    size="small"
                    aria-label="Continue to login"
                  >
                    CONTINUE
                  </Button>
                </div>
              </section>
          </div>
          <div className="auth-page__illustration" aria-hidden="true">
            <Image
              src="/illustrations/auth-security-illustration.svg"
              alt="Illustration of a person resetting their password securely"
              width={500}
              height={500}
              className="auth-page__image--illustration"
              loading="lazy"
              sizes="(max-width: 1024px) 50vw, 500px"
            />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default memo(PasswordResetSuccess);