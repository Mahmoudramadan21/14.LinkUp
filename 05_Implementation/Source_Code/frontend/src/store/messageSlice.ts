// store/messageSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getConversations,
  searchConversations,
  startConversation,
  getMessages,
  sendMessage,
  replyToStory,
  editMessage,
  deleteMessage,
} from "@/services/messageService";
import {
  Conversation,
  GetConversationsResponse,
  SearchConversationsResponse,
  SearchConversationsRequest,
  ConversationsSearchEvent,
  StartConversationRequest,
  StartConversationResponse,
  GetMessagesResponse,
  SendMessageRequest,
  ReplyToStoryRequest,
  ReplyToStoryResponse,
  EditMessageRequest,
  SimpleSuccessResponse,
  NewMessageEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  MessagesReadEvent,
  ConversationCreatedEvent,
  ConversationsUpdatedEvent,
  Message,
  TypingEvent
} from "@/types/message";
import { AxiosError } from "axios";
import { RootState } from "@/store";

// === Helper Function ===
const calculateUnreadConversationsCount = (conversations: Conversation[]): number => {
  return conversations.filter(conv => conv.unreadCount > 0).length;
};

// Message state interface
interface MessageState {
  conversations: Conversation[];
  hasMoreConversations: boolean;
  conversationsPagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
  messagesByConversation: Record<
    string,
    {
      messages: Message[];
      hasMore: boolean;
    }
  >;
  search: {
    query: string;
    results: Conversation[];
    hasMore: boolean;
    pagination?: {
      page: number;
      limit: number;
      totalPages: number;
      totalCount: number;
    };
    loading: boolean;
    error: string | null;
  };
  typingIndicators: Record<
    string, // conversationId
    { userId: number; username: string; isTyping: boolean; timeoutId: NodeJS.Timeout | null }[]
  >;
  currentConversationId: string | null;
  loading: {
    getConversations: boolean;
    startConversation: boolean;
    getMessages: Record<string, boolean>;
    sendMessage: boolean;
    replyToStory: boolean;
    editMessage: Record<string, boolean>; // Per messageId
    deleteMessage: Record<string, boolean>; // Per messageId
  };
  error: {
    getConversations: string | null;
    startConversation: string | null;
    getMessages: Record<string, boolean | null | string>;
    sendMessage: string | null;
    replyToStory: string | null;
    editMessage: Record<string, string | null>;
    deleteMessage: Record<string, string | null>;
  };
  unreadConversationsCount: number;
}

// Initial state
const initialState: MessageState = {
  conversations: [],
  hasMoreConversations: true,
  messagesByConversation: {},
  search: {
    query: "",
    results: [],
    hasMore: true,
    pagination: undefined,
    loading: false,
    error: null,
  },
  typingIndicators: {},
  currentConversationId: null,
  loading: {
    getConversations: true,
    startConversation: false,
    getMessages: {},
    sendMessage: false,
    replyToStory: false,
    editMessage: {},
    deleteMessage: {},
  },
  error: {
    getConversations: null,
    startConversation: null,
    getMessages: {},
    sendMessage: null,
    replyToStory: null,
    editMessage: {},
    deleteMessage: {},
  },
  unreadConversationsCount: 0,
};

// Async thunks
export const getConversationsThunk = createAsyncThunk<
  GetConversationsResponse,
  { page?: number; limit?: number },
  { rejectValue: string }
>("message/getConversations", async (params, { rejectWithValue }) => {
  try {
    const response = await getConversations(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch conversations"
    );
  }
});

export const searchConversationsThunk = createAsyncThunk<
  SearchConversationsResponse,
  SearchConversationsRequest,
  { rejectValue: string }
>(
  "message/searchConversations",
  async (params, { rejectWithValue }) => {
    try {
      const response = await searchConversations(params);
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.error || "Failed to search conversations"
      );
    }
  }
);

export const startConversationThunk = createAsyncThunk<
  StartConversationResponse & { otherParticipant: { UserID: number; Username: string; ProfilePicture?: string | null } },
  StartConversationRequest,
  { rejectValue: string }
>("message/startConversation", async (data, { getState, rejectWithValue }) => {
  try {
    const response = await startConversation(data);
    const rootState = getState() as RootState;
    const currentUserId = rootState.auth.user?.userId;
    if (!currentUserId) {
      return rejectWithValue("No current user logged in");
    }
    const otherParticipant = response.participants.find(
      (p) => p.UserID !== currentUserId
    );
    if (!otherParticipant) {
      return rejectWithValue("Could not find other participant");
    }
    return { ...response, otherParticipant };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to start conversation"
    );
  }
});

export const getMessagesThunk = createAsyncThunk<
  GetMessagesResponse & { conversationId: string },
  { conversationId: string; params: { limit?: number; before?: string } },
  { rejectValue: string }
>(
  "message/getMessages",
  async ({ conversationId, params }, { rejectWithValue }) => {
    try {
      const response = await getMessages(conversationId, params);
      return { ...response, conversationId };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

export const sendMessageThunk = createAsyncThunk<
  Message & { conversationId: string },
  { conversationId: string; data: SendMessageRequest; attachment?: File },
  { rejectValue: string }
>("message/sendMessage", async ({ conversationId, data, attachment }, { rejectWithValue }) => {
  try {
    const response = await sendMessage(conversationId, data, attachment);
    return { ...response, conversationId };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to send message"
    );
  }
});

export const replyToStoryThunk = createAsyncThunk<
  ReplyToStoryResponse,
  ReplyToStoryRequest,
  { rejectValue: string }
>("message/replyToStory", async (data, { rejectWithValue }) => {
  try {
    const response = await replyToStory(data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to reply to story"
    );
  }
});

export const editMessageThunk = createAsyncThunk<
  SimpleSuccessResponse & { messageId: string; conversationId?: string },
  { messageId: string; data: EditMessageRequest },
  { rejectValue: string }
>("message/editMessage", async ({ messageId, data }, { rejectWithValue }) => {
  try {
    const response = await editMessage(messageId, data);
    return { ...response, messageId };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to edit message"
    );
  }
});


export const deleteMessageThunk = createAsyncThunk<
  SimpleSuccessResponse & { messageId: string, conversationId?: string },
  string,
  { rejectValue: string }
>("message/deleteMessage", async (messageId, { rejectWithValue }) => {
  try {
    const response = await deleteMessage(messageId);
    return { ...response, messageId };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to delete message"
    );
  }
});

const getAutoContent = (message: any) => {
  if (message.Content) return message.Content;

  if (message.Attachments && message.Attachments.length > 0) {
    const type = message.Attachments[0].Type;

    switch (type) {
      case "IMAGE":
        return "Image";
      case "VIDEO":
        return "Video";
      case "VOICE":
        return "Voice message";
      default:
        return "Attachment";
    }
  }

  return null;
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof MessageState["error"]>) => {
      const key = action.payload;
      if (key === "editMessage" || key === "deleteMessage" || key === "getMessages") {
          state.error[key] = {};
        } else {
          state.error[key] = null;
      }
    },
    clearSearch: (state) => {
      state.search = {
        query: "",
        results: [],
        hasMore: true,
        pagination: undefined,
        loading: false,
        error: null,
      };
    },
    clearMessageState: (state) => {
      state.conversations = [];
      state.hasMoreConversations = true;
      state.conversationsPagination = undefined;
      state.messagesByConversation = {};
      state.currentConversationId = null;
      state.unreadConversationsCount = 0;
    },
    setCurrentConversationId: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
    },
    receiveConversationsSearch: (state, action: PayloadAction<ConversationsSearchEvent>) => {
      const { query, results, total, page, limit } = action.payload;

      if (state.search.query !== query) return; // ignore if not current search

      state.search.results = page > 1
        ? [...state.search.results, ...results]
        : results;

      state.search.pagination = {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
      };
      state.search.hasMore = page < state.search.pagination.totalPages;
    },
    receiveTyping: (
      state,
      action: PayloadAction<TypingEvent>
    ) => {
      const { conversationId, userId, username, isTyping } = action.payload;
      const key = conversationId;

      if (!state.typingIndicators[key]) {
        state.typingIndicators[key] = [];
      }

      const existingIndex = state.typingIndicators[key].findIndex(u => u.userId === userId);

      if (isTyping) {
        if (existingIndex !== -1) {
          // Update existing user
          state.typingIndicators[key][existingIndex] = {
            userId,
            username,
            isTyping: true, // This is critical
            timeoutId: null,
          };
        } else {
          // Add new typing user
          state.typingIndicators[key].push({
            userId,
            username,
            isTyping: true,
            timeoutId: null,
          });
        }
      } else {
        // Remove user when isTyping: false
        if (existingIndex !== -1) {
          state.typingIndicators[key].splice(existingIndex, 1);
        }
      }
    },
    stopTypingDisplay: (
      state,
      action: PayloadAction<{ conversationId: string; userId: number }>
    ) => {
      const { conversationId, userId } = action.payload;
      const key = conversationId;
      if (state.typingIndicators[key]) {
        state.typingIndicators[key] = state.typingIndicators[key].filter(
          u => u.userId !== userId
        );
      }
    },
    // WebSocket reducers
    receiveNewMessage: (state, action: PayloadAction<NewMessageEvent & { currentUserId?: number }>) => {
      const message = action.payload;
      const conversationId = message.ConversationId;
      const currentUserId = message.currentUserId;

      // Add to messages if conversation loaded
      if (state.messagesByConversation[conversationId]) {
        const existingMessages = state.messagesByConversation[conversationId].messages;
        if (!existingMessages.some((m) => m.Id === message.Id)) {
          state.messagesByConversation[conversationId].messages = [
            ...existingMessages,
            message,
          ];
        }
      }

      // Update conversation list
      const convIndex = state.conversations.findIndex(
        (c) => c.conversationId === conversationId
      );
      if (convIndex !== -1) {
        const conv = state.conversations[convIndex];
        const oldUnreadCount = conv.unreadCount;

        conv.lastMessage = {
          id: message.Id,
          content: getAutoContent(message),
          createdAt: message.CreatedAt,
          senderId: message.Sender.UserID,
        };
        conv.updatedAt = message.CreatedAt;

        if (
          currentUserId &&
          message.Sender.UserID !== currentUserId &&
          state.currentConversationId !== conversationId
        ) {
          conv.unreadCount += 1;
        }

        // Update total unread conversations count
        if (oldUnreadCount === 0 && conv.unreadCount > 0) {
          state.unreadConversationsCount += 1;
        }

        // Move to top
        state.conversations.splice(convIndex, 1);
        state.conversations.unshift(conv);
      }
    },
    receiveMessageEdited: (state, action: PayloadAction<MessageEditedEvent>) => {
      const { messageId, conversationId, content, editedAt } = action.payload;

      const convData = state.messagesByConversation[conversationId];
      if (convData) {
        const msgIndex = convData.messages.findIndex((m) => m.Id === messageId);
        if (msgIndex !== -1) {
          convData.messages[msgIndex] = {
            ...convData.messages[msgIndex],
            Content: content,
            IsEdited: true,
            UpdatedAt: editedAt,
          };
        }
      }

      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      if (conv?.lastMessage?.id === messageId) {
        conv.lastMessage.content = content;
        conv.updatedAt = editedAt;
      }
    },
    receiveMessageDeleted: (state, action: PayloadAction<MessageDeletedEvent>) => {
      const { messageId, conversationId } = action.payload;

      const convData = state.messagesByConversation[conversationId];
      if (convData) {
        const msgIndex = convData.messages.findIndex((m) => m.Id === messageId);
        if (msgIndex !== -1) {
          convData.messages[msgIndex] = {
            ...convData.messages[msgIndex],
            IsDeleted: true,
            Content: "Message deleted",
          };
        }
      }

      const conv = state.conversations.find((c) => c.conversationId === conversationId);
      if (conv?.lastMessage?.id === messageId) {
        conv.lastMessage.content = "Message deleted";
      }
    },
    receiveMessagesRead: (state, action: PayloadAction<MessagesReadEvent>) => {
      const { userId, conversationId } = action.payload;

      if (state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId].messages = state.messagesByConversation[
          conversationId
        ].messages.map((m) => {
          if (m.Sender.UserID !== userId && m.Status !== "READ") {
            return { ...m, Status: "READ", ReadBy: [...m.ReadBy, { UserID: userId }] };
          }
          return m;
        });
      }

      // Reset unreadCount for conversation
      const conv = state.conversations.find(
        (c) => c.conversationId === conversationId
      );
      if (conv && conv.unreadCount > 0) {
        state.unreadConversationsCount -= 1;
        conv.unreadCount = 0;
      }
    },
    receiveConversationCreated: (state, action: PayloadAction<ConversationCreatedEvent  & { currentUserId?: number }>) => {
      const { conversationId, participants, currentUserId } = action.payload;

      // Add new conversation if not exists
      if (!state.conversations.some((c) => c.conversationId === conversationId)) {
        const otherParticipant = participants.find(
          (p) => p.UserID !== currentUserId
        );
        state.conversations.unshift({
          conversationId,
          lastMessage: null,
          unreadCount: 0,
          otherParticipant: otherParticipant
            ? {
                UserID: otherParticipant.UserID,
                Username: otherParticipant.Username,
                ProfilePicture: otherParticipant.ProfilePicture,
              }
            : null,
          updatedAt: new Date().toISOString(),
        });
        state.unreadConversationsCount = calculateUnreadConversationsCount(state.conversations);
        if (state.conversationsPagination) {
          state.conversationsPagination.totalCount += 1;
        }
      }
    },
    receiveConversationsUpdated: (state, action: PayloadAction<ConversationsUpdatedEvent>) => {
      state.conversations = action.payload.conversations;
      state.unreadConversationsCount = calculateUnreadConversationsCount(state.conversations);

      state.conversationsPagination = {
        page: 1,
        limit: action.payload.conversations.length,
        totalPages: Math.ceil(action.payload.total / action.payload.conversations.length),
        totalCount: action.payload.total,
      };

      state.hasMoreConversations = state.conversations.length < action.payload.total;
    },
  
    addOptimisticMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;

      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = { messages: [], hasMore: false };
      }
      state.messagesByConversation[conversationId].messages.push(message);
    },

    replaceOptimisticMessage: (state, action: PayloadAction<{ conversationId: string; localId: string; realMessage: Message }>) => {
      const { conversationId, localId, realMessage } = action.payload;
      const conv = state.messagesByConversation[conversationId];
      if (!conv) return;

      const index = conv.messages.findIndex(m => m.LocalId === localId || m.Id === localId);
      if (index !== -1) {
        conv.messages[index] = {
          ...realMessage,
          LocalId: localId,
          Status: "SENT"
        };
      }
    },

    markMessageAsFailed: (state, action: PayloadAction<{ conversationId: string; localId: string }>) => {
      const { conversationId, localId } = action.payload;
      const conv = state.messagesByConversation[conversationId];
      if (!conv) return;

      const msg = conv.messages.find(m => m.LocalId === localId || m.Id === localId);
      if (msg) {
        msg.Status = "FAILED";
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Conversations
      .addCase(getConversationsThunk.pending, (state) => {
        state.loading.getConversations = true;
        state.error.getConversations = null;
      })
      .addCase(
        getConversationsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            GetConversationsResponse,
            string,
            { arg: { page?: number; limit?: number } }
          >
        ) => {
          state.loading.getConversations = false;
          const { page = 1 } = action.meta.arg;

          const existingConvIds = new Set(
            state.conversations.map((c) => c.conversationId)
          );
          const newConvs = action.payload.conversations.filter(
            (c) => !existingConvIds.has(c.conversationId)
          );

          state.conversations =
            page > 1
              ? [...state.conversations, ...newConvs]
              : action.payload.conversations;

          state.conversationsPagination = {
            page: action.payload.page,
            limit: action.payload.limit,
            totalPages: Math.ceil(action.payload.total / action.payload.limit),
            totalCount: action.payload.total,
          };
          state.unreadConversationsCount = calculateUnreadConversationsCount(
            state.conversations
          );
          state.hasMoreConversations =
            action.payload.page < state.conversationsPagination.totalPages;
        }
      )
      .addCase(
        getConversationsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getConversations = false;
          state.error.getConversations =
            action.payload ?? "Failed to fetch conversations";
        }
      )
      // Search Conversations
      .addCase(searchConversationsThunk.pending, (state, action) => {
        state.search.loading = true;
        state.search.error = null;
        state.search.query = action.meta.arg.q;
      })
      .addCase(searchConversationsThunk.fulfilled, (state, action) => {
        state.search.loading = false;
        const { page = 1, limit = 15 } = action.meta.arg;

        const existingIds = new Set(
          state.search.results.map((c) => c.conversationId)
        );
        const newResults = action.payload.conversations.filter(
          (c) => !existingIds.has(c.conversationId)
        );

        state.search.results =
          page > 1
            ? [...state.search.results, ...newResults]
            : action.payload.conversations;

        state.search.pagination = {
          page: action.payload.page,
          limit: action.payload.limit || limit,
          totalPages: Math.ceil(action.payload.total / action.payload.limit),
          totalCount: action.payload.total,
        };
        state.search.hasMore =
          action.payload.page < state.search.pagination.totalPages;
      })
      .addCase(searchConversationsThunk.rejected, (state, action) => {
        state.search.loading = false;
        state.search.error = action.payload ?? "Failed to search";
      })
      // Start Conversation
      .addCase(startConversationThunk.pending, (state) => {
        state.loading.startConversation = true;
        state.error.startConversation = null;
      })
      .addCase(
        startConversationThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            StartConversationResponse & {
              otherParticipant: {
                UserID: number;
                Username: string;
                ProfilePicture?: string | null;
              };
            }
          >
        ) => {
          state.loading.startConversation = false;
          // Add or update conversation
          const convIndex = state.conversations.findIndex(
            (c) => c.conversationId === action.payload.conversationId
          );
          if (convIndex === -1) {
            // const currentUserId = (state as any).auth.user?.userId;
            // const otherParticipant = action.payload.participants.find(
            //   (p) => p.UserID !== currentUserId
            // );
            state.conversations.unshift({
              conversationId: action.payload.conversationId,
              lastMessage: null,
              unreadCount: 0,
              otherParticipant: {
                UserID: action.payload.otherParticipant.UserID,
                Username: action.payload.otherParticipant.Username,
                ProfilePicture: action.payload.otherParticipant.ProfilePicture,
              },
              updatedAt: new Date().toISOString(),
            });
            state.unreadConversationsCount = calculateUnreadConversationsCount(
              state.conversations
            );
            if (state.conversationsPagination) {
              state.conversationsPagination.totalCount += 1;
            }
          }
          state.currentConversationId = action.payload.conversationId;
        }
      )
      .addCase(
        startConversationThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.startConversation = false;
          state.error.startConversation =
            action.payload ?? "Failed to start conversation";
        }
      )
      // Get Messages
      .addCase(getMessagesThunk.pending, (state, action) => {
        const conversationId = action.meta.arg.conversationId;
        state.loading.getMessages[conversationId] = true;
        state.error.getMessages[conversationId] = null;
      })
      .addCase(
        getMessagesThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            GetMessagesResponse & { conversationId: string },
            string,
            { arg: { conversationId: string } }
          >
        ) => {
          const { conversationId } = action.payload;
          state.loading.getMessages[conversationId] = false;

          if (!state.messagesByConversation[conversationId]) {
            state.messagesByConversation[conversationId] = {
              messages: [],
              hasMore: true,
            };
          }

          const existingMsgIds = new Set(
            state.messagesByConversation[conversationId].messages.map(
              (m) => m.Id
            )
          );
          const newMessages = action.payload.messages.filter(
            (m) => !existingMsgIds.has(m.Id)
          );

          state.messagesByConversation[conversationId].messages = [
            ...state.messagesByConversation[conversationId].messages,
            ...newMessages,
          ];
          state.messagesByConversation[conversationId].hasMore =
            action.payload.hasMore;
        }
      )
      .addCase(
        getMessagesThunk.rejected,
        (
          state,
          action: PayloadAction<
            string | undefined,
            string,
            { arg: { conversationId: string } }
          >
        ) => {
          const conversationId = action.meta.arg.conversationId;
          state.loading.getMessages[conversationId] = false;
          state.error.getMessages[conversationId] =
            action.payload ?? "Failed to fetch messages";
        }
      )
      // Send Message
      .addCase(sendMessageThunk.pending, (state) => {
        state.loading.sendMessage = true;
        state.error.sendMessage = null;
      })
      .addCase(
        sendMessageThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            Message & { conversationId: string },
            string,
            {
              arg: {
                conversationId: string;
                data: SendMessageRequest;
                attachment?: File;
              };
            }
          >
        ) => {
          state.loading.sendMessage = false;

          const realMessage = action.payload;
          const conversationId = realMessage.conversationId;

          const convData = state.messagesByConversation[conversationId];
          if (convData) {
            let replaced = false;
            if (realMessage.LocalId) {
              const optimisticIndex = convData.messages.findIndex(
                (m) => m.LocalId === realMessage.LocalId
              );
              if (optimisticIndex !== -1) {
                convData.messages[optimisticIndex] = {
                  ...realMessage,
                  Status: "SENT" as const,
                };
                replaced = true;
              }
            }

            if (!replaced) {
              const lastMessage =
                convData.messages[convData.messages.length - 1];
              if (
                lastMessage &&
                (lastMessage.Status === "SENDING" ||
                  !lastMessage.Id ||
                  lastMessage.Id.toString().startsWith("local_"))
              ) {
                convData.messages[convData.messages.length - 1] = {
                  ...realMessage,
                  Status: "SENT" as const,
                };
                replaced = true;
              }
            }

            if (!replaced) {
              const exists = convData.messages.some(
                (m) => m.Id === realMessage.Id
              );
              if (!exists) {
                convData.messages.push({
                  ...realMessage,
                  Status: "SENT" as const,
                });
              }
            }
          }
        }
      )
      .addCase(
        sendMessageThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.sendMessage = false;
          state.error.sendMessage = action.payload ?? "Failed to send message";
        }
      )
      // Reply to Story
      .addCase(replyToStoryThunk.pending, (state) => {
        state.loading.replyToStory = true;
        state.error.replyToStory = null;
      })
      .addCase(
        replyToStoryThunk.fulfilled,
        (state, action: PayloadAction<ReplyToStoryResponse>) => {
          state.loading.replyToStory = false;
          const { conversationId, message, isNewConversation } = action.payload;
          const convData = state.messagesByConversation[conversationId];
          if (convData) {
            const optimisticIndex = convData.messages.findIndex(
              (m) => m.Status === "SENT" && m.LocalId === message.LocalId
            );
            if (optimisticIndex !== -1) {
              convData.messages[optimisticIndex] = message;
            }
          }
          if (state.messagesByConversation[conversationId]) {
            state.messagesByConversation[conversationId].messages.push(message);
          } else {
            state.messagesByConversation[conversationId] = {
              messages: [message],
              hasMore: false,
            };
          }
          // Update or add conversation
          const convIndex = state.conversations.findIndex(
            (c) => c.conversationId === conversationId
          );
          const lastMessage = {
            id: message.Id,
            content: getAutoContent(message),
            createdAt: message.CreatedAt,
            senderId: message.Sender.UserID,
          };
          if (convIndex !== -1) {
            const conv = state.conversations[convIndex];
            conv.lastMessage = lastMessage;
            conv.updatedAt = message.CreatedAt;
            state.conversations.splice(convIndex, 1);
            state.conversations.unshift(conv);
          } else if (isNewConversation) {
            // Add new conv
            const otherParticipant = action.payload.storyPreview
              ? { UserID: 0, Username: "", ProfilePicture: null } // Fetch if needed
              : null; // Adjust based on response
            state.conversations.unshift({
              conversationId,
              lastMessage,
              unreadCount: 0,
              otherParticipant,
              updatedAt: message.CreatedAt,
            });
            state.unreadConversationsCount = calculateUnreadConversationsCount(
              state.conversations
            );
            if (state.conversationsPagination) {
              state.conversationsPagination.totalCount += 1;
            }
          }
        }
      )
      .addCase(
        replyToStoryThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.replyToStory = false;
          state.error.replyToStory =
            action.payload ?? "Failed to reply to story";
        }
      )
      // Edit Message
      .addCase(editMessageThunk.pending, (state, action) => {
        const messageId = action.meta.arg.messageId;
        state.loading.editMessage[messageId] = true;
        state.error.editMessage[messageId] = null;
      })
      .addCase(
        editMessageThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SimpleSuccessResponse & {
              messageId: string;
              conversationId?: string;
            },
            string,
            { arg: { messageId: string; data: EditMessageRequest } }
          >
        ) => {
          const { messageId, conversationId } = action.payload;
          const { content } = action.meta.arg.data;
          const editedAt = new Date().toISOString();

          state.loading.editMessage[messageId] = false;

          if (!conversationId) return;

          const convData = state.messagesByConversation[conversationId];
          if (convData) {
            const msgIndex = convData.messages.findIndex(
              (m) => m.Id === messageId
            );
            if (msgIndex !== -1) {
              convData.messages[msgIndex] = {
                ...convData.messages[msgIndex],
                Content: getAutoContent(content),
                IsEdited: true,
                UpdatedAt: editedAt,
              };
            }
          }

          const conv = state.conversations.find(
            (c) => c.conversationId === conversationId
          );
          if (conv?.lastMessage?.id === messageId) {
            conv.lastMessage.content = content;
            conv.updatedAt = editedAt;
          }
        }
      )
      .addCase(
        editMessageThunk.rejected,
        (
          state,
          action: PayloadAction<
            string | undefined,
            string,
            { arg: { messageId: string; data: EditMessageRequest } }
          >
        ) => {
          const messageId = action.meta.arg.messageId;
          state.loading.editMessage[messageId] = false;
          state.error.editMessage[messageId] =
            action.payload ?? "Failed to edit message";
        }
      )
      // Delete Message
      .addCase(deleteMessageThunk.pending, (state, action) => {
        const messageId = action.meta.arg;
        state.loading.deleteMessage[messageId] = true;
        state.error.deleteMessage[messageId] = null;
      })
      .addCase(
        deleteMessageThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SimpleSuccessResponse & {
              messageId: string;
              conversationId?: string;
            },
            string,
            { arg: string }
          >
        ) => {
          const { messageId, conversationId } = action.payload;
          const deletedAt = new Date().toISOString();

          state.loading.deleteMessage[messageId] = false;

          if (!conversationId) return;

          const convData = state.messagesByConversation[conversationId];
          if (convData) {
            const msgIndex = convData.messages.findIndex(
              (m) => m.Id === messageId
            );
            if (msgIndex !== -1) {
              convData.messages[msgIndex] = {
                ...convData.messages[msgIndex],
                IsDeleted: true,
                Content: "Message deleted",
                DeletedAt: deletedAt,
              };
            }
          }

          const conv = state.conversations.find(
            (c) => c.conversationId === conversationId
          );
          if (conv?.lastMessage?.id === messageId) {
            conv.lastMessage.content = "Message deleted";
            conv.updatedAt = deletedAt;
          }
        }
      )
      .addCase(
        deleteMessageThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: string }>
        ) => {
          const messageId = action.meta.arg;
          state.loading.deleteMessage[messageId] = false;
          state.error.deleteMessage[messageId] =
            action.payload ?? "Failed to delete message";
        }
      );
  },
});

export const {
  clearError,
  clearSearch,
  clearMessageState,
  setCurrentConversationId,
  receiveConversationsSearch,
  receiveTyping,
  stopTypingDisplay,
  receiveNewMessage,
  receiveMessageEdited,
  receiveMessageDeleted,
  receiveMessagesRead,
  receiveConversationCreated,
  receiveConversationsUpdated,
  addOptimisticMessage,
  replaceOptimisticMessage,
  markMessageAsFailed,
} = messageSlice.actions;

export default messageSlice.reducer;