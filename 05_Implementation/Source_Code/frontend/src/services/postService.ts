import api from "./api";
import {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  AddCommentRequest,
  ReplyCommentRequest,
  ReportPostRequest,
  SharePostRequest,
  PostResponse,
  PostsResponse,
  Comment,
  SimpleSuccessResponse,
  UsersResponse,
  CommentsResponse,
  RepliesResponse,
  BatchPostViewsRequest,
  BatchPostViewsResponse,
} from "@/types/post";
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
 * Creates a new post with optional media.
 * @param data - Post content and optional media file
 * @returns Created post
 */
export const createPost = async (
  data: CreatePostRequest
): Promise<PostResponse> => {
  const formData = new FormData();
  if (data.content) formData.append("content", data.content);
  if (data.media) formData.append("media", data.media);
  return makeApiRequest<PostResponse>("post", "/posts", formData);
};

/**
 * Fetches posts for the authenticated user.
 * @param params - Pagination parameters
 * @returns Array of posts
 */
export const getPosts = async (params: {
  page?: number;
  limit?: number;
}): Promise<PostsResponse> => {
  return makeApiRequest<PostsResponse>("get", "/posts", params);
};

/**
 * Fetches posts by a specific user.
 * @param userId - ID of the user whose posts to retrieve
 * @param params - Pagination parameters
 * @returns Array of user posts
 */
export const getUserPosts = async (
  userId: number,
  params: { page?: number; limit?: number }
): Promise<PostsResponse> => {
  return makeApiRequest<PostsResponse>(
    "get",
    `/profile/posts/${userId}`,
    params
  );
};

/**
 * Fetches saved posts for the authenticated user.
 * @param params - Pagination parameters
 * @returns Array of saved posts
 */
export const getSavedPosts = async (params: {
  page?: number;
  limit?: number;
}): Promise<PostsResponse> => {
  return makeApiRequest<PostsResponse>("get", "/profile/saved-posts", params);
};

/**
 * Fetches explore posts (unseen posts with images or videos from non-followed users).
 * @param params - Pagination parameters
 * @returns Array of explore posts
 */
export const getExplorePosts = async (params: {
  page?: number;
  limit?: number;
}): Promise<PostsResponse> => {
  return makeApiRequest<PostsResponse>("get", "/posts/explore", params);
};

/**
 * Fetches flicks (unseen video-only posts from followed and non-followed users).
 * @param params - Pagination parameters
 * @returns Array of flicks
 */
export const getFlicks = async (params: {
  page?: number;
  limit?: number;
}): Promise<PostsResponse> => {
  return makeApiRequest<PostsResponse>("get", "/posts/flicks", params);
};

/**
 * Fetches a single post by ID.
 * @param postId - ID of the post
 * @returns Post details
 */
export const getPostById = async (postId: number): Promise<PostResponse> => {
  return makeApiRequest<PostResponse>("get", `/posts/${postId}`);
};

/**
 * Updates a post's content.
 * @param postId - ID of the post
 * @param data - Updated post content
 * @returns Updated post
 */
export const updatePost = async (
  postId: number,
  data: UpdatePostRequest
): Promise<Post> => {
  return makeApiRequest<Post>("put", `/posts/${postId}`, data);
};

/**
 * Deletes a post.
 * @param postId - ID of the post
 * @returns Success response
 */
export const deletePost = async (
  postId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("delete", `/posts/${postId}`);
};

/**
 * Toggles like status on a post.
 * @param postId - ID of the post
 * @returns Success response with action
 */
export const likePost = async (
  postId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("post", `/posts/${postId}/like`);
};

/**
 * Adds a comment to a post.
 * @param postId - ID of the post
 * @param data - Comment content
 * @returns Created comment
 */
export const addComment = async (
  postId: number,
  data: AddCommentRequest
): Promise<Comment> => {
  return makeApiRequest<Comment>("post", `/posts/${postId}/comment`, data);
};

/**
 * Toggles like status on a comment.
 * @param commentId - ID of the comment
 * @returns Success response with action
 */
export const likeComment = async (
  commentId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "post",
    `/posts/comments/${commentId}/like`
  );
};

/**
 * Adds a reply to a comment.
 * @param commentId - ID of the parent comment
 * @param data - Reply content
 * @returns Created reply
 */
export const replyToComment = async (
  commentId: number,
  data: ReplyCommentRequest
): Promise<Comment> => {
  return makeApiRequest<Comment>(
    "post",
    `/posts/comments/${commentId}/reply`,
    data
  );
};

/**
 * Edits a comment.
 * @param commentId - ID of the comment
 * @param data - Updated comment content
 * @returns Updated comment
 */
export const editComment = async (
  commentId: number,
  data: AddCommentRequest
): Promise<Comment> => {
  return makeApiRequest<Comment>("patch", `/posts/comments/${commentId}`, data);
};

/**
 * Deletes a comment.
 * @param commentId - ID of the comment
 * @returns Success response
 */
export const deleteComment = async (
  commentId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "delete",
    `/posts/comments/${commentId}`
  );
};

/**
 * Toggles save status on a post.
 * @param postId - ID of the post
 * @returns Success response with action
 */
export const savePost = async (
  postId: number
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("post", `/posts/${postId}/save`);
};

/**
 * Reports a post.
 * @param postId - ID of the post
 * @param data - Report reason
 * @returns Report confirmation
 */
export const reportPost = async (
  postId: number,
  data: ReportPostRequest
): Promise<SimpleSuccessResponse & { reportId: number }> => {
  return makeApiRequest<SimpleSuccessResponse & { reportId: number }>(
    "post",
    `/posts/${postId}/report`,
    data
  );
};

/**
 * Shares a post with an optional caption.
 * @param postId - ID of the post to share
 * @param data - Optional caption for the shared post
 * @returns Success response
 */
export const sharePost = async (
  postId: number,
  data: SharePostRequest
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "post",
    `/posts/${postId}/share`,
    data
  );
};

/**
 * Fetches users who liked a specific post.
 * @param postId - ID of the post
 * @param params - Pagination parameters
 * @returns Array of users who liked the post
 */
export const getPostLikers = async (
  postId: number,
  params: { page?: number; limit?: number }
): Promise<UsersResponse> => {
  return makeApiRequest<UsersResponse>(
    "get",
    `/posts/${postId}/likers`,
    params
  );
};

/**
 * Fetches comments on a specific post.
 * @param postId - ID of the post
 * @param params - Pagination parameters
 * @returns Array of comments with user information
 */
export const getPostComments = async (
  postId: number,
  params: { page?: number; limit?: number }
): Promise<CommentsResponse> => {
  return makeApiRequest<CommentsResponse>(
    "get",
    `/posts/${postId}/commenters`,
    params
  );
};

/**
 * Fetches replies for a specific comment.
 * @param commentId - ID of the parent comment
 * @param params - Pagination parameters
 * @returns Array of replies
 */
export const getCommentReplies = async (
  commentId: number,
  params: { page?: number; limit?: number }
): Promise<RepliesResponse> => {
  return makeApiRequest<RepliesResponse>(
    "get",
    `/posts/comments/${commentId}/replies`,
    params
  );
};

export const recordBatchPostViews = async (
  data: BatchPostViewsRequest
): Promise<BatchPostViewsResponse> => {
  return makeApiRequest<BatchPostViewsResponse>(
    "post",
    "/posts/post-views/batch",
    data
  );
};
