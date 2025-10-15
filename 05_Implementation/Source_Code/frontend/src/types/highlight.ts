export interface HighlightViewer {
  userId: number;
  username: string;
  profileName?: string | null;
  profilePicture?: string | null;
  isFollowed: boolean;
  viewedAt: string; // ISO date string
  isLiked: boolean;
}

export interface HighlightStory {
  storyId: number;
  mediaUrl: string;
  createdAt: string; // ISO date string
  expiresAt: string; // ISO date string
  assignedAt: string; // ISO date string
  isMine: boolean;
  isViewed: boolean;
  viewCount?: number; // Only for isMine: true
  likeCount?: number; // Only for isMine: true
  latestViewers?: HighlightViewer[]; // Only for isMine: true
}

export interface Highlight {
  highlightId: number;
  title: string;
  coverImage: string;
  storyCount: number;
  isMine: boolean;
  stories: HighlightStory[];
}

export interface CreateHighlightRequest {
  title: string;
  storyIds: number[];
}

export interface UpdateHighlightRequest {
  title?: string;
  storyIds?: number[];
}

export interface SimpleSuccessResponse {
  success: boolean;
  message: string;
  deletedId?: number;
}

export interface HighlightResponse {
  highlight: Highlight;
}

export interface UserHighlightsResponse {
  highlights: Highlight[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}