'use client';
import React, { memo } from 'react';

interface StoriesSectionLoadingProps {
  title?: string;
}

/**
 * StoriesSectionLoading Component
 * Displays a skeleton loader for the StoriesSection component, mimicking the layout of a stories list.
 * Includes avatar and username placeholders with a shimmer effect.
 */
const StoriesSectionLoading: React.FC<StoriesSectionLoadingProps> = ({ title = 'Stories' }) => {
  return (
    <section
      className="stories-section"
      data-testid="stories-section-loading"
      aria-busy="true"
      aria-live="polite"
      aria-label={`Loading ${title.toLowerCase()}`}
    >
      <h2 className="stories-section__title">{title}</h2>
      <div className="stories-section__list">
        {[...Array(6)].map((_, index) => (
          <div
            key={`loading-story-${index}`}
            className="stories-section__item"
            aria-hidden="true"
          >
            <div className="stories-section-loading__avatar-skeleton" />
            <div className="stories-section-loading__username-skeleton" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(StoriesSectionLoading);