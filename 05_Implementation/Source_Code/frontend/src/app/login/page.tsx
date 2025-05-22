'use client';
import React, { memo } from 'react';
import AuthLayout from '@/layout/AuthLayout';
import LoginForm from '@/forms/LoginForm';
import Image from 'next/image';

const LoginPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Sign In">
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__form">
            <LoginForm />
          </div>
          <div className="auth-page__illustration" aria-hidden="true">
            <Image
              src="/illustrations/login-illustration.svg"
              alt="People connecting on LinkUp"
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

export default memo(LoginPage);