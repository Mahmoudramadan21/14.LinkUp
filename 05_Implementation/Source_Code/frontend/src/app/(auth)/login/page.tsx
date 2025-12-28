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
  title: "Log In | LinkUp",
  description:
    "Log in to LinkUp to connect with friends, share your moments, and explore your personalized feed.",
  keywords: [
    "LinkUp",
    "login",
    "sign in",
    "account login",
    "LinkUp login",
    "social network login",
  ],
  authors: [{ name: "LinkUp Team" }],
  applicationName: "LinkUp",
  generator: "Next.js",

  // Canonical URL
  alternates: {
    canonical: "https://linkup-app-frontend.vercel.app/login",
  },

  // Robots (login pages CAN be indexed)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  // Open Graph
  openGraph: {
    title: "Login | LinkUp",
    description:
      "Access your LinkUp account to connect with friends and explore updates.",
    url: "https://linkup-app-frontend.vercel.app/login",
    siteName: "LinkUp",
    type: "website",
    images: [
      {
        url: "og/og-login.png",
        width: 1200,
        height: 630,
        alt: "LinkUp Login",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Login | LinkUp",
    description:
      "Log in to your LinkUp account and continue connecting with the community.",
    images: ["og/og-login.png"],
    creator: "@LinkUp",
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