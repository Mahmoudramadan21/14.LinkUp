// app/(main)/explore/page.tsx

import type { Metadata } from 'next';
import ExplorePageClient from './ExploreClient';
import StructuredData from '@/components/seo/StructuredData';

/**
 * SEO Metadata for the Explore / Discovery page
 */
export const metadata: Metadata = {
  title: 'Explore | LinkUp',
  description:
    'Explore trending photos, videos, and posts on LinkUp. Discover new creators, popular content, and the latest moments shared across the community.',

  alternates: {
    canonical: '/explore',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },

  openGraph: {
    title: 'Explore Trending Content on LinkUp',
    description:
      'Browse trending photos, videos, and posts from creators across LinkUp. Stay updated with the most engaging content.',
    url: '/explore',
    siteName: 'LinkUp',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-explore.png',
        width: 1200,
        height: 630,
        alt: 'Explore trending posts on LinkUp',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Explore • LinkUp',
    description: 'Discover trending photos, videos, and the latest popular posts.',
    images: ['/og-explore.png'],
    site: '@LinkUp',
  },
};

/**
 * Explore Page – Server Component
 */
export default function ExplorePage() {
  return (
    <>
      {/* Main Explore Collection Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Explore - Trending Content on LinkUp',
          description:
            'Discover trending posts, photos, and videos shared by the LinkUp community.',
          url: 'https://linkup.com/explore',
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
          mainEntity: {
            '@type': 'ItemList',
            name: 'Trending Posts',
            itemListOrder: 'http://schema.org/ItemListOrderDescending',
          },
        }}
      />

      {/* Image Gallery Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Explore Image Gallery - LinkUp',
          description: 'A curated gallery of trending and popular images shared by the community.',
          url: 'https://linkup.com/explore',
          associatedMedia: {
            '@type': 'MediaGallery',
          },
        }}
      />

      {/* Video Gallery Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'VideoGallery',
          name: 'Explore Video Highlights - LinkUp',
          description: 'A collection of trending and popular short-form videos.',
          url: 'https://linkup.com/explore',
        }}
      />

      {/* Client Component */}
      <ExplorePageClient />
    </>
  );
}
