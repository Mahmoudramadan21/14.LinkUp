/**
 * Login page for the LinkUp application (Server Component).
 * Renders the login client component with metadata for SEO.
 */

import type { Metadata } from 'next';
import LoginClient from './LoginClient';
import type { JSX } from 'react';

/**
 * Metadata for the login page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to LinkUp to connect with friends and share your moments.',
  openGraph: {
    title: 'LinkUp | Login',
    description: 'Log in to LinkUp to connect with friends and share your moments.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Login',
    description: 'Log in to LinkUp to connect with friends and share your moments.',
  },
};

/**
 * Renders the login page with the login client component.
 * @returns {JSX.Element} The login page component.
 */
const LoginPage = (): JSX.Element => {
  return <LoginClient />;
};

export default LoginPage;