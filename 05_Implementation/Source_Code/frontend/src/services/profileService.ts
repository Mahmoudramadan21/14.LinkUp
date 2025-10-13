import api from "./api";
import {
  ProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdatePrivacyRequest,
  SimpleSuccessResponse,
  PendingFollowRequestsResponse,
  FollowersResponse,
  FollowingResponse,
  AcceptFollowResponse,
  UserSuggestionsResponse,
} from "@/types/profile";
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
 * Fetches profile by username.
 * @param username - Username of the user
 * @returns Profile details
 */
export const getProfileByUsername = async (
  username: string
): Promise<ProfileResponse> => {
  if (
    !username ||
    typeof username !== "string" ||
    username.trim().length === 0
  ) {
    throw new Error("Invalid username");
  }
  return makeApiRequest<ProfileResponse>("get", `/profile/${username}`);
};

/**
 * Updates user profile with optional file uploads.
 * @param data - Profile update data
 * @param profilePicture - Optional profile picture file
 * @param coverPicture - Optional cover picture file
 * @returns Updated profile
 */
export const updateProfile = async (
  data: UpdateProfileRequest,
  profilePicture?: File,
  coverPicture?: File
): Promise<SimpleSuccessResponse> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, value.toString());
  });
  if (profilePicture) formData.append("profilePicture", profilePicture);
  if (coverPicture) formData.append("coverPicture", coverPicture);
  return makeApiRequest<SimpleSuccessResponse>(
    "put",
    "/profile/edit",
    formData
  );
};

/**
 * Changes user password.
 * @param data - Old and new passwords
 * @returns Success response
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "put",
    "/profile/change-password",
    data
  );
};

/**
 * Updates privacy settings.
 * @param data - Privacy update data
 * @returns Success response
 */
export const updatePrivacySettings = async (
  data: UpdatePrivacyRequest
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("put", "/profile/privacy", data);
};

/**
 * Deletes user profile.
 * @returns Success response
 */
export const deleteProfile = async (): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("delete", "/profile");
};

/**
 * Follows a user.
 * @param userId - ID of the user to follow
 * @returns Success response with status
 */
export const followUser = async (
  userId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "post",
    `/profile/follow/${userId}`
  );
};

/**
 * Unfollows a user.
 * @param userId - ID of the user to unfollow
 * @returns Success response
 */
export const unfollowUser = async (
  userId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "delete",
    `/profile/unfollow/${userId}`
  );
};

/**
 * Removes a follower.
 * @param followerId - ID of the follower to remove
 * @returns Success response
 */
export const removeFollower = async (
  followerId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "delete",
    `/profile/remove-follower/${followerId}`
  );
};

/**
 * Fetches pending follow requests.
 * @returns Pending requests response
 */
export const getPendingFollowRequests =
  async (): Promise<PendingFollowRequestsResponse> => {
    return makeApiRequest<PendingFollowRequestsResponse>(
      "get",
      "/profile/follow-requests/pending"
    );
  };

/**
 * Accepts a follow request.
 * @param requestId - ID of the request to accept
 * @returns Accept response
 */
export const acceptFollowRequest = async (
  requestId: number
): Promise<AcceptFollowResponse> => {
  return makeApiRequest<AcceptFollowResponse>(
    "put",
    `/profile/follow-requests/${requestId}/accept`
  );
};

/**
 * Rejects a follow request.
 * @param requestId - ID of the request to reject
 * @returns Success response
 */
export const rejectFollowRequest = async (
  requestId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "delete",
    `/profile/follow-requests/${requestId}/reject`
  );
};

/**
 * Fetches followers for a user.
 * @param username - Username of the user
 * @param params - Pagination parameters
 * @returns Followers response
 */
export const getFollowers = async (
  username: string,
  params: { page?: number; limit?: number }
): Promise<FollowersResponse> => {
  if (
    !username ||
    typeof username !== "string" ||
    username.trim().length === 0
  ) {
    throw new Error("Invalid username");
  }
  return makeApiRequest<FollowersResponse>(
    "get",
    `/profile/followers/${username}`,
    params
  );
};

/**
 * Fetches following for a user.
 * @param username - Username of the user
 * @param params - Pagination parameters
 * @returns Following response
 */
export const getFollowing = async (
  username: string,
  params: { page?: number; limit?: number }
): Promise<FollowingResponse> => {
  if (
    !username ||
    typeof username !== "string" ||
    username.trim().length === 0
  ) {
    throw new Error("Invalid username");
  }
  return makeApiRequest<FollowingResponse>(
    "get",
    `/profile/following/${username}`,
    params
  );
};

/**
 * Fetches user suggestions.
 * @param limit - Number of suggestions (optional)
 * @returns Suggestions response
 */
export const getUserSuggestions = async (
  limit?: number
): Promise<UserSuggestionsResponse> => {
  return makeApiRequest<UserSuggestionsResponse>(
    "get",
    "/profile/suggestions",
    { limit }
  );
};
