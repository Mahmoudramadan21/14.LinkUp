// store/storySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createStory,
  getStoryFeed,
  getStoryViews,
  recordStoryView,
  getStoryById,
  toggleStoryLike,
  deleteStory,
  getStoryViewersWithLikes,
  reportStory,
  getUserStories,
  getMyStories,
} from "@/services/storyService";
import {
  Story,
  CreateStoryRequest,
  StoryFeedItem,
  StoryViewsResponse,
  StoryFeedResponse,
  SimpleSuccessResponse,
  StoryResponse,
  StoryViewersWithLikesResponse,
  ReportStoryRequest,
  ReportStoryResponse,
  PaginatedUserStoriesResponse,
} from "@/types/story";
import { AxiosError } from "axios";
import { RootState } from "./index";

// Story state interface
interface StoryState {
  storyFeed: StoryFeedItem[];
  currentStory: Story | null;
  hasMore: boolean;
  myStories: PaginatedUserStoriesResponse["stories"];
  hasMoreMyStories: boolean;
  loading: {
    createStory: boolean;
    getStoryFeed: boolean;
    getStoryViews: boolean;
    getStoryViewersWithLikes: boolean;
    recordStoryView: boolean;
    getStoryById: boolean;
    toggleStoryLike: boolean;
    deleteStory: boolean;
    reportStory: boolean;
    getUserStories: boolean;
    getMyStories: boolean;
  };
  error: {
    createStory: string | null;
    getStoryFeed: string | null;
    getStoryViews: string | null;
    getStoryViewersWithLikes: string | null;
    recordStoryView: string | null;
    getStoryById: string | null;
    toggleStoryLike: string | null;
    deleteStory: string | null;
    reportStory: string | null;
    getUserStories: string | null;
    getMyStories: string | null;
  };
  reportStatus: {
    [storyId: number]: { reportId: number; message: string } | null;
  };
}

// Initial state
const initialState: StoryState = {
  storyFeed: [],
  currentStory: null,
  hasMore: true,
  myStories: [],
  hasMoreMyStories: true,
  loading: {
    createStory: false,
    getStoryFeed: true,
    getStoryViews: false,
    getStoryViewersWithLikes: false,
    recordStoryView: false,
    getStoryById: false,
    toggleStoryLike: false,
    deleteStory: false,
    reportStory: false,
    getUserStories: true,
    getMyStories: false,
  },
  error: {
    createStory: null,
    getStoryFeed: null,
    getStoryViews: null,
    getStoryViewersWithLikes: null,
    recordStoryView: null,
    getStoryById: null,
    toggleStoryLike: null,
    deleteStory: null,
    reportStory: null,
    getUserStories: null,
    getMyStories: null,
  },
  reportStatus: {},
};

// Async thunks
// Create Story
export const createStoryThunk = createAsyncThunk<
  { story: StoryResponse["story"]; user: RootState["auth"]["user"] },
  CreateStoryRequest,
  { state: RootState; rejectValue: string }
>("story/createStory", async (data, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const user = state.auth.user;
    if (!user) {
      return rejectWithValue("User not authenticated");
    }
    const response = await createStory(data);
    return { story: response.story, user };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to create story"
    );
  }
});

// Get Story Feed
export const getStoryFeedThunk = createAsyncThunk<
  StoryFeedResponse,
  { limit?: number; offset?: number },
  { rejectValue: string }
>("story/getStoryFeed", async (params, { rejectWithValue }) => {
  try {
    const response = await getStoryFeed(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch story feed"
    );
  }
});

// Fetch Stories by Username
export const getUserStoriesThunk = createAsyncThunk<
  StoryFeedItem,
  string,
  { state: RootState; rejectValue: string }
>("story/getUserStories", async (identifier, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const storyFeed = state.story.storyFeed;

    // Try to resolve identifier -> username
    const userItem = storyFeed.find(
      (item) =>
        item.userId === parseInt(identifier, 10) || item.username === identifier
    );
    const username = userItem?.username || identifier;

    if (!username) {
      return rejectWithValue("Invalid username or user ID");
    }

    const userStories = await getUserStories(username);
    if (
      !userStories ||
      !userStories.stories ||
      userStories.stories.length === 0
    ) {
      return rejectWithValue("No stories found for this user");
    }

    return {
      ...userStories,
      stories: userStories.stories.map((story) => ({
        ...story,
        latestViewers: story.latestViewers ?? [],
      })),
    };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch user stories"
    );
  }
});

// Get My Stories with Pagination
export const getMyStoriesThunk = createAsyncThunk<
  PaginatedUserStoriesResponse,
  { limit?: number; offset?: number },
  { rejectValue: string }
>("story/getMyStories", async (params, { rejectWithValue }) => {
  try {
    const response = await getMyStories(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch my stories"
    );
  }
});

// Get Story Views
export const getStoryViewsThunk = createAsyncThunk<
  StoryViewsResponse,
  number,
  { rejectValue: string }
>("story/getStoryViews", async (storyId, { rejectWithValue }) => {
  try {
    const response = await getStoryViews(storyId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch story views"
    );
  }
});

// Get Story Viewers with Likes
export const getStoryViewersWithLikesThunk = createAsyncThunk<
  StoryViewersWithLikesResponse,
  { storyId: number; limit?: number; offset?: number },
  { rejectValue: string }
>(
  "story/getStoryViewersWithLikes",
  async ({ storyId, limit, offset }, { rejectWithValue }) => {
    try {
      const response = await getStoryViewersWithLikes(storyId, {
        limit,
        offset,
      });
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to fetch story viewers"
      );
    }
  }
);

// Record Story View
export const recordStoryViewThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("story/recordStoryView", async (storyId, { rejectWithValue }) => {
  try {
    const response = await recordStoryView(storyId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to record story view"
    );
  }
});

// Get Story By ID
export const getStoryByIdThunk = createAsyncThunk<
  StoryResponse,
  number,
  { rejectValue: string }
>("story/getStoryById", async (storyId, { rejectWithValue }) => {
  try {
    const response = await getStoryById(storyId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch story"
    );
  }
});

// Toggle Story Like
export const toggleStoryLikeThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("story/toggleStoryLike", async (storyId, { rejectWithValue }) => {
  try {
    const response = await toggleStoryLike(storyId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to toggle story like"
    );
  }
});

// Delete Story
export const deleteStoryThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("story/deleteStory", async (storyId, { rejectWithValue }) => {
  try {
    const response = await deleteStory(storyId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to delete story"
    );
  }
});

// Report Story
export const reportStoryThunk = createAsyncThunk<
  ReportStoryResponse,
  { storyId: number; data: ReportStoryRequest },
  { rejectValue: string }
>("story/reportStory", async ({ storyId, data }, { rejectWithValue }) => {
  try {
    const response = await reportStory(storyId, data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to report story"
    );
  }
});

const storySlice = createSlice({
  name: "story",
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof StoryState["error"]>) => {
      state.error[action.payload] = null;
    },
    clearStories: (state) => {
      state.storyFeed = [];
      state.currentStory = null;
      state.reportStatus = {};
    },
    clearMyStories: (state) => {
      state.myStories = [];
      state.hasMoreMyStories = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Story
      .addCase(createStoryThunk.pending, (state) => {
        state.loading.createStory = true;
        state.error.createStory = null;
      })
      .addCase(
        createStoryThunk.fulfilled,
        (
          state: StoryState,
          action: PayloadAction<{
            story: StoryResponse["story"];
            user: RootState["auth"]["user"];
          }>
        ) => {
          state.loading.createStory = false;
          const newStory: Story = {
            ...action.payload.story,
            isMine: true,
            likeCount: 0,
            viewCount: 0,
            isLiked: false,
            isViewed: false,
            latestViewers: [],
          };

          const user = action.payload.user;
          if (user) {
            const userFeedIndex = state.storyFeed.findIndex(
              (item) => item.userId === user.userId
            );
            if (userFeedIndex !== -1) {
              state.storyFeed[userFeedIndex].stories = [
                ...state.storyFeed[userFeedIndex].stories,
                newStory,
              ];
              state.storyFeed[userFeedIndex].hasUnviewedStories = true;
            } else {
              state.storyFeed = [
                {
                  userId: user.userId,
                  username: user.username,
                  profilePicture: user.profilePicture,
                  stories: [newStory],
                  hasUnviewedStories: true,
                },
                ...state.storyFeed,
              ];
            }
          }

          // Also add to myStories for consistency
          const newMyStoryItem = {
            storyId: newStory.storyId,
            mediaUrl: newStory.mediaUrl,
            createdAt: newStory.createdAt,
          };
          state.myStories = [newMyStoryItem, ...state.myStories];
        }
      )
      .addCase(
        createStoryThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.createStory = false;
          state.error.createStory = action.payload ?? "Failed to create story";
        }
      )
      // Get Story Feed
      .addCase(getStoryFeedThunk.pending, (state) => {
        state.loading.getStoryFeed = true;
        state.error.getStoryFeed = null;
      })
      .addCase(
        getStoryFeedThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            StoryFeedResponse,
            string,
            { arg: { limit?: number; offset?: number } }
          >
        ) => {
          state.loading.getStoryFeed = false;
          const newItems = action.payload;
          newItems.forEach((item) => {
            item.stories.forEach((story) => {
              story.latestViewers = story.latestViewers ?? [];
            });
          });
          if (action.meta.arg.offset && action.meta.arg.offset > 0) {
            state.storyFeed = [...state.storyFeed, ...newItems];
          } else {
            state.storyFeed = newItems;
          }
          state.hasMore = newItems.length === (action.meta.arg.limit || 50);
        }
      )
      .addCase(
        getStoryFeedThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getStoryFeed = false;
          state.error.getStoryFeed =
            action.payload ?? "Failed to fetch story feed";
        }
      )
      // Get User Stories
      .addCase(getUserStoriesThunk.pending, (state) => {
        state.loading.getUserStories = true;
        state.error.getUserStories = null;
      })
      .addCase(
        getUserStoriesThunk.fulfilled,
        (state, action: PayloadAction<StoryFeedItem>) => {
          state.loading.getUserStories = false;
          const newItem = action.payload;
          newItem.stories.forEach((story) => {
            story.latestViewers = story.latestViewers ?? [];
          });

          const existingIndex = state.storyFeed.findIndex(
            (item) => item.userId === newItem.userId
          );
          if (existingIndex !== -1) {
            state.storyFeed[existingIndex] = newItem;
          } else {
            state.storyFeed.push(newItem);
          }

          state.currentStory = newItem.stories[0] || null;
        }
      )
      .addCase(
        getUserStoriesThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getUserStories = false;
          state.error.getUserStories =
            action.payload ?? "Failed to fetch user stories";
        }
      )
      // Get My Stories
      .addCase(getMyStoriesThunk.pending, (state) => {
        state.loading.getMyStories = true;
        state.error.getMyStories = null;
      })
      .addCase(
        getMyStoriesThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PaginatedUserStoriesResponse,
            string,
            { arg: { limit?: number; offset?: number } }
          >
        ) => {
          state.loading.getMyStories = false;
          const newStories = action.payload.stories;
          if (action.meta.arg.offset && action.meta.arg.offset > 0) {
            state.myStories = [...state.myStories, ...newStories];
          } else {
            state.myStories = newStories;
          }
          state.hasMoreMyStories = action.payload.hasMore;
        }
      )
      .addCase(
        getMyStoriesThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getMyStories = false;
          state.error.getMyStories =
            action.payload ?? "Failed to fetch my stories";
        }
      )
      // Get Story Views
      .addCase(getStoryViewsThunk.pending, (state) => {
        state.loading.getStoryViews = true;
        state.error.getStoryViews = null;
      })
      .addCase(
        getStoryViewsThunk.fulfilled,
        (state, action: PayloadAction<StoryViewsResponse>) => {
          state.loading.getStoryViews = false;
          if (state.currentStory) {
            state.currentStory.viewCount = action.payload.totalViews;
            state.currentStory.likeCount = action.payload.totalLikes;
          }
        }
      )
      .addCase(
        getStoryViewsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getStoryViews = false;
          state.error.getStoryViews =
            action.payload ?? "Failed to fetch story views";
        }
      )
      // Get Story Viewers with Likes
      .addCase(getStoryViewersWithLikesThunk.pending, (state) => {
        state.loading.getStoryViewersWithLikes = true;
        state.error.getStoryViewersWithLikes = null;
      })
      .addCase(
        getStoryViewersWithLikesThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            StoryViewersWithLikesResponse,
            string,
            { arg: { storyId: number; limit?: number; offset?: number } }
          >
        ) => {
          state.loading.getStoryViewersWithLikes = false;
          const newViewers = action.payload;
          const storyId = action.meta.arg.storyId;

          const newLatestViewers = newViewers.viewers.map((viewer) => ({
            userId: viewer.userId,
            username: viewer.username,
            profilePicture: viewer.profilePicture,
            profileName: viewer.profileName,
            isFollowed: viewer.isFollowed,
            viewedAt: viewer.viewedAt,
            isLiked: viewer.isLiked,
          }));

          state.storyFeed.forEach((item) => {
            item.stories.forEach((story) => {
              if (story.storyId === storyId) {
                story.latestViewers = story.latestViewers || [];
                const existingUserIds = new Set(
                  story.latestViewers.map((v) => v.userId)
                );
                const uniqueNewViewers = newLatestViewers.filter(
                  (v) => !existingUserIds.has(v.userId)
                );
                story.latestViewers = [
                  ...story.latestViewers,
                  ...uniqueNewViewers,
                ];
              }
            });
          });

          if (state.currentStory && state.currentStory.storyId === storyId) {
            state.currentStory.latestViewers =
              state.currentStory.latestViewers || [];
            const existingUserIds = new Set(
              state.currentStory.latestViewers.map((v) => v.userId)
            );
            const uniqueNewViewers = newLatestViewers.filter(
              (v) => !existingUserIds.has(v.userId)
            );
            state.currentStory.latestViewers = [
              ...state.currentStory.latestViewers,
              ...uniqueNewViewers,
            ];
          }
        }
      )
      .addCase(
        getStoryViewersWithLikesThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getStoryViewersWithLikes = false;
          state.error.getStoryViewersWithLikes =
            action.payload ?? "Failed to fetch story viewers";
        }
      )
      // Record Story View
      .addCase(recordStoryViewThunk.pending, (state) => {
        state.loading.recordStoryView = true;
        state.error.recordStoryView = null;
      })
      .addCase(
        recordStoryViewThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          state.loading.recordStoryView = false;
          const storyId = action.meta.arg;
          const updateStory = (story: Story) => {
            if (story.storyId === storyId) {
              story.isViewed = true;
              if (!story.isMine) {
                story.viewCount = (story.viewCount || 0) + 1;
              }
            }
          };

          // Update story in storyFeed and check hasUnviewedStories
          state.storyFeed.forEach((item) => {
            item.stories.forEach(updateStory);
            // Update hasUnviewedStories for the user
            item.hasUnviewedStories = item.stories.some((s) => !s.isViewed);
          });

          // Update currentStory if it matches
          if (state.currentStory && state.currentStory.storyId === storyId) {
            updateStory(state.currentStory);
          }
        }
      )
      .addCase(
        recordStoryViewThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.recordStoryView = false;
          state.error.recordStoryView =
            action.payload ?? "Failed to record story view";
        }
      )
      // Get Story By ID
      .addCase(getStoryByIdThunk.pending, (state) => {
        state.loading.getStoryById = true;
        state.error.getStoryById = null;
      })
      .addCase(
        getStoryByIdThunk.fulfilled,
        (state, action: PayloadAction<StoryResponse>) => {
          state.loading.getStoryById = false;
          state.currentStory = {
            ...action.payload.story,
            latestViewers: action.payload.story.latestViewers ?? [],
          };
        }
      )
      .addCase(
        getStoryByIdThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getStoryById = false;
          state.error.getStoryById = action.payload ?? "Failed to fetch story";
        }
      )
      // Toggle Story Like
      .addCase(toggleStoryLikeThunk.pending, (state, action) => {
        state.loading.toggleStoryLike = true;
        state.error.toggleStoryLike = null;
        const storyId = action.meta.arg;
        state.storyFeed.forEach((item) => {
          const story = item.stories.find((s) => s.storyId === storyId);
          if (story) {
            story.isLiked = !story.isLiked;
            story.likeCount = (story.likeCount || 0) + (story.isLiked ? 1 : -1);
          }
        });
        if (state.currentStory?.storyId === storyId) {
          state.currentStory.isLiked = !state.currentStory.isLiked;
          state.currentStory.likeCount =
            (state.currentStory.likeCount || 0) +
            (state.currentStory.isLiked ? 1 : -1);
        }
      })
      .addCase(toggleStoryLikeThunk.fulfilled, (state) => {
        state.loading.toggleStoryLike = false;
      })
      .addCase(toggleStoryLikeThunk.rejected, (state, action) => {
        state.loading.toggleStoryLike = false;
        state.error.toggleStoryLike =
          action.payload ?? "Failed to toggle story like";
        // Revert optimistic update
        const storyId = action.meta.arg;
        state.storyFeed.forEach((item) => {
          const story = item.stories.find((s) => s.storyId === storyId);
          if (story) {
            story.isLiked = !story.isLiked;
            story.likeCount = (story.likeCount || 0) + (story.isLiked ? 1 : -1);
          }
        });
        if (state.currentStory?.storyId === storyId) {
          state.currentStory.isLiked = !state.currentStory.isLiked;
          state.currentStory.likeCount =
            (state.currentStory.likeCount || 0) +
            (state.currentStory.isLiked ? 1 : -1);
        }
      })
      // Delete Story
      .addCase(deleteStoryThunk.pending, (state) => {
        state.loading.deleteStory = true;
        state.error.deleteStory = null;
      })
      .addCase(
        deleteStoryThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          state.loading.deleteStory = false;
          const storyId = action.meta.arg;
          state.storyFeed.forEach((item) => {
            item.stories = item.stories.filter((s) => s.storyId !== storyId);
            item.hasUnviewedStories = item.stories.some((s) => !s.isViewed);
          });
          state.storyFeed = state.storyFeed.filter(
            (item) => item.stories.length > 0
          );
          if (state.currentStory && state.currentStory.storyId === storyId) {
            state.currentStory = null;
          }
          // Also remove from myStories
          state.myStories = state.myStories.filter(
            (s) => s.storyId !== storyId
          );
        }
      )
      .addCase(
        deleteStoryThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.deleteStory = false;
          state.error.deleteStory = action.payload ?? "Failed to delete story";
        }
      )
      // Report Story
      .addCase(reportStoryThunk.pending, (state) => {
        state.loading.reportStory = true;
        state.error.reportStory = null;
      })
      .addCase(
        reportStoryThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            ReportStoryResponse,
            string,
            { arg: { storyId: number; data: ReportStoryRequest } }
          >
        ) => {
          state.loading.reportStory = false;
          const storyId = action.meta.arg.storyId;
          state.reportStatus[storyId] = {
            reportId: action.payload.reportId,
            message: action.payload.message,
          };
        }
      )
      .addCase(
        reportStoryThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.reportStory = false;
          state.error.reportStory = action.payload ?? "Failed to report story";
        }
      );
  },
});

export const { clearError, clearStories, clearMyStories } = storySlice.actions;

export default storySlice.reducer;
