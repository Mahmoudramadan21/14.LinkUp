'use client';
import React from 'react';
import Avatar from '../components/Avatar';

/*
 * StoriesSection Component
 * Displays a scrollable list of user stories with avatars and usernames.
 * Used in the feed page to showcase stories from followed users.
 */
interface Story {
  username: string;
  imageSrc: string;
  hasPlus?: boolean;
  hasUnviewedStories?: boolean;
}

interface StoriesSectionProps {
  stories: Story[];
}

const StoriesSection: React.FC<StoriesSectionProps> = ({ stories }) => {
  return (
    <section className="stories-section" data-testid="stories-section">
      <h2 className="stories-section__title">Stories</h2>
      <div className="stories-section__list">
        {stories.map((story, index) => (
          <Avatar
            key={index}
            imageSrc={story.imageSrc || '/avatars/placeholder.jpg'}
            username={story.username}
            size="medium"
            showUsername={true}
            hasPlus={story.hasPlus || false}
            hasUnviewedStories={story.hasUnviewedStories || false}
          />
        ))}
      </div>
    </section>
  );
};

export default StoriesSection;