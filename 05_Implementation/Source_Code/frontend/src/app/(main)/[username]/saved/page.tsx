// app/[username]/saved/page.tsx
import type { Metadata } from 'next';
import SavedPostsPageClient from './SavedPostsPageClient';
import StructuredData from '@/components/seo/StructuredData';

type Props = {
  params: Promise<{ username: string }>;
};

/**
 * Generates SEO metadata for the private "/saved" tab.
 *
 * Even though the content is protected, crawlers and social platforms will still
 * request this URL (shared links, bots, preview generation, etc.).
 * We explicitly tell search engines not to index the page and we give a clear,
 * user-friendly title/description for link previews.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');
  const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  return {
    title: `${displayName}'s Saved Posts | LinkUp`,
    description: `Private collection – Only ${displayName} can view their saved posts on LinkUp.`,

    alternates: {
      canonical: `https://linkup-app-frontend.vercel.app/${username}/saved`,
    },

    // Critical: prevent indexing of private content
    robots: {
      index: false,
      follow: false,
      noimageindex: true,
      nocache: true,
    },

    openGraph: {
      title: `${displayName}'s Saved Posts (Private) | LinkUp`,
      description:
        'This is a private collection. Only the profile owner can view saved posts.',
      url: `https://linkup-app-frontend.vercel.app/${username}/saved`,
      siteName: 'LinkUp',
      type: 'profile',
      locale: 'en_US',
    },

    twitter: {
      card: 'summary',
      title: 'Private Collection | LinkUp',
      description: 'Saved posts are private and visible only to the owner.',
    },
  };
}

/**
 * Server Component – Entry point for the protected "/:username/saved" route.
 *
 * Responsibilities:
 *  | Provide correct SEO signals (noindex + clear messaging)
 *  | Inject structured data that explicitly marks the page as private
 *  • Stream the tiny client component that performs the ownership check
 *    and silent redirect (zero flash of protected content)
 *
 * No data fetching is performed here – the heavy lifting (profile check,
 * redirect) is delegated to SavedPostsPageClient.
 */
export default async function StoryViewerPage({ params }: Props) {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');

  return (
    <>
      {/* Structured Data – informs search engines that this page is private */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${cleanUsername}'s Saved Posts`,
          description:
            'Private collection of saved posts. Only visible to the profile owner.',
          url: `https://linkup-app-frontend.vercel.app/${username}/saved`,
          accessMode: 'private',
          accessModeSufficient: ['textual'],
          isAccessibleForFree: false,
          audience: {
            '@type': 'Audience',
            audienceType: 'Profile Owner Only',
          },
        }}
      />

      {/* Client-side ownership guard + silent redirect */}
      <SavedPostsPageClient />
    </>
  );
}