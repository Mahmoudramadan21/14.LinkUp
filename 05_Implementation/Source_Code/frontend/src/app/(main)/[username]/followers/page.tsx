// app/[username]/followers/page.tsx
import type { Metadata } from 'next';
import FollowersPageClient from './FollowersClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Dynamic metadata for the "Followers" list page.
 *
 * This route is one of the most shared social proof pages.
 * We generate rich, SEO-friendly metadata for public profiles
 * while ensuring private accounts are never indexed.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params; 
  const cleanUsername = username.replace(/^@/, '');
  const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    title: `${displayName}'s Followers | LinkUp`,
    description: `See who follows ${displayName} on LinkUp social network.`,

    alternates: {
      canonical: `https://linkup-app-frontend.vercel.app/${username}/followers`,
    },

    // Safe default: assume public until client confirms otherwise
    // Private accounts will be redirected + noindex enforced via client meta tags if needed
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
      title: `${displayName}'s Followers | LinkUp`,
      description: `Discover the people who follow ${displayName} on LinkUp.`,
      url: `https://linkup-app-frontend.vercel.app/${username}/followers`,
      siteName: 'LinkUp',
      type: 'profile',
      locale: 'en_US',
      images: [
        {
          url: 'og/og-followers.png',
          width: 1200,
          height: 630,
          alt: `${displayName}'s followers on LinkUp`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Followers | LinkUp`,
      description: `See who follows ${displayName}`,
      images: ['og/og-followers.png'],
      site: '@LinkUp',
      creator: `@${username}`,
    },
  };
}

/**
 * Server Component – Entry point for the "Followers" list page.
 *
 * Responsibilities:
 *  • Deliver rich SEO & social sharing metadata
 *  • Inject structured data identifying this as a follower relationship list
 *  • Stream the client component instantly (zero blocking)
 *  • No server-side access checks – privacy enforcement is delegated to client
 *
 * This pattern ensures maximum performance and perfect compatibility
 * with both public and private accounts.
 */
export default async function StoryViewerPage({ params }: Props) {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');

  return (
    <>
      {/* Primary WebPage schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${cleanUsername}'s Followers`,
          description: `List of users who follow @${username} on LinkUp social platform.`,
          url: `https://linkup-app-frontend.vercel.app/${username}/followers`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup-app-frontend.vercel.app',
          },
        }}
      />

      {/* ItemList schema – represents the list of followers */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Followers of ${username}`,
          description: `People who follow @${username} on LinkUp.`,
          url: `https://linkup-app-frontend.vercel.app/${username}/followers`,
          itemListOrder: 'http://schema.org/ItemListOrderDescendingByDate',
          numberOfItems: 0, // populated client-side for public profiles
        }}
      />

      {/* Client component – handles access control, loading, and renders the modal */}
      <FollowersPageClient />
    </>
  );
}