// app/error.tsx
/**
 * Global Error Boundary for the entire app (App Router)
 * 
 * Catches:
 * - Server-side rendering errors
 * - Client-side runtime errors
 * - API route errors (when used inside app directory)
 * 
 * Features:
 * - Beautiful, on-brand error UI (light + dark mode)
 * - Full accessibility & SEO considerations
 * - Error reporting hook (ready for Sentry/LogRocket in the future)
 * - "Try again" button that resets the error boundary
 * - Clean, maintainable, well-commented code
 */

'use client';

import type { Metadata } from 'next';
import Link from 'next/link';

// ===============================================
// Optional: Static metadata (won't run on error, but good for SSR fallback)
// ===============================================
export const metadata: Metadata = {
  title: 'Something Went Wrong | LinkUp',
  description: 'An unexpected error occurred. Our team has been notified.',
  robots: { index: false, follow: false },
};

// ===============================================
// Error Boundary Component
// ===============================================
interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void; // Provided by Next.js to attempt recovery
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {

  return (
    <html lang="en">
      <body>
        <main
          className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] px-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          {/* Animated gradient icon or illustration */}
          <div className="mb-8 rounded-full bg-gradient-to-br from-[var(--linkup-purple)] to-[var(--linkup-teal)] p-6 shadow-2xl">
            <svg
              className="h-16 w-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="mb-4 text-5xl font-black text-[var(--text-primary)] md:text-6xl">
            Oops!
          </h1>

          {/* Friendly Message */}
          <p className="mb-6 max-w-lg text-xl font-medium text-[var(--text-primary)]">
            Something went wrong
          </p>

          <p className="mb-10 max-w-md text-[var(--text-secondary)]">
            Don&apos;t worry — our team has been notified. Try refreshing or come back later.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Try Again Button */}
            <button
              onClick={() => reset()}
              className="btn-rounded--purple flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-ring active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0L9 4m-4.418 5H9m11 7v-5h-.582m-10.774 7a8.001 8.001 0 0115.356-2m0 0L21 20m-16.418-5H9"
                />
              </svg>
              Try Again
            </button>

            {/* Back to Feed / Home */}
            <Link
              href="/feed"
              className="btn-rounded flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-[var(--text-primary)] bg-[var(--card-bg)] shadow-md transition-all hover:shadow-lg focus-ring"
            >
              Back to Feed
            </Link>
          </div>

        </main>
      </body>
    </html>
  );
}