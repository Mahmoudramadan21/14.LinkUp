import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

interface User {
  name: string;
  username: string;
  profilePicture?: string;
}

interface StoriesSectionProps {
  currentUserId?: number;
  token: string;
  user: User;
}

/**
 * StoriesSection Component
 * Renders a list of user stories with avatars and a create story dialog.
 */
const StoriesSection: React.FC<StoriesSectionProps> = ({ currentUserId, token, user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fetch stories on mount
  useEffect(() => {
    if (!token) {
      setError('No authentication token available');
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
        setError(err.response?.data?.message || err.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    };
    loadStories();
  }, [token]);

  // Memoized story list
  const storyList = useMemo(
    () => [
      {
        username: 'You',
        imageSrc: user.profilePicture || '/avatars/placeholder.png',
        hasUnviewedStories: false,
      },
      ...stories.map((userStory) => ({
        username: userStory.username,
        imageSrc:
          userStory.stories.length > 0
            ? userStory.stories[0].mediaUrl
            : userStory.profilePicture || '/avatars/placeholder.png',
        hasUnviewedStories: userStory.hasUnviewedStories,
      })),
    ],
    [stories, user.profilePicture]
  );

  // Handle story click
  const handleStoryClick = useCallback(
    (userIndex: number) => {
      if (userIndex === 0) {
        setIsCreateDialogOpen(true);
      } else if (userIndex > 0 && userIndex - 1 < stories.length) {
        const userStory = stories[userIndex - 1];
        if (userStory?.stories?.length > 0) {
          const firstUnviewedStory = userStory.stories.find((story) => !story.isViewed);
          const storyToSelect = firstUnviewedStory || userStory.stories[0];
          setSelectedStoryId(storyToSelect.storyId);
          setIsDialogOpen(true);
        }
      }
    },
    [stories]
  );

  // Handle share story
  const handleShareStory = useCallback(
    (storyData: {
      text: string;
      media?: File;
      backgroundColor?: string;
      textColor: string;
      position: { x: number; y: number };
      fontSize: number;
    }) => {
      setIsCreateDialogOpen(false);
    },
    []
  );

  // Handle discard story
  const handleDiscardStory = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  // Close dialog on outside click
  const handleOverlayClick = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  // Focus trap for dialog
  useEffect(() => {
    if (isCreateDialogOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
        if (e.key === 'Escape') {
          setIsCreateDialogOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isCreateDialogOpen]);

  return (
    <section
      className="stories-section"
      data-testid="stories-section"
      role="region"
      aria-labelledby="stories-section-title"
      itemscope
      itemtype="http://schema.org/CreativeWork"
    >
      <h2 id="stories-section-title" className="stories-section__title">
        Stories
      </h2>
      {loading ? (
        <div className="stories-section__loading" aria-live="polite">
          Loading stories...
        </div>
      ) : error ? (
        <div className="stories-section__error" aria-live="polite">
          {error}
        </div>
      ) : (
        <div className="stories-section__list">
          {storyList.length > 0 ? (
            storyList.map((story, index) => (
              <div
                key={index}
                onClick={() => handleStoryClick(index)}
                className="stories-section__item"
                role="button"
                aria-label={`View ${story.username}'s story`}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleStoryClick(index)}
              >
                <Avatar
                  imageSrc={story.imageSrc}
                  username={story.username}
                  size="medium"
                  showUsername={true}
                  hasUnviewedStories={story.hasUnviewedStories}
                  status={story.hasUnviewedStories ? 'Super Active' : ''}
                />
              </div>
            ))
          ) : (
            <p className="stories-section__empty" aria-live="polite">
              No stories available
            </p>
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
        <div
          className="stories-section__create-overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Create story dialog"
        >
          <div
            className="stories-section__create-dialog"
            onClick={(e) => e.stopPropagation()}
            ref={dialogRef}
          >
            <CreateStories
              user={user}
              onDiscard={handleDiscardStory}
              onShare={handleShareStory}
            />
          </div>
        </div>
      </Transition>
    </section>
  );
};

export default memo(StoriesSection);