import { removeAuthData } from '@/utils/auth';
import { User, UserStory } from '@/types';

export const handleStoryClick = (
  userIndex: number,
  userStories: UserStory[],
  setSelectedStoryId: (id: number | null) => void,
  setIsDialogOpen: (open: boolean) => void,
  setIsCreateDialogOpen: (open: boolean) => void
) => {
  if (userIndex === 0) {
    setIsCreateDialogOpen(true);
  } else if (userIndex > 0 && userIndex - 1 < userStories.length) {
    const userStory = userStories[userIndex - 1];
    if (userStory?.stories?.length > 0) {
      const firstUnviewedStory = userStory.stories.find((story) => !story.isViewed);
      const storyToSelect = firstUnviewedStory || userStory.stories[0];
      setSelectedStoryId(storyToSelect.storyId);
      setIsDialogOpen(true);
    }
  }
};

export const handleDiscardStory = (setIsCreateDialogOpen: (open: boolean) => void) => {
  setIsCreateDialogOpen(false);
};

export const handleOverlayClick = (setIsCreateDialogOpen: (open: boolean) => void) => {
  setIsCreateDialogOpen(false);
};

export const handleLogout = () => {
  removeAuthData();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getUserFromAuthData = (authData: any): User => ({
  name: authData?.profileName || 'Guest',
  username: authData?.username || 'guest',
  profilePicture: authData?.profilePicture || '/avatars/placeholder.jpg',
});