'use client';

import { useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import CreateStoryModal from '@/components/ui/story/modals/CreateStoryModal';

/**
 * FullCreateStoryPage component for rendering the story creation modal in a full-page view.
 * Optimized for performance, accessibility, SEO, and best practices.
 */
const FullCreateStoryPage = memo(() => {
  const router = useRouter();

  // Close handler with history fallback
  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed', { scroll: false });
    }
  }, [router]);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <Head>
        <title>Create Story | LinkUp</title>
        <meta name="description" content="Create a new story on LinkUp to share with your friends." />
        <meta name="robots" content="noindex" /> {/* Prevent indexing of transient content */}
      </Head>
      <CreateStoryModal
        isOpen={true}
        onClose={handleClose}
        aria-labelledby="create-story-modal-title"
      />
    </>
  );
});

FullCreateStoryPage.displayName = 'FullCreateStoryPage';

export default FullCreateStoryPage;