// store/highlightSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createHighlight,
  getUserHighlights,
  getUserHighlightById,
  updateHighlight,
  deleteHighlight,
} from "@/services/highlightService";
import {
  Highlight,
  CreateHighlightRequest,
  UpdateHighlightRequest,
  SimpleSuccessResponse,
  UserHighlightsResponse,
} from "@/types/highlight";
import { AxiosError } from "axios";

/**
 * Interface for the highlight state in Redux.
 * Manages highlights by username, loading states, and error messages for each operation.
 */
interface HighlightState {
  highlightsByUsername: Record<
    string,
    {
      highlights: Highlight[];
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalCount: number;
      };
    }
  >;
  loading: {
    createHighlight: boolean;
    getUserHighlights: boolean;
    getUserHighlightById: boolean;
    updateHighlight: boolean;
    deleteHighlight: boolean;
  };
  error: {
    createHighlight: string | null;
    getUserHighlights: string | null;
    getUserHighlightById: string | null;
    updateHighlight: string | null;
    deleteHighlight: string | null;
  };
}

/**
 * Initial state for the highlight slice.
 */
const initialState: HighlightState = {
  highlightsByUsername: {},
  loading: {
    createHighlight: false,
    getUserHighlights: false,
    getUserHighlightById: false,
    updateHighlight: false,
    deleteHighlight: false,
  },
  error: {
    createHighlight: null,
    getUserHighlights: null,
    getUserHighlightById: null,
    updateHighlight: null,
    deleteHighlight: null,
  },
};

/**
 * Async thunk to create a new highlight.
 * Validates input data before calling the service.
 * @param {Object} params - Parameters including data, coverImage, and username.
 * @returns {Promise<Highlight & { username: string }>} The created highlight with username.
 */
export const createHighlightThunk = createAsyncThunk<
  Highlight & { username: string },
  { data: CreateHighlightRequest; coverImage: File; username: string },
  { rejectValue: string }
>(
  "highlight/createHighlight",
  async ({ data, coverImage, username }, { rejectWithValue }) => {
    try {
      // Validate storyIds: must be non-empty array of positive integers
      if (
        !Array.isArray(data.storyIds) ||
        data.storyIds.length === 0 ||
        !data.storyIds.every((id) => Number.isInteger(id) && id > 0)
      ) {
        return rejectWithValue(
          "storyIds must be a non-empty array of positive integers"
        );
      }
      // Validate coverImage: must be a valid File instance
      if (!(coverImage instanceof File)) {
        return rejectWithValue("coverImage must be a valid file");
      }
      const response = await createHighlight(data, coverImage);
      return { ...response, username };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to create highlight")
      );
    }
  }
);

/**
 * Async thunk to fetch a specific highlight by ID.
 * Validates input before calling the service.
 * @param {Object} params - Parameters including highlightId and username.
 * @returns {Promise<Highlight & { username: string }>} The fetched highlight with username.
 */
export const getUserHighlightByIdThunk = createAsyncThunk<
  Highlight & { username: string },
  { highlightId: number; username: string },
  { rejectValue: string }
>(
  "highlight/getUserHighlightById",
  async ({ highlightId, username }, { rejectWithValue }) => {
    try {
      if (!Number.isInteger(highlightId) || highlightId <= 0) {
        return rejectWithValue("Invalid highlight ID");
      }
      if (typeof username !== "string" || username.trim().length === 0) {
        return rejectWithValue("Invalid username");
      }
      const response = await getUserHighlightById(highlightId);
      return { ...response, username };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to fetch highlight")
      );
    }
  }
);

/**
 * Async thunk to fetch user highlights with pagination.
 * Validates username before calling the service.
 * @param {Object} params - Parameters including username and pagination params.
 * @returns {Promise<UserHighlightsResponse>} The paginated highlights response.
 */
export const getUserHighlightsThunk = createAsyncThunk<
  UserHighlightsResponse,
  { username: string; params: { limit?: number; offset?: number } },
  { rejectValue: string }
>(
  "highlight/getUserHighlights",
  async ({ username, params }, { rejectWithValue }) => {
    try {
      if (typeof username !== "string" || username.trim().length === 0) {
        return rejectWithValue("Invalid username");
      }
      const response = await getUserHighlights(username, params);
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to fetch highlights")
      );
    }
  }
);

/**
 * Async thunk to update an existing highlight.
 * Validates input before calling the service.
 * @param {Object} params - Parameters including highlightId, data, optional coverImage, and username.
 * @returns {Promise<Highlight & { username: string }>} The updated highlight with username.
 */
export const updateHighlightThunk = createAsyncThunk<
  Highlight & { username: string },
  {
    highlightId: number;
    data: UpdateHighlightRequest;
    coverImage?: File;
    username: string;
  },
  { rejectValue: string }
>(
  "highlight/updateHighlight",
  async ({ highlightId, data, coverImage, username }, { rejectWithValue }) => {
    try {
      // Optional validation for storyIds if provided
      if (data.storyIds && data.storyIds.length > 0) {
        if (
          !Array.isArray(data.storyIds) ||
          !data.storyIds.every((id) => Number.isInteger(id) && id > 0)
        ) {
          return rejectWithValue(
            "storyIds must be an array of positive integers"
          );
        }
      }
      // Validate coverImage if provided
      if (coverImage && !(coverImage instanceof File)) {
        return rejectWithValue("coverImage must be a valid file");
      }
      const response = await updateHighlight(highlightId, data, coverImage);
      return { ...response, username };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to update highlight")
      );
    }
  }
);

/**
 * Async thunk to delete a highlight.
 * Validates highlightId before calling the service.
 * @param {Object} params - Parameters including highlightId and username.
 * @returns {Promise<SimpleSuccessResponse & { username: string }>} The success response with username.
 */
export const deleteHighlightThunk = createAsyncThunk<
  SimpleSuccessResponse & { username: string },
  { highlightId: number; username: string },
  { rejectValue: string }
>(
  "highlight/deleteHighlight",
  async ({ highlightId, username }, { rejectWithValue }) => {
    try {
      if (!Number.isInteger(highlightId) || highlightId <= 0) {
        return rejectWithValue("Invalid highlight ID");
      }
      const response = await deleteHighlight(highlightId);
      return { ...response, username };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to delete highlight")
      );
    }
  }
);

/**
 * Redux slice for managing highlights.
 * Includes reducers for clearing errors and state, and extra reducers for handling async thunks.
 */
const highlightSlice = createSlice({
  name: "highlight",
  initialState,
  reducers: {
    /**
     * Clears a specific error in the state.
     * @param {HighlightState} state - The current state.
     * @param {PayloadAction<keyof HighlightState["error"]>} action - The error key to clear.
     */
    clearError: (
      state,
      action: PayloadAction<keyof HighlightState["error"]>
    ) => {
      state.error[action.payload] = null;
    },
    /**
     * Resets the highlight state to initial values.
     * @param {HighlightState} state - The current state.
     */
    clearHighlightState: (state) => {
      state.highlightsByUsername = {};
      state.loading = initialState.loading;
      state.error = initialState.error;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Highlight cases
      .addCase(createHighlightThunk.pending, (state) => {
        state.loading.createHighlight = true;
        state.error.createHighlight = null;
      })
      .addCase(
        createHighlightThunk.fulfilled,
        (
          state,
          action: PayloadAction<Highlight & { username: string }>
        ) => {
          state.loading.createHighlight = false;
          const { highlightId, ...highlight } = action.payload; // Assuming response is Highlight
          const username = action.payload.username;
          if (!state.highlightsByUsername[username]) {
            state.highlightsByUsername[username] = {
              highlights: [],
              pagination: { page: 1, limit: 20, totalPages: 1, totalCount: 0 },
            };
          }
          state.highlightsByUsername[username].highlights.unshift({
            highlightId,
            ...highlight,
          });
          state.highlightsByUsername[username].pagination.totalCount += 1;
          state.highlightsByUsername[username].pagination.totalPages = Math.ceil(
            state.highlightsByUsername[username].pagination.totalCount /
              state.highlightsByUsername[username].pagination.limit
          );
        }
      )
      .addCase(
        createHighlightThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.createHighlight = false;
          state.error.createHighlight =
            action.payload ?? "Failed to create highlight";
        }
      )
      // Get User Highlight By ID cases
      .addCase(getUserHighlightByIdThunk.pending, (state) => {
        state.loading.getUserHighlightById = true;
        state.error.getUserHighlightById = null;
      })
      .addCase(
        getUserHighlightByIdThunk.fulfilled,
        (
          state,
          action: PayloadAction<Highlight & { username: string }>
        ) => {
          state.loading.getUserHighlightById = false;
          const { highlightId, ...highlight } = action.payload; // Assuming response is Highlight
          const username = action.payload.username;
          if (!state.highlightsByUsername[username]) {
            state.highlightsByUsername[username] = {
              highlights: [],
              pagination: { page: 1, limit: 20, totalPages: 1, totalCount: 0 },
            };
          }
          const index = state.highlightsByUsername[username].highlights.findIndex(
            (h) => h.highlightId === highlightId
          );
          if (index !== -1) {
            state.highlightsByUsername[username].highlights[index] = {
              highlightId,
              ...highlight,
            };
          } else {
            state.highlightsByUsername[username].highlights.unshift({
              highlightId,
              ...highlight,
            });
            state.highlightsByUsername[username].pagination.totalCount += 1;
            state.highlightsByUsername[username].pagination.totalPages = Math.ceil(
              state.highlightsByUsername[username].pagination.totalCount /
                state.highlightsByUsername[username].pagination.limit
            );
          }
        }
      )
      .addCase(
        getUserHighlightByIdThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getUserHighlightById = false;
          state.error.getUserHighlightById =
            action.payload ?? "Failed to fetch highlight";
        }
      )
      // Get User Highlights cases
      .addCase(getUserHighlightsThunk.pending, (state) => {
        state.loading.getUserHighlights = true;
        state.error.getUserHighlights = null;
      })
      .addCase(
        getUserHighlightsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            UserHighlightsResponse,
            string,
            {
              arg: {
                username: string;
                params: { limit?: number; offset?: number };
              };
            }
          >
        ) => {
          state.loading.getUserHighlights = false;
          const { username, params } = action.meta.arg;
          const {
            highlights = [],
            page,
            limit,
            totalPages,
            totalCount,
          } = action.payload;

          if (!state.highlightsByUsername[username]) {
            state.highlightsByUsername[username] = {
              highlights: [],
              pagination: {
                page: 1,
                limit: limit || 20,
                totalPages: 1,
                totalCount: 0,
              },
            };
          }

          // Deduplicate and append or replace highlights
          const existingIds = new Set(
            state.highlightsByUsername[username].highlights.map(
              (h) => h.highlightId
            )
          );
          const newHighlights = highlights.filter(
            (h) => !existingIds.has(h.highlightId)
          );

          state.highlightsByUsername[username].highlights =
            params.offset && params.offset > 0
              ? [...state.highlightsByUsername[username].highlights, ...newHighlights]
              : highlights;

          // Update pagination
          state.highlightsByUsername[username].pagination = {
            page: page || 1,
            limit: limit || 20,
            totalPages: totalPages || 1,
            totalCount: totalCount || 0,
          };
        }
      )
      .addCase(
        getUserHighlightsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getUserHighlights = false;
          state.error.getUserHighlights =
            action.payload ?? "Failed to fetch highlights";
        }
      )
      // Update Highlight cases
      .addCase(updateHighlightThunk.pending, (state) => {
        state.loading.updateHighlight = true;
        state.error.updateHighlight = null;
      })
      .addCase(
        updateHighlightThunk.fulfilled,
        (
          state,
          action: PayloadAction<Highlight & { username: string }>
        ) => {
          state.loading.updateHighlight = false;
          const { highlightId, ...highlight } = action.payload; // Assuming response is Highlight
          const username = action.payload.username;
          if (state.highlightsByUsername[username]) {
            const index = state.highlightsByUsername[username].highlights.findIndex(
              (h) => h.highlightId === highlightId
            );
            if (index !== -1) {
              state.highlightsByUsername[username].highlights[index] = {
                highlightId,
                ...highlight,
              };
            }
          }
        }
      )
      .addCase(
        updateHighlightThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.updateHighlight = false;
          state.error.updateHighlight =
            action.payload ?? "Failed to update highlight";
        }
      )
      // Delete Highlight cases
      .addCase(deleteHighlightThunk.pending, (state) => {
        state.loading.deleteHighlight = true;
        state.error.deleteHighlight = null;
      })
      .addCase(
        deleteHighlightThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SimpleSuccessResponse & { username: string },
            string,
            { arg: { highlightId: number; username: string } }
          >
        ) => {
          state.loading.deleteHighlight = false;
          const { highlightId, username } = action.meta.arg;
          if (state.highlightsByUsername[username]) {
            state.highlightsByUsername[username].highlights = state.highlightsByUsername[
              username
            ].highlights.filter((h) => h.highlightId !== highlightId);
            state.highlightsByUsername[username].pagination.totalCount -= 1;
            state.highlightsByUsername[username].pagination.totalPages = Math.ceil(
              state.highlightsByUsername[username].pagination.totalCount /
                state.highlightsByUsername[username].pagination.limit
            );
            if (state.highlightsByUsername[username].highlights.length === 0) {
              delete state.highlightsByUsername[username];
            }
          }
        }
      )
      .addCase(
        deleteHighlightThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.deleteHighlight = false;
          state.error.deleteHighlight =
            action.payload ?? "Failed to delete highlight";
        }
      );
  },
});

export const { clearError, clearHighlightState } = highlightSlice.actions;

export default highlightSlice.reducer;