// app/(main)/feed/stories/create/pageClient.tsx
'use client';

import { useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import CreateStoryModal from '@/components/ui/story/modals/CreateStoryModal';

/**
 * Client-side full-page story creation experience.
 * 
 * Features:
 * - Full-screen modal with native escape key support
 * - Smart navigation (back → feed fallback)
 * - Accessible keyboard navigation
 * - Optimized with useCallback and proper cleanup
 * 
 * This component is intentionally lightweight and focused on UX.
 */
const CreateStoryClient = memo(() => {
  const router = useRouter();

  /**
   * Close the create story flow intelligently:
   * - Prefer router.back() if history exists
   * - Fallback to /feed if opened directly
   */
  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed', { scroll: false });
    }
  }, [router]);

  /**
   * Global keyboard shortcut: Escape key closes the modal
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    },
    [handleClose]
  );

  // Attach/detach global keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <CreateStoryModal
      isOpen={true}
      onClose={handleClose}
      aria-labelledby="create-story-modal-title"
      aria-describedby="create-story-modal-description"
    />
  );
});

CreateStoryClient.displayName = 'CreateStoryClient';
export default CreateStoryClient;