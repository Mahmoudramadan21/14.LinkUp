'use client';
import React from 'react';

/*
 * Loading Component
 * Displays a loading spinner with an optional message.
 * Used to indicate ongoing processes like data fetching.
 */
const Loading: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default Loading;