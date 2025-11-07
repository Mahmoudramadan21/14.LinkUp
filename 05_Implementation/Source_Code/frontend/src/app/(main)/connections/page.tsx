// app/(main)/connections/page.tsx
import type { Metadata } from 'next';
import ConnectionsPageClient from './ConnectionsClient';
import StructuredData from '@/components/seo/StructuredData';

/**
 * Enterprise-grade SEO metadata for the Connections page.
 */
export const metadata: Metadata = {
  title: 'Connections | LinkUp',
  description:
    'Discover people you may know, manage followers, following, and follow requests on LinkUp.',

  alternates: {
    canonical: '/connections',
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
    title: 'Your Connections on LinkUp',
    description:
      'Grow your network — manage followers, following, and discover people you may know.',
    url: '/connections',
    siteName: 'LinkUp',
    type: 'profile',
    locale: 'en_US',
    images: [
      {
        url: '/og-connections.png',
        width: 1200,
        height: 630,
        alt: 'Manage your connections and discover new people on LinkUp',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Connections • LinkUp',
    description: 'Grow your network and discover people you may know.',
    images: ['/og-connections.png'],
    site: '@LinkUp',
  },
};

/**
 * Server Component – Connections Page Entry Point
 */
export default function ConnectionsPage() {
  return (
    <>
      {/* Main WebPage Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Your Connections',
          description:
            'Manage followers, following, pending requests, and discover people you may know on LinkUp.',
          url: 'https://linkup.com/connections',
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
        }}
      />

      {/* Social Network Graph Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'SocialNetwork',
          name: 'LinkUp',
          url: 'https://linkup.com',
          potentialAction: {
            '@type': 'FollowAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://linkup.com/connections',
            },
          },
        }}
      />

      {/* Suggested Users Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'People You May Know on LinkUp',
          description:
            'Suggested connections based on mutual friends, interests, and interactions.',
          url: 'https://linkup.com/connections?tab=suggestions',
          itemListElement: [], // Will be dynamically injected from client in future
        }}
      />

      {/* Client Component */}
      <ConnectionsPageClient />
    </>
  );
}
