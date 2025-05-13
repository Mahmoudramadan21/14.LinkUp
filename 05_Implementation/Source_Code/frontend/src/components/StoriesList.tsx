'use client';
import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import Avatar from '../components/Avatar';

// Interface for story data
interface Story {
  storyId: number;
  createdAt: string;
  mediaUrl: string;
  expiresAt: string;
  isViewed: boolean;
}

// Interface for user story data
interface UserStory {
  userId: number;
  username: string;
  profilePicture: string | null;
  hasUnviewedStories: boolean;
  stories: Story[];
}

// Interface for component props
interface StoriesListProps {
  data: UserStory[];
  onStorySelect: (storyId: number) => void;
  activeUserId?: number;
}

/**
 * StoriesList Component
 * Displays a list of user stories with avatars and usernames.
 * Highlights unviewed stories and supports story selection.
 */
const StoriesList: React.FC<StoriesListProps> = ({ data, onStorySelect, activeUserId }) => {
  // Handle story selection
  const handleStoryClick = useCallback(
    (user: UserStory) => {
      const firstUnviewedStory = user.stories.find((story) => !story.isViewed);
      const storyToSelect = firstUnviewedStory || user.stories[0];
      if (storyToSelect) {
        onStorySelect(storyToSelect.storyId);
      }
    },
    [onStorySelect]
  );

  return (
    <section
      className="stories-list__container"
      data-testid="stories-list"
      itemscope
      itemtype="http://schema.org/ItemList"
    >
      <h2 className="stories-list__title">Stories</h2>
      <div className="stories-list__items" role="list">
        {data.map((user) => (
          <button
            type="button"
            key={`${user.userId}-${user.username}`}
            className={`stories-list__button--item ${
              activeUserId === user.userId ? 'stories-list__button--item-active' : ''
            }`}
            onClick={() => handleStoryClick(user)}
            aria-label={`View stories by ${user.username}`}
            aria-current={activeUserId === user.userId ? 'true' : undefined}
            role="listitem"
            itemprop="itemListElement"
          >
            <Avatar
              imageSrc={user.profilePicture || '/avatars/placeholder.jpg'}
              username={user.username}
              size="medium"
              showUsername={false}
              className={user.hasUnviewedStories ? 'avatar--active' : ''}
              aria-hidden="true"
              width={48}
              height={48}
              loading="lazy"
            />
            <div className="stories-list__details">
              <Link
                href={`/profile/${user.username}`}
                className="stories-list__username"
                prefetch={false}
                itemProp="name"
              >
                {user.username}
              </Link>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default memo(StoriesList);