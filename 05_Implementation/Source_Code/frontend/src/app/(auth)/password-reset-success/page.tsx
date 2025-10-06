/**
 * Password Reset Success page for the LinkUp application (Server Component).
 * Renders the success message wrapper after a successful password reset.
 */

import type { Metadata } from 'next';
import PasswordResetSuccessWrapper from './PasswordResetSuccessWrapper';
import type { JSX } from 'react';

/**
 * Metadata for the password reset success page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Password Reset Success',
  description: 'Your password has been successfully reset. Log in to your LinkUp account.',
  openGraph: {
    title: 'LinkUp | Password Reset Success',
    description: 'Your password has been successfully reset. Log in to your LinkUp account.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Password Reset Success',
    description: 'Your password has been successfully reset. Log in to your LinkUp account.',
  },
};

/**
 * Renders the password reset success page.
 * @returns {JSX.Element} The password reset success page component.
 */
const PasswordResetSuccessPage = (): JSX.Element => {
  return <PasswordResetSuccessWrapper />;
};

export default PasswordResetSuccessPage;