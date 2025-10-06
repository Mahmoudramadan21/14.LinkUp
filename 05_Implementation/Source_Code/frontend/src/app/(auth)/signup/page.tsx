/**
 * Signup page for the LinkUp application.
 * Renders the signup form within the authentication layout.
 */

import SignupForm from './SignupForm';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';

/**
 * Metadata for the signup page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Sign up for LinkUp to connect with friends and share your moments.',
  openGraph: {
    title: 'LinkUp | Sign Up',
    description: 'Sign up for LinkUp to connect with friends and share your moments.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Sign Up',
    description: 'Sign up for LinkUp to connect with friends and share your moments.',
  },
};

/**
 * Renders the signup page with the signup form.
 * @returns {ReactElement} The signup page component.
 */
const SignupPage = (): ReactElement => {
  return (
    <div className="auth-page auth-page--signup">
      <div className="auth-page__container">
        <div className="auth-page__form auth-page__form--signup">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;