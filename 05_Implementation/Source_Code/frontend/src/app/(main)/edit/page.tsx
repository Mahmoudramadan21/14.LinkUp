// app/(main)/edit/page.tsx
import type { Metadata } from 'next';
import EditProfilePagClient from './EditProfileClient';
import StructuredData from '@/components/seo/StructuredData';

/**
 * SEO metadata for the Edit Profile page.
 * 
 * Notes:
 * - This page is intentionally blocked from indexing.
 * - Metadata focuses on clean social previews only.
 */
export const metadata: Metadata = {
  title: 'Edit Profile | LinkUp',
  description:
    'Manage your personal information, profile photo, bio, and privacy settings.',

  alternates: {
    canonical: '/edit',
  },

  // This page must NOT be indexed (private)
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },

  openGraph: {
    title: 'Edit Your Profile on LinkUp',
    description:
      'Update your profile photo, bio, and personal details to customize your LinkUp experience.',
    url: '/edit',
    siteName: 'LinkUp',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-edit-profile.png',
        width: 1200,
        height: 630,
        alt: 'Edit your LinkUp profile',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Edit Profile • LinkUp',
    description: 'Manage your profile details and settings.',
    images: ['/og-edit-profile.png'],
    site: '@LinkUp',
  },
};

/**
 * Server Component – Edit Profile Page
 */
export default function EditProfilePage() {
  return (
    <>
      {/* WebPage Schema – high-level only (no personal data) */}
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Edit Profile',
          description:
            'Manage your profile information, photos, and privacy settings.',
          url: 'https://linkup.com/edit',
          isPartOf: {
            '@type': 'WebSite',
            name: 'LinkUp',
            url: 'https://linkup.com',
          },
          potentialAction: {
            '@type': 'UpdateAction',
            name: 'Edit Profile',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://linkup.com/edit',
            },
          },
        }}
      />

      {/* Client Component (full editing UI) */}
      <EditProfilePagClient />
    </>
  );
}
