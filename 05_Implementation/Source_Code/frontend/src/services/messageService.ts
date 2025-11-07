// services/messageService.ts

import api from "./api";
import {
  Message,
  GetConversationsResponse,
  SearchConversationsRequest,
  SearchConversationsResponse,
  StartConversationRequest,
  StartConversationResponse,
  GetMessagesResponse,
  SendMessageRequest,
  ReplyToStoryRequest,
  ReplyToStoryResponse,
  EditMessageRequest,
  SimpleSuccessResponse,
} from "@/types/message";
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
    } else if (method === "post" || method === "put" || method === "patch") {
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
 * Fetches paginated list of user's conversations.
 * @param params - Pagination parameters
 * @returns Conversations response
 */
export const getConversations = async (params: {
  page?: number;
  limit?: number;
}): Promise<GetConversationsResponse> => {
  return makeApiRequest<GetConversationsResponse>("get", "/messages/conversations", params);
};

/**
 * Search user's conversations by participant name/username
 * @param params - Search query and pagination
 * @returns Search results
 */
export const searchConversations = async (
  params: SearchConversationsRequest
): Promise<SearchConversationsResponse> => {
  return makeApiRequest<SearchConversationsResponse>(
    "get",
    "/messages/conversations/search",
    params
  );
};

/**
 * Starts a new conversation or returns existing one.
 * @param data - Participant ID
 * @returns Conversation response
 */
export const startConversation = async (
  data: StartConversationRequest
): Promise<StartConversationResponse> => {
  return makeApiRequest<StartConversationResponse>("post", "/messages/start", data);
};

/**
 * Fetches messages in a conversation with infinite scroll.
 * @param conversationId - ID of the conversation
 * @param params - Pagination parameters (limit, before)
 * @returns Messages response
 */
export const getMessages = async (
  conversationId: string,
  params: { limit?: number; before?: string }
): Promise<GetMessagesResponse> => {
  return makeApiRequest<GetMessagesResponse>(
    "get",
    `/messages/conversations/${conversationId}/messages`,
    params
  );
};

/**
 * Sends a new message with optional attachment.
 * @param conversationId - ID of the conversation
 * @param data - Message content and replyToId
 * @param attachment - Optional file attachment
 * @returns Sent message
 */
export const sendMessage = async (
  conversationId: string,
  data: SendMessageRequest,
  attachment?: File
): Promise<Message> => {
  const formData = new FormData();
  if (data.content) formData.append("content", data.content);
  if (data.replyToId) formData.append("replyToId", data.replyToId);
  if (attachment) formData.append("attachment", attachment);
  return makeApiRequest<Message>(
    "post",
    `/messages/conversations/${conversationId}/messages`,
    formData
  );
};

/**
 * Replies to a story, creating conversation if needed.
 * @param data - Story ID and optional content
 * @returns Reply response
 */
export const replyToStory = async (
  data: ReplyToStoryRequest
): Promise<ReplyToStoryResponse> => {
  return makeApiRequest<ReplyToStoryResponse>("post", "/messages/reply-story", data);
};

/**
 * Edits a message content.
 * @param messageId - ID of the message
 * @param data - New content
 * @returns Success response
 */
export const editMessage = async (
  messageId: string,
  data: EditMessageRequest
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("patch", `/messages/${messageId}/update`, data);
};

/**
 * Deletes a message (soft delete).
 * @param messageId - ID of the message
 * @returns Success response
 */
export const deleteMessage = async (
  messageId: string
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("delete", `/messages/${messageId}/delete`);
};