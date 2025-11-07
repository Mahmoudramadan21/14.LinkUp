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
  title: "Reset Password | LinkUp",
  description:
    "Reset your LinkUp account password securely to regain access to your profile.",
  keywords: [
    "LinkUp",
    "reset password",
    "forgot password",
    "password recovery",
    "account access",
  ],
  authors: [{ name: "LinkUp Team" }],
  applicationName: "LinkUp",
  generator: "Next.js",

  // Canonical URL (important for avoiding duplicate pages)
  alternates: {
    canonical: "/reset-password",
  },

  // Robots (Reset Password should NOT be indexed)
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
    title: "Reset Password | LinkUp",
    description:
      "Reset your LinkUp password to regain secure access to your account.",
    url: "/reset-password",
    siteName: "LinkUp",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "LinkUp Password Reset",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Reset Password | LinkUp",
    description:
      "Reset your LinkUp password to restore access to your account securely.",
    images: ["/og-default.png"],
    creator: "@LinkUp",
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