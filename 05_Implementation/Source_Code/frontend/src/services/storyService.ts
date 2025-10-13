import api from "./api";
import {
  CreateStoryRequest,
  StoryViewsResponse,
  StoryFeedItem,
  StoryFeedResponse,
  SimpleSuccessResponse,
  StoryResponse,
  PaginatedUserStoriesResponse,
  StoryViewersWithLikesResponse,
  ReportStoryRequest,
  ReportStoryResponse,
} from "@/types/story";
import { AxiosResponse } from "axios";

/**
 * Generic function to make API requests and handle responses.
 * @param method - HTTP method (e.g., 'post', 'get')
 * @param endpoint - API endpoint
 * @param data - Request payload (optional)
 * @returns Response data
 * @throws ErrorResponse on failure
 */
const makeApiRequest = async <T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  endpoint: string,
  data?: unknown
): Promise<T> => {
  try {
    let response: AxiosResponse<T>;

    if (method === "get") {
      response = await api.get<T>(endpoint, { params: data });
    } else if (method === "post") {
      response = await api.post<T>(endpoint, data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      });
    } else if (method === "put" || method === "patch") {
      response = await api[method]<T>(endpoint, data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      });
    } else {
      response = await api.delete<T>(endpoint);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new story with media.
 * @param data - Story media file
 * @returns Created story
 */
export const createStory = async (
  data: CreateStoryRequest
): Promise<StoryResponse> => {
  const formData = new FormData();
  formData.append("media", data.media);
  return makeApiRequest<StoryResponse>("post", "/stories", formData);
};

/**
 * Fetches the story feed for the authenticated user.
 * @param params - Pagination parameters
 * @returns Array of story feed items
 */
export const getStoryFeed = async (params: {
  limit?: number;
  offset?: number;
}): Promise<StoryFeedResponse> => {
  return makeApiRequest<StoryFeedResponse>("get", "/stories/feed", params);
};

/**
 * Fetches stories for a specific user by username.
 * @param username - Username of the user
 * @returns Array of stories
 */
export const getUserStories = async (
  username: string
): Promise<StoryFeedItem> => {
  return makeApiRequest<StoryFeedItem>("get", `/stories/${username}`);
};

/**
 * Fetches views and likes for a specific story.
 * @param storyId - ID of the story
 * @returns Story views and likes analytics
 */
export const getStoryViews = async (
  storyId: number
): Promise<StoryViewsResponse> => {
  return makeApiRequest<StoryViewsResponse>("get", `/stories/${storyId}/views`);
};

/**
 * Fetches viewers with their like status for a specific story.
 * @param storyId - ID of the story
 * @param params - Pagination parameters
 * @returns Viewers with like status
 */
export const getStoryViewersWithLikes = async (
  storyId: number,
  params: { limit?: number; offset?: number }
): Promise<StoryViewersWithLikesResponse> => {
  return makeApiRequest<StoryViewersWithLikesResponse>(
    "get",
    `/stories/${storyId}/viewers`,
    params
  );
};

/**
 * Records a view for a specific story.
 * @param storyId - ID of the story
 * @returns Success response
 */
export const recordStoryView = async (
  storyId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "post",
    `/stories/${storyId}/view`
  );
};

/**
 * Fetches a specific story by ID.
 * @param storyId - ID of the story
 * @returns Story details
 */
export const getStoryById = async (storyId: number): Promise<StoryResponse> => {
  return makeApiRequest<StoryResponse>("get", `/stories/id/${storyId}`);
};

/**
 * Toggles like status on a story.
 * @param storyId - ID of the story
 * @returns Success response with action
 */
export const toggleStoryLike = async (
  storyId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "post",
    `/stories/${storyId}/like`
  );
};

/**
 * Deletes a story.
 * @param storyId - ID of the story
 * @returns Success response
 */
export const deleteStory = async (
  storyId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("delete", `/stories/${storyId}`);
};

/**
 * Reports a story to admins.
 * @param storyId - ID of the story
 * @param data - Report reason
 * @returns Report response with report ID
 */
export const reportStory = async (
  storyId: number,
  data: ReportStoryRequest
): Promise<ReportStoryResponse> => {
  return makeApiRequest<ReportStoryResponse>(
    "post",
    `/stories/${storyId}/report`,
    data
  );
};

/**
 * Fetches paginated stories for the authenticated user.
 * @param params - Pagination parameters (limit, offset)
 * @returns Paginated list of user stories
 */
export const getMyStories = async (params: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedUserStoriesResponse> => {
  return makeApiRequest<PaginatedUserStoriesResponse>(
    "get",
    "/profile/stories",
    params
  );
};
