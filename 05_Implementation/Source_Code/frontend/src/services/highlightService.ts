// services/highlightService.ts

import { AxiosResponse } from "axios";
import {
  Highlight,
  CreateHighlightRequest,
  UpdateHighlightRequest,
  SimpleSuccessResponse,
  UserHighlightsResponse,
} from "@/types/highlight";
import api from "./api"; // Assuming api is an Axios instance configured with base URL and headers

/**
 * Generic function to make API requests.
 * Handles GET, POST, PUT, and DELETE methods with proper headers for FormData.
 * @param {"get" | "post" | "put" | "delete"} method - The HTTP method.
 * @param {string} endpoint - The API endpoint.
 * @param {unknown} [data] - The request data or params.
 * @returns {Promise<T>} The response data.
 * @throws {Error} If the request fails.
 */
const makeApiRequest = async <T>(
  method: "get" | "post" | "put" | "delete",
  endpoint: string,
  data?: unknown
): Promise<T> => {
  try {
    let response: AxiosResponse<T>;

    switch (method) {
      case "get":
        response = await api.get<T>(endpoint, { params: data });
        break;
      case "post":
      case "put":
        response = await api[method]<T>(endpoint, data, {
          headers:
            data instanceof FormData
              ? { "Content-Type": "multipart/form-data" }
              : { "Content-Type": "application/json" },
        });
        break;
      case "delete":
        response = await api.delete<T>(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new highlight with a cover image.
 * Prepares FormData with title, storyIds as comma-separated string, and coverImage file.
 * @param {CreateHighlightRequest} data - The highlight creation data (title, storyIds).
 * @param {File} coverImage - The cover image file.
 * @returns {Promise<Highlight>} The created highlight response.
 */
export const createHighlight = async (
  data: CreateHighlightRequest,
  coverImage: File
): Promise<Highlight> => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("storyIds", data.storyIds.join(","));
  formData.append("coverImage", coverImage);
  return makeApiRequest<Highlight>("post", "/highlights", formData);
};

/**
 * Fetches highlights for a user with pagination.
 * @param {string} username - The username of the user.
 * @param {{ limit?: number; offset?: number }} params - Pagination parameters.
 * @returns {Promise<UserHighlightsResponse>} The paginated highlights response.
 */
export const getUserHighlights = async (
  username: string,
  params: { limit?: number; offset?: number }
): Promise<UserHighlightsResponse> => {
  return makeApiRequest<UserHighlightsResponse>(
    "get",
    `/highlights/user/${username}`,
    params
  );
};

/**
 * Fetches a specific highlight by ID.
 * @param {number} highlightId - The ID of the highlight.
 * @returns {Promise<Highlight>} The highlight response.
 */
export const getUserHighlightById = async (
  highlightId: number
): Promise<Highlight> => {
  return makeApiRequest<Highlight>("get", `/highlights/${highlightId}`);
};

/**
 * Updates a highlight with optional fields.
 * Prepares FormData with optional title, storyIds as comma-separated string, and coverImage.
 * @param {number} highlightId - The ID of the highlight.
 * @param {UpdateHighlightRequest} data - The highlight update data (title, storyIds).
 * @param {File} [coverImage] - Optional cover image file.
 * @returns {Promise<Highlight>} The updated highlight response.
 */
export const updateHighlight = async (
  highlightId: number,
  data: UpdateHighlightRequest,
  coverImage?: File
): Promise<Highlight> => {
  const formData = new FormData();
  if (data.title) formData.append("title", data.title);
  if (data.storyIds && data.storyIds.length > 0) {
    formData.append("storyIds", data.storyIds.join(","));
  }
  if (coverImage) formData.append("coverImage", coverImage);
  return makeApiRequest<Highlight>(
    "put",
    `/highlights/${highlightId}`,
    formData
  );
};

/**
 * Deletes a highlight.
 * @param {number} highlightId - The ID of the highlight.
 * @returns {Promise<SimpleSuccessResponse>} The success response.
 */
export const deleteHighlight = async (
  highlightId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "delete",
    `/highlights/${highlightId}`
  );
};