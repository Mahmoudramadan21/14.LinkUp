// app/(main)/feed/stories/[username]/page.tsx
import type { Metadata } from 'next';
import StoryViewerClient from './StoriesPageClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Dynamic SEO metadata for individual story viewer pages.
 * 
 * This page is heavily shared via WhatsApp, Telegram, iMessage, etc.
 * Having rich, accurate metadata dramatically increases click-through rate
 * and improves organic discoverability.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params; 
  const cleanUsername = username.replace(/^@/, '');
  const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    title: `${displayName}'s Story | LinkUp`,
    description: `Watch ${displayName}'s latest story on LinkUp – photos, videos, and moments shared with friends.`,

    alternates: {
      canonical: `/feed/stories/${username}`,
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
      title: `${displayName}'s Story | LinkUp`,
      description: `Check out what ${displayName} is sharing right now – only on LinkUp.`,
      url: `/feed/stories/${username}`,
      siteName: 'LinkUp',
      type: 'profile',
      locale: 'en_US',
      images: [
        {
          url: `/og-story.png`,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Story on LinkUp`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Story | LinkUp`,
      description: `See ${displayName}'s latest moments`,
      images: ['/og-story.png'],
      creator: `@${username}`,
      site: '@LinkUp',
    },
  };
}

/**
 * Server Component – Responsible for:
 * - Injecting SEO metadata (via generateMetadata)
 * - Rendering structured data for rich results
 * - Delegating all interactivity to client component
 * 
 * Zero UI rendering here → maximum performance + streaming
 */
export default async function StoryViewerPage({ params }: Props) {
const { username } = await params; 
  const cleanUsername = username.replace(/^@/, '');

  return (
    <>
      {/* Structured Data – Helps Google show rich story previews */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${cleanUsername}'s Story`,
          description: `View ${username}'s active story on LinkUp social platform.`,
          url: `https://linkup.com/feed/stories/${username}`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
        }}
      />

      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: `${cleanUsername}'s Story`,
          description: `Temporary story content from @${username} on LinkUp`,
          url: `https://linkup.com/feed/stories/${username}`,
          about: {
            '@type': 'Person',
            alternateName: username,
          },
        }}
      />

      {/* Client Component – All interactivity stays exactly as you wrote */}
      <StoryViewerClient username={username} />
    </>
  );
}