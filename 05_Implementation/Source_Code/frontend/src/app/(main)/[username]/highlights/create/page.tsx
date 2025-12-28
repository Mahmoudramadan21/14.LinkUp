import type { Metadata } from 'next';
import HighlightCreatePageClient from './HighlightCreatePageClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Dynamic metadata for the "Create Highlight" full-page modal route.
 *
 * Even though this page is only accessible to the profile owner,
 * it can still be bookmarked, shared, or reached via browser history.
 * Providing clear, private-aware metadata ensures:
 *  • No accidental indexing
 *  • Professional link previews if shared
 *  • Proper title in browser tabs/history
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `Create a New Highlight | LinkUp`,
    description: `Create a new highlight to save your favorite stories permanently on LinkUp.`,

    alternates: {
      canonical: `https://linkup-app-frontend.vercel.app/${username}/highlights/create`,
    },

    // This is a private/action page – never index it
    robots: {
      index: false,
      follow: false,
      noimageindex: true,
      nocache: true,
    },

    openGraph: {
      title: `Create a New Highlight | LinkUp`, 
      description: 'Private page – Create a new highlight to save your best stories.',
      url: `https://linkup-app-frontend.vercel.app/${username}/highlights/create`,
      siteName: 'LinkUp',
      type: 'website',
      locale: 'en_US',
    },

    twitter: {
      card: 'summary',
      title: `Create a New Highlight | LinkUp`, 
      description: 'Private page for creating a new highlight.',
    },
  };
}

/**
 * Server Component – Entry point for the "Create Highlight" full-page modal.
 *
 * Responsibilities:
 *  • Deliver correct SEO signals (noindex + clear messaging)
 *  • Inject minimal structured data marking this as a private action page
 *  • Stream the lightweight client component instantly
 *  • Zero server-side data fetching or logic
 *
 * This follows the same bulletproof pattern used across Instagram-style routes:
 *   server = SEO + privacy, client = interactivity
 */
export default async function StoryViewerPage({ params }: Props) {
  const { username } = await params;

  return (
    <>
      {/* Structured Data – explicitly marks this as a private creation page */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Create New Highlight',
          description: 'Private interface for creating a new story highlight on LinkUp.',
          url: `https://linkup-app-frontend.vercel.app/${username}/highlights/create`,
          accessMode: 'private',
          accessModeSufficient: ['textual'],
          isAccessibleForFree: true,
          audience: {
            '@type': 'Audience',
            audienceType: 'Authenticated User Only',
          },
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup-app-frontend.vercel.app',
          },
        }}
      />

      {/* Client component – full-screen Create Highlight modal with smart navigation */}
      <HighlightCreatePageClient />
    </>
  );
}