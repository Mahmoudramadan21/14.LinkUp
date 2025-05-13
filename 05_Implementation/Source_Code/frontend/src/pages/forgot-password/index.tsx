import React, { memo } from 'react';
import AuthLayout from '@/layout/AuthLayout';
import ForgotPasswordForm from '@/sections/ForgotPasswordForm';
import Image from 'next/image';

/**
 * ForgotPasswordPage Component
 * Renders the forgot password page with a form and an illustration within the AuthLayout.
 */
const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Forgot Password">
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__form">
            <ForgotPasswordForm />
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

export default memo(ForgotPasswordPage);