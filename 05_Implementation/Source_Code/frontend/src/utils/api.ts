import axios, { AxiosError } from "axios";
import {
  getAccessToken,
  refreshAccessToken,
  removeAuthData,
} from "./auth";
import { API_ENDPOINTS } from "./constants";

// Define error response type
interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: { field?: string; message?: string; msg?: string }[];
}

// Define Story types based on API responses
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

interface LikeToggleResponse {
  success: boolean;
  action: "liked" | "unliked";
}

// Define Profile types based on API response
interface Profile {
  userId: number;
  username: string;
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
}

interface ProfileResponse {
  profile: Profile;
}

// Define Change Password Response type
interface ChangePasswordResponse {
  message: string;
}

// Define Post types based on API response
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

// Define Highlight Story type (للـ Stories داخل الـ Highlight)
interface HighlightStory {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  assignedAt: string;
}

// Define Highlight types based on API response
interface Highlight {
  highlightId: number;
  title: string;
  coverImage: string;
  storyCount: number;
  stories: HighlightStory[];
}

// Define Saved Post types
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

// Define Update Profile Response type
interface UpdateProfileResponse {
  message: string;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Add request interceptor to include Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    let status = error.response?.status || 500;
    let message = "An unexpected error occurred";

    console.error(`API Error [${status}]:`, error.response?.data || error.message);

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("Attempting to refresh token...");
        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
          throw new Error("Failed to refresh token");
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("Retrying original request:", originalRequest.url);
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error("Failed to refresh token:", refreshError.message);

        if (refreshError.response) {
          console.error("Refresh token error response:", refreshError.response.data);
        }

        removeAuthData();
        if (typeof window !== "undefined") {
          console.log("Redirecting to login page...");
          window.location.href = "/login";
        }

        const refreshApiError: ApiErrorResponse = {
          status: 401,
          message: "Session expired. Please log in again.",
        };
        return Promise.reject(refreshApiError);
      }
    }

    switch (status) {
      case 400:
        message =
          (error.response?.data as { message: string })?.message ||
          "Validation error. Please check your input.";
        break;
      case 401:
        message = "Authentication failed. Please log in.";
        break;
      case 403:
        message = "You do not have permission to perform this action.";
        break;
      case 404:
        message =
          (error.response?.data as { message: string })?.message ||
          "Resource not found.";
        break;
      case 429:
        message = "Too many requests. Please try again later.";
        break;
      case 500:
        message = "Internal server error. Please try again later.";
        break;
      default:
        message =
          (error.response?.data as { message: string })?.message ||
          "Request failed. Please try again.";
    }

    const apiError: ApiErrorResponse = {
      status,
      message,
      errors: (error.response?.data as { errors: { field?: string; message?: string; msg?: string }[] })?.errors,
    };

    return Promise.reject(apiError);
  }
);

// Stories API functions
export const fetchStoryFeed = async (token?: string): Promise<UserStory[]> => {
  const url = API_ENDPOINTS.GET_STORIES_FEED;
  const response = await api.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
};

export const toggleStoryLike = async (storyId: number, token: string): Promise<LikeToggleResponse> => {
  const url = API_ENDPOINTS.TOGGLE_STORY_LIKE.replace(":storyId", storyId.toString());
  const response = await api.post(url, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Profile API functions
export const fetchProfileByUsername = async (username: string): Promise<ProfileResponse> => {
  const url = API_ENDPOINTS.GET_PROFILE_BY_USERNAME.replace(":username", username);
  const response = await api.get(url);
  return response.data;
};

export const fetchUserPosts = async (userId: number): Promise<PostsResponse> => {
  const url = API_ENDPOINTS.GET_USER_POSTS.replace(":userId", userId.toString());
  const response = await api.get(url);
  return response.data;
};

export const updateProfile = async (formData: FormData): Promise<UpdateProfileResponse> => {
  const response = await api.put('/profile/edit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<ChangePasswordResponse> => {
  const formData = new FormData();
  formData.append('oldPassword', oldPassword);
  formData.append('newPassword', newPassword);

  const response = await api.put(API_ENDPOINTS.CHANGE_PASSWORD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const followUser = async (userId: number): Promise<FollowResponse> => {
  const url = API_ENDPOINTS.FOLLOW_USER.replace(":userId", userId.toString());
  const response = await api.post(url);
  return response.data;
};

export const unfollowUser = async (userId: number): Promise<{ message: string }> => {
  const url = API_ENDPOINTS.UNFOLLOW_USER.replace(":userId", userId.toString());
  const response = await api.delete(url);
  return response.data;
};

export const fetchFollowing = async (userId: number): Promise<FollowingFollowersResponse> => {
  const url = API_ENDPOINTS.GET_FOLLOWING.replace(":userId", userId.toString());
  const response = await api.get(url);
  return response.data;
};

export const fetchFollowers = async (userId: number): Promise<FollowingFollowersResponse> => {
  const url = API_ENDPOINTS.GET_FOLLOWERS.replace(":userId", userId.toString());
  const response = await api.get(url);
  return response.data;
};

export const removeFollower = async (followerId: number): Promise<{ message: string }> => {
  const url = API_ENDPOINTS.REMOVE_FOLLOWER.replace(":followerId", followerId.toString());
  const response = await api.delete(url);
  return response.data;
};

// Highlights API functions
export const fetchUserHighlights = async (userId: number): Promise<Highlight[]> => {
  const url = API_ENDPOINTS.GET_USER_HIGHLIGHTS.replace(":userId", userId.toString());
  const response = await api.get(url);
  return response.data;
};

// Update fetchSavedPosts return type
export const fetchSavedPosts = async (): Promise<SavedPost[]> => {
  const response = await api.get(API_ENDPOINTS.GET_SAVED_POSTS);
  return response.data.savedPosts; // تأكد إن الـ Response بيرجع savedPosts
};

export default api;