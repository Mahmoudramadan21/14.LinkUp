import api from './api';
import { Story, Comment, Post } from '@/types';

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

export const handleOpenModal = (
  savedPost: any,
  setSelectedPost: (post: Post | null) => void,
  setIsModalOpen: (isOpen: boolean) => void
) => {
  const transformedPost: Post = {
    postId: savedPost.PostID,
    userId: savedPost.UserID,
    username: savedPost.User.Username,
    profilePicture: savedPost.User.ProfilePicture || null,
    privacy: savedPost.privacy,
    content: savedPost.Content || null,
    imageUrl: savedPost.ImageURL,
    videoUrl: savedPost.VideoURL,
    createdAt: savedPost.CreatedAt,
    likeCount: savedPost._count?.Likes || savedPost.likeCount || 0,
    commentCount: savedPost._count?.Comments || savedPost.commentCount || 0,
    comments: savedPost.Comments?.map((comment: any) => ({
      commentId: comment.CommentID,
      userId: comment.UserID,
      username: comment.User.Username,
      content: comment.Content,
      createdAt: comment.CreatedAt,
      profilePicture: comment.User.ProfilePicture || null,
      isLiked: comment.isLiked || false,
      likeCount: comment._count?.CommentLikes || comment.likeCount || 0,
      replies: comment.Replies?.map((reply: any) => ({
        commentId: reply.CommentID,
        userId: reply.UserID,
        username: reply.User.Username,
        content: reply.Content,
        createdAt: reply.CreatedAt,
        profilePicture: reply.User.ProfilePicture || null,
        isLiked: reply.isLiked || false,
        likeCount: reply._count?.CommentLikes || reply.likeCount || 0,
        replies: [],
      })) || [],
    })) || [],
    isLiked: savedPost.isLiked || false,
    likedBy: savedPost.likedBy?.map((user: any) => ({
      username: user.username,
      profilePicture: user.profilePicture || null,
    })) || [],
  };
  setSelectedPost(transformedPost);
  setIsModalOpen(true);
};