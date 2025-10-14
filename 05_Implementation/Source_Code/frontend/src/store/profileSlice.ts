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
import { AxiosError } from "axios";

// Profile state interface
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
  loading: {
    getProfile: boolean;
    updateProfile: boolean;
    changePassword: boolean;
    updatePrivacy: boolean;
    deleteProfile: boolean;
    followUser: boolean;
    unfollowUser: boolean;
    removeFollower: boolean;
    getPendingRequests: boolean;
    acceptRequest: boolean;
    rejectRequest: boolean;
    getFollowers: boolean;
    getFollowing: boolean;
    getSuggestions: boolean;
  };
  error: {
    getProfile: string | null;
    updateProfile: string | null;
    changePassword: string | null;
    updatePrivacy: string | null;
    deleteProfile: string | null;
    followUser: string | null;
    unfollowUser: string | null;
    removeFollower: string | null;
    getPendingRequests: string | null;
    acceptRequest: string | null;
    rejectRequest: string | null;
    getFollowers: string | null;
    getFollowing: string | null;
    getSuggestions: string | null;
  };
}

// Initial state
const initialState: ProfileState = {
  profiles: {},
  currentProfileUsername: null,
  suggestions: [],
  pendingRequests: [],
  hasMoreFollowers: {},
  hasMoreFollowing: {},
  loading: {
    getProfile: false,
    updateProfile: false,
    changePassword: false,
    updatePrivacy: false,
    deleteProfile: false,
    followUser: false,
    unfollowUser: false,
    removeFollower: false,
    getPendingRequests: false,
    acceptRequest: false,
    rejectRequest: false,
    getFollowers: false,
    getFollowing: false,
    getSuggestions: false,
  },
  error: {
    getProfile: null,
    updateProfile: null,
    changePassword: null,
    updatePrivacy: null,
    deleteProfile: null,
    followUser: null,
    unfollowUser: null,
    removeFollower: null,
    getPendingRequests: null,
    acceptRequest: null,
    rejectRequest: null,
    getFollowers: null,
    getFollowing: null,
    getSuggestions: null,
  },
};

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
  SimpleSuccessResponse, // Change return type to match service
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
  SimpleSuccessResponse, // Change return type
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
  { rejectValue: string } // Remove state: RootState
>("profile/followUser", async (userId, { rejectWithValue }) => {
  try {
    const response = await followUser(userId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to follow user"
    );
  }
});

export const unfollowUserThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string } // Remove state: RootState
>("profile/unfollowUser", async (userId, { rejectWithValue }) => {
  try {
    const response = await unfollowUser(userId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
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
      state.error[action.payload] = null;
    },
    clearProfileState: (state) => {
      state.profiles = {};
      state.currentProfileUsername = null;
      state.suggestions = [];
      state.pendingRequests = [];
      state.hasMoreFollowers = {};
      state.hasMoreFollowing = {};
    },
    setCurrentProfileUsername: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.currentProfileUsername = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Profile By Username
      .addCase(getProfileByUsernameThunk.pending, (state) => {
        state.loading.getProfile = true;
        state.error.getProfile = null;
      })
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
            { arg: { data: UpdateProfileRequest; profilePicture?: File; coverPicture?: File } }
          >
        ) => {
          state.loading.updateProfile = false;
          if (state.currentProfileUsername) {
            state.profiles[state.currentProfileUsername] = {
              ...state.profiles[state.currentProfileUsername],
              ...action.meta.arg.data, // Apply updated fields from request data
              profilePicture: action.meta.arg.profilePicture
                ? URL.createObjectURL(action.meta.arg.profilePicture)
                : state.profiles[state.currentProfileUsername].profilePicture,
              coverPicture: action.meta.arg.coverPicture
                ? URL.createObjectURL(action.meta.arg.coverPicture)
                : state.profiles[state.currentProfileUsername].coverPicture,
              followers: state.profiles[state.currentProfileUsername]?.followers || [],
              following: state.profiles[state.currentProfileUsername]?.following || [],
              followersPagination:
                state.profiles[state.currentProfileUsername]?.followersPagination,
              followingPagination:
                state.profiles[state.currentProfileUsername]?.followingPagination,
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
          action: PayloadAction<SimpleSuccessResponse, string, { arg: UpdatePrivacyRequest }>
        ) => {
          state.loading.updatePrivacy = false;
          if (state.currentProfileUsername) {
            state.profiles[state.currentProfileUsername] = {
              ...state.profiles[state.currentProfileUsername],
              isPrivate: action.meta.arg.isPrivate, // Apply privacy setting from request
              followers: state.profiles[state.currentProfileUsername]?.followers || [],
              following: state.profiles[state.currentProfileUsername]?.following || [],
              followersPagination:
                state.profiles[state.currentProfileUsername]?.followersPagination,
              followingPagination:
                state.profiles[state.currentProfileUsername]?.followingPagination,
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
        state.loading.followUser = true;
        state.error.followUser = null;
        // Optimistic update for profiles
        const userId = action.meta.arg;
        const username = Object.keys(state.profiles).find(
          (key) => state.profiles[key].userId === userId
        );
        if (username && state.profiles[username]) {
          state.profiles[username].isFollowing = true;
          state.profiles[username].followStatus = "PENDING";
          if (username && state.profiles[username]) {
            state.profiles[username].followerCount = state.profiles[username].followerCount; // Guarded
          }
        }
        // Optimistic update for followers and following lists in all profiles
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
          state.loading.followUser = false;
          const userId = action.meta.arg;
          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );
          if (username && state.profiles[username]) {
            state.profiles[username].isFollowing = true;
            state.profiles[username].followStatus =
              action.payload.status || "ACCEPTED";
            state.profiles[username].followerCount =
              state.profiles[username].followerCount; // Keep count as is, already incremented optimistically
          }
          // Update isFollowed in followers and following lists
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
      .addCase(
        followUserThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          state.loading.followUser = false;
          state.error.followUser = action.payload ?? "Failed to follow user";
          // Revert optimistic update for profiles
          const userId = action.meta.arg;
          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );
          if (username && state.profiles[username]) {
            state.profiles[username].isFollowing = false;
            state.profiles[username].followStatus = "NONE";
            if (username && state.profiles[username]) {
              state.profiles[username].followerCount = state.profiles[username].followerCount; // Guarded
            }
          }
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
        state.loading.unfollowUser = true;
        state.error.unfollowUser = null;
        // Optimistic update for profiles
        const userId = action.meta.arg;
        const username = Object.keys(state.profiles).find(
          (key) => state.profiles[key].userId === userId
        );
        if (username && state.profiles[username]) {
          state.profiles[username].isFollowing = false;
          state.profiles[username].followStatus = "NONE";
          if (username && state.profiles[username]) {
            state.profiles[username].followerCount = state.profiles[username].followerCount; // Guarded
          }
        }
        // Optimistic update for followers and following lists in all profiles
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
          state.loading.unfollowUser = false;
          const userId = action.meta.arg;
          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );
          if (username && state.profiles[username]) {
            state.profiles[username].isFollowing = false;
            state.profiles[username].followStatus = "NONE";
            state.profiles[username].followerCount =
              state.profiles[username].followerCount; // Keep count as is, already decremented optimistically
          }
          // Update isFollowed in followers and following lists
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
      .addCase(
        unfollowUserThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          state.loading.unfollowUser = false;
          state.error.unfollowUser =
            action.payload ?? "Failed to unfollow user";
          // Revert optimistic update for profiles
          const userId = action.meta.arg;
          const username = Object.keys(state.profiles).find(
            (key) => state.profiles[key].userId === userId
          );
          if (username && state.profiles[username]) {
            state.profiles[username].isFollowing = true;
            state.profiles[username].followStatus = "ACCEPTED";
            if (username && state.profiles[username]) {
              state.profiles[username].followerCount = state.profiles[username].followerCount; // Guarded
            }
          }
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
      .addCase(removeFollowerThunk.pending, (state) => {
        state.loading.removeFollower = true;
        state.error.removeFollower = null;
      })
      .addCase(
        removeFollowerThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          state.loading.removeFollower = false;
          const followerId = action.meta.arg;
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
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.removeFollower = false;
          state.error.removeFollower =
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
          state.pendingRequests = action.payload.pendingRequests;
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
      .addCase(acceptFollowRequestThunk.pending, (state) => {
        state.loading.acceptRequest = true;
        state.error.acceptRequest = null;
      })
      .addCase(
        acceptFollowRequestThunk.fulfilled,
        (
          state,
          action: PayloadAction<AcceptFollowResponse, string, { arg: number }>
        ) => {
          state.loading.acceptRequest = false;
          state.pendingRequests = state.pendingRequests.filter(
            (r) => r.requestId !== action.meta.arg
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
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.acceptRequest = false;
          state.error.acceptRequest =
            action.payload ?? "Failed to accept request";
        }
      )
      // Reject Follow Request
      .addCase(rejectFollowRequestThunk.pending, (state) => {
        state.loading.rejectRequest = true;
        state.error.rejectRequest = null;
      })
      .addCase(
        rejectFollowRequestThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          state.loading.rejectRequest = false;
          state.pendingRequests = state.pendingRequests.filter(
            (r) => r.requestId !== action.meta.arg
          );
        }
      )
      .addCase(
        rejectFollowRequestThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.rejectRequest = false;
          state.error.rejectRequest =
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
          state.suggestions = action.payload.suggestions;
          action.payload.suggestions.forEach((suggestion) => {
            if (!state.profiles[suggestion.username]) {
              state.profiles[suggestion.username] = {
                userId: suggestion.userId,
                username: suggestion.username,
                profilePicture: suggestion.profilePicture || null,
                bio: suggestion.bio || null,
                followers: [],
                following: [],
                coverPicture: null,
                address: null,
                jobTitle: null,
                dateOfBirth: undefined,
                isPrivate: false,
                role: "USER",
                createdAt: "",
                updatedAt: "",
                postCount: 0,
                followerCount: 0,
                followingCount: 0,
                likeCount: 0,
                isFollowing: false,
                followStatus: "NONE",
                hasUnViewedStories: false,
                hasActiveStories: false, // Add missing field
                hasAccess: false,
                profileName: null,
                followedBy: [],
                isMine: false, // Add missing field
                followersPagination: undefined,
                followingPagination: undefined,
              };
              state.hasMoreFollowers[suggestion.username] = true;
              state.hasMoreFollowing[suggestion.username] = true;
            }
          });
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

export const { clearError, clearProfileState, setCurrentProfileUsername } =
  profileSlice.actions;

export default profileSlice.reducer;
