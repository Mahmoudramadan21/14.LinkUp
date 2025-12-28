import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getProfileByUsername,
  updateProfile,
  changePassword,
  updatePrivacySettings,
  deleteProfile,
  followUser,
  unfollowUser,
  removeFollower,
  getPendingFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  getUserSuggestions,
} from "@/services/profileService";
import { search } from "@/services/searchService";
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
  Profile,
} from "@/types/profile";
import { SearchResponse, SearchUser } from "@/types/search";
import { AxiosError } from "axios";
import { updateUserFollowStatus } from "./postSlice";

// Profile state interface (Added search-related fields)
interface ProfileState {
  profiles: Record<
    string,
    Profile & {
      followersPagination?: {
        page: number;
        limit: number;
        totalPages: number;
        totalCount: number;
      };
      followingPagination?: {
        page: number;
        limit: number;
        totalPages: number;
        totalCount: number;
      };
    }
  >;
  currentProfileUsername: string | null;
  suggestions: UserSuggestionsResponse["suggestions"];
  pendingRequests: PendingFollowRequestsResponse["pendingRequests"];
  hasMoreFollowers: Record<string, boolean>;
  hasMoreFollowing: Record<string, boolean>;
  searchResults: SearchUser[];
  searchPagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalUsers: number;
  };
  hasMoreSearch: boolean;
  currentSearchQuery: string | null;
  loading: {
    getProfile: boolean;
    updateProfile: boolean;
    changePassword: boolean;
    updatePrivacy: boolean;
    deleteProfile: boolean;
    followUser: Record<number, boolean>;
    unfollowUser: Record<number, boolean>;
    removeFollower: Record<number, boolean>;
    getPendingRequests: boolean;
    acceptRequest: Record<number, boolean>;
    rejectRequest: Record<number, boolean>;
    getFollowers: boolean;
    getFollowing: boolean;
    getSuggestions: boolean;
    searchUsers: boolean;
  };
  error: {
    getProfile: string | null;
    updateProfile: string | null;
    changePassword: string | null;
    updatePrivacy: string | null;
    deleteProfile: string | null;
    followUser: Record<number, string | null>;
    unfollowUser: Record<number, string | null>;
    removeFollower: Record<number, string | null>;
    getPendingRequests: string | null;
    acceptRequest: Record<number, string | null>;
    rejectRequest: Record<number, string | null>;
    getFollowers: string | null;
    getFollowing: string | null;
    getSuggestions: string | null;
    searchUsers: string | null;
  };
}

// Initial state (Added search fields)
const initialState: ProfileState = {
  profiles: {},
  currentProfileUsername: null,
  suggestions: [],
  pendingRequests: [],
  hasMoreFollowers: {},
  hasMoreFollowing: {},
  searchResults: [],
  hasMoreSearch: false, 
  currentSearchQuery: null, 
  loading: {
    getProfile: true,
    updateProfile: false,
    changePassword: false,
    updatePrivacy: false,
    deleteProfile: false,
    followUser: {},
    unfollowUser: {},
    removeFollower: {},
    getPendingRequests: true,
    acceptRequest: {},
    rejectRequest: {},
    getFollowers: true,
    getFollowing: true,
    getSuggestions: true,
    searchUsers: true, 
  },
  error: {
    getProfile: null,
    updateProfile: null,
    changePassword: null,
    updatePrivacy: null,
    deleteProfile: null,
    followUser: {},
    unfollowUser: {},
    removeFollower: {},
    getPendingRequests: null,
    acceptRequest: {},
    rejectRequest: {},
    getFollowers: null,
    getFollowing: null,
    getSuggestions: null,
    searchUsers: null,
  },
};

// Async thunks (Added searchUsersThunk)
export const searchUsersThunk = createAsyncThunk<
  SearchResponse,
  { query: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  "profile/searchUsers",
  async ({ query, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await search({ query, type: "USERS", page, limit });
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to search users"
      );
    }
  }
);

// Async thunks
export const getProfileByUsernameThunk = createAsyncThunk<
  ProfileResponse,
  string,
  { rejectValue: string }
>("profile/getProfileByUsername", async (username, { rejectWithValue }) => {
  try {
    const response = await getProfileByUsername(username);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch profile"
    );
  }
});

export const updateProfileThunk = createAsyncThunk<
  SimpleSuccessResponse,
  { data: UpdateProfileRequest; profilePicture?: File; coverPicture?: File },
  { rejectValue: string }
>(
  "profile/updateProfile",
  async ({ data, profilePicture, coverPicture }, { rejectWithValue }) => {
    try {
      const response = await updateProfile(data, profilePicture, coverPicture);
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to update profile"
      );
    }
  }
);

export const changePasswordThunk = createAsyncThunk<
  SimpleSuccessResponse,
  ChangePasswordRequest,
  { rejectValue: string }
>("profile/changePassword", async (data, { rejectWithValue }) => {
  try {
    const response = await changePassword(data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to change password"
    );
  }
});

export const updatePrivacySettingsThunk = createAsyncThunk<
  SimpleSuccessResponse,
  UpdatePrivacyRequest,
  { rejectValue: string }
>("profile/updatePrivacySettings", async (data, { rejectWithValue }) => {
  try {
    const response = await updatePrivacySettings(data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to update privacy settings"
    );
  }
});

export const deleteProfileThunk = createAsyncThunk<
  SimpleSuccessResponse,
  void,
  { rejectValue: string }
>("profile/deleteProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await deleteProfile();
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to delete profile"
    );
  }
});

export const followUserThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("profile/followUser", async (userId, { rejectWithValue, dispatch }) => {
  try {
    const response = await followUser(userId);

    const status = response.status || "ACCEPTED";
    const isFollowedValue: boolean | "pending" =
      status === "PENDING" ? "pending" : true;

    dispatch(updateUserFollowStatus({ userId, isFollowed: isFollowedValue }));

    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    dispatch(updateUserFollowStatus({ userId, isFollowed: false }));
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to follow user"
    );
  }
});

export const unfollowUserThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("profile/unfollowUser", async (userId, { rejectWithValue, dispatch }) => {
  try {
    const response = await unfollowUser(userId);
    dispatch(updateUserFollowStatus({ userId, isFollowed: false }));
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    dispatch(updateUserFollowStatus({ userId, isFollowed: true }));
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to unfollow user"
    );
  }
});

export const removeFollowerThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("profile/removeFollower", async (followerId, { rejectWithValue }) => {
  try {
    const response = await removeFollower(followerId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to remove follower"
    );
  }
});

export const getPendingFollowRequestsThunk = createAsyncThunk<
  PendingFollowRequestsResponse,
  void,
  { rejectValue: string }
>("profile/getPendingFollowRequests", async (_, { rejectWithValue }) => {
  try {
    const response = await getPendingFollowRequests();
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch pending requests"
    );
  }
});

export const acceptFollowRequestThunk = createAsyncThunk<
  AcceptFollowResponse,
  number,
  { rejectValue: string }
>("profile/acceptFollowRequest", async (requestId, { rejectWithValue }) => {
  try {
    const response = await acceptFollowRequest(requestId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to accept follow request"
    );
  }
});

export const rejectFollowRequestThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("profile/rejectFollowRequest", async (requestId, { rejectWithValue }) => {
  try {
    const response = await rejectFollowRequest(requestId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to reject follow request"
    );
  }
});

export const getFollowersThunk = createAsyncThunk<
  FollowersResponse,
  { username: string; params: { page?: number; limit?: number } },
  { rejectValue: string }
>("profile/getFollowers", async ({ username, params }, { rejectWithValue }) => {
  try {
    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length === 0
    ) {
      throw new Error("Invalid username");
    }
    const response = await getFollowers(username, params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch followers"
    );
  }
});

export const getFollowingThunk = createAsyncThunk<
  FollowingResponse,
  { username: string; params: { page?: number; limit?: number } },
  { rejectValue: string }
>("profile/getFollowing", async ({ username, params }, { rejectWithValue }) => {
  try {
    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length === 0
    ) {
      throw new Error("Invalid username");
    }
    const response = await getFollowing(username, params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch following"
    );
  }
});

export const getUserSuggestionsThunk = createAsyncThunk<
  UserSuggestionsResponse,
  { limit?: number },
  { rejectValue: string }
>("profile/getUserSuggestions", async ({ limit }, { rejectWithValue }) => {
  try {
    const response = await getUserSuggestions(limit);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch user suggestions"
    );
  }
});

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof ProfileState["error"]>) => {
      if (
        action.payload === "followUser" ||
        action.payload === "unfollowUser" ||
        action.payload === "removeFollower" ||
        action.payload === "acceptRequest" ||
        action.payload === "rejectRequest"
      ) {
        state.error[action.payload] = {} as Record<number, string | null>;
      } else {
        state.error[action.payload] = null as string | null;
      }
    },
    clearProfileState: (state) => {
      // ... (Existing code)
      state.searchResults = []; // Added: Clear search
      state.currentSearchQuery = null;
      state.hasMoreSearch = false;
    },
    clearSearchResults: (state) => {
      // Added: Reducer to clear search
      state.searchResults = [];
      state.currentSearchQuery = null;
      state.hasMoreSearch = false;
      state.searchPagination = undefined;
    },
    setCurrentProfileUsername: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.currentProfileUsername = action.payload;
    },
    setCurrentSearchQuery: (state, action: PayloadAction<string | null>) => {
      // Added: Optional reducer
      state.currentSearchQuery = action.payload;
    },
    updateHasUnviewedStories: (
      state,
      action: PayloadAction<{ username: string; hasUnviewedStories: boolean }>
    ) => {
      const { username, hasUnviewedStories } = action.payload;
      if (state.profiles[username]) {
        state.profiles[username].hasUnViewedStories = hasUnviewedStories;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Profile By Username
      .addCase(getProfileByUsernameThunk.pending, (state) => {
        state.loading.getProfile = true;
        state.error.getProfile = null;
      })
      // Search Users (Added)
      .addCase(searchUsersThunk.pending, (state) => {
        state.loading.searchUsers = true;
        state.error.searchUsers = null;
      })
      .addCase(
        searchUsersThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SearchResponse,
            string,
            { arg: { query: string; page?: number; limit?: number } }
          >
        ) => {
          state.loading.searchUsers = false;
          const { query, page = 1 } = action.meta.arg;
          state.currentSearchQuery = query;

          // Avoid duplicates using Set
          const existingUserIds = new Set(
            state.searchResults.map((u) => u.userId)
          );
          const newUsers = action.payload.users.filter(
            (u) => !existingUserIds.has(u.userId)
          );

          // Append or replace
          state.searchResults =
            page > 1
              ? [...state.searchResults, ...newUsers]
              : action.payload.users;

          // Update pagination (Assuming backend returns totalUsers, totalPages)
          // If not, add to backend as suggested before
          state.searchPagination = {
            page,
            limit: action.meta.arg.limit || 10,
            totalPages:
              (action.payload as any).totalPages ||
              Math.ceil(
                (action.payload as any).totalUsers /
                  (action.meta.arg.limit || 10)
              ),
            totalUsers:
              (action.payload as any).totalUsers || action.payload.users.length,
          };
          state.hasMoreSearch = page < (state.searchPagination.totalPages || 1);
        }
      )
      .addCase(
        searchUsersThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.searchUsers = false;
          state.error.searchUsers = action.payload ?? "Failed to search users";
        }
      )
      .addCase(
        getProfileByUsernameThunk.fulfilled,
        (state, action: PayloadAction<ProfileResponse>) => {
          state.loading.getProfile = false;
          const profile = {
            ...action.payload.profile,
            followers: [],
            following: [],
            followersPagination: undefined,
            followingPagination: undefined,
          };
          state.profiles[action.payload.profile.username] = profile;
          state.currentProfileUsername = action.payload.profile.username;
          state.hasMoreFollowers[action.payload.profile.username] = true;
          state.hasMoreFollowing[action.payload.profile.username] = true;
        }
      )
      .addCase(
        getProfileByUsernameThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getProfile = false;
          state.error.getProfile = action.payload ?? "Failed to fetch profile";
        }
      )
      // Update Profile
      .addCase(updateProfileThunk.pending, (state) => {
        state.loading.updateProfile = true;
        state.error.updateProfile = null;
      })
      .addCase(
        updateProfileThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SimpleSuccessResponse,
            string,
            {
              arg: {
                data: UpdateProfileRequest;
                profilePicture?: File;
                coverPicture?: File;
              };
            }
          >
        ) => {
          state.loading.updateProfile = false;
          if (state.currentProfileUsername) {
            state.profiles[state.currentProfileUsername] = {
              ...state.profiles[state.currentProfileUsername],
              ...action.meta.arg.data,
              profilePicture: action.meta.arg.profilePicture
                ? URL.createObjectURL(action.meta.arg.profilePicture)
                : state.profiles[state.currentProfileUsername].profilePicture,
              coverPicture: action.meta.arg.coverPicture
                ? URL.createObjectURL(action.meta.arg.coverPicture)
                : state.profiles[state.currentProfileUsername].coverPicture,
              followers:
                state.profiles[state.currentProfileUsername]?.followers || [],
              following:
                state.profiles[state.currentProfileUsername]?.following || [],
              followersPagination:
                state.profiles[state.currentProfileUsername]
                  ?.followersPagination,
              followingPagination:
                state.profiles[state.currentProfileUsername]
                  ?.followingPagination,
            };
          }
        }
      )
      .addCase(
        updateProfileThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.updateProfile = false;
          state.error.updateProfile =
            action.payload ?? "Failed to update profile";
        }
      )
      // Change Password
      .addCase(changePasswordThunk.pending, (state) => {
        state.loading.changePassword = true;
        state.error.changePassword = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.loading.changePassword = false;
      })
      .addCase(
        changePasswordThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.changePassword = false;
          state.error.changePassword =
            action.payload ?? "Failed to change password";
        }
      )
      // Update Privacy Settings
      .addCase(updatePrivacySettingsThunk.pending, (state) => {
        state.loading.updatePrivacy = true;
        state.error.updatePrivacy = null;
      })
      .addCase(
        updatePrivacySettingsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SimpleSuccessResponse,
            string,
            { arg: UpdatePrivacyRequest }
          >
        ) => {
          state.loading.updatePrivacy = false;
          if (state.currentProfileUsername) {
            state.profiles[state.currentProfileUsername] = {
              ...state.profiles[state.currentProfileUsername],
              isPrivate: action.meta.arg.isPrivate,
              followers:
                state.profiles[state.currentProfileUsername]?.followers || [],
              following:
                state.profiles[state.currentProfileUsername]?.following || [],
              followersPagination:
                state.profiles[state.currentProfileUsername]
                  ?.followersPagination,
              followingPagination:
                state.profiles[state.currentProfileUsername]
                  ?.followingPagination,
            };
          }
        }
      )
      .addCase(
        updatePrivacySettingsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.updatePrivacy = false;
          state.error.updatePrivacy =
            action.payload ?? "Failed to update privacy";
        }
      )
      // Delete Profile
      .addCase(deleteProfileThunk.pending, (state) => {
        state.loading.deleteProfile = true;
        state.error.deleteProfile = null;
      })
      .addCase(deleteProfileThunk.fulfilled, (state) => {
        state.loading.deleteProfile = false;
        if (state.currentProfileUsername) {
          delete state.profiles[state.currentProfileUsername];
          delete state.hasMoreFollowers[state.currentProfileUsername];
          delete state.hasMoreFollowing[state.currentProfileUsername];
          state.currentProfileUsername = null;
        }
      })
      .addCase(
        deleteProfileThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.deleteProfile = false;
          state.error.deleteProfile =
            action.payload ?? "Failed to delete profile";
        }
      )
      // Follow User
      .addCase(followUserThunk.pending, (state, action) => {
        const userId = action.meta.arg;
        state.loading.followUser[userId] = true;
        state.error.followUser[userId] = null;
        // Optimistic update for profiles
        // const username = Object.keys(state.profiles).find(
        //   (key) => state.profiles[key].userId === userId
        // );
        // if (username && state.profiles[username]) {
        //   state.profiles[username].isFollowed = true;
        //   state.profiles[username].followStatus = "PENDING";
        // }
        // Optimistic update for suggestions
        state.suggestions = state.suggestions.map((suggestion) =>
          suggestion.userId === userId
            ? { ...suggestion, isFollowed: true }
            : suggestion
        );
        state.searchResults = state.searchResults.map((user) =>
          user.userId === action.meta.arg
            ? { ...user, isFollowed: true } // Or "pending" based on logic
            : user
        );
        // Optimistic update for followers and following lists in profiles
        Object.keys(state.profiles).forEach((profileUsername) => {
          if (state.profiles[profileUsername].followers) {
            state.profiles[profileUsername].followers = state.profiles[
              profileUsername
            ].followers.map((follower) =>
              follower.userId === userId
                ? { ...follower, isFollowed: true }
                : follower
            );
          }
          if (state.profiles[profileUsername].following) {
            state.profiles[profileUsername].following = state.profiles[
              profileUsername
            ].following.map((following) =>
              following.userId === userId
                ? { ...following, isFollowed: true }
                : following
            );
          }
        });
      })
      .addCase(
        followUserThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          state.loading.followUser[userId] = false;

          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );

          const status = action.payload.status || "ACCEPTED";
          const isFollowedValue: boolean | "pending" =
            status === "PENDING" ? "pending" : true;

          if (status === "ACCEPTED") {
            if (username && state.profiles[username]) {
              state.profiles[username].isFollowed = true;
              state.profiles[username].followStatus = "ACCEPTED";
            }
            const currentUserProfile =
              state.profiles[state.currentProfileUsername ?? ""];
            if (currentUserProfile) {
              const alreadyFollowing = currentUserProfile.following?.some(
                (u) => u.userId === userId
              );
              if (!alreadyFollowing) {
                const followedUser = state.suggestions.find(
                  (s) => s.userId === userId
                );
                if (followedUser) {
                  if (!currentUserProfile.following)
                    currentUserProfile.following = [];
                  currentUserProfile.following.push({
                    userId: followedUser.userId,
                    username: followedUser.username,
                    profilePicture: followedUser.profilePicture,
                    bio: followedUser.bio,
                    isPrivate: false,
                    isFollowed: true,
                  });
                  if (currentUserProfile.followingPagination) {
                    currentUserProfile.followingPagination.totalCount += 1;
                  }
                }
              }
            }
          }

          if (status === "PENDING") {
            if (username && state.profiles[username]) {
              state.profiles[username].isFollowed = false;
              state.profiles[username].followStatus = "PENDING";
            }
          }

          state.suggestions = state.suggestions.map((suggestion) =>
            suggestion.userId === userId
              ? { ...suggestion, isFollowed: isFollowedValue }
              : suggestion
          );

          state.searchResults = state.searchResults.map((user) =>
            user.userId === userId
              ? { ...user, isFollowed: isFollowedValue }
              : user
          );

          Object.keys(state.profiles).forEach((profileUsername) => {
            const profile = state.profiles[profileUsername];

            if (profile.followers) {
              profile.followers = profile.followers.map((follower) =>
                follower.userId === userId
                  ? { ...follower, isFollowed: isFollowedValue }
                  : follower
              );
            }

            if (profile.following) {
              profile.following = profile.following.map((following) =>
                following.userId === userId
                  ? { ...following, isFollowed: isFollowedValue }
                  : following
              );
            }
          });
        }
      )
      .addCase(
        followUserThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          state.loading.followUser[userId] = false;
          state.error.followUser[userId] =
            action.payload ?? "Failed to follow user";
          // Revert optimistic update for profiles
          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );
          if (username && state.profiles[username]) {
            state.profiles[username].isFollowed = false;
            state.profiles[username].followStatus = "NONE";
          }
          // Revert optimistic update for suggestions
          state.suggestions = state.suggestions.map((suggestion) =>
            suggestion.userId === userId
              ? { ...suggestion, isFollowed: false }
              : suggestion
          );
          state.searchResults = state.searchResults.map((user) =>
            user.userId === userId ? { ...user, isFollowed: false } : user
          );
          // Revert optimistic update for followers and following lists
          Object.keys(state.profiles).forEach((profileUsername) => {
            if (state.profiles[profileUsername].followers) {
              state.profiles[profileUsername].followers = state.profiles[
                profileUsername
              ].followers.map((follower) =>
                follower.userId === userId
                  ? { ...follower, isFollowed: false }
                  : follower
              );
            }
            if (state.profiles[profileUsername].following) {
              state.profiles[profileUsername].following = state.profiles[
                profileUsername
              ].following.map((following) =>
                following.userId === userId
                  ? { ...following, isFollowed: false }
                  : following
              );
            }
          });
        }
      )
      // Unfollow User
      .addCase(unfollowUserThunk.pending, (state, action) => {
        const userId = action.meta.arg;
        state.loading.unfollowUser[userId] = true;
        state.error.unfollowUser[userId] = null;
        // Optimistic update for profiles
        const username = Object.keys(state.profiles).find(
          (key) => state.profiles[key].userId === userId
        );
        if (username && state.profiles[username]) {
          state.profiles[username].isFollowed = false;
          state.profiles[username].followStatus = "NONE";
        }
        // Optimistic update for suggestions
        state.suggestions = state.suggestions.map((suggestion) =>
          suggestion.userId === userId
            ? { ...suggestion, isFollowed: false }
            : suggestion
        );
        state.searchResults = state.searchResults.map((user) =>
          user.userId === action.meta.arg
            ? { ...user, isFollowed: false }
            : user
        );
        // Optimistic update for followers and following lists in profiles
        Object.keys(state.profiles).forEach((profileUsername) => {
          if (state.profiles[profileUsername].followers) {
            state.profiles[profileUsername].followers = state.profiles[
              profileUsername
            ].followers.map((follower) =>
              follower.userId === userId
                ? { ...follower, isFollowed: false }
                : follower
            );
          }
          if (state.profiles[profileUsername].following) {
            state.profiles[profileUsername].following = state.profiles[
              profileUsername
            ].following.map((following) =>
              following.userId === userId
                ? { ...following, isFollowed: false }
                : following
            );
          }
        });
      })
      .addCase(
        unfollowUserThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          state.loading.unfollowUser[userId] = false;

          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );

          if (username && state.profiles[username]) {
            state.profiles[username].isFollowed = false;
            state.profiles[username].followStatus = "NONE";
          }

          state.suggestions = state.suggestions.map((suggestion) =>
            suggestion.userId === userId
              ? { ...suggestion, isFollowed: false }
              : suggestion
          );

          state.searchResults = state.searchResults.map((user) =>
            user.userId === userId ? { ...user, isFollowed: false } : user
          );

          Object.keys(state.profiles).forEach((profileUsername) => {
            const profile = state.profiles[profileUsername];

            if (profile.followers) {
              profile.followers = profile.followers.map((follower) =>
                follower.userId === userId
                  ? { ...follower, isFollowed: false }
                  : follower
              );
            }

            if (profile.following) {
              profile.following = profile.following.map((following) =>
                following.userId === userId
                  ? { ...following, isFollowed: false }
                  : following
              );
            }
          });

          const currentUserProfile =
            state.profiles[state.currentProfileUsername ?? ""];
          if (currentUserProfile?.following) {
            const beforeCount = currentUserProfile.following.length;

            currentUserProfile.following = currentUserProfile.following.filter(
              (f) => f.userId !== userId
            );

            if (
              currentUserProfile.followingPagination &&
              currentUserProfile.following.length < beforeCount
            ) {
              currentUserProfile.followingPagination.totalCount -= 1;
            }
          }
        }
      )
      .addCase(
        unfollowUserThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          state.loading.unfollowUser[userId] = false;
          state.error.unfollowUser[userId] =
            action.payload ?? "Failed to unfollow user";
          // Revert optimistic update for profiles
          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );
          if (username && state.profiles[username]) {
            state.profiles[username].isFollowed = true;
            state.profiles[username].followStatus = "ACCEPTED";
          }
          // Revert optimistic update for suggestions
          state.suggestions = state.suggestions.map((suggestion) =>
            suggestion.userId === userId
              ? { ...suggestion, isFollowed: true }
              : suggestion
          );
          state.searchResults = state.searchResults.map((user) =>
            user.userId === userId
              ? { ...user, isFollowed: true } // Assume was followed
              : user
          );
          // Revert optimistic update for followers and following lists
          Object.keys(state.profiles).forEach((profileUsername) => {
            if (state.profiles[profileUsername].followers) {
              state.profiles[profileUsername].followers = state.profiles[
                profileUsername
              ].followers.map((follower) =>
                follower.userId === userId
                  ? { ...follower, isFollowed: true }
                  : follower
              );
            }
            if (state.profiles[profileUsername].following) {
              state.profiles[profileUsername].following = state.profiles[
                profileUsername
              ].following.map((following) =>
                following.userId === userId
                  ? { ...following, isFollowed: true }
                  : following
              );
            }
          });
        }
      )
      // Remove Follower
      .addCase(removeFollowerThunk.pending, (state, action) => {
        const followerId = action.meta.arg;
        state.loading.removeFollower[followerId] = true;
        state.error.removeFollower[followerId] = null;
      })
      .addCase(
        removeFollowerThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          const followerId = action.meta.arg;
          state.loading.removeFollower[followerId] = false;
          if (
            state.currentProfileUsername &&
            state.profiles[state.currentProfileUsername]
          ) {
            state.profiles[state.currentProfileUsername].followers =
              state.profiles[state.currentProfileUsername].followers.filter(
                (f) => f.userId !== followerId
              );
            state.profiles[state.currentProfileUsername].followerCount -= 1;
          }
        }
      )
      .addCase(
        removeFollowerThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          const followerId = action.meta.arg;
          state.loading.removeFollower[followerId] = false;
          state.error.removeFollower[followerId] =
            action.payload ?? "Failed to remove follower";
        }
      )
      // Get Pending Follow Requests
      .addCase(getPendingFollowRequestsThunk.pending, (state) => {
        state.loading.getPendingRequests = true;
        state.error.getPendingRequests = null;
      })
      .addCase(
        getPendingFollowRequestsThunk.fulfilled,
        (state, action: PayloadAction<PendingFollowRequestsResponse>) => {
          state.loading.getPendingRequests = false;
          state.pendingRequests = [
            ...state.pendingRequests,
            ...action.payload.pendingRequests.filter(
              (newReq) =>
                !state.pendingRequests.some(
                  (oldReq) => oldReq.user.userId === newReq.user.userId
                )
            ),
          ];
        }
      )
      .addCase(
        getPendingFollowRequestsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getPendingRequests = false;
          state.error.getPendingRequests =
            action.payload ?? "Failed to fetch pending requests";
        }
      )
      // Accept Follow Request
      .addCase(acceptFollowRequestThunk.pending, (state, action) => {
        const requestId = action.meta.arg;
        state.loading.acceptRequest[requestId] = true;
        state.error.acceptRequest[requestId] = null;
      })
      .addCase(
        acceptFollowRequestThunk.fulfilled,
        (
          state,
          action: PayloadAction<AcceptFollowResponse, string, { arg: number }>
        ) => {
          const requestId = action.meta.arg;
          state.loading.acceptRequest[requestId] = false;
          state.error.acceptRequest[requestId] = null; // Clear error on success
          state.pendingRequests = state.pendingRequests.filter(
            (r) => r.requestId !== requestId
          );
          if (
            state.currentProfileUsername &&
            state.profiles[state.currentProfileUsername]
          ) {
            const existingFollowerIds = new Set(
              state.profiles[state.currentProfileUsername].followers.map(
                (f) => f.userId
              )
            );
            const newFollowers = action.payload.acceptedFollowers.filter(
              (f) => !existingFollowerIds.has(f.userId)
            );
            state.profiles[state.currentProfileUsername].followers = [
              ...state.profiles[state.currentProfileUsername].followers,
              ...newFollowers,
            ];
            state.profiles[state.currentProfileUsername].followerCount +=
              newFollowers.length;
          }
        }
      )
      .addCase(
        acceptFollowRequestThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          const requestId = action.meta.arg;
          state.loading.acceptRequest[requestId] = false;
          state.error.acceptRequest[requestId] =
            action.payload ?? "Failed to accept request";
        }
      )
      // Reject Follow Request
      .addCase(rejectFollowRequestThunk.pending, (state, action) => {
        const requestId = action.meta.arg;
        state.loading.rejectRequest[requestId] = true;
        state.error.rejectRequest[requestId] = null;
      })
      .addCase(
        rejectFollowRequestThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          const requestId = action.meta.arg;
          state.loading.rejectRequest[requestId] = false;
          state.error.rejectRequest[requestId] = null; // Clear error on success
          state.pendingRequests = state.pendingRequests.filter(
            (r) => r.requestId !== action.meta.arg
          );
        }
      )
      .addCase(
        rejectFollowRequestThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          const requestId = action.meta.arg;
          state.loading.rejectRequest[requestId] = false;
          state.error.rejectRequest[requestId] =
            action.payload ?? "Failed to reject request";
        }
      )
      // Get Followers
      .addCase(getFollowersThunk.pending, (state) => {
        state.loading.getFollowers = true;
        state.error.getFollowers = null;
      })
      .addCase(
        getFollowersThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            FollowersResponse,
            string,
            {
              arg: {
                username: string;
                params: { page?: number; limit?: number };
              };
            }
          >
        ) => {
          state.loading.getFollowers = false;
          const { username, params } = action.meta.arg;
          if (state.profiles[username]) {
            const existingFollowerIds = new Set(
              state.profiles[username].followers.map((f) => f.userId)
            );
            const newFollowers = action.payload.followers.filter(
              (f) => !existingFollowerIds.has(f.userId)
            );
            state.profiles[username].followers =
              params.page && params.page > 1
                ? [...state.profiles[username].followers, ...newFollowers]
                : action.payload.followers;
            state.profiles[username].followerCount = action.payload.totalCount;
            state.profiles[username].followersPagination = {
              page: action.payload.page,
              limit: action.payload.limit,
              totalPages: action.payload.totalPages,
              totalCount: action.payload.totalCount,
            };
            state.hasMoreFollowers[username] =
              action.payload.page < action.payload.totalPages;
          }
        }
      )
      .addCase(
        getFollowersThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getFollowers = false;
          state.error.getFollowers =
            action.payload ?? "Failed to fetch followers";
        }
      )
      // Get Following
      .addCase(getFollowingThunk.pending, (state) => {
        state.loading.getFollowing = true;
        state.error.getFollowing = null;
      })
      .addCase(
        getFollowingThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            FollowingResponse,
            string,
            {
              arg: {
                username: string;
                params: { page?: number; limit?: number };
              };
            }
          >
        ) => {
          state.loading.getFollowing = false;
          const { username, params } = action.meta.arg;
          if (state.profiles[username]) {
            const existingFollowingIds = new Set(
              state.profiles[username].following.map((f) => f.userId)
            );
            const newFollowing = action.payload.following.filter(
              (f) => !existingFollowingIds.has(f.userId)
            );
            state.profiles[username].following =
              params.page && params.page > 1
                ? [...state.profiles[username].following, ...newFollowing]
                : action.payload.following;
            state.profiles[username].followingCount = action.payload.totalCount;
            state.profiles[username].followingPagination = {
              page: action.payload.page,
              limit: action.payload.limit,
              totalPages: action.payload.totalPages,
              totalCount: action.payload.totalCount,
            };
            state.hasMoreFollowing[username] =
              action.payload.page < action.payload.totalPages;
          }
        }
      )
      .addCase(
        getFollowingThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getFollowing = false;
          state.error.getFollowing =
            action.payload ?? "Failed to fetch following";
        }
      )
      // Get User Suggestions
      .addCase(getUserSuggestionsThunk.pending, (state) => {
        state.loading.getSuggestions = true;
        state.error.getSuggestions = null;
      })
      .addCase(
        getUserSuggestionsThunk.fulfilled,
        (state, action: PayloadAction<UserSuggestionsResponse>) => {
          state.loading.getSuggestions = false;
          state.suggestions = [
            ...state.suggestions,
            ...action.payload.suggestions.filter(
              (newUser) =>
                !state.suggestions.some(
                  (oldUser) => oldUser.username === newUser.username
                )
            ),
          ];
        }
      )
      .addCase(
        getUserSuggestionsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getSuggestions = false;
          state.error.getSuggestions =
            action.payload ?? "Failed to fetch suggestions";
        }
      );
  },
});

export const {
  clearError,
  clearProfileState,
  setCurrentProfileUsername,
  clearSearchResults,
  setCurrentSearchQuery,
  updateHasUnviewedStories,
} = profileSlice.actions;

export default profileSlice.reducer;