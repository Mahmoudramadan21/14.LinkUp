'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import CreateHighlightModal from '@/components/profile/CreateHighlightModal';

/**
 * ModalCreateHighlightPage component for rendering the highlight creation modal as an overlay.
 * Optimized for performance, accessibility, and best practices.
 */
const ModalCreateHighlightPage = () => {
  const router = useRouter();
  const params = useParams();
  const username = typeof params?.username === 'string' ? params.username : '';

  // Close handler with history fallback
  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (username) {
      router.push(`/${username}`);
    } else {
      router.push('/');
    }
  };

  return <CreateHighlightModal isOpen={true} onClose={handleClose} />;
};

export default ModalCreateHighlightPage;