// app/(main)/feed/page.tsx
import type { Metadata } from 'next';

/**
 * SEO-optimized static metadata for the main Feed page (/feed).
 * 
 * This is LinkUp's most important page for organic traffic, social sharing,
 * and user retention. Using static export ensures:
 * - Lightning-fast TTFB and LCP
 * - Full CDN caching
 * - Zero blocking of HTML streaming
 * - Perfect Core Web Vitals
 */
export const metadata: Metadata = {
  // Title: 50–60 characters (Google's sweet spot)
  title: 'Your Feed | LinkUp',
  
  // Description: 150–160 characters, compelling, includes primary keywords
  description:
    'See what your friends are sharing on LinkUp. Discover new posts, stories, photos, and updates from people you follow.',

  keywords: [
    'social feed',
    'friends updates',
    'LinkUp feed',
    'latest posts',
    'social network',
    'stories and posts',
  ],

  // Canonical URL
  alternates: {
    canonical: '/feed',
  },

  // Full indexing – this is your homepage alternative
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

  // Open Graph – Critical for social sharing
  openGraph: {
    title: 'Your Feed on LinkUp',
    description: 'Stay connected with friends through posts, stories, and real-time updates.',
    url: '/feed',
    siteName: 'LinkUp',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-feed.png',          
        width: 1200,
        height: 630,
        alt: 'LinkUp Feed – Posts and Stories from Friends',
      },
    ],
  },

  // Twitter/X Cards
  twitter: {
    card: 'summary_large_image',
    title: 'Your Feed | LinkUp',
    description: 'See the latest from your friends on LinkUp.',
    images: ['/og-feed.png'],
    creator: '@LinkUp',
    site: '@LinkUp',
  },

  // PWA & Mobile
  manifest: '/manifest.json',
  themeColor: '#4361ee',
  appleWebApp: {
    capable: true,
    title: 'LinkUp',
    statusBarStyle: 'black-translucent',
  },
};

/**
 * Feed Page – Main entry point.
 * Returns layout only to enable full SSR streaming and optimal performance.
 */
export default function FeedPage() {
  return null;
}