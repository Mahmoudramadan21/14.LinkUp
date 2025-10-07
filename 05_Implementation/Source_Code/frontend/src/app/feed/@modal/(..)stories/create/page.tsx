'use client';

import { useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import CreateStoryModal from '@/components/ui/story/modals/CreateStoryModal';

/**
 * CreateStoryModalPage component for rendering the story creation modal in an intercepting route.
 * Optimized for performance, accessibility, and best practices.
 */
const CreateStoryModalPage = memo(() => {
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
    <CreateStoryModal
      isOpen={true}
      onClose={handleClose}
      aria-labelledby="create-story-modal-title"
    />
  );
});

CreateStoryModalPage.displayName = 'CreateStoryModalPage';

export default CreateStoryModalPage;