import React, { memo } from 'react';
import AuthLayout from '@/layout/AuthLayout';
import VerificationCodeForm from '@/forms/VerificationCodeForm';
import Image from 'next/image';

/**
 * VerifyCodePage Component
 * Renders the verification code page with a form and an illustration within the AuthLayout.
 */
const VerifyCodePage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Verify Code">
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__form">
            <VerificationCodeForm />
          </div>
          <div className="auth-page__illustration" aria-hidden="true">
            <Image
              src="/illustrations/auth-security-illustration.svg"
              alt="Illustration of a person verifying a code securely"
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

export default memo(VerifyCodePage);