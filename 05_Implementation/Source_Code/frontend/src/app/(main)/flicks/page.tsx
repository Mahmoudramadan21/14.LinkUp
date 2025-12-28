// app/(main)/flicks/page.tsx

import type { Metadata } from 'next';
import FlicksPageClient from './FlicksClient';
import StructuredData from '@/components/seo/StructuredData';

/**
 * SEO Metadata for the Flicks page
 */
export const metadata: Metadata = {
  title: 'Flicks | LinkUp',
  description:
    'Watch the best short videos, viral clips, and trending moments on LinkUp. Enjoy an immersive vertical video experience built for speed and engagement.',

  alternates: {
    canonical: 'https://linkup-app-frontend.vercel.app/flicks',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    title: 'Flicks - Short Videos on LinkUp',
    description:
      'Discover trending short videos, viral clips, and creative moments shared by the LinkUp community.',
    url: 'https://linkup-app-frontend.vercel.app/flicks',
    siteName: 'LinkUp',
    type: 'video.other',
    locale: 'en_US',
    images: [
      {
        url: 'og/og-flicks.png',
        width: 1200,
        height: 630,
        alt: 'Viral short videos on LinkUp Flicks',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Flicks • LinkUp',
    description: 'A fast and engaging feed of short videos from creators everywhere.',
    images: ['og/og-flicks.png'],
    site: '@LinkUp',
  },
};

/**
 * Flicks Page – Server Component
 */
export default function FlicksPage() {
  return (
    <>
      {/* Main Video Gallery Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'VideoGallery',
          name: 'Flicks - Short Videos on LinkUp',
          description:
            'A curated gallery of trending short-form videos, viral clips, and creative moments from the LinkUp community.',
          url: 'https://linkup-app-frontend.vercel.app/flicks',
          thumbnailUrl: 'og/og-flicks.png',
          genre: 'short-form video',
          inLanguage: 'ar-EG',
          isFamilyFriendly: true,
        }}
      />

      {/* Collection Page Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Flicks Feed',
          description: 'A continuous stream of engaging and trending short videos.',
          url: 'https://linkup-app-frontend.vercel.app/flicks',
          mainEntity: {
            '@type': 'ItemList',
            name: 'Trending Flicks',
            itemListOrder: 'http://schema.org/ItemListOrderDescending',
          },
        }}
      />

      {/* Example Fallback VideoObject */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: 'Viral Flick on LinkUp',
          description: 'Watch one of the latest trending short videos on LinkUp.',
          thumbnailUrl: 'og/og-flicks.png',
          uploadDate: new Date().toISOString(),
          duration: 'PT15S',
          contentUrl: 'https://linkup-app-frontend.vercel.app/flicks',
          embedUrl: 'https://linkup-app-frontend.vercel.app/flicks',
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: { '@type': 'WatchAction' },
            userInteractionCount: 999999,
          },
        }}
      />

      {/* Client Component – Flicks UI */}
      <FlicksPageClient />
    </>
  );
}
