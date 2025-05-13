'use client';
import React, { memo } from 'react';

/*
 * Loading Component
 * Displays a spinner to indicate ongoing processes like data fetching.
 * Accessible with ARIA attributes for screen readers.
 */
const Loading: React.FC = () => {
  return (
    <div className="loading__container" role="status" aria-live="polite" aria-busy="true">
      <div className="loading__spinner" />
      <span className="loading__sr-only">Loading content, please wait...</span>
    </div>
  );
};

export default memo(Loading);