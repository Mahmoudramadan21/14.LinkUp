import type { Metadata } from 'next';
import StoriesPageClient from './StoriesPageClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Dynamic metadata for the full-screen story viewer route.
 *
 * This route is heavily shared via WhatsApp, Telegram, iMessage, etc.
 * Having accurate, rich metadata dramatically improves click-through rate
 * and gives a professional preview even before the story loads.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');
  const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    title: `${displayName}'s Story | LinkUp`,
    description: `Watch ${displayName}'s active story – photos, videos and moments shared with friends on LinkUp.`,

    alternates: {
      canonical: `/feed/stories/${username}`,
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
      title: `${displayName}'s Story on LinkUp`,
      description: `See what ${displayName} is sharing right now – only visible for 24 hours`,
      url: `https://linkup.com/feed/stories/${username}`,
      siteName: 'LinkUp',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: '/og-story.png', // you can later make this dynamic per user
          width: 1200,
          height: 630,
          alt: `${displayName}'s active story on LinkUp`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Story | LinkUp`,
      description: `Check out ${displayName}'s latest story`,
      images: ['/og-story.png'],
      site: '@LinkUp',
      creator: `@${username}`,
    },
  };
}

/**
 * Server Component – Entry point for the full-screen story viewer.
 *
 * Responsibilities:
 *  • Provide perfect SEO & social sharing metadata
 *  • Inject structured data that helps Google understand this is a story page
 *  • Stream the client component instantly (zero blocking)
 *  • No data fetching on the server – everything is handled client-side
 *    (keeps TTFB minimal and allows full React Server Components streaming)
 */
export default async function StoryViewerPage({ params }: Props) {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');
  
  return (
    <>
      {/* WebPage schema – tells search engines this is a story viewer */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${cleanUsername}'s Story`,
          description: `Full-screen story viewer for @${username} on LinkUp social platform. Stories disappear after 24 hours.`,
          url: `https://linkup.com/feed/stories/${username}`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
        }}
      />

      {/* Additional ProfilePage hint – reinforces that this belongs to a user */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: `${username}'s Story`,
          description: `Temporary story content from @${username}`,
          url: `https://linkup.com/feed/stories/${username}`,
          about: {
            '@type': 'Person',
            alternateName: username,
          },
        }}
      />

      {/* Client component – contains all story logic, navigation, modals */}
      <StoriesPageClient />
    </>
  );
}