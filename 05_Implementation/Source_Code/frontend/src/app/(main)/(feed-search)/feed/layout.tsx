// app/(main)/feed/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { Suspense, memo } from 'react';
import StoriesContent from './StoriesContent';
import FeedPostsContent from './FeedPostsContent';
import StructuredData from '@/components/seo/StructuredData'; 

/**
 * FeedPageLayout
 * Shared layout for /feed – handles streaming, suspense boundaries,
 * and injects critical structured data for rich results.
 */
const FeedPageLayout = memo(({ children }: { children?: ReactNode }) => {
  return (
    <>
      {/* Critical Structured Data – Boosts Rich Results */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Your Feed',
          description:
            'Personalized social media feed showing posts and stories from friends on LinkUp.',
          url: 'https://linkup.com/feed',
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://linkup.com/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Feed',
              },
            ],
          },
        }}
      />

      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'LinkUp Social Feed',
          description: 'Latest posts and stories from people you follow.',
          url: 'https://linkup.com/feed',
          mainEntity: {
            '@type': 'ItemList',
            name: 'Social Media Posts',
            description: 'User-generated posts and stories',
          },
        }}
      />

      {/* Page-specific banners, headers, promotions */}
      <Suspense fallback={null}>{children}</Suspense>

      {/* Main Feed Content – Streamed */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <p className="text-lg text-gray-500 animate-pulse">Loading your feed...</p>
          </div>
        }
      >
        <StoriesContent />
        <FeedPostsContent />
      </Suspense>
    </>
  );
});

FeedPageLayout.displayName = 'FeedPageLayout';
export default FeedPageLayout;