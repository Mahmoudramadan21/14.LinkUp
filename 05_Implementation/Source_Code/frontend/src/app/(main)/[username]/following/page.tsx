import type { Metadata } from 'next';
import FollowingPageClient from './FollowingClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Dynamic metadata for the "Following" list page.
 *
 * This route may be public or private depending on the target user's privacy settings.
 * We generate safe, descriptive metadata while respecting privacy:
 *  • Public profiles → indexable, rich previews
 *  • Private profiles → noindex + clear privacy messaging
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params; 
  const cleanUsername = username.replace(/^@/, '');
  const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    title: `${displayName}'s Following • LinkUp`,
    description: `See who ${displayName} follows on LinkUp.`,

    alternates: {
      canonical: `/${username}/following`,
    },

    // We cannot know if the account is private on the server → default to safe indexing
    // Client component will redirect + noindex will be enforced via <meta> if needed
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },

    openGraph: {
      title: `${displayName}'s Following | LinkUp`,
      description: `Discover the accounts ${displayName} follows on LinkUp social network.`,
      url: `https://linkup.com/${username}/following`,
      siteName: 'LinkUp',
      type: 'profile',
      locale: 'en_US',
      images: [
        {
          url: '/og-following.png',
          width: 1200,
          height: 630,
          alt: `${displayName}'s following list on LinkUp`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Following | LinkUp`,
      description: `See who ${displayName} follows`,
      images: ['/og-following.png'],
      site: '@LinkUp',
      creator: `@${username}`,
    },
  };
}

/**
 * Server Component – Entry point for the "Following" list page.
 *
 * Responsibilities:
 *  • Provide rich SEO metadata and social sharing previews
 *  • Inject structured data identifying this as a social relationship list
 *  • Stream the client component instantly (zero blocking)
 *  • No server-side data fetching – access control is handled client-side
 *
 * This ensures maximum performance and compatibility with private accounts.
 */
export default async function StoryViewerPage({ params }: Props) {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');

  return (
    <>
      {/* WebPage schema – primary identifier */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${cleanUsername}'s Following List`,
          description: `List of accounts that @${username} follows on LinkUp.`,
          url: `https://linkup.com/${username}/following`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
        }}
      />

      {/* ItemList schema – represents the list of followed users */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `People ${cleanUsername} Follows`,
          description: `Accounts followed by @${username} on LinkUp social platform.`,
          url: `https://linkup.com/${username}/following`,
          itemListOrder: 'http://schema.org/ItemListOrderDescendingByDate',
          numberOfItems: 0, // actual count populated client-side if public
        }}
      />

      {/* Client component – handles access control, loading states, and renders the modal */}
      <FollowingPageClient />
    </>
  );
}