/**
 * Signup page for the LinkUp application.
 * Renders the signup form within the authentication layout.
 */

import SignupForm from './SignupForm';
import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import styles from "../auth-layout.module.css"

/**
 * Metadata for the signup page.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Create Account | LinkUp",
  description:
    "Create your LinkUp account to connect with friends, share your moments, and join the community.",
  keywords: [
    "LinkUp",
    "sign up",
    "create account",
    "register",
    "social network",
    "join LinkUp",
  ],
  authors: [{ name: "LinkUp Team" }],
  applicationName: "LinkUp",
  generator: "Next.js",

  // Canonical URL
  alternates: {
    canonical: "/signup",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-video-preview": -1,
      "max-image-preview": "large",
    },
  },

  // Open Graph
  openGraph: {
    title: "Create Account | LinkUp",
    description:
      "Join LinkUp today and start connecting with people around the world.",
    url: "/signup",
    siteName: "LinkUp",
    type: "website",
    images: [
      {
        url: "/og-signup.png",
        width: 1200,
        height: 630,
        alt: "LinkUp Signup",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Create Account | LinkUp",
    description:
      "Join LinkUp today and start connecting with friends and sharing your world.",
    images: ["/og-signup.png"],
    creator: "@LinkUp",
  },
};


/**
 * Renders the signup page with the signup form.
 * @returns {ReactElement} The signup page component.
 */
const SignupPage = (): ReactElement => {
  return (
    <div className={`${styles["auth-page"]} ${styles["auth-page--signup"]}`}>
      <div className={styles["auth-page__container"]}>
        <div className={`${styles["auth-page__form"]} ${styles["auth-page__form--signup"]} `}>
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;