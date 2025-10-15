/**
 * Types related to Stories APIs
 */

import { User } from "./post";

export interface Story {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  user?: User;
  isViewed: boolean;
  isLiked: boolean;
  isMine: boolean;
  likeCount?: number;
  viewCount?: number;
  latestViewers?: Array<{
    userId: number;
    username: string;
    profileName: string;
    profilePicture: string | null;
    isFollowed: boolean;
    viewedAt: string;
    isLiked: boolean;
  }>;
}

export interface CreateStoryRequest {
  media: File;
}

export interface StoryFeedItem {
  userId: number;
  username: string;
  profileName?: string;
  profilePicture?: string | null;
  hasUnviewedStories: boolean;
  stories: Story[];
}

export interface StoryViewsResponse {
  totalViews: number;
  views: Array<{
    user: {
      userId: number;
      username: string;
      profilePicture: string | null;
    };
    viewedAt: string;
  }>;
  totalLikes: number;
  likedBy: Array<{
    userId: number;
    username: string;
    profilePicture: string | null;
  }>;
}

export interface StoryViewersWithLikesResponse {
  totalViewers: number;
  viewers: Array<{
    userId: number;
    username: string;
    profileName: string;
    profilePicture: string | null;
    isFollowed: boolean;
    viewedAt: string;
    isLiked: boolean;
  }>;
  page: number;
  limit: number;
}

export type UserStoriesResponse = Story[];

export type StoryFeedResponse = StoryFeedItem[];

export interface SimpleSuccessResponse {
  success: boolean;
  message?: string;
  action?: "liked" | "unliked" | "viewed";
}

export interface StoryResponse {
  story: Story;
}

export interface ReportStoryRequest {
  reason: string;
}

export interface ReportStoryResponse {
  message: string;
  reportId: number;
}

export interface UserStoryItem {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
}

export interface PaginatedUserStoriesResponse {
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  stories: UserStoryItem[];
}
