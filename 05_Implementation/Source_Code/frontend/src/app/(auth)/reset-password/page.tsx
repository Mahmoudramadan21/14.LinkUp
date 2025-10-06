/**
 * Reset Password page for the LinkUp application (Server Component).
 * Renders the reset password form wrapper within the authentication layout.
 */

import type { Metadata } from 'next';
import ResetPasswordWrapper from './ResetPasswordWrapper';
import type { JSX } from 'react';

/**
 * Metadata for the reset password page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your LinkUp account to regain access.',
  openGraph: {
    title: 'LinkUp | Reset Password',
    description: 'Set a new password for your LinkUp account to regain access.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Reset Password',
    description: 'Set a new password for your LinkUp account to regain access.',
  },
};

/**
 * Renders the reset password page with the reset password wrapper.
 * @returns {JSX.Element} The reset password page component.
 */
const ResetPasswordPage = (): JSX.Element => {
  return <ResetPasswordWrapper />;
};

export default ResetPasswordPage;