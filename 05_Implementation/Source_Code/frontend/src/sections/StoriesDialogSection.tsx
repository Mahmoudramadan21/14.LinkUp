import React, { useState, useEffect, useRef } from "react";
import StoriesList from "../components/StoriesList";
import StoryViewer from "../components/StoryViewer";
import { Transition } from "@headlessui/react";
import { toggleStoryLike } from "../utils/api";

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

interface StoryDetails {
  StoryID: number;
  MediaURL: string;
  CreatedAt: string;
  ExpiresAt: string;
  User: {
    UserID: number;
    Username: string;
    ProfilePicture: string;
    IsPrivate: boolean;
  };
  _count: {
    StoryLikes: number;
    StoryViews: number;
  };
  hasLiked: boolean;
}

interface StoriesDialogSectionProps {
  stories: UserStory[];
  initialStoryId: number;
  currentUserId: number;
  onClose: () => void;
  token: string;
}

const StoriesDialogSection: React.FC<StoriesDialogSectionProps> = ({
  stories,
  initialStoryId,
  currentUserId,
  onClose,
  token,
}) => {
  const [selectedStory, setSelectedStory] = useState<StoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [userStoryIds, setUserStoryIds] = useState<number[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 15000;

  useEffect(() => {
    const loadInitialStory = () => {
      try {
        setLoading(true);
        const initialStory = stories
          .flatMap((user) => user.stories)
          .find((story) => story.storyId === initialStoryId);
        if (initialStory) {
          const userIndex = stories.findIndex((user) => user.stories.some((s) => s.storyId === initialStoryId));
          const user = stories[userIndex];
          setSelectedStory({
            StoryID: initialStory.storyId,
            MediaURL: initialStory.mediaUrl,
            CreatedAt: initialStory.createdAt,
            ExpiresAt: initialStory.expiresAt,
            User: {
              UserID: user.userId,
              Username: user.username,
              ProfilePicture: user.profilePicture,
              IsPrivate: false,
            },
            _count: { StoryLikes: 0, StoryViews: 0 },
            hasLiked: false,
          });
          setActiveUserId(user.userId);
          setCurrentUserIndex(userIndex >= 0 ? userIndex : 0);
          setUserStoryIds(user.stories.map((s) => s.storyId));
          setCurrentStoryIndex(user.stories.findIndex((s) => s.storyId === initialStoryId));
          setError(null);
        } else {
          setError("Story not found");
        }
      } catch (err: any) {
        setError("Failed to load story");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialStory();
  }, [initialStoryId, stories]);

  useEffect(() => {
    if (isPlaying && selectedStory && userStoryIds.length > 0) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + (100 / (storyDuration / 100));
        });
      }, 100);
    } else if (!isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentUserIndex, currentStoryIndex, selectedStory, userStoryIds]);

  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);

  const handleStorySelect = (storyId: number) => {
    try {
      setLoading(true);
      const selected = stories
        .flatMap((user) => user.stories)
        .find((story) => story.storyId === storyId);
      if (selected) {
        const userIndex = stories.findIndex((user) => user.stories.some((s) => s.storyId === storyId));
        const user = stories[userIndex];
        setSelectedStory({
          StoryID: selected.storyId,
          MediaURL: selected.mediaUrl,
          CreatedAt: selected.createdAt,
          ExpiresAt: selected.expiresAt,
          User: {
            UserID: user.userId,
            Username: user.username,
            ProfilePicture: user.profilePicture,
            IsPrivate: false,
          },
          _count: { StoryLikes: 0, StoryViews: 0 },
          hasLiked: false,
        });
        setActiveUserId(user.userId);
        setCurrentUserIndex(userIndex >= 0 ? userIndex : 0);
        setUserStoryIds(user.stories.map((s) => s.storyId));
        setCurrentStoryIndex(user.stories.findIndex((s) => s.storyId === storyId));
        setError(null);
      } else {
        setError("Story not found");
      }
    } catch (err: any) {
      setError("Failed to load story");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStory = () => {
    if (currentStoryIndex !== null && currentUserIndex !== null) {
      const currentUser = stories[currentUserIndex];
      if (currentStoryIndex + 1 < userStoryIds.length) {
        setCurrentStoryIndex(currentStoryIndex + 1);
        handleStorySelect(userStoryIds[currentStoryIndex + 1]);
      } else if (currentUserIndex + 1 < stories.length) {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
        const nextUser = stories[currentUserIndex + 1];
        setUserStoryIds(nextUser.stories.map((s) => s.storyId));
        if (nextUser.stories.length > 0) {
          handleStorySelect(nextUser.stories[0].storyId);
        }
      } else {
        setCurrentUserIndex(0);
        setCurrentStoryIndex(0);
        const firstUser = stories[0];
        setUserStoryIds(firstUser.stories.map((s) => s.storyId));
        if (firstUser.stories.length > 0) {
          handleStorySelect(firstUser.stories[0].storyId);
        }
      }
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex !== null && currentUserIndex !== null) {
      if (currentStoryIndex > 0) {
        setCurrentStoryIndex(currentStoryIndex - 1);
        handleStorySelect(userStoryIds[currentStoryIndex - 1]);
      } else if (currentUserIndex > 0) {
        setCurrentUserIndex(currentUserIndex - 1);
        const prevUser = stories[currentUserIndex - 1];
        setUserStoryIds(prevUser.stories.map((s) => s.storyId));
        setCurrentStoryIndex(prevUser.stories.length - 1);
        if (prevUser.stories.length > 0) {
          handleStorySelect(prevUser.stories[prevUser.stories.length - 1].storyId);
        }
      }
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = async (storyId: number) => {
    try {
      const result = await toggleStoryLike(storyId, token);
      setSelectedStory((prev) =>
        prev ? { ...prev, hasLiked: result.action === "liked", _count: { ...prev._count, StoryLikes: result.action === "liked" ? prev._count.StoryLikes + 1 : prev._count.StoryLikes - 1 } } : prev
      );
    } catch (err: any) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleReply = (storyId: number, reply: string) => {
    console.log(`Replying to story with ID: ${storyId}, Reply: ${reply}`);
  };

  return (
    <div className="stories-dialog__overlay">
      <div className="stories-dialog__wrapper" onClick={(e) => e.stopPropagation()}>
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
                <button className="stories-dialog__close-button" onClick={onClose}>
                  <span className="stories-dialog__close-icon">✖</span>
                </button>
              </div>
              <div className="stories-dialog__body">
                <StoriesList
                  data={stories}
                  onStorySelect={handleStorySelect}
                  activeUserId={activeUserId}
                />
                {error && <div className="error-message">{error}</div>}
                {loading ? (
                  <div className="story-viewer__loading">Loading...</div>
                ) : selectedStory ? (
                  <StoryViewer
                    story={selectedStory}
                    currentUserId={currentUserId}
                    onLike={handleLike}
                    onReply={handleReply}
                    token={token}
                    onPrev={handlePrevStory}
                    onNext={handleNextStory}
                    totalStories={userStoryIds.length}
                    currentStoryIndex={currentStoryIndex || 0}
                    isPlaying={isPlaying}
                    onTogglePlayPause={togglePlayPause}
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