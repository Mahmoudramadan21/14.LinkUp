// app/(main)/feed/stories/create/page.tsx
import type { Metadata } from 'next';
import CreateStoryClient from './CreateStoryClient';
import StructuredData from '@/components/seo/StructuredData';

/**
 * SEO-optimized metadata for the Create Story page.
 * 
 * This page is frequently shared (especially via "Add to Story" buttons)
 * and appears in browser history, bookmarks, and social previews.
 * Having rich metadata significantly improves click-through rate.
 */
export const metadata: Metadata = {
  title: 'Create Story | LinkUp',
  description: 'Share a photo or video as your story on LinkUp. Your friends will see it for 24 hours.',

  alternates: {
    canonical: 'https://linkup-app-frontend.vercel.app/feed/stories/create',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  openGraph: {
    title: 'Create Your Story on LinkUp',
    description: 'Share a quick photo or video – your friends will see it for 24 hours!',
    url: 'https://linkup-app-frontend.vercel.app/feed/stories/create',
    siteName: 'LinkUp',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'og/og-create-story.png',
        width: 1200,
        height: 630,
        alt: 'Create a new story on LinkUp',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Create Story | LinkUp',
    description: 'Share a moment that lasts 24 hours',
    images: ['og/og-create-story.png'],
    site: '@LinkUp',
  },
};

/**
 * Server Component – Handles:
 * - Static + rich SEO metadata
 * - Structured Data for rich results
 * - Zero blocking of streaming
 * 
 * Delegates all interactivity to client component.
 */
export default function CreateStoryPage() {
  return (
    <>
      {/* Structured Data – Helps Google understand this is a creation flow */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Create Story',
          description: 'Upload a photo or video to share as your story on LinkUp for 24 hours.',
          url: 'https://linkup-app-frontend.vercel.app/feed/stories/create',
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup-app-frontend.vercel.app',
          },
          potentialAction: {
            '@type': 'CreateAction',
            name: 'Create a new story',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://linkup-app-frontend.vercel.app/feed/stories/create',
            },
          },
        }}
      />

      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreateAction',
          name: 'Share a Story on LinkUp',
          description: 'Upload a photo or video to your story',
          agent: {
            '@type': 'Person',
            name: 'LinkUp User',
          },
          result: {
            '@type': 'CreativeWork',
            name: '24-Hour Story',
            duration: 'PT24H',
          },
        }}
      />

      {/* Client Component – Full interactive experience */}
      <CreateStoryClient />
    </>
  );
}