// app/(main)/search/page.tsx
import type { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';
import StructuredData from '@/components/seo/StructuredData';

/**
 * Dynamic, query-aware metadata for the global search page.
 * 
 * This page is CRITICAL for:
 * - Organic traffic via long-tail keywords
 * - Social sharing when users share search results
 * - Google rich results (People also ask, Featured snippets)
 * - Deep linking from notifications & messages
 */
export function generateMetadata(): Metadata {
  // We'll read the query from the URL in the client, but for SEO we use a strong fallback
  return {
    title: 'Search | LinkUp',
    description: 'Find people, posts, photos, videos, and trending content on LinkUp.',

    alternates: {
      canonical: '/search',
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
      title: 'Search LinkUp',
      description: 'Discover people, posts, and trending content across LinkUp.',
      url: '/search',
      siteName: 'LinkUp',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: '/og-search.png',
          width: 1200,
          height: 630,
          alt: 'Search people and posts on LinkUp',
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: 'Search | LinkUp',
      description: 'Find friends, posts, and trending content',
      images: ['/og-search.png'],
      site: '@LinkUp',
    },

    
  };
}

/**
 * Server Component – Global Search Entry Point
 * 
 * Responsibilities:
 * - Inject rich SEO metadata (static + dynamic-ready)
 * - Provide structured data for search engine understanding
 * - Stream the heavy client component with zero blocking
 * - Maintain perfect Core Web Vitals
 */
export default function SearchPage() {
  return (
    <>
      {/* Primary Structured Data – SearchAction for Google */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: 'https://linkup.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://linkup.com/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* Secondary – WebPage for current search experience */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'SearchResultsPage',
          name: 'LinkUp Search',
          description: 'Search results for people, posts, and content on LinkUp social network.',
          url: 'https://linkup.com/search',
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
        }}
      />

      {/* Client Component – Full interactive search experience */}
      <SearchPageClient />
    </>
  );
}