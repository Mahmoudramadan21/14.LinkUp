/**
 * Verify Code page for the LinkUp application (Server Component).
 * Renders the verification code form within the authentication layout.
 */

import type { Metadata } from 'next';
import VerifyCodeWrapper from './VerifyCodeWrapper';
import type { ReactElement } from 'react';
import styles from "../auth-layout.module.css"

export const metadata: Metadata = {
  title: "Verify Code | LinkUp",
  description:
    "Enter the verification code sent to your email to continue resetting your LinkUp account password.",
  keywords: [
    "LinkUp",
    "verify code",
    "password reset",
    "authentication",
    "email verification",
  ],
  authors: [{ name: "LinkUp Team" }],
  applicationName: "LinkUp",
  generator: "Next.js",

  // Canonical URL
  alternates: {
    canonical: "/verify-code",
  },

  // Robots
  robots: {
    index: false, // Verify code page usually shouldn't be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-video-preview": -1,
      "max-image-preview": "none",
    },
  },

  // Open Graph
  openGraph: {
    title: "Verify Code | LinkUp",
    description:
      "Enter the verification code sent to your email to reset your LinkUp password.",
    url: "/verify-code",
    siteName: "LinkUp",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "LinkUp Verification",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Verify Code | LinkUp",
    description:
      "Enter the verification code sent to your email to reset your LinkUp account password.",
    images: ["/og-default.png"],
    creator: "@LinkUp",
  },
};

/**
 * Renders the verify code page with the verification form wrapper.
 * @returns {ReactElement} The verify code page component.
 */
const VerifyCodePage = (): ReactElement => {
  return (
    <div className={styles["auth-page"]}>
      <VerifyCodeWrapper />
    </div>
  );
};

export default VerifyCodePage;