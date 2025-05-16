import { create } from 'zustand';
import api from '@/utils/api';
import { getAuthData } from '@/utils/auth';

// Define interfaces
interface User {
  UserID: number;
  Username: string;
  ProfilePicture: string | null;
  Bio: string | null;
}

interface FollowRequest {
  requestId: number;
  user: User;
  createdAt: string;
}

interface FollowRequestsResponse {
  count: number;
  pendingRequests: FollowRequest[];
}

interface StoryUser {
  userId: number;
  username: string;
  profilePicture: string;
  hasUnviewedStories: boolean;
  stories: { storyId: number; createdAt: string; mediaUrl: string; expiresAt: string; isViewed: boolean }[];
}

interface Story {
  username: string;
  imageSrc: string;
  hasPlus?: boolean;
  hasUnviewedStories?: boolean;
}

interface Comment {
  commentId: number;
  username: string;
  content: string;
  createdAt: string;
  profilePicture?: string;
  isLiked: boolean;
  likeCount: number;
  replies?: Comment[];
}

interface Post {
  postId: number;
  userId: number;
  username: string;
  profilePicture: string;
  privacy: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  likedBy: { username: string; profilePicture: string }[];
  comments: Comment[];
}

interface AppState {
  authLoading: boolean;
  followLoading: boolean;
  postLoading: boolean;
  storiesLoading: boolean;
  postsLoading: boolean;
  authData: ReturnType<typeof getAuthData> | null;
  followRequests: FollowRequest[];
  stories: Story[];
  storiesError: string | null;
  posts: Post[];
  error: string | null;
  page: number;
  hasMore: boolean;

  setAuthLoading: (loading: boolean) => void;
  setFollowLoading: (loading: boolean) => void;
  setPostLoading: (loading: boolean) => void;
  setStoriesLoading: (loading: boolean) => void;
  setPostsLoading: (loading: boolean) => void;
  setAuthData: (data: ReturnType<typeof getAuthData> | null) => void;
  setFollowRequests: (requests: FollowRequest[]) => void;
  setStories: (stories: Story[]) => void;
  setStoriesError: (error: string | null) => void;
  setPosts: (posts: Post[]) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;

  fetchFollowRequests: () => Promise<void>;
  fetchStories: (token: string) => Promise<void>;
  fetchPosts: () => Promise<void>;
  handleAcceptRequest: (requestId: number) => Promise<void>;
  handleRejectRequest: (requestId: number) => Promise<void>;
  handlePostSubmit: (content: string, image?: File, video?: File) => Promise<void>;
  handlePostUpdate: (postId: number, updatedFields: Partial<Post>) => void;
  handlePostStory: (media: File, text?: string, backgroundColor?: string, textColor?: string, position?: { x: number; y: number }, fontSize?: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  authLoading: true,
  followLoading: false,
  postLoading: false,
  storiesLoading: false,
  postsLoading: false,
  authData: getAuthData(),
  followRequests: [],
  stories: [],
  storiesError: null,
  posts: [],
  error: null,
  page: 1,
  hasMore: true,

  setAuthLoading: (loading) => set({ authLoading: loading }),
  setFollowLoading: (loading) => set({ followLoading: loading }),
  setPostLoading: (loading) => set({ postLoading: loading }),
  setStoriesLoading: (loading) => set({ storiesLoading: loading }),
  setPostsLoading: (loading) => set({ postsLoading: loading }),
  setAuthData: (data) => set({ authData: data }),
  setFollowRequests: (requests) => set({ followRequests: requests }),
  setStories: (stories) => set({ stories }),
  setStoriesError: (error) => set({ storiesError: error }),
  setPosts: (posts) => set({ posts }),
  setError: (error) => set({ error }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),

  fetchFollowRequests: async () => {
    set({ followLoading: true });
    try {
      const response = await api.get<FollowRequestsResponse>('/profile/follow-requests/pending');
      console.log('Fetched follow requests:', response.data);
      set({ followRequests: response.data.pendingRequests || [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load follow requests' });
    } finally {
      set({ followLoading: false });
    }
  },

  fetchStories: async (token: string) => {
    set({ storiesLoading: true, storiesError: null });
    try {
      const response = await api.get<StoryUser[]>('/stories/feed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched stories:', response.data, 'Status:', response.status);
      const mappedStories: Story[] = [
        {
          username: 'You',
          imageSrc: get().authData?.profilePicture || '/avatars/placeholder.jpg',
          hasPlus: true,
        },
        ...response.data.map((storyUser) => ({
          username: storyUser.username,
          imageSrc: storyUser.stories.length > 0 ? storyUser.stories[0].mediaUrl : storyUser.profilePicture || '/avatars/placeholder.jpg',
          hasUnviewedStories: storyUser.hasUnviewedStories,
        })),
      ];
      set({ stories: mappedStories });
    } catch (err: any) {
      console.error('Fetch stories error:', err.response?.data, err.response?.status);
      set({ storiesError: err.response?.data?.message || err.message || 'Failed to load stories' });
    } finally {
      set({ storiesLoading: false });
    }
  },

  fetchPosts: async () => {
    set({ postsLoading: true });
    try {
      const response = await api.get<any[]>('/posts', {
        params: { page: get().page, limit: 10 },
      });
      console.log('Fetched posts raw data:', response.data);
      if (response.data && Array.isArray(response.data)) {
        const newPosts: Post[] = response.data.map((post) => ({
          postId: post.PostID,
          userId: post.UserID,
          username: post.User.Username,
          profilePicture: post.User.ProfilePicture || '/avatars/placeholder.jpg',
          privacy: post.privacy || 'PUBLIC',
          content: post.Content || '',
          imageUrl: post.ImageURL || null,
          videoUrl: post.VideoURL || null,
          createdAt: post.CreatedAt || new Date().toISOString(),
          likeCount: post._count?.Likes || 0,
          commentCount: post._count?.Comments || 0,
          isLiked: post.isLiked || false,
          likedBy: post.likedBy || [],
          comments: post.Comments?.map((comment: any) => ({
            commentId: comment.CommentID,
            username: comment.User.Username,
            content: comment.Content,
            createdAt: comment.CreatedAt,
            profilePicture: comment.User.ProfilePicture,
            isLiked: comment.isLiked || false,
            likeCount: comment._count?.CommentLikes || 0,
            replies: comment.Replies?.map((reply: any) => ({
              commentId: reply.CommentID,
              username: reply.User.Username,
              content: reply.Content,
              createdAt: reply.CreatedAt,
              profilePicture: reply.User.ProfilePicture,
              isLiked: reply.isLiked || false,
              likeCount: reply._count?.CommentLikes || 0,
            })) || [],
          })) || [],
        }));
        set((state) => ({
          posts: get().page === 1 ? newPosts : [...state.posts, ...newPosts],
          hasMore: newPosts.length === 10,
        }));
      } else {
        set({ hasMore: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load posts' });
    } finally {
      set({ postsLoading: false });
    }
  },

  handleAcceptRequest: async (requestId: number) => {
    try {
      await api.put(`/profile/follow-requests/${requestId}/accept`);
      set((state) => ({
        followRequests: state.followRequests.filter((req) => req.requestId !== requestId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to accept follow request' });
    }
  },

  handleRejectRequest: async (requestId: number) => {
    try {
      await api.delete(`/profile/follow-requests/${requestId}/reject`);
      set((state) => ({
        followRequests: state.followRequests.filter((req) => req.requestId !== requestId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to reject follow request' });
    }
  },

  handlePostSubmit: async (content: string, image?: File, video?: File) => {
    set({ postLoading: true });
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) formData.append('media', image);
      if (video) formData.append('media', video);

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Post created successfully:', response.data);

      // Reset page to 1 to fetch updated posts, but keep current posts until fetch is done
      set({ page: 1, hasMore: true });
      await get().fetchPosts();
    } catch (err: any) {
      set({ error: err.message || 'Failed to create post' });
    } finally {
      set({ postLoading: false });
    }
  },

  handlePostUpdate: (postId: number, updatedFields: Partial<Post>) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.postId === postId ? { ...post, ...updatedFields } : post
      ),
    }));
  },

  handlePostStory: async (media: File, text?: string, backgroundColor?: string, textColor?: string, position?: { x: number; y: number }, fontSize?: number) => {
    set({ storiesLoading: true, storiesError: null });
    try {
      const formData = new FormData();
      formData.append('media', media);
      if (text) formData.append('text', text);
      if (backgroundColor) formData.append('backgroundColor', backgroundColor);
      if (textColor) formData.append('textColor', textColor);
      if (position) formData.append('position', JSON.stringify(position));
      if (fontSize) formData.append('fontSize', fontSize.toString());

      const response = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Story posted successfully:', response.data);
      await get().fetchStories(get().authData?.accessToken || '');
    } catch (err: any) {
      console.error('Post story error:', err.response?.data, err.response?.status);
      set({ storiesError: err.response?.data?.message || err.message || 'Failed to post story' });
    } finally {
      set({ storiesLoading: false });
    }
  },
}));