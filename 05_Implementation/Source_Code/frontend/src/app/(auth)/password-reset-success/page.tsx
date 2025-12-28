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
  title: "Password Reset Successful | LinkUp",
  description:
    "Your password has been successfully reset. You can now log in to your LinkUp account securely.",
  keywords: [
    "LinkUp",
    "password reset",
    "success",
    "login",
    "account access",
  ],
  authors: [{ name: "LinkUp Team" }],
  applicationName: "LinkUp",
  generator: "Next.js",

  // Canonical URL
  alternates: {
    canonical: "https://linkup-app-frontend.vercel.app/password-reset-success",
  },

  // Robots – these pages MUST NOT be indexed
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },

  // Open Graph
  openGraph: {
    title: "Password Reset Successful | LinkUp",
    description:
      "Your password has been reset successfully. You can now log in to your LinkUp account.",
    url: "https://linkup-app-frontend.vercel.app/password-reset-success",
    siteName: "LinkUp",
    type: "website",
    images: [
      {
        url: "og/og-default.png",
        width: 1200,
        height: 630,
        alt: "Password Reset Completed",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Password Reset Successful | LinkUp",
    description:
      "Your LinkUp password has been reset successfully. You can now log in securely.",
    images: ["og/og-default.png"],
    creator: "@LinkUp",
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