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

// Define Profile type
interface Profile {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  coverPicture: string | null;
  bio: string | null;
  address: string | null;
  jobTitle: string | null;
  dateOfBirth: string | null;
  isPrivate: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  isFollowing: boolean;
  followStatus: 'PENDING' | 'ACCEPTED' | null;
}

// Define AuthData type
interface AuthData {
  userId: number;
  username: string;
  profilePicture: string | null;
  token: string;
}

// Define Highlight Story type
interface HighlightStory {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  assignedAt: string;
}

// Define Highlight type
interface Highlight {
  highlightId: number;
  title: string;
  coverImage: string;
  storyCount: number;
  stories: HighlightStory[];
}

// Define Saved Post type based on API response
interface SavedPost {
  PostID: number;
  UserID: number;
  Content: string;
  ImageURL: string | null;
  VideoURL: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  privacy: string;
  User: {
    UserID: number;
    Username: string;
    ProfilePicture: string | null;
    IsPrivate: boolean;
  };
  Likes: Array<{
    LikeID: number;
    PostID: number;
    UserID: number;
    CreatedAt: string;
    User: {
      Username: string;
      ProfilePicture: string | null;
    };
  }>;
  Comments: Array<{
    CommentID: number;
    PostID: number;
    UserID: number;
    Content: string;
    CreatedAt: string;
    ParentCommentID: number | null;
    User: {
      Username: string;
      ProfilePicture: string | null;
    };
    CommentLikes: Array<{
      LikeID: number;
      CommentID: number;
      UserID: number;
      CreatedAt: string;
      User: {
        Username: string;
        ProfilePicture: string | null;
      };
    }>;
    Replies: Array<{
      CommentID: number;
      PostID: number;
      UserID: number;
      Content: string;
      CreatedAt: string;
      ParentCommentID: number | null;
      User: {
        Username: string;
        ProfilePicture: string | null;
      };
      CommentLikes: Array<{
        LikeID: number;
        CommentID: number;
        UserID: number;
        CreatedAt: string;
        User: {
          Username: string;
          ProfilePicture: string | null;
        };
      }>;
      isLiked: boolean;
      likeCount: number;
      replyCount: number;
      likedBy: Array<{
        username: string;
        profilePicture: string | null;
      }>;
    }>;
    _count: {
      CommentLikes: number;
      Replies: number;
    };
    isLiked: boolean;
    likeCount: number;
    replyCount: number;
    likedBy: Array<{
      username: string;
      profilePicture: string | null;
    }>;
  }>;
  _count: {
    Likes: number;
    Comments: number;
  };
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  likedBy: Array<{
    username: string;
    profilePicture: string | null;
  }>;
}

// Define Post type based on API response
interface Post {
  postId: number;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    UserID: number;
    Username: string;
    ProfilePicture: string;
  };
  likeCount: number;
  commentCount: number;
}

interface PostsResponse {
  count: number;
  posts: Post[];
}

interface SavedPostsResponse {
  savedPosts: SavedPost[];
}

interface FollowResponse {
  message: string;
  status?: 'PENDING' | 'ACCEPTED';
}

interface FollowingFollower {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  isPrivate: boolean;
  bio: string | null;
}

interface FollowingFollowersResponse {
  count: number;
  following?: FollowingFollower[];
  followers?: FollowingFollower[];
}

interface ProfileState {
  profile: Profile | null;
  highlights: Highlight[];
  savedPosts: SavedPost[];
  posts: Post[];
  loading: boolean;
  error: string | null;
  highlightsLoading: boolean;
  highlightsError: string | null;
  savedPostsLoading: boolean;
  savedPostsError: string | null;
  postsLoading: boolean;
  postsError: string | null;
  authData: AuthData | null;

  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHighlights: (highlights: Highlight[]) => void;
  setHighlightsLoading: (loading: boolean) => void;
  setHighlightsError: (error: string | null) => void;
  setSavedPosts: (savedPosts: SavedPost[]) => void;
  setSavedPostsLoading: (loading: boolean) => void;
  setSavedPostsError: (error: string | null) => void;
  setPosts: (posts: Post[]) => void;
  setPostsLoading: (loading: boolean) => void;
  setPostsError: (error: string | null) => void;
  setAuthData: (data: AuthData | null) => void;
  setInitialAuthData: (data: AuthData | null) => void;

  fetchProfile: (username: string) => Promise<void>;
  fetchHighlights: (userId: number) => Promise<void>;
  fetchSavedPosts: () => Promise<void>;
  fetchPosts: (userId: number) => Promise<void>;
  followUser: (userId: number) => Promise<void>;
  unfollowUser: (userId: number) => Promise<void>;
  fetchFollowers: (userId: number, signal?: AbortSignal) => Promise<FollowingFollowersResponse>;
  fetchFollowing: (userId: number, signal?: AbortSignal) => Promise<FollowingFollowersResponse>;
  removeFollower: (followerId: number) => Promise<{ message: string }>;
  initializeAuth: () => Promise<void>;
}

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