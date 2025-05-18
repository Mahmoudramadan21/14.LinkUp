import React, { memo, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import HeaderSection from '@/sections/HeaderSection';
import UserMenu from '@/components/UserMenu';
import { useProfileStore } from '@/store/profileStore';
import { removeAuthData } from '@/utils/auth';
import { MainLayoutProps, User } from '@/types';

/**
 * PageHead Component
 * Renders SEO meta tags for the page.
 */
const PageHead: React.FC<{ title: string }> = ({ title }) => (
  <Head>
    <title>{title}</title>
    <meta name="description" content={`Connect with friends and share your moments on ${title}.`} />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charSet="UTF-8" />
    <meta name="csrf-token" content="dummy-csrf-token" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={`Connect with friends and share your moments on ${title}.`} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LinkUp" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={`Connect with friends and share your moments on ${title}.`} />
  </Head>
);

/**
 * MainLayout Component
 * Renders the main layout with header, content, and sidebar.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'LinkUp' }) => {
  const router = useRouter();
  const { authData, initializeAuth } = useProfileStore();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle logout
  const handleLogout = useCallback(() => {
    removeAuthData();
    router.push('/login');
  }, [router]);

  // Memoized user object
  const user = useMemo<User>(
    () => ({
      name: authData?.name || 'User',
      username: authData?.username || 'username',
      profilePicture: authData?.profilePicture || '/avatars/default.jpg',
    }),
    [authData]
  );

  // Render loading state if no auth data
  if (!authData) {
    return (
      <div className="main-layout">
        <PageHead title={title} />
        <div className="main-layout__loading" aria-live="polite">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      className="main-layout"
      itemScope
      itemType="http://schema.org/WebPage"
    >
      <PageHead title={title} />
      <a href="#main-content" className="main-layout__skip-link">
        Skip to main content
      </a>
      <HeaderSection />
      <div className="main-layout__content">
        <main
          id="main-content"
          className="main-layout__container"
          role="main"
          aria-labelledby="main-content-title"
        >
          <h1 id="main-content-title" className="sr-only">
            {title}
          </h1>
          {children}
        </main>
        <aside
          className="main-layout__sidebar"
          role="complementary"
          aria-label="User menu"
        >
          <UserMenu user={user} onLogout={handleLogout} />
        </aside>
      </div>
    </div>
  );
};

export default memo(MainLayout);