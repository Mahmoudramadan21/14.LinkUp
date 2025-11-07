// types/message.ts

/**
 * Types related to Messaging APIs
 */

export interface User {
  UserID: number;
  Username: string;
  ProfilePicture?: string | null;
  LastActive?: string | null; // ISO date string
}

export interface LastMessage {
  id: string;
  content?: string | null;
  createdAt: string; // ISO date string
  senderId: number;
}

export interface Conversation {
  conversationId: string;
  lastMessage?: LastMessage | null;
  unreadCount: number;
  otherParticipant?: User | null;
  updatedAt: string; // ISO date string
}

export interface GetConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface StartConversationRequest {
  participantId: number;
}

export interface Participant {
  UserID: number;
  Username: string;
  ProfilePicture?: string | null;
}

export interface StartConversationResponse {
  conversationId: string;
  participants: Participant[];
}

export interface Sender {
  UserID: number;
  Username: string;
  ProfilePicture?: string | null;
}

export interface Attachment {
  Id: string;
  Url: string;
  Type: "IMAGE" | "VIDEO" | "AUDIO" | "FILE" | "VOICE";
  FileName?: string | null;
  FileSize?: number | null;
  Duration?: number | null;
  Thumbnail?: string | null;
  Metadata?: Record<string, unknown> | null;
}

export interface Reaction {
  Id: string;
  Emoji: string;
  User: User;
}

export interface Message {
  Id: string;
  LocalId?: string;        
  Content?: string | null;
  CreatedAt: string; // ISO date string
  UpdatedAt: string; // ISO date string
  DeletedAt: string;
  Sender: Sender;
  Status: "SENT" | "SENDING" | "DELIVERED" | "FAILED" | "READ";
  Attachments: Attachment[];
  Reactions: Reaction[];
  ReadBy: Array<{ UserID: number }>;
  ReplyTo?: {
    Id: string;
    Content: string;
    SenderId: number;
    IsDeleted: boolean;
  } | null;
  IsEdited: boolean;
  IsDeleted: boolean;
  Metadata?: Record<string, unknown> | null;
  storyReference: {
    storyId: number;
    userId: number;
    username: string;
    mediaUrl: string | null;
    expiresAt: string | null;
    isExpired: boolean;
  } | null;
}

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface SendMessageRequest {
  content?: string | null;
  replyToId?: string | null;
  // attachment handled as File in FormData
}

export interface ReplyToStoryRequest {
  storyId: number;
  content?: string | null;
}

export interface StoryPreview {
  StoryID: number;
  MediaURL: string;
  ExpiresAt: string; // ISO date string
}

export interface ReplyToStoryResponse {
  message: Message;
  conversationId: string;
  isNewConversation: boolean;
  storyPreview: StoryPreview;
}

export interface EditMessageRequest {
  content: string;
}

export interface SimpleSuccessResponse {
  success: boolean;
  message?: string;
}

// WebSocket Event Payloads
export interface NewMessageEvent extends Message {
  ConversationId: string;
}

export interface MessageEditedEvent {
  messageId: string;
  conversationId: string;
  content: string;
  editedAt: string; // ISO date string
}

export interface MessageDeletedEvent {
  conversationId: string;
  messageId: string;
}

export interface MessagesReadEvent {
  userId: number;
  conversationId: string;
}

export interface ConversationCreatedEvent {
  conversationId: string;
  participants: Participant[];
}

export interface ConversationsUpdatedEvent {
  conversations: Conversation[];
  total: number;
}

export interface NotificationNewEvent {
  type: string;
  message: string;
  data: Record<string, unknown>;
}

// === Search Conversations ===
export interface SearchConversationsRequest {
  q: string;
  page?: number;
  limit?: number;
}

export interface SearchConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  query: string;
}

export interface ConversationsSearchEvent {
  query: string;
  results: Conversation[];
  total: number;
  page: number;
  limit: number;
}

// === Typing Indicator ===
export interface TypingIndicator {
  userId: number;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

export interface TypingEvent {
  conversationId: string;
  userId: number;
  username: string;
  isTyping: boolean;
}