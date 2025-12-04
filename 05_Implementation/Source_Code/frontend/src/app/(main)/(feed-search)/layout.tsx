// app/(main)/(feed-search)/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { Suspense, memo } from 'react';
import SidebarContent from './SidebarContent';

/**
 * FeedSearchLayout
 * Shared layout for both Feed and Search pages in the main app.
 * Features a responsive two-column design:
 * - Left sidebar (visible on lg+ screens) with suggestions & follow requests
 * - Main content area centered on mobile, full-width on desktop
 */
const FeedSearchLayout = memo(({ children }: { children: ReactNode }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_62.5%] xl:grid-cols-[30%_67.5%] gap-6">
      {/* Sidebar - Hidden on mobile, sticky on desktop */}
      <aside
        className="hidden lg:block w-full sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
        aria-label="Sidebar with user suggestions and follow requests"
      >
        <Suspense
          fallback={
            <div className="p-8 text-center text-gray-500 animate-pulse">
              Loading sidebar...
            </div>
          }
        >
          <SidebarContent />
        </Suspense>
      </aside>

      {/* Main Content - Feed or Search Results */}
      <main className="flex flex-col w-full max-w-2xl mx-auto lg:mx-0 lg:max-w-none lg:w-full">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  );
});

FeedSearchLayout.displayName = 'FeedSearchLayout';

export default FeedSearchLayout;