import React from 'react';
import Avatar from '../components/Avatar';

interface Story {
  storyId: number;
  createdAt: string;
  mediaUrl: string;
  expiresAt: string;
  isViewed: boolean;
}

interface UserStory {
  userId: number;
  username: string;
  profilePicture: string;
  hasUnviewedStories: boolean;
  stories: Story[];
}

interface StoriesListProps {
  data: UserStory[];
  onStorySelect: (storyId: number) => void;
  activeUserId?: number;
}

const StoriesList: React.FC<StoriesListProps> = ({ data, onStorySelect, activeUserId }) => {
  const handleStoryClick = (user: UserStory) => {
    const firstUnviewedStory = user.stories.find((story) => !story.isViewed);
    const storyToSelect = firstUnviewedStory || user.stories[0];
    if (storyToSelect) {
      onStorySelect(storyToSelect.storyId);
    }
  };

  return (
    <div className="stories-list-container" data-testid="stories-list">
      <h2 className="stories-list-title">Stories</h2>
      <div className="stories-list-items">
        {data.map((user) => (
          <div
            key={user.userId}
            className={`story-item cursor-pointer hover:bg-gray-100 p-1 rounded ${activeUserId === user.userId ? 'bg-blue-100' : ''}`}
            onClick={() => handleStoryClick(user)}
          >
            <Avatar
              imageSrc={user.profilePicture || '/avatars/placeholder.jpg'}
              username={user.username}
              size="medium"
              showUsername={false}
              className={user.hasUnviewedStories ? 'active' : ''}
            />
            <div className="story-details">
              <p className="story-username">{user.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesList;