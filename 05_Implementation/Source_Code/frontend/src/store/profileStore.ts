import { create } from 'zustand';
import {
  fetchProfileByUsername,
  fetchUserHighlights,
  fetchSavedPosts,
  fetchUserPosts,
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  removeFollower,
} from '@/utils/api';
import { getAuthData } from '@/utils/auth';
import {
  ProfileStoreProfile,
  ProfileStoreAuthData,
  HighlightStory,
  Highlight,
  SavedPost,
  ProfileStorePost,
  PostsResponse,
  SavedPostsResponse,
  FollowResponse,
  FollowingFollower,
  FollowingFollowersResponse,
  ProfileState,
} from '@/types';

/**
 * Zustand store for profile and authentication data.
 */
export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  highlights: [],
  savedPosts: [],
  posts: [],
  loading: false,
  error: null,
  highlightsLoading: false,
  highlightsError: null,
  savedPostsLoading: false,
  savedPostsError: null,
  postsLoading: false,
  postsError: null,
  authData: null,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHighlights: (highlights) => set({ highlights }),
  setHighlightsLoading: (loading) => set({ highlightsLoading: loading }),
  setHighlightsError: (error) => set({ highlightsError: error }),
  setSavedPosts: (savedPosts) => set({ savedPosts }),
  setSavedPostsLoading: (loading) => set({ savedPostsLoading: loading }),
  setSavedPostsError: (error) => set({ savedPostsError: error }),
  setPosts: (posts) => set({ posts }),
  setPostsLoading: (loading) => set({ postsLoading: loading }),
  setPostsError: (error) => set({ postsError: error }),
  setAuthData: (data) => set({ authData: data }),
  setInitialAuthData: (data) => {
    if (!get().authData) {
      set({ authData: data });
    }
  },

  fetchProfile: async (username: string) => {
    console.log('Starting fetchProfile for:', username);
    try {
      const response = await fetchProfileByUsername(username);
      console.log('fetchProfile response:', response.profile);
      set({ profile: response.profile, loading: false, error: null });
    } catch (err: any) {
      console.error('fetchProfile error:', err);
      set({ error: err.message || 'Failed to fetch profile', loading: false });
    }
  },

  fetchHighlights: async (userId: number) => {
    set({ highlightsLoading: true, highlightsError: null });
    try {
      const highlights = await fetchUserHighlights(userId);
      set({ highlights, highlightsLoading: false });
    } catch (err: any) {
      set({ highlightsError: err.message || 'Failed to fetch highlights', highlightsLoading: false });
    }
  },

  fetchSavedPosts: async () => {
    set({ savedPostsLoading: true, savedPostsError: null });
    try {
      const response = await fetchSavedPosts();
      if (!Array.isArray(response)) {
        throw new Error('Invalid saved posts data format');
      }
      set({ savedPosts: response, savedPostsLoading: false });
    } catch (err: any) {
      set({ savedPostsError: err.message || 'Failed to fetch saved posts', savedPostsLoading: false });
    }
  },

  fetchPosts: async (userId: number) => {
    set({ postsLoading: true, postsError: null });
    try {
      const response = await fetchUserPosts(userId);
      set({ posts: response.posts || [], postsLoading: false });
    } catch (err: any) {
      set({ postsError: err.message || 'Failed to fetch posts', posts: [], postsLoading: false });
    }
  },

  followUser: async (userId: number) => {
    try {
      const response = await followUser(userId);
      if (response.status === 'PENDING' || response.status === 'ACCEPTED') {
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                isFollowing: true,
                followStatus: response.status,
                followerCount: state.profile.followerCount + 1,
              }
            : null,
        }));
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to follow user');
    }
  },

  unfollowUser: async (userId: number) => {
    try {
      const response = await unfollowUser(userId);
      set((state) => ({
        profile: state.profile
          ? {
              ...state.profile,
              isFollowing: false,
              followStatus: null,
              followerCount: state.profile.followerCount - 1,
            }
          : null,
      }));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to unfollow user');
    }
  },

  fetchFollowers: async (userId: number, signal?: AbortSignal) => {
    try {
      const response = await fetchFollowers(userId, signal);
      return response;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch followers');
    }
  },

  fetchFollowing: async (userId: number, signal?: AbortSignal) => {
    try {
      const response = await fetchFollowing(userId, signal);
      return response;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to fetch following');
    }
  },

  removeFollower: async (followerId: number) => {
    try {
      const response = await removeFollower(followerId);
      set((state) => ({
        profile: state.profile
          ? {
              ...state.profile,
              followerCount: state.profile.followerCount - 1,
            }
          : null,
      }));
      return response;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to remove follower');
    }
  },

  initializeAuth: async () => {
    const auth = await getAuthData();
    set({ authData: auth });
  },
}));