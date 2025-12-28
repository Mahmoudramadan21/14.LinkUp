'use client';

import Image from 'next/image';

/* -------------------------------------------------------------------------- */
/*                               App Loader                                   */
/* -------------------------------------------------------------------------- */
/**
 * Displays a full-screen branded loader while the app is initializing.
 * - Used during auth / app bootstrapping
 * - Logo-only loader (Facebook-style)
 * - Theme-aware (light / dark)
 */
export default function AppLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-bg)]"
      role="status"
      aria-label="Loading application"
    >
      <Image
        src="/svgs/logo.svg"
        alt="LinkUp"
        width={160}
        height={52}
        priority
        fetchPriority="high"
        className="dark:invert opacity-90 animate-pulse"
      />
    </div>
  );
}
