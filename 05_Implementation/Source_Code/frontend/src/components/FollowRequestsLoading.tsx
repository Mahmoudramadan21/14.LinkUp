'use client';
import React, { memo } from 'react';

/**
 * FollowRequestsLoading Component
 * Displays a skeleton loader for the FollowRequests component, mimicking the layout and size of follow request items.
 * Includes a shimmer effect for a dynamic loading experience.
 */
const FollowRequestsLoading: React.FC = () => {
  return (
    <section
      className="follow-requests__container"
      data-testid="follow-requests-loading"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading follow requests"
    >
      <h2
        className="follow-requests__title"
        id="follow-requests-title"
        aria-hidden="true"
      >
        <div className="follow-requests-loading__title-skeleton" />
      </h2>
      <div className="follow-requests__list" role="list">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="follow-request__item"
            role="listitem"
            aria-hidden="true"
          >
            <div className="follow-request__details">
              <div className="follow-requests-loading__avatar-skeleton" />
              <div className="follow-requests-loading__text-container">
                <div className="follow-requests-loading__username-skeleton" />
                <div className="follow-requests-loading__time-skeleton" />
              </div>
            </div>
            <div className="follow-request__actions">
              <div className="follow-requests-loading__button-skeleton" />
              <div className="follow-requests-loading__button-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default memo(FollowRequestsLoading);