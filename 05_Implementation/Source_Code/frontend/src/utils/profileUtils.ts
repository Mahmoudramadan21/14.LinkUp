import api from './api';
import { Story } from '@/components/StoryViewer';
import { useRouter } from 'next/router';

// Define TypeScript interfaces for function parameters
interface Comment {
  commentId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  profilePicture: string;
  isLiked: boolean;
  likeCount: number;
  replies: Comment[];
}

interface Post {
  postId: number;
  userId: number;
  username: string;
  profilePicture: string;
  privacy: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  comments: Comment[];
  isLiked: boolean;
  likedBy: { username: string; profilePicture: string }[];
}

/*
 * Fetches user stories for highlight creation
 * Updates the stories state with fetched data
 */
export const fetchUserStories = async (
  setUserStories: React.Dispatch<React.SetStateAction<Story[]>>
): Promise<void> => {
  try {
    const response = await api.get('/profile/stories');
    setUserStories(response.data.stories || []);
  } catch (err: any) {
    console.error('Failed to fetch user stories:', err.message);
  }
};

/*
 * Submits a new highlight with title, stories, and cover image
 * Handles API call and state updates on success
 */
export const handleAddHighlightSubmit = async (
  userId: number | undefined,
  highlightTitle: string,
  selectedStories: number[],
  coverImage: File | null,
  userStories: Story[],
  fetchHighlights: (userId: number) => Promise<void>,
  setIsAddHighlightDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setStep: React.Dispatch<React.SetStateAction<number>>,
  setHighlightTitle: React.Dispatch<React.SetStateAction<string>>,
  setSelectedStories: React.Dispatch<React.SetStateAction<number[]>>,
  setCoverImage: React.Dispatch<React.SetStateAction<File | null>>
): Promise<void> => {
  if (!userId || !highlightTitle.trim() || selectedStories.length === 0) {
    alert('Please fill the title and select at least one story.');
    return;
  }

  const formData = new FormData();
  formData.append('title', highlightTitle);

  if (!coverImage && selectedStories.length > 0) {
    const selectedStoriesData = userStories.filter((story) => selectedStories.includes(story.storyId));
    if (selectedStoriesData.length > 0) {
      const latestStory = selectedStoriesData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      try {
        const response = await fetch(latestStory.mediaUrl);
        const blob = await response.blob();
        const file = new File([blob], `cover-${latestStory.storyId}.jpg`, { type: blob.type });
        formData.append('coverImage', file);
      } catch (err: any) {
        console.error('Failed to fetch story image for cover:', err.message);
        alert('Failed to set cover image from story. Please upload a cover image manually.');
        return;
      }
    }
  } else if (coverImage) {
    formData.append('coverImage', coverImage);
  }

  formData.append('storyIds', selectedStories.join(','));

  try {
    await api.post('/highlights', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await fetchHighlights(userId);
    setIsAddHighlightDialogOpen(false);
    setStep(1);
    setHighlightTitle('');
    setSelectedStories([]);
    setCoverImage(null);
  } catch (err: any) {
    console.error('Failed to create highlight:', err.message);
    alert(`Failed to create highlight: ${err.message}`);
  }
};

/*
 * Opens a post modal with transformed post data
 * Formats comments and post details for display
 */
export const handleOpenModal = (
  savedPost: any,
  setSelectedPost: React.Dispatch<React.SetStateAction<Post | null>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  const transformedComments = (savedPost.Comments || []).map((comment: any) => ({
    commentId: comment.CommentID,
    userId: comment.UserID,
    username: comment.User.Username || 'Unknown',
    content: comment.Content,
    createdAt: comment.CreatedAt,
    profilePicture: comment.User.ProfilePicture || '/avatars/default.jpg',
    isLiked: comment.isLiked || false,
    likeCount: comment.likeCount || 0,
    replies: (comment.Replies || []).map((reply: any) => ({
      commentId: reply.CommentID,
      userId: reply.UserID,
      username: reply.User.Username || 'Unknown',
      content: reply.Content,
      createdAt: reply.CreatedAt,
      profilePicture: reply.User.ProfilePicture || '/avatars/default.jpg',
      isLiked: reply.isLiked || false,
      likeCount: reply.likeCount || 0,
    })),
  }));

  const transformedPost: Post = {
    postId: savedPost.PostID,
    userId: savedPost.UserID,
    username: savedPost.User.Username || 'Unknown',
    profilePicture: savedPost.User.ProfilePicture || '/avatars/default.jpg',
    privacy: savedPost.privacy,
    content: savedPost.Content,
    imageUrl: savedPost.ImageURL,
    videoUrl: savedPost.VideoURL,
    createdAt: savedPost.CreatedAt,
    likeCount: savedPost.likeCount || 0,
    commentCount: savedPost.commentCount || 0,
    comments: transformedComments,
    isLiked: savedPost.isLiked || false,
    likedBy: savedPost.likedBy || [],
  };

  setSelectedPost(transformedPost);
  setIsModalOpen(true);
};

/*
 * Handles follow/unfollow action
 * Updates profile after action
 */
export const handleFollowAction = async (
  isFollowing: boolean,
  followStatus: string | undefined,
  userId: number,
  username: string,
  followUser: (userId: number) => Promise<void>,
  unfollowUser: (userId: number) => Promise<void>,
  fetchProfile: (username: string) => Promise<void>,
  setIsFollowingLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> => {
  setIsFollowingLoading(true);
  try {
    if (isFollowing || followStatus === 'PENDING') {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
    await fetchProfile(username);
  } catch (err: any) {
    console.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'}:`, err);
    alert(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`);
  } finally {
    setIsFollowingLoading(false);
  }
};

/*
 * Opens followers/following dialog
 * Updates URL with shallow routing
 */
export const openDialog = (
  type: 'followers' | 'following',
  profile: any,
  username: string | string[] | undefined,
  setDialogType: React.Dispatch<React.SetStateAction<'followers' | 'following'>>,
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  router: ReturnType<typeof useRouter>
): void => {
  if (!profile || !username) return;
  setDialogType(type);
  setIsDialogOpen(true);
  const newPath = `/profile/${username}?tab=${type}`;
  router.push(newPath, undefined, { shallow: true });
};

/*
 * Closes followers/following dialog
 * Resets URL with shallow routing
 */
export const closeDialog = (
  username: string | string[] | undefined,
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
  router: ReturnType<typeof useRouter>
): void => {
  setIsDialogOpen(false);
  if (username) {
    const basePath = `/profile/${username}`;
    router.replace(basePath, undefined, { shallow: true });
  }
};