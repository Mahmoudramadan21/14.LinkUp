import React from 'react';
import Avatar from '../components/Avatar';

/*
 * StoriesList Component
 * Displays a list of user stories with avatars indicating unviewed stories.
 * Used in a stories feed to allow users to navigate to story viewers.
 */
interface Story {
  storyId: number; // Unique ID of the story
  createdAt: string; // Timestamp of when the story was created
  isViewed: boolean; // Whether the story has been viewed by the user
}

interface UserStory {
  userId: number; // Unique ID of the user
  username: string; // User's username
  profilePicture: string; // URL of the user's profile picture
  hasUnviewedStories: boolean; // Whether the user has unviewed stories
  stories: Story[]; // List of the user's stories
}

interface StoriesListProps {
  data: UserStory[]; // List of user stories to display
}

const StoriesList: React.FC<StoriesListProps> = ({ data }) => {
  return (
    <div className="stories-list-container" data-testid="stories-list">
      <h2 className="stories-list-title">Stories</h2>
      <div className="stories-list-items">
        {data.map((user) => (
          <div key={user.userId} className="story-item">
            <Avatar
              imageSrc={user.profilePicture}
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