import React, { memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '@/layout/AuthLayout';
import PasswordResetSuccessSection from '@/sections/PasswordResetSuccessSection';
import Image from 'next/image';
import { PasswordResetSuccessProps } from '@/types';

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
            <PasswordResetSuccessSection onContinue={handleContinue} />
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