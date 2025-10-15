export interface Profile {
  userId: number;
  username: string;
  profilePicture?: string | null;
  coverPicture?: string | null;
  bio?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  dateOfBirth?: string; // ISO date string
  isPrivate: boolean;
  role: string; // e.g., "USER", "ADMIN"
  createdAt: string;
  updatedAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  isFollowing: boolean;
  followStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
  hasUnViewedStories: boolean;
  hasActiveStories: boolean;
  hasAccess: boolean;
  profileName?: string | null;
  followers: FollowUser[]; // Added followers array
  following: FollowUser[]; // Added following array
  isMine: boolean;
  followedBy: {
    userId: number;
    username: string;
    profileName?: string | null;
    profilePicture?: string | null;
    isFollowed: boolean;
    latestInteraction?: string | null; // ISO date string
  }[];
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  bio?: string;
  address?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  isPrivate?: boolean;
  firstName?: string;
  lastName?: string;
  // Files are handled separately in FormData
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UpdatePrivacyRequest {
  isPrivate: boolean;
}

export interface FollowRequestItem {
  requestId: number;
  user: {
    userId: number;
    username: string;
    profilePicture?: string | null;
    bio?: string | null;
  };
  createdAt: string;
}

export interface FollowUser {
  userId: number;
  username: string;
  profileName?: string;
  profilePicture?: string | null;
  isPrivate: boolean;
  bio?: string | null;
  isFollowing: boolean;
}

export interface UserSuggestion {
  userId: number;
  username: string;
  profilePicture?: string | null;
  bio?: string | null;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface PendingFollowRequestsResponse {
  count: number;
  pendingRequests: FollowRequestItem[];
}

export interface FollowersResponse {
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  followers: FollowUser[];
}

export interface FollowingResponse {
  count: number;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  following: FollowUser[];
}

export interface UserSuggestionsResponse {
  count: number;
  suggestions: UserSuggestion[];
}

export interface SimpleSuccessResponse {
  message: string;
  profile?: Profile[];
  status?: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
}

export interface AcceptFollowResponse {
  message: string;
  acceptedFollowers: FollowUser[];
}
