import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Dynamic SEO Metadata for User Profiles
 * 
 * This is one of the most important pages for:
 * - Organic search traffic (people searching names)
 * - Social sharing (WhatsApp, Telegram, iMessage)
 * - Google Knowledge Graph & Person Rich Results
 * 
 * No API calls → fully static generation possible with proper setup
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params; 
  const cleanUsername = username.replace(/^@/, '');
  const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    title: `${displayName}'s Profile | LinkUp`,
    description: `View ${displayName}'s profile on LinkUp – photos, videos, bio, and updates from ${username}.`,

    alternates: {
      canonical: `https://linkup-app-frontend.vercel.app/${username}`,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    openGraph: {
      title: `${displayName} Profile | LinkUp`,
      description: `Connect with ${displayName} – see their posts, stories, and latest updates.`,
      url: `https://linkup-app-frontend.vercel.app/${username}`,
      siteName: 'LinkUp',
      type: 'profile',
      locale: 'en_US',
      images: [
        {
          url: `og/og-profile.png`,
          width: 1200,
          height: 630,
          alt: `${displayName}'s profile on LinkUp`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: `${displayName} Profile | LinkUp`,
      description: `Check out ${displayName}'s profile`,
      images: ['og/og-profile.png'],
      site: '@LinkUp',
      creator: `@${username}`,
    },
  };
}

/**
 * Server Component – Profile Page Entry Point
 * 
 * Responsibilities:
 * - Inject perfect SEO metadata
 * - Add Person + ProfilePage structured data
 * - Stream the client component instantly
 * - Zero blocking, zero API calls
 */
export default async function StoryViewerPage({ params }: Props) {
  const { username } = await params; 
  const cleanUsername = username.replace(/^@/, '');

  return (
    <>
      {/* Person Schema – Critical for Google Knowledge Panel */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: cleanUsername,
          alternateName: `@${username}`,
          url: `https://linkup-app-frontend.vercel.app/${username}`,
          sameAs: [`https://linkup-app-frontend.vercel.app/${username}`],
          memberOf: {
            '@type': 'Organization',
            name: 'LinkUp',
            url: 'https://linkup-app-frontend.vercel.app',
          },
        }}
      />

      {/* ProfilePage Schema */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: `${cleanUsername}'s Profile on LinkUp`,
          description: `View @${username}'s photos, videos, stories, and updates on LinkUp social network.`,
          url: `https://linkup-app-frontend.vercel.app/${username}`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup-app-frontend.vercel.app',
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://linkup-app-frontend.vercel.app',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: username,
                item: `https://linkup-app-frontend.vercel.app/${username}`,
              },
            ],
          },
        }}
      />
    </>
  );
}