/**
 * Verify Code page for the LinkUp application (Server Component).
 * Renders the verification code form within the authentication layout.
 */

import type { Metadata } from 'next';
import VerifyCodeWrapper from './VerifyCodeWrapper';
import type { ReactElement } from 'react';

/**
 * Metadata for the verify code page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Verify Code',
  description:
    'Enter the verification code sent to your email to reset your LinkUp account password.',
  openGraph: {
    title: 'LinkUp | Verify Code',
    description:
      'Enter the verification code sent to your email to reset your LinkUp account password.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Verify Code',
    description:
      'Enter the verification code sent to your email to reset your LinkUp account password.',
  },
};

/**
 * Renders the verify code page with the verification form wrapper.
 * @returns {ReactElement} The verify code page component.
 */
const VerifyCodePage = (): ReactElement => {
  return (
    <div className="auth-page">
      <VerifyCodeWrapper />
    </div>
  );
};

export default VerifyCodePage;