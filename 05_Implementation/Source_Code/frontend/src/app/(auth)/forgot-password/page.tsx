/**
 * Forgot Password page for the LinkUp application (Server Component).
 * Renders the forgot password form with an illustration for visual appeal.
 */

import ForgotPasswordForm from './ForgotPasswordForm';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { JSX } from 'react';
import styles from "../auth-layout.module.css"

/**
 * Metadata for the forgot password page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Forgot Password | LinkUp",
  description:
    "Recover your LinkUp account by requesting a secure password reset link.",
  keywords: [
    "LinkUp",
    "forgot password",
    "password recovery",
    "reset password",
    "account access",
  ],
  authors: [{ name: "LinkUp Team" }],
  applicationName: "LinkUp",
  generator: "Next.js",

  // Canonical URL
  alternates: {
    canonical: "https://linkup-app-frontend.vercel.app/forgot-password",
  },

  // Robots — MUST NOT be indexed
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
    title: "Forgot Password | LinkUp",
    description:
      "Recover your account by requesting a password reset link securely.",
    url: "https://linkup-app-frontend.vercel.app/forgot-password",
    siteName: "LinkUp",
    type: "website",
    images: [
      {
        url: "og/og-default.png",
        width: 1200,
        height: 630,
        alt: "Forgot Password - LinkUp",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Forgot Password | LinkUp",
    description:
      "Request a secure password reset link to regain access to your LinkUp account.",
    images: ["og/og-default.png"],
    creator: "@LinkUp",
  },
};

/**
 * Renders the forgot password page with form and illustration.
 * @returns {JSX.Element} The forgot password page component.
 */
const ForgotPasswordPage = (): JSX.Element => {
  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-page__container"]}>
        <div className={styles["auth-page__form"]}>
          <ForgotPasswordForm />
        </div>
        <div className={styles["auth-page__illustration"]} aria-hidden="true">
          <Image
            src="/illustrations/auth-security-illustration.svg"
            alt="Illustration of a person resetting their password securely"
            width={500}
            height={500}
            className={styles["auth-page__image--illustration"]}
            loading="lazy"
            sizes="(max-width: 1024px) 50vw, 500px"
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;