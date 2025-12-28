import type { Metadata } from 'next';
import HighlightModalClient from './HighlightPageClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{
    username: string;
    highlightId: string;
  }>;
};
/**
 * Dynamic metadata for individual Highlight viewer pages.
 *
 * These URLs are frequently shared (e.g., "Check out my travel highlight!").
 * Rich, accurate metadata ensures beautiful link previews on WhatsApp,
 * Telegram, iMessage, Twitter/X, Facebook, etc.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username.replace(/^@/, '').toLowerCase();
  const highlightId = resolvedParams.highlightId;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return {
    title: `${displayName}'s Highlight | LinkUp`,
    description: `${displayName}'s saved stories – a permanent collection of favorite moments on LinkUp.`,

    alternates: {
      canonical: `https://linkup-app-frontend.vercel.app/${username}/highlights/${highlightId}`,
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
      title: `${displayName}'s Highlight on LinkUp`,
      description: `Explore ${displayName}'s curated collection of stories that never expire.`,
      url: `https://linkup-app-frontend.vercel.app/${username}/highlights/${highlightId}`,
      siteName: 'LinkUp',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: 'og/og-highlight.png',
          width: 1200,
          height: 630,
          alt: `${displayName}'s Highlight on LinkUp`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Highlight | LinkUp`,
      description: `Permanent collection of ${displayName}'s best stories`,
      images: ['og/og-highlight.png'],
      site: '@LinkUp',
      creator: `@${username}`,
    },
  };
}

/**
 * Server Component – Entry point for individual Highlight viewer.
 *
 * Responsibilities:
 *  • Deliver perfect SEO & social sharing metadata
 *  • Inject structured data that identifies this as a highlight collection
 *  • Stream the client component instantly (zero blocking, full RSC streaming)
 *  • No data fetching on the server – all logic lives in the client component
 *
 * This pattern mirrors Instagram: the server only cares about SEO,
 * the client handles everything interactive.
 */
export default async function HighlightViewerPage({ params }: Props) {
  const resolvedParams = await params; 
  const username = resolvedParams.username.replace(/^@/, '').toLowerCase();
  const highlightId = Number(resolvedParams.highlightId);

  return (
    <>
      {/* WebPage schema – primary identifier for this highlight */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${username}'s Highlight #${highlightId}`,
          description: `Permanent story collection (highlight) from @${username} on LinkUp social platform.`,
          url: `https://linkup-app-frontend.vercel.app/${username}/highlights/${highlightId}`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup-app-frontend.vercel.app',
          },
        }}
      />

      {/* CollectionPage schema – reinforces that this is a curated collection */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${username}'s Highlight`,
          description: `Curated collection of stories saved by @${username}`,
          url: `https://linkup-app-frontend.vercel.app/${username}/highlights/${highlightId}`,
          mainEntity: {
            '@type': 'ItemList',
            name: 'Stories in Highlight',
            numberOfItems: 0, // populated client-side if needed
          },
        }}
      />

      {/* Client component – full highlight viewer with navigation, edit, delete, etc. */}
      <HighlightModalClient />
    </>
  );
}