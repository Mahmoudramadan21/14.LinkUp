import React from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Image from 'next/image';
import PasswordResetSuccessSection from '@/sections/PasswordResetSuccessSection';
import AuthLayout from '@/layout/AuthLayout';
import authSecurityIllustration from '@/../public/illustrations/auth-security-illustration.svg';

const PasswordResetSuccess: React.FC = () => {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/login');
  };

  return (
    <AuthLayout title="LinkUp | Password Reset Success">
      <div className="auth-page">
        <div className="auth-page__container">
          {/* Left Side: Success Message */}
          <div className="auth-page__form">
            <PasswordResetSuccessSection onContinue={handleContinue} />
          </div>
          {/* Right Side: Illustration */}
          <div className="auth-page__illustration">
            <Image
              src={authSecurityIllustration}
              alt="Illustration of a person resetting their password securely"
              width={500}
              height={500}
              priority
              className="auth-page__illustration-image"
            />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetSuccess;