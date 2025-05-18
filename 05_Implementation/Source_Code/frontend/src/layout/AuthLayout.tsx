import React, { memo, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { AuthLayoutProps } from '@/types';

/**
 * AuthLayout Component
 * Provides a layout for authentication pages with background images and a centered container.
 * Includes SEO meta tags and accessibility features.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title = 'LinkUp | Sign In' }) => {
  // Memoize children rendering
  const memoizedChildren = useMemo(() => children, [children]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sign up or log in to LinkUp to connect with friends and share your moments." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="Connect with friends and share your moments on LinkUp." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content="Connect with friends and share your moments on LinkUp." />
        <meta lang="en" />
      </Head>
      <div className="auth-layout__wrapper" itemscope itemtype="http://schema.org/WebPage">
        <a href="#main-content" className="auth-layout__skip-link">
          Skip to main content
        </a>
        <div className="auth-layout__liquid" role="banner" aria-hidden="true">
          <Image
            src="/svgs/liquid.svg"
            alt=""
            width={600}
            height={636}
            className="auth-layout__image--liquid"
            aria-hidden="true"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 600px"
          />
        </div>
        <div className="auth-layout__footer" role="banner" aria-hidden="true">
          <Image
            src="/svgs/footer.svg"
            alt=""
            width={1439}
            height={214}
            className="auth-layout__image--footer"
            aria-hidden="true"
            loading="lazy"
            sizes="100vw"
          />
        </div>
        <main className="auth-layout__main" id="main-content" role="main" aria-labelledby="auth-layout-title">
          <h1 id="auth-layout-title" className="sr-only">
            {title}
          </h1>
          {memoizedChildren}
        </main>
      </div>
    </>
  );
};

export default memo(AuthLayout);