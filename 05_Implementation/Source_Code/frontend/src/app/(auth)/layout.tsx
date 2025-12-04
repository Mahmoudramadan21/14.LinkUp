/**
 * Authentication layout for the LinkUp application.
 * Provides a consistent layout for authentication pages (e.g., login, signup) with background images and accessibility features.
 */

import { memo } from 'react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import styles from "./auth-layout.module.css"

/**
 * Metadata for authentication pages.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: {
    default: 'LinkUp | Authentication',
    template: '%s | LinkUp',
  },
  description: 'Sign up or log in to LinkUp to connect with friends and share your moments.',
  openGraph: {
    title: 'LinkUp | Authentication',
    description: 'Connect with friends and share your moments on LinkUp.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkUp | Authentication',
    description: 'Connect with friends and share your moments on LinkUp.',
  },
};

/**
 * Props for the AuthLayout component.
 * @interface AuthLayoutProps
 */
interface AuthLayoutProps {
  /** The child components to be rendered within the layout. */
  children: ReactNode;
}

/**
 * Renders the authentication layout with decorative images and accessibility features.
 * @param {AuthLayoutProps} props - The component props.
 * @returns {ReactElement} The authentication layout with children.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className={`${styles["auth-layout__wrapper"]}`} itemScope itemType="http://schema.org/WebPage">
      <a href="#main-content" className={styles["auth-layout__skip-link"]}>
        Skip to main content
      </a>
      <div className={styles["auth-layout__liquid"]} role="banner" aria-hidden="true">
        <Image
          src="/svgs/liquid.svg"
          alt=""
          width={600}
          height={636}
          className={styles["auth-layout__image--liquid"]}
          aria-hidden="true"
          loading="lazy"
          sizes="(max-width: 768px) 50vw, 600px"
        />
      </div>
      <div className={styles["auth-layout__footer"]} role="banner" aria-hidden="true">
        <Image
          src="/svgs/footer.svg"
          alt=""
          width={1439}
          height={214}
          className={styles["auth-layout__image--footer"]}
          aria-hidden="true"
          loading="lazy"
          sizes="100vw"
        />
      </div>
      <main className={styles["auth-layout__main"]} id="main-content" role="main" aria-labelledby="auth-layout-title">
        <h1 id="auth-layout-title" className="sr-only">
          Authentication
        </h1>
        {children}
      </main>
    </div>
  );
};

export default memo(AuthLayout);