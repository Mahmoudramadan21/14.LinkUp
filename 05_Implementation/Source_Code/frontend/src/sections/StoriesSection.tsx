'use client';
import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import StoriesDialogSection from './StoriesDialogSection';
import { fetchStoryFeed } from '../utils/api';
import CreateStories from '../components/CreateStories';
import { Transition } from '@headlessui/react';

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

interface StoriesSectionProps {
  currentUserId?: number;
  token: string;
  user?: { 
    name: string;
    username: string;
    profilePicture?: string;
  };
}

const StoriesSection: React.FC<StoriesSectionProps> = ({ currentUserId, token, user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No authentication token available");
      setLoading(false);
      return;
    }
    const loadStories = async () => {
      try {
        setLoading(true);
        const data = await fetchStoryFeed(token);
        setStories(data);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to load stories";
        setError(errorMessage);
        console.error("API Error:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    loadStories();
  }, [token]);

  const storyList = [
    {
      username: 'You',
      imageSrc: user?.profilePicture || '/avatars/placeholder.png',
      hasUnviewedStories: false,
    },
    ...stories.map((userStory) => ({
      username: userStory.username,
      imageSrc: userStory.stories.length > 0 ? userStory.stories[0].mediaUrl : userStory.profilePicture || '/avatars/placeholder.png',
      hasUnviewedStories: userStory.hasUnviewedStories,
    })),
  ];

  const handleStoryClick = (userIndex: number) => {
    if (userIndex === 0) {
      setIsCreateDialogOpen(true);
    } else if (userIndex > 0 && userIndex - 1 < stories.length) {
      const userStory = stories[userIndex - 1];
      if (userStory && Array.isArray(userStory.stories) && userStory.stories.length > 0) {
        const firstUnviewedStory = userStory.stories.find((story) => !story.isViewed);
        const storyToSelect = firstUnviewedStory || userStory.stories[0];
        setSelectedStoryId(storyToSelect.storyId);
        setIsDialogOpen(true);
      } else {
        console.warn(`No valid stories found for user at index ${userIndex - 1}`, userStory);
      }
    } else {
      console.warn(`Invalid user index: ${userIndex}, stories length: ${stories.length}`);
    }
  };

  const handleShareStory = (storyData: {
    text: string;
    media?: File;
    backgroundColor?: string;
    textColor: string;
    position: { x: number; y: number };
    fontSize: number;
  }) => {
    console.log('Story shared:', storyData);
    setIsCreateDialogOpen(false);
  };

  const handleDiscardStory = () => {
    setIsCreateDialogOpen(false);
  };

  return (
    <section className="stories-section" data-testid="stories-section">
      <h2 className="stories-section__title">Stories</h2>
      {loading ? (
        <div>Loading stories...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="stories-section__list">
          {storyList.length > 0 ? (
            storyList.map((story, index) => (
              <div
                key={index}
                onClick={() => handleStoryClick(index)}
                className="story-item cursor-pointer"
              >
                <Avatar
                  imageSrc={story.imageSrc}
                  username={story.username}
                  size="medium"
                  showUsername={true}
                  hasUnviewedStories={story.hasUnviewedStories}
                  status={story.hasUnviewedStories ? "Super Active" : ""}
                />
              </div>
            ))
          ) : (
            <p>No stories available</p>
          )}
        </div>
      )}
      {isDialogOpen && selectedStoryId !== null && (
        <StoriesDialogSection
          stories={stories}
          initialStoryId={selectedStoryId}
          currentUserId={currentUserId || 0}
          onClose={() => setIsDialogOpen(false)}
          token={token}
        />
      )}
      <Transition
        show={isCreateDialogOpen}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="create-stories-overlay" onClick={() => setIsCreateDialogOpen(false)}>
          <div className="create-stories-dialog" onClick={(e) => e.stopPropagation()}>
            <CreateStories
              user={user || { name: '', username: '', profilePicture: undefined }}
              onDiscard={handleDiscardStory}
            />
          </div>
        </div>
      </Transition>
    </section>
  );
};

export default StoriesSection;