// app/feed/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { Suspense, memo } from 'react';
import StoriesContent from './StoriesContent';
import FeedPostsContent from './FeedPostsContent';

const FeedLayout = memo(
  ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
    return (
      <div className="relative min-h-screen">
        {/* Nested children (e.g., routed content inside feed) */}
        <Suspense
          fallback={
            <div className="p-4 text-center text-gray-400">
              Loading content...
            </div>
          }
        >
          {children}
        </Suspense>

        {/* Modal overlays */}
        <Suspense fallback={null}>{modal}</Suspense>

        {/* Stories & Posts */}
        <Suspense
          fallback={
            <div className="p-4 text-center text-gray-500">
              Loading feed...
            </div>
          }
        >
          <StoriesContent />
          <FeedPostsContent />
        </Suspense>
      </div>
    );
  }
);

FeedLayout.displayName = 'FeedLayout';

export default FeedLayout;