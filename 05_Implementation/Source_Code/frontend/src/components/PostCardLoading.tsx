'use client';
import React, { memo } from 'react';

/**
 * PostCardLoading Component
 * Displays a skeleton loader for the PostCard component, mimicking the layout and size of a social media post.
 * Includes a shimmer effect for a dynamic loading experience.
 */
const PostCardLoading: React.FC = () => {
  return (
    <article
      className="post-card"
      data-testid="post-card-loading"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading post"
    >
      <div className="post-card__header">
        <div className="post-card-loading__avatar-skeleton" />
        <div className="post-card__header-info">
          <div className="post-card-loading__username-skeleton" />
          <div className="post-card__meta">
            <div className="post-card-loading__privacy-skeleton" />
            <div className="post-card-loading__time-skeleton" />
          </div>
        </div>
        <div className="post-card__actions">
          <div className="post-card-loading__more-skeleton" />
        </div>
      </div>
      <div className="post-card__content">
        <div className="post-card-loading__caption-skeleton" />
        <div className="post-card-loading__caption-skeleton post-card-loading__caption-skeleton--short" />
        <div className="post-card-loading__media-skeleton" />
      </div>
      <div className="post-card__actions-bar">
        <div className="post-card-loading__action-skeleton" />
        <div className="post-card-loading__action-skeleton" />
        <div className="post-card-loading__action-skeleton" />
      </div>
      <div className="post-card__likes">
        <div className="post-card__likes-avatars">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="post-card-loading__like-avatar-skeleton"
            />
          ))}
        </div>
        <div className="post-card-loading__likes-text-skeleton" />
      </div>
      <div className="post-card__comments" role="list">
        {[...Array(2)].map((_, index) => (
          <div
            key={index}
            className="post-card__comment"
            role="listitem"
            aria-hidden="true"
          >
            <div className="post-card-loading__comment-avatar-skeleton" />
            <div className="post-card__comment-content">
              <div className="post-card-loading__comment-username-skeleton" />
              <div className="post-card-loading__comment-text-skeleton" />
              <div className="post-card__comment-actions">
                <div className="post-card-loading__comment-action-skeleton" />
                <div className="post-card-loading__comment-action-skeleton" />
                <div className="post-card-loading__comment-time-skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default memo(PostCardLoading);