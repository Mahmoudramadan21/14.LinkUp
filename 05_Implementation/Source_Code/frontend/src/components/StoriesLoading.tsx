'use client';
import React, { memo } from 'react';
import { StoriesLoadingProps } from '@/types';

/**
 * StoriesLoading Component
 * Displays a skeleton loader for the Stories component, mimicking the layout of a stories list.
 * Includes avatar and username placeholders with a shimmer effect.
 */
const StoriesLoading: React.FC<StoriesLoadingProps> = ({ title = 'Stories' }) => {
  return (
    <section
      className="stories"
      data-testid="stories-loading"
      aria-busy="true"
      aria-live="polite"
      aria-label={`Loading ${title.toLowerCase()}`}
    >
      <h2 className="stories__title">{title}</h2>
      <div className="stories__list">
        {[...Array(6)].map((_, index) => (
          <div
            key={`loading-story-${index}`}
            className="stories__item"
            aria-hidden="true"
          >
            <div className="stories-loading__avatar-skeleton" />
            <div className="stories-loading__username-skeleton" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(StoriesLoading);