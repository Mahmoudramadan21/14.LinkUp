import React, { useState } from "react";
import StoriesList from "../components/StoriesList";
import StoryViewer from "../components/StoryViewer";
import { Transition } from "@headlessui/react";

/*
 * StoriesDialogSection Component
 * A dialog that displays a list of user stories on the left and the selected story on the right.
 * Handles story navigation and interactions like liking and replying.
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

interface StoryDetails {
  StoryID: number; // Unique ID of the story
  MediaURL: string; // URL of the story media
  CreatedAt: string; // Timestamp of when the story was created
  ExpiresAt: string; // Timestamp of when the story expires
  User: {
    UserID: number; // ID of the user who created the story
    Username: string; // Username of the story creator
    ProfilePicture: string; // URL of the creator's profile picture
    IsPrivate: boolean; // Whether the user's profile is private
  };
  _count: {
    StoryLikes: number; // Number of likes on the story
    StoryViews: number; // Number of views on the story
  };
  hasLiked: boolean; // Whether the current user has liked the story
}

interface StoriesDialogSectionProps {
  stories: UserStory[]; // List of user stories to display in StoriesList
  initialStoryId: number; // The ID of the initially selected story
  currentUserId: number; // ID of the current user viewing the stories
  onClose: () => void; // Callback to close the dialog
}

const StoriesDialogSection: React.FC<StoriesDialogSectionProps> = ({
  stories,
  initialStoryId,
  currentUserId,
  onClose,
}) => {
  // State to track the currently selected story
  const [selectedStory, setSelectedStory] = useState<StoryDetails | null>(() => {
    // Find the initial story based on initialStoryId
    for (const userStory of stories) {
      const story = userStory.stories.find((s) => s.storyId === initialStoryId);
      if (story) {
        return {
          StoryID: story.storyId,
          MediaURL: "", // You need to map this from your data source
          CreatedAt: story.createdAt,
          ExpiresAt: "", // You need to map this from your data source
          User: {
            UserID: userStory.userId,
            Username: userStory.username,
            ProfilePicture: userStory.profilePicture,
            IsPrivate: false, // Adjust based on your data
          },
          _count: {
            StoryLikes: 0, // Adjust based on your data
            StoryViews: 0, // Adjust based on your data
          },
          hasLiked: false, // Adjust based on your data
        };
      }
    }
    return null;
  });

  // Handle story selection from StoriesList
  const handleStorySelect = (storyId: number) => {
    for (const userStory of stories) {
      const story = userStory.stories.find((s) => s.storyId === storyId);
      if (story) {
        setSelectedStory({
          StoryID: story.storyId,
          MediaURL: "", // You need to map this from your data source
          CreatedAt: story.createdAt,
          ExpiresAt: "", // You need to map this from your data source
          User: {
            UserID: userStory.userId,
            Username: userStory.username,
            ProfilePicture: userStory.profilePicture,
            IsPrivate: false, // Adjust based on your data
          },
          _count: {
            StoryLikes: 0, // Adjust based on your data
            StoryViews: 0, // Adjust based on your data
          },
          hasLiked: false, // Adjust based on your data
        });
      }
    }
  };

  // Handle liking a story
  const handleLike = (storyId: number) => {
    console.log(`Liking story with ID: ${storyId}`);
    // Add API call or state update logic here
  };

  // Handle replying to a story
  const handleReply = (storyId: number, reply: string) => {
    console.log(`Replying to story with ID: ${storyId}, Reply: ${reply}`);
    // Add API call or state update logic here
  };

  return (
    // Overlay to close dialog on click outside
    <div className="stories-dialog__overlay" onClick={onClose}>
      <div className="stories-dialog__wrapper">
        <div className="stories-dialog__content">
          <Transition
            show={true}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="stories-dialog__panel">
              <div className="stories-dialog__title">
                Stories
                <button
                  className="stories-dialog__close-button"
                  onClick={onClose}
                >
                  <span className="stories-dialog__close-icon">✖</span>
                </button>
              </div>
              <div className="stories-dialog__body">
                <StoriesList data={stories} onStorySelect={handleStorySelect} />
                {selectedStory ? (
                  <StoryViewer
                    story={selectedStory}
                    currentUserId={currentUserId}
                    onLike={handleLike}
                    onReply={handleReply}
                  />
                ) : (
                  <div className="story-viewer__loading">Select a story to view</div>
                )}
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default StoriesDialogSection;