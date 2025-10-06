/**
 * Forgot Password page for the LinkUp application (Server Component).
 * Renders the forgot password form with an illustration for visual appeal.
 */

import ForgotPasswordForm from './ForgotPasswordForm';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Metadata for the forgot password page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your LinkUp password to regain access to your account.',
  openGraph: {
    title: 'LinkUp | Forgot Password',
    description: 'Reset your LinkUp password to regain access to your account.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Forgot Password',
    description: 'Reset your LinkUp password to regain access to your account.',
  },
};

/**
 * Renders the forgot password page with form and illustration.
 * @returns {JSX.Element} The forgot password page component.
 */
const ForgotPasswordPage = (): JSX.Element => {
  return (
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
  );
};

export default ForgotPasswordPage;