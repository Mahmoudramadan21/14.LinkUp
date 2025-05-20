import React, { memo } from 'react';
import AuthLayout from '@/layout/AuthLayout';
import SignupForm from '@/forms/SignupForm';

/**
 * SignupPage Component
 * Renders the signup page with a form within the AuthLayout.
 */
const SignupPage: React.FC = () => {
  return (
    <AuthLayout title="LinkUp | Sign Up">
      <div className="auth-page auth-page--signup">
        <div className="auth-page__container">
          <div className="auth-page__form auth-page__form--signup">
            <SignupForm />
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default memo(SignupPage);