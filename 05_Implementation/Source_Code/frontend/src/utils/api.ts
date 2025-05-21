import axios, { AxiosError } from "axios";
import {
  getAccessToken,
  refreshAccessToken,
  removeAuthData,
} from "./auth";
import { API_ENDPOINTS } from "./constants";
import {
  ApiErrorResponse,
  ApiStory,
  UserStory,
  StoryDetails,
  ApiLikeToggleResponse,
  ProfileStoreProfile,
  ProfileResponse,
  ChangePasswordResponse,
  ProfileStorePost,
  PostsResponse,
  HighlightStory,
  Highlight,
  SavedPost,
  FollowingFollower,
  FollowingFollowersResponse,
  UpdateProfileResponse,
} from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

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

export const fetchStoryFeed = async (token?: string): Promise<UserStory[]> => {
  const url = API_ENDPOINTS.GET_STORIES_FEED;
  const response = await api.get<UserStory[]>(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    params: { limit: 20, offset: 0 },
  });
  return response.data;
};

export const fetchStoriesByUsername = async (username: string, token: string): Promise<ApiStory[]> => {
  const url = `/stories/${encodeURIComponent(username)}`;
  const response = await api.get<ApiStory[]>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchStoryDetails = async (storyId: number, token: string): Promise<StoryDetails> => {
  const url = `/stories/${storyId}`;
  const response = await api.get<StoryDetails>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const recordStoryView = async (storyId: number, token: string): Promise<void> => {
  const url = `/stories/${storyId}/view`;
  await api.post(url, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const toggleStoryLike = async (storyId: number, token: string): Promise<ApiLikeToggleResponse> => {
  const url = API_ENDPOINTS.LIKE_STORY.replace(":storyId", storyId.toString());
  const response = await api.post<ApiLikeToggleResponse>(url, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchProfileByUsername = async (username: string): Promise<ProfileResponse> => {
  const url = API_ENDPOINTS.GET_PROFILE_BY_USERNAME.replace(":username", username);
  const response = await api.get<ProfileResponse>(url);
  return response.data;
};

export const fetchUserPosts = async (userId: number): Promise<PostsResponse> => {
  const url = API_ENDPOINTS.GET_USER_POSTS.replace(":userId", userId.toString());
  const response = await api.get<PostsResponse>(url);
  return response.data;
};

export const updateProfile = async (formData: FormData): Promise<UpdateProfileResponse> => {
  const response = await api.put<UpdateProfileResponse>('/profile/edit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<ChangePasswordResponse> => {
  const formData = new FormData();
  formData.append('oldPassword', oldPassword);
  formData.append('newPassword', newPassword);

  const response = await api.put<ChangePasswordResponse>(API_ENDPOINTS.CHANGE_PASSWORD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const followUser = async (userId: number): Promise<FollowResponse> => {
  const url = API_ENDPOINTS.FOLLOW_USER.replace(":userId", userId.toString());
  const response = await api.post<FollowResponse>(url);
  return response.data;
};

export const unfollowUser = async (userId: number): Promise<{ message: string }> => {
  const url = API_ENDPOINTS.UNFOLLOW_USER.replace(":userId", userId.toString());
  const response = await api.delete<{ message: string }>(url);
  return response.data;
};

export const fetchFollowing = async (userId: number): Promise<FollowingFollowersResponse> => {
  const url = API_ENDPOINTS.GET_FOLLOWING.replace(":userId", userId.toString());
  const response = await api.get<FollowingFollowersResponse>(url);
  return response.data;
};

export const fetchFollowers = async (userId: number): Promise<FollowingFollowersResponse> => {
  const url = API_ENDPOINTS.GET_FOLLOWERS.replace(":userId", userId.toString());
  const response = await api.get<FollowingFollowersResponse>(url);
  return response.data;
};

export const removeFollower = async (followerId: number): Promise<{ message: string }> => {
  const url = API_ENDPOINTS.REMOVE_FOLLOWER.replace(":followerId", followerId.toString());
  const response = await api.delete<{ message: string }>(url);
  return response.data;
};

export const fetchUserHighlights = async (userId: number): Promise<Highlight[]> => {
  const url = API_ENDPOINTS.GET_USER_HIGHLIGHTS.replace(":userId", userId.toString());
  const response = await api.get<Highlight[]>(url);
  return response.data;
};

export const fetchSavedPosts = async (): Promise<SavedPost[]> => {
  const response = await api.get<SavedPostsResponse>(API_ENDPOINTS.GET_SAVED_POSTS);
  return response.data.savedPosts;
};

export default api;