// app/not-found.tsx
/**
 * Custom 404 Not Found Page for LinkUp
 * 
 * Features:
 * - Full SEO optimization (metadata, OG, Twitter cards, noindex)
 * - Perfectly matches the app's design system (colors, fonts, dark mode)
 * - Fully responsive & mobile-friendly
 * - High accessibility (ARIA, focus states, screen reader ready)
 * - Clean, readable, and maintainable code with detailed comments
 * - Consistent with Feed, Stories, and other pages in style and feel
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

// ===============================================
// SEO & Social Metadata (Best Practices)
// ===============================================
export const metadata: Metadata = {
  title: "Page Not Found | LinkUp",
  description:
    "Oops! The page you're looking for doesn't exist on LinkUp. Return to your feed and keep connecting with friends.",
  keywords: ["404", "page not found", "LinkUp 404", "not found"],

  robots: {
    index: false,
    follow: false,
  },

  openGraph: {
    title: "Page Not Found | LinkUp",
    description: "This page doesn't exist. Let's get you back to your feed!",
    url: "https://linkup-app-frontend.vercel.app/not-found",
    siteName: "LinkUp",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "og/og-404.png",
        width: 1200,
        height: 630,
        alt: "LinkUp - Page Not Found",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Page Not Found | LinkUp",
    description: "Oops! This page doesn't exist.",
    images: ["og/og-404.png"],
  },
};

// ===============================================
// 404 Page Component
// ===============================================
export default function NotFoundPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-[var(--text-muted)] animate-pulse">
            Loading...
          </p>
        </div>
      }
    >
      <main
        className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] px-6 text-center"
        role="alert"
        aria-live="polite"
      >
        {/* Large 404 Text */}
        <h1
          className="mb-6 bg-gradient-to-r from-[var(--linkup-purple)] to-[var(--linkup-teal)] bg-clip-text text-8xl font-black text-transparent md:text-9xl"
          aria-hidden="true"
        >
          404
        </h1>

        {/* Friendly Message */}
        <p
          className="mb-10 max-w-lg text-xl font-medium text-[var(--text-primary)] md:text-2xl"
          id="not-found-message"
        >
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <p className="mb-12 max-w-md text-[var(--text-secondary)]">
          It might have been moved, deleted, or you may have mistyped the URL.
        </p>

        {/* Action Button - Same style as the rest of the app */}
        <Link
          href="/feed"
          className="btn-rounded--purple flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus-ring active:scale-95"
          prefetch={false}
        >
          <span>Back to Feed</span>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </Link>

      </main>
    </Suspense>
  );
}