import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  likeComment,
  replyToComment,
  savePost,
  reportPost,
  sharePost,
  getPostLikers,
  getPostComments,
  editComment,
  deleteComment,
  getCommentReplies,
  recordBatchPostViews,
  getExplorePosts,
  getFlicks,
  getUserPosts,
  getSavedPosts,
} from "@/services/postService";
import {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  AddCommentRequest,
  ReplyCommentRequest,
  ReportPostRequest,
  SharePostRequest,
  PostResponse,
  PostsResponse,
  Comment,
  SimpleSuccessResponse,
  UsersResponse,
  CommentsResponse,
  RepliesResponse,
  BatchPostViewsRequest,
  BatchPostViewsResponse,
} from "@/types/post";
import { AxiosError } from "axios";
import { RootState } from "./index";
import { followUserThunk, unfollowUserThunk } from "./profileSlice"; // Import profile thunks

// Post state interface
interface PostState {
  posts: Post[];
  hasMore: boolean;
  explorePosts: Post[];
  flicks: Post[];
  usersPosts: { userId: number; posts: Post[] }[];
  savedPosts: Post[];
  hasMoreUsersPosts: { userId: number; hasMore: boolean }[];
  hasMoreSavedPosts: boolean;
  currentPost: Post | null;
  loading: {
    createPost: boolean;
    getPosts: boolean;
    getExplorePosts: boolean;
    getFlicks: boolean;
    getUserPosts: boolean;
    getSavedPosts: boolean;
    getPostById: boolean;
    updatePost: boolean;
    deletePost: boolean;
    likePost: boolean;
    addComment: boolean;
    likeComment: boolean;
    replyToComment: boolean;
    savePost: boolean;
    reportPost: boolean;
    sharePost: boolean;
    getPostLikers: boolean;
    getPostComments: boolean;
    editComment: boolean;
    deleteComment: boolean;
    getCommentReplies: boolean;
    recordBatchPostViews: boolean;
  };
  error: {
    createPost: string | null;
    getPosts: string | null;
    getExplorePosts: string | null;
    getFlicks: string | null;
    getUserPosts: string | null;
    getSavedPosts: string | null;
    getPostById: string | null;
    updatePost: string | null;
    deletePost: string | null;
    likePost: string | null;
    addComment: string | null;
    likeComment: string | null;
    replyToComment: string | null;
    savePost: string | null;
    reportPost: string | null;
    sharePost: string | null;
    getPostLikers: string | null;
    getPostComments: string | null;
    editComment: string | null;
    deleteComment: string | null;
    getCommentReplies: string | null;
    recordBatchPostViews: string | null;
  };
}

// Initial state
const initialState: PostState = {
  posts: [],
  hasMore: true,
  explorePosts: [],
  flicks: [],
  usersPosts: [],
  savedPosts: [],
  hasMoreUsersPosts: [],
  hasMoreSavedPosts: true,
  currentPost: null,
  loading: {
    createPost: false,
    getPosts: false,
    getExplorePosts: false,
    getFlicks: false,
    getUserPosts: false,
    getSavedPosts: false,
    getPostById: false,
    updatePost: false,
    deletePost: false,
    likePost: false,
    addComment: false,
    likeComment: false,
    replyToComment: false,
    savePost: false,
    reportPost: false,
    sharePost: false,
    getPostLikers: false,
    getPostComments: false,
    editComment: false,
    deleteComment: false,
    getCommentReplies: false,
    recordBatchPostViews: false,
  },
  error: {
    createPost: null,
    getPosts: null,
    getExplorePosts: null,
    getFlicks: null,
    getUserPosts: null,
    getSavedPosts: null,
    getPostById: null,
    updatePost: null,
    deletePost: null,
    likePost: null,
    addComment: null,
    likeComment: null,
    replyToComment: null,
    savePost: null,
    reportPost: null,
    sharePost: null,
    getPostLikers: null,
    getPostComments: null,
    editComment: null,
    deleteComment: null,
    getCommentReplies: null,
    recordBatchPostViews: null,
  },
};

// Async thunks
export const createPostThunk = createAsyncThunk<
  PostResponse,
  CreatePostRequest,
  { rejectValue: string }
>("post/createPost", async (data, { rejectWithValue }) => {
  try {
    const response = await createPost(data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to create post"
    );
  }
});

export const getPostsThunk = createAsyncThunk<
  PostsResponse,
  { page?: number; limit?: number },
  { rejectValue: string }
>("post/getPosts", async (params, { rejectWithValue }) => {
  try {
    const response = await getPosts(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch posts"
    );
  }
});

export const getUserPostsThunk = createAsyncThunk<
  PostsResponse,
  { userId: number; params: { page?: number; limit?: number } },
  { rejectValue: string }
>("post/getUserPosts", async ({ userId, params }, { rejectWithValue }) => {
  try {
    const response = await getUserPosts(userId, params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch user posts"
    );
  }
});

export const getSavedPostsThunk = createAsyncThunk<
  PostsResponse,
  { page?: number; limit?: number },
  { rejectValue: string }
>("post/getSavedPosts", async (params, { rejectWithValue }) => {
  try {
    const response = await getSavedPosts(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch saved posts"
    );
  }
});

export const getExplorePostsThunk = createAsyncThunk<
  PostsResponse,
  { page?: number; limit?: number },
  { rejectValue: string }
>("post/getExplorePosts", async (params, { rejectWithValue }) => {
  try {
    const response = await getExplorePosts(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch explore posts"
    );
  }
});

export const getFlicksThunk = createAsyncThunk<
  PostsResponse,
  { page?: number; limit?: number },
  { rejectValue: string }
>("post/getFlicks", async (params, { rejectWithValue }) => {
  try {
    const response = await getFlicks(params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch flicks"
    );
  }
});

export const getPostByIdThunk = createAsyncThunk<
  PostResponse,
  number,
  { rejectValue: string }
>("post/getPostById", async (postId, { rejectWithValue }) => {
  try {
    const response = await getPostById(postId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch post"
    );
  }
});

export const updatePostThunk = createAsyncThunk<
  Post,
  { postId: number; data: UpdatePostRequest },
  { rejectValue: string }
>("post/updatePost", async ({ postId, data }, { rejectWithValue }) => {
  try {
    const response = await updatePost(postId, data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to update post"
    );
  }
});

export const deletePostThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("post/deletePost", async (postId, { rejectWithValue }) => {
  try {
    const response = await deletePost(postId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to delete post"
    );
  }
});

interface LikePostMeta {
  arg: number;
  requestId: string;
  requestStatus: "pending" | "rejected";
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null | undefined;
}

export const likePostThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  {
    rejectValue: {
      message: string;
      userId: number;
      username: string;
      profileName: string;
      profilePicture: string | null | undefined;
    };
    state: RootState;
    pendingMeta: LikePostMeta;
  }
>(
  "post/likePost",
  async (postId, { rejectWithValue, getState }) => {
    try {
      const response = await likePost(postId);
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const {
        userId = 0,
        username = "",
        profileName = "",
        profilePicture = null,
      } = getState().auth.user || {};
      return rejectWithValue({
        message: axiosError.response?.data?.message || "Failed to toggle like",
        userId,
        username,
        profileName,
        profilePicture,
      });
    }
  },
  {
    getPendingMeta: ({ arg }, { getState }): LikePostMeta => {
      const {
        userId = 0,
        username = "",
        profileName = "",
        profilePicture = null,
      } = getState().auth.user || {};
      return {
        arg,
        requestId: "",
        requestStatus: "pending",
        userId,
        username,
        profileName,
        profilePicture,
      };
    },
  }
);

export const addCommentThunk = createAsyncThunk<
  Comment,
  { postId: number; data: AddCommentRequest },
  { rejectValue: string }
>("post/addComment", async ({ postId, data }, { rejectWithValue }) => {
  try {
    const response = await addComment(postId, data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to add comment"
    );
  }
});

export const likeCommentThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("post/likeComment", async (commentId, { rejectWithValue }) => {
  try {
    const response = await likeComment(commentId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to toggle comment like"
    );
  }
});

export const replyToCommentThunk = createAsyncThunk<
  Comment,
  { commentId: number; data: ReplyCommentRequest },
  { rejectValue: string }
>("post/replyToComment", async ({ commentId, data }, { rejectWithValue }) => {
  try {
    const response = await replyToComment(commentId, data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to add reply"
    );
  }
});

interface EditCommentMeta {
  arg: { commentId: number; data: AddCommentRequest; originalContent: string };
  requestId: string;
  requestStatus: "pending" | "rejected";
  originalContent: string;
}

export const editCommentThunk = createAsyncThunk<
  Comment,
  { commentId: number; data: AddCommentRequest },
  {
    rejectValue: string;
    state: RootState;
    pendingMeta: EditCommentMeta;
  }
>(
  "post/editComment",
  async ({ commentId, data }, { rejectWithValue }) => {
    try {
      const response = await editComment(commentId, data);
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to edit comment"
      );
    }
  },
  {
    getPendingMeta: ({ arg }, { getState }): EditCommentMeta => {
      let originalContent = "";
      const { commentId } = arg;
      const findComment = (comments: Comment[] | undefined): Comment | null => {
        if (!comments) return null;
        for (const comment of comments) {
          if (comment.CommentID === commentId) {
            return comment;
          }
          if (comment.Replies) {
            const found = findComment(comment.Replies);
            if (found) return found;
          }
        }
        return null;
      };
      for (const post of getState().post.posts) {
        const comment = findComment(post.Comments);
        if (comment) {
          originalContent = comment.Content;
          break;
        }
      }
      for (const post of getState().post.explorePosts) {
        const comment = findComment(post.Comments);
        if (comment) {
          originalContent = comment.Content;
          break;
        }
      }
      for (const post of getState().post.flicks) {
        const comment = findComment(post.Comments);
        if (comment) {
          originalContent = comment.Content;
          break;
        }
      }
      for (const userPosts of getState().post.usersPosts) {
        for (const post of userPosts.posts) {
          const comment = findComment(post.Comments);
          if (comment) {
            originalContent = comment.Content;
            break;
          }
        }
      }
      for (const post of getState().post.savedPosts) {
        const comment = findComment(post.Comments);
        if (comment) {
          originalContent = comment.Content;
          break;
        }
      }
      const currentPostComment = findComment(
        getState().post.currentPost?.Comments
      );
      if (currentPostComment) {
        originalContent = currentPostComment.Content;
      }
      return {
        originalContent,
        arg: { ...arg, originalContent },
        requestId: "",
        requestStatus: "pending",
      };
    },
  }
);

export const deleteCommentThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("post/deleteComment", async (commentId: number, { rejectWithValue }) => {
  try {
    const response = await deleteComment(commentId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to delete comment"
    );
  }
});

export const savePostThunk = createAsyncThunk<
  SimpleSuccessResponse,
  number,
  { rejectValue: string }
>("post/savePost", async (postId, { rejectWithValue }) => {
  try {
    const response = await savePost(postId);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to toggle save"
    );
  }
});

export const reportPostThunk = createAsyncThunk<
  SimpleSuccessResponse & { reportId: number },
  { postId: number; data: ReportPostRequest },
  { rejectValue: string }
>("post/reportPost", async ({ postId, data }, { rejectWithValue }) => {
  try {
    const response = await reportPost(postId, data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to report post"
    );
  }
});

export const sharePostThunk = createAsyncThunk<
  SimpleSuccessResponse,
  { postId: number; data: SharePostRequest },
  { rejectValue: string }
>("post/sharePost", async ({ postId, data }, { rejectWithValue }) => {
  try {
    const response = await sharePost(postId, data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to share post"
    );
  }
});

export const getPostLikersThunk = createAsyncThunk<
  UsersResponse,
  { postId: number; params: { page?: number; limit?: number } },
  { rejectValue: string }
>("post/getPostLikers", async ({ postId, params }, { rejectWithValue }) => {
  try {
    const response = await getPostLikers(postId, params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch post likers"
    );
  }
});

export const getPostCommentsThunk = createAsyncThunk<
  CommentsResponse,
  { postId: number; params: { page?: number; limit?: number } },
  { rejectValue: string }
>("post/getPostComments", async ({ postId, params }, { rejectWithValue }) => {
  try {
    const response = await getPostComments(postId, params);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to fetch post comments"
    );
  }
});

export const getCommentRepliesThunk = createAsyncThunk<
  RepliesResponse,
  { commentId: number; params: { page?: number; limit?: number } },
  { rejectValue: string }
>(
  "post/getCommentReplies",
  async ({ commentId, params }, { rejectWithValue }) => {
    try {
      const response = await getCommentReplies(commentId, params);
      return response;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message || "Failed to fetch comment replies"
      );
    }
  }
);

export const recordBatchPostViewsThunk = createAsyncThunk<
  BatchPostViewsResponse,
  BatchPostViewsRequest,
  { rejectValue: string }
>("post/recordBatchPostViews", async (data, { rejectWithValue }) => {
  try {
    const response = await recordBatchPostViews(data);
    return response;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      axiosError.response?.data?.message || "Failed to record post views"
    );
  }
});

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof PostState["error"]>) => {
      state.error[action.payload] = null;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.hasMore = true;
      state.explorePosts = [];
      state.flicks = [];
      state.usersPosts = [];
      state.savedPosts = [];
      state.hasMoreUsersPosts = [];
      state.hasMoreSavedPosts = true;
      state.currentPost = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Post
      .addCase(createPostThunk.pending, (state) => {
        state.loading.createPost = true;
        state.error.createPost = null;
      })
      .addCase(
        createPostThunk.fulfilled,
        (state, action: PayloadAction<PostResponse>) => {
          state.loading.createPost = false;
          const newPost = {
            ...action.payload.post,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
          };
          state.posts.unshift(newPost);
          const userId = action.payload.post.User.UserID;
          const userPostsIndex = state.usersPosts.findIndex(
            (up) => up.userId === userId
          );
          if (userPostsIndex !== -1) {
            state.usersPosts[userPostsIndex].posts.unshift(newPost);
          } else {
            state.usersPosts.push({ userId, posts: [newPost] });
            state.hasMoreUsersPosts.push({ userId, hasMore: true });
          }
        }
      )
      .addCase(
        createPostThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.createPost = false;
          state.error.createPost = action.payload ?? "Failed to create post";
        }
      )
      // Get Posts
      .addCase(getPostsThunk.pending, (state) => {
        state.loading.getPosts = true;
        state.error.getPosts = null;
      })
      .addCase(
        getPostsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PostsResponse,
            string,
            {
              arg: { page?: number; limit?: number };
              requestId: string;
              requestStatus: "fulfilled";
            }
          >
        ) => {
          state.loading.getPosts = false;
          if (action.meta.arg.page && action.meta.arg.page > 1) {
            const existingIds = new Set(state.posts.map((p) => p.PostID));
            const newPosts = action.payload.filter(
              (p) => !existingIds.has(p.PostID)
            );
            state.posts = [...state.posts, ...newPosts];
          } else {
            state.posts = action.payload;
          }
          state.hasMore =
            action.payload.length === (action.meta.arg.limit || 10);
        }
      )
      .addCase(
        getPostsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getPosts = false;
          state.error.getPosts = action.payload ?? "Failed to fetch posts";
        }
      )
      // Get User Posts
      .addCase(getUserPostsThunk.pending, (state) => {
        state.loading.getUserPosts = true;
        state.error.getUserPosts = null;
      })
      .addCase(
        getUserPostsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PostsResponse,
            string,
            {
              arg: {
                userId: number;
                params: { page?: number; limit?: number };
              };
              requestId: string;
              requestStatus: "fulfilled";
            }
          >
        ) => {
          state.loading.getUserPosts = false;
          const userId = action.meta.arg.userId;
          const userPostsIndex = state.usersPosts.findIndex(
            (up) => up.userId === userId
          );
          if (action.meta.arg.params.page && action.meta.arg.params.page > 1) {
            if (userPostsIndex !== -1) {
              const existingIds = new Set(
                state.usersPosts[userPostsIndex].posts.map((p) => p.PostID)
              );
              const newPosts = action.payload.filter(
                (p) => !existingIds.has(p.PostID)
              );
              state.usersPosts[userPostsIndex].posts = [
                ...state.usersPosts[userPostsIndex].posts,
                ...newPosts,
              ];
            } else {
              state.usersPosts.push({ userId, posts: action.payload });
              state.hasMoreUsersPosts.push({
                userId,
                hasMore:
                  action.payload.length ===
                  (action.meta.arg.params.limit || 10),
              });
            }
          } else {
            if (userPostsIndex !== -1) {
              state.usersPosts[userPostsIndex].posts = action.payload;
            } else {
              state.usersPosts.push({ userId, posts: action.payload });
              state.hasMoreUsersPosts.push({
                userId,
                hasMore:
                  action.payload.length ===
                  (action.meta.arg.params.limit || 10),
              });
            }
          }
          const hasMoreIndex = state.hasMoreUsersPosts.findIndex(
            (h) => h.userId === userId
          );
          if (hasMoreIndex !== -1) {
            state.hasMoreUsersPosts[hasMoreIndex].hasMore =
              action.payload.length === (action.meta.arg.params.limit || 10);
          }
        }
      )
      .addCase(
        getUserPostsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getUserPosts = false;
          state.error.getUserPosts =
            action.payload ?? "Failed to fetch user posts";
        }
      )
      // Get Saved Posts
      .addCase(getSavedPostsThunk.pending, (state) => {
        state.loading.getSavedPosts = true;
        state.error.getSavedPosts = null;
      })
      .addCase(
        getSavedPostsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PostsResponse,
            string,
            {
              arg: { page?: number; limit?: number };
              requestId: string;
              requestStatus: "fulfilled";
            }
          >
        ) => {
          state.loading.getSavedPosts = false;
          if (action.meta.arg.page && action.meta.arg.page > 1) {
            const existingIds = new Set(state.savedPosts.map((p) => p.PostID));
            const newPosts = action.payload.filter(
              (p) => !existingIds.has(p.PostID)
            );
            state.savedPosts = [...state.savedPosts, ...newPosts];
          } else {
            state.savedPosts = action.payload;
          }
          state.hasMoreSavedPosts =
            action.payload.length === (action.meta.arg.limit || 10);
        }
      )
      .addCase(
        getSavedPostsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getSavedPosts = false;
          state.error.getSavedPosts =
            action.payload ?? "Failed to fetch saved posts";
        }
      )
      // Get Explore Posts
      .addCase(getExplorePostsThunk.pending, (state) => {
        state.loading.getExplorePosts = true;
        state.error.getExplorePosts = null;
      })
      .addCase(
        getExplorePostsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PostsResponse,
            string,
            {
              arg: { page?: number; limit?: number };
              requestId: string;
              requestStatus: "fulfilled";
            }
          >
        ) => {
          state.loading.getExplorePosts = false;
          if (action.meta.arg.page && action.meta.arg.page > 1) {
            const existingIds = new Set(
              state.explorePosts.map((p) => p.PostID)
            );
            const newPosts = action.payload.filter(
              (p) => !existingIds.has(p.PostID)
            );
            state.explorePosts = [...state.explorePosts, ...newPosts];
          } else {
            state.explorePosts = action.payload;
          }
        }
      )
      .addCase(
        getExplorePostsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getExplorePosts = false;
          state.error.getExplorePosts =
            action.payload ?? "Failed to fetch explore posts";
        }
      )
      // Get Flicks
      .addCase(getFlicksThunk.pending, (state) => {
        state.loading.getFlicks = true;
        state.error.getFlicks = null;
      })
      .addCase(
        getFlicksThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            PostsResponse,
            string,
            {
              arg: { page?: number; limit?: number };
              requestId: string;
              requestStatus: "fulfilled";
            }
          >
        ) => {
          state.loading.getFlicks = false;
          if (action.meta.arg.page && action.meta.arg.page > 1) {
            const existingIds = new Set(state.flicks.map((p) => p.PostID));
            const newPosts = action.payload.filter(
              (p) => !existingIds.has(p.PostID)
            );
            state.flicks = [...state.flicks, ...newPosts];
          } else {
            state.flicks = action.payload;
          }
        }
      )
      .addCase(
        getFlicksThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getFlicks = false;
          state.error.getFlicks = action.payload ?? "Failed to fetch flicks";
        }
      )
      // Get Post By ID
      .addCase(getPostByIdThunk.pending, (state) => {
        state.loading.getPostById = true;
        state.error.getPostById = null;
      })
      .addCase(
        getPostByIdThunk.fulfilled,
        (state, action: PayloadAction<PostResponse>) => {
          state.loading.getPostById = false;
          state.currentPost = action.payload.post;
        }
      )
      .addCase(
        getPostByIdThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getPostById = false;
          state.error.getPostById = action.payload ?? "Failed to fetch post";
        }
      )
      // Update Post
      .addCase(updatePostThunk.pending, (state) => {
        state.loading.updatePost = true;
        state.error.updatePost = null;
      })
      .addCase(
        updatePostThunk.fulfilled,
        (state, action: PayloadAction<Post>) => {
          state.loading.updatePost = false;
          const updateUserPosts = (userPosts: {
            userId: number;
            posts: Post[];
          }) => {
            const index = userPosts.posts.findIndex(
              (post) => post.PostID === action.payload.PostID
            );
            if (index !== -1) {
              userPosts.posts[index] = {
                ...userPosts.posts[index],
                ...action.payload,
              };
            }
          };
          state.posts = state.posts.map((post) =>
            post.PostID === action.payload.PostID
              ? { ...post, ...action.payload }
              : post
          );
          state.explorePosts = state.explorePosts.map((post) =>
            post.PostID === action.payload.PostID
              ? { ...post, ...action.payload }
              : post
          );
          state.flicks = state.flicks.map((post) =>
            post.PostID === action.payload.PostID
              ? { ...post, ...action.payload }
              : post
          );
          state.usersPosts.forEach(updateUserPosts);
          state.savedPosts = state.savedPosts.map((post) =>
            post.PostID === action.payload.PostID
              ? { ...post, ...action.payload }
              : post
          );
          if (
            state.currentPost &&
            state.currentPost.PostID === action.payload.PostID
          ) {
            state.currentPost = { ...state.currentPost, ...action.payload };
          }
        }
      )
      .addCase(
        updatePostThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.updatePost = false;
          state.error.updatePost = action.payload ?? "Failed to update post";
        }
      )
      // Delete Post
      .addCase(deletePostThunk.pending, (state) => {
        state.loading.deletePost = true;
        state.error.deletePost = null;
      })
      .addCase(
        deletePostThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          state.loading.deletePost = false;
          state.posts = state.posts.filter(
            (post) => post.PostID !== action.meta.arg
          );
          state.explorePosts = state.explorePosts.filter(
            (post) => post.PostID !== action.meta.arg
          );
          state.flicks = state.flicks.filter(
            (post) => post.PostID !== action.meta.arg
          );
          state.usersPosts = state.usersPosts.map((userPosts) => ({
            ...userPosts,
            posts: userPosts.posts.filter(
              (post) => post.PostID !== action.meta.arg
            ),
          }));
          state.savedPosts = state.savedPosts.filter(
            (post) => post.PostID !== action.meta.arg
          );
          if (
            state.currentPost &&
            state.currentPost.PostID === action.meta.arg
          ) {
            state.currentPost = null;
          }
        }
      )
      .addCase(
        deletePostThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.deletePost = false;
          state.error.deletePost = action.payload ?? "Failed to delete post";
        }
      )
      // Like Post
      .addCase(
        likePostThunk.pending,
        (state, action: PayloadAction<void, string, LikePostMeta>) => {
          state.loading.likePost = true;
          state.error.likePost = null;
          const postId = action.meta.arg;
          const { userId, username, profileName, profilePicture } = action.meta;
          const updatePost = (post: Post) => {
            if (post.PostID === postId) {
              const alreadyLiked = post.isLiked;
              post.isLiked = !alreadyLiked;
              post.likeCount += alreadyLiked ? -1 : 1;
              post.Likes = post.Likes || [];
              if (!alreadyLiked) {
                post.Likes.unshift({
                  userId: userId,
                  username: username,
                  profileName: profileName,
                  profilePicture: profilePicture || "",
                  isFollowed: false,
                  likedAt: new Date().toISOString(),
                });
              } else {
                post.Likes = post.Likes.filter(
                  (like) => like.userId !== userId
                );
              }
            }
          };
          state.posts.forEach(updatePost);
          state.explorePosts.forEach(updatePost);
          state.flicks.forEach(updatePost);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePost)
          );
          state.savedPosts.forEach(updatePost);
          if (state.currentPost) {
            updatePost(state.currentPost);
          }
        }
      )
      .addCase(likePostThunk.fulfilled, (state) => {
        state.loading.likePost = false;
      })
      .addCase(likePostThunk.rejected, (state, action) => {
        state.loading.likePost = false;
        state.error.likePost =
          action.payload?.message ?? "Failed to toggle like";
        const postId = action.meta.arg;
        const { userId, username, profileName, profilePicture } =
          action.payload ?? {
            userId: 0,
            username: "",
            profileName: "",
            profilePicture: null,
          };
        const updatePost = (post: Post) => {
          if (post.PostID === postId) {
            const justLiked = post.isLiked;
            post.isLiked = !justLiked;
            post.likeCount += justLiked ? -1 : 1;
            post.Likes = post.Likes || [];
            if (justLiked) {
              post.Likes = post.Likes.filter((like) => like.userId!== userId);
            } else {
              post.Likes.unshift({
                userId: userId,
                username: username,
                profileName: profileName,
                profilePicture: profilePicture,
                isFollowed: false,
                likedAt: new Date().toISOString(),
              });
            }
          }
        };
        state.posts.forEach(updatePost);
        state.explorePosts.forEach(updatePost);
        state.flicks.forEach(updatePost);
        state.usersPosts.forEach((userPosts) =>
          userPosts.posts.forEach(updatePost)
        );
        state.savedPosts.forEach(updatePost);
        if (state.currentPost) {
          updatePost(state.currentPost);
        }
      })
      // Add Comment
      .addCase(addCommentThunk.pending, (state) => {
        state.loading.addComment = true;
        state.error.addComment = null;
      })
      .addCase(
        addCommentThunk.fulfilled,
        (
          state,
          action: PayloadAction<Comment, string, { arg: { postId: number } }>
        ) => {
          state.loading.addComment = false;
          const postId = action.meta.arg.postId;
          const updatePost = (post: Post) => {
            if (post.PostID === postId) {
              post.Comments = post.Comments || [];
              post.Comments.unshift({
                ...action.payload,
                likeCount: 0,
                replyCount: 0,
                isMine: true,
              });
              post.commentCount += 1;
            }
          };
          state.posts.forEach(updatePost);
          state.explorePosts.forEach(updatePost);
          state.flicks.forEach(updatePost);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePost)
          );
          state.savedPosts.forEach(updatePost);
          if (state.currentPost && state.currentPost.PostID === postId) {
            updatePost(state.currentPost);
          }
        }
      )
      .addCase(
        addCommentThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.addComment = false;
          state.error.addComment = action.payload ?? "Failed to add comment";
        }
      )
      // Like Comment
      .addCase(
        likeCommentThunk.pending,
        (state, action: PayloadAction<void, string, { arg: number }>) => {
          state.loading.likeComment = true;
          state.error.likeComment = null;
          const commentId = action.meta.arg;
          const updateComment = (comment: Comment) => {
            if (comment.CommentID === commentId) {
              const wasLiked = comment.isLiked;
              comment.isLiked = !wasLiked;
              comment.likeCount += wasLiked ? -1 : 1;
              comment.likedBy = comment.likedBy || [];
              if (!wasLiked) {
                comment.likedBy.unshift({
                  username: "You",
                  profilePicture: "",
                });
              } else {
                comment.likedBy = comment.likedBy.filter(
                  (like) => like.username !== "You"
                );
              }
            }
            if (comment.Replies) {
              comment.Replies.forEach(updateComment);
            }
          };
          state.posts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          state.explorePosts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          state.flicks.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          state.usersPosts.forEach((userPosts) => {
            userPosts.posts.forEach((post) => {
              if (post.Comments) {
                post.Comments.forEach(updateComment);
              }
            });
          });
          state.savedPosts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          if (state.currentPost?.Comments) {
            state.currentPost.Comments.forEach(updateComment);
          }
        }
      )
      .addCase(likeCommentThunk.fulfilled, (state) => {
        state.loading.likeComment = false;
      })
      .addCase(
        likeCommentThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          state.loading.likeComment = false;
          state.error.likeComment =
            action.payload ?? "Failed to toggle comment like";
          const commentId = action.meta.arg;
          const updateComment = (comment: Comment) => {
            if (comment.CommentID === commentId) {
              const justLiked = comment.isLiked;
              comment.isLiked = !justLiked;
              comment.likeCount += justLiked ? -1 : 1;
              comment.likedBy = comment.likedBy || [];
              if (justLiked) {
                comment.likedBy = comment.likedBy.filter(
                  (like) => like.username !== "You"
                );
              } else {
                comment.likedBy.unshift({
                  username: "You",
                  profilePicture: "",
                });
              }
            }
            if (comment.Replies) {
              comment.Replies.forEach(updateComment);
            }
          };
          state.posts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          state.explorePosts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          state.flicks.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          state.usersPosts.forEach((userPosts) => {
            userPosts.posts.forEach((post) => {
              if (post.Comments) {
                post.Comments.forEach(updateComment);
              }
            });
          });
          state.savedPosts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach(updateComment);
            }
          });
          if (state.currentPost?.Comments) {
            state.currentPost.Comments.forEach(updateComment);
          }
        }
      )
      // Reply to Comment
      .addCase(replyToCommentThunk.pending, (state) => {
        state.loading.replyToComment = true;
        state.error.replyToComment = null;
      })
      .addCase(
        replyToCommentThunk.fulfilled,
        (
          state,
          action: PayloadAction<Comment, string, { arg: { commentId: number } }>
        ) => {
          state.loading.replyToComment = false;
          const commentId = action.meta.arg.commentId;
          const updateComment = (comment: Comment, post: Post) => {
            if (comment.CommentID === commentId) {
              comment.Replies = comment.Replies || [];
              comment.Replies.push({
                ...action.payload,
                likeCount: 0,
                replyCount: 0,
                isMine: true,
              });
              comment.replyCount += 1;
              post.commentCount += 1;
            }
            if (comment.Replies) {
              comment.Replies.forEach((reply) => updateComment(reply, post));
            }
          };
          state.posts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach((comment) => updateComment(comment, post));
            }
          });
          state.explorePosts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach((comment) => updateComment(comment, post));
            }
          });
          state.flicks.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach((comment) => updateComment(comment, post));
            }
          });
          state.usersPosts.forEach((userPosts) => {
            userPosts.posts.forEach((post) => {
              if (post.Comments) {
                post.Comments.forEach((comment) =>
                  updateComment(comment, post)
                );
              }
            });
          });
          state.savedPosts.forEach((post) => {
            if (post.Comments) {
              post.Comments.forEach((comment) => updateComment(comment, post));
            }
          });
          if (state.currentPost?.Comments) {
            state.currentPost.Comments.forEach((comment) =>
              updateComment(comment, state.currentPost!)
            );
          }
        }
      )
      .addCase(
        replyToCommentThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.replyToComment = false;
          state.error.replyToComment = action.payload ?? "Failed to add reply";
        }
      )
      // Edit Comment
      .addCase(editCommentThunk.pending, (state) => {
        state.loading.editComment = true;
        state.error.editComment = null;
      })
      .addCase(
        editCommentThunk.fulfilled,
        (state, action: PayloadAction<Comment>) => {
          state.loading.editComment = false;
          const updatedComment = action.payload;

          const updateComment = (comment: Comment): Comment => {
            if (comment.CommentID === updatedComment.CommentID) {
              return {
                ...updatedComment,
                isMine: true,
                likeCount: comment.likeCount,
                replyCount: comment.replyCount,
                Replies: comment.Replies,
              };
            }
            if (comment.Replies) {
              return {
                ...comment,
                Replies: comment.Replies.map(updateComment),
              };
            }
            return comment;
          };

          state.posts = state.posts.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          state.explorePosts = state.explorePosts.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          state.flicks = state.flicks.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          state.usersPosts = state.usersPosts.map((userPosts) => ({
            ...userPosts,
            posts: userPosts.posts.map((post) => ({
              ...post,
              Comments: post.Comments?.map(updateComment),
            })),
          }));
          state.savedPosts = state.savedPosts.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          if (state.currentPost?.Comments) {
            state.currentPost.Comments =
              state.currentPost.Comments.map(updateComment);
          }
        }
      )
      .addCase(editCommentThunk.rejected, (state, action) => {
        state.loading.editComment = false;
        state.error.editComment = action.payload ?? "Failed to edit comment";
      })
      // Delete Comment
      .addCase(
        deleteCommentThunk.pending,
        (state, action: PayloadAction<void, string, { arg: number }>) => {
          state.loading.deleteComment = true;
          state.error.deleteComment = null;
          const commentId = action.meta.arg;
          const updateComment = (comment: Comment) => {
            if (comment.Replies) {
              comment.Replies = comment.Replies.filter(
                (c) => c.CommentID !== commentId
              );
              comment.replyCount = comment.Replies.length;
            }
          };
          state.posts.forEach((post) => {
            if (post.Comments) {
              post.Comments = post.Comments.filter(
                (c) => c.CommentID !== commentId
              );
              post.commentCount = post.Comments.length;
              post.Comments.forEach(updateComment);
            }
          });
          state.explorePosts.forEach((post) => {
            if (post.Comments) {
              post.Comments = post.Comments.filter(
                (c) => c.CommentID !== commentId
              );
              post.commentCount = post.Comments.length;
              post.Comments.forEach(updateComment);
            }
          });
          state.flicks.forEach((post) => {
            if (post.Comments) {
              post.Comments = post.Comments.filter(
                (c) => c.CommentID !== commentId
              );
              post.commentCount = post.Comments.length;
              post.Comments.forEach(updateComment);
            }
          });
          state.usersPosts.forEach((userPosts) => {
            userPosts.posts.forEach((post) => {
              if (post.Comments) {
                post.Comments = post.Comments.filter(
                  (c) => c.CommentID !== commentId
                );
                post.commentCount = post.Comments.length;
                post.Comments.forEach(updateComment);
              }
            });
          });
          state.savedPosts.forEach((post) => {
            if (post.Comments) {
              post.Comments = post.Comments.filter(
                (c) => c.CommentID !== commentId
              );
              post.commentCount = post.Comments.length;
              post.Comments.forEach(updateComment);
            }
          });
          if (state.currentPost?.Comments) {
            state.currentPost.Comments = state.currentPost.Comments.filter(
              (c) => c.CommentID !== commentId
            );
            state.currentPost.commentCount = state.currentPost.Comments.length;
            state.currentPost.Comments.forEach(updateComment);
          }
        }
      )
      .addCase(deleteCommentThunk.fulfilled, (state) => {
        state.loading.deleteComment = false;
      })
      .addCase(
        deleteCommentThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          state.loading.deleteComment = false;
          state.error.deleteComment =
            action.payload ?? "Failed to delete comment";
        }
      )
      // Save Post
      .addCase(
        savePostThunk.pending,
        (state, action: PayloadAction<void, string, { arg: number }>) => {
          state.loading.savePost = true;
          state.error.savePost = null;
          const postId = action.meta.arg;
          const toggleSave = (post: Post) => {
            if (post.PostID === postId) {
              post.isSaved = !post.isSaved;
              post.saveTime = post.isSaved
                ? new Date().toISOString()
                : undefined;
            }
          };
          state.posts.forEach(toggleSave);
          state.explorePosts.forEach(toggleSave);
          state.flicks.forEach(toggleSave);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(toggleSave)
          );
          state.savedPosts.forEach(toggleSave);
          if (state.currentPost) {
            toggleSave(state.currentPost);
          }
        }
      )
      .addCase(savePostThunk.fulfilled, (state) => {
        state.loading.savePost = false;
      })
      .addCase(
        savePostThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          state.loading.savePost = false;
          state.error.savePost = action.payload ?? "Failed to toggle save";
          const postId = action.meta.arg;
          const toggleSave = (post: Post) => {
            if (post.PostID === postId) {
              post.isSaved = !post.isSaved;
              post.saveTime = post.isSaved
                ? new Date().toISOString()
                : undefined;
            }
          };
          state.posts.forEach(toggleSave);
          state.explorePosts.forEach(toggleSave);
          state.flicks.forEach(toggleSave);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(toggleSave)
          );
          state.savedPosts.forEach(toggleSave);
          if (state.currentPost) {
            toggleSave(state.currentPost);
          }
        }
      )
      // Report Post
      .addCase(reportPostThunk.pending, (state) => {
        state.loading.reportPost = true;
        state.error.reportPost = null;
      })
      .addCase(reportPostThunk.fulfilled, (state) => {
        state.loading.reportPost = false;
      })
      .addCase(
        reportPostThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.reportPost = false;
          state.error.reportPost = action.payload ?? "Failed to report post";
        }
      )
      // Share Post
      .addCase(sharePostThunk.pending, (state) => {
        state.loading.sharePost = true;
        state.error.sharePost = null;
      })
      .addCase(
        sharePostThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            SimpleSuccessResponse,
            string,
            { arg: { postId: number } }
          >
        ) => {
          state.loading.sharePost = false;
          const postId = action.meta.arg.postId;
          const updatePost = (post: Post) => {
            if (post.PostID === postId) {
              post.shareCount += 1;
            }
          };
          state.posts.forEach(updatePost);
          state.explorePosts.forEach(updatePost);
          state.flicks.forEach(updatePost);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePost)
          );
          state.savedPosts.forEach(updatePost);
          if (state.currentPost && state.currentPost.PostID === postId) {
            updatePost(state.currentPost);
          }
        }
      )
      .addCase(
        sharePostThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.sharePost = false;
          state.error.sharePost = action.payload ?? "Failed to share post";
        }
      )
      // Get Post Likers
      .addCase(getPostLikersThunk.pending, (state) => {
        state.loading.getPostLikers = true;
        state.error.getPostLikers = null;
      })
      .addCase(
        getPostLikersThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            UsersResponse,
            string,
            {
              arg: {
                postId: number;
                params: { page?: number; limit?: number };
              };
            }
          >
        ) => {
          state.loading.getPostLikers = false;
          const postId = action.meta.arg.postId;
          const newLikers = action.payload.likers.map((user) => ({
            ...user,
            likedAt: user.likedAt || new Date().toISOString(),
          }));
          const updatePost = (post: Post) => {
            if (post.PostID === postId) {
              post.Likes = post.Likes || [];
              const existingUserIds = new Set(
                post.Likes.map((like) => like.userId)
              );
              const uniqueNewLikers = newLikers.filter(
                (like) => !existingUserIds.has(like.userId)
              );
              post.Likes = [...post.Likes, ...uniqueNewLikers];
            }
          };
          state.posts.forEach(updatePost);
          state.explorePosts.forEach(updatePost);
          state.flicks.forEach(updatePost);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePost)
          );
          state.savedPosts.forEach(updatePost);
          if (state.currentPost && state.currentPost.PostID === postId) {
            updatePost(state.currentPost);
          }
        }
      )
      .addCase(
        getPostLikersThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getPostLikers = false;
          state.error.getPostLikers =
            action.payload ?? "Failed to fetch post likers";
        }
      )
      // Get Post Comments
      .addCase(getPostCommentsThunk.pending, (state) => {
        state.loading.getPostComments = true;
        state.error.getPostComments = null;
      })
      .addCase(
        getPostCommentsThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            CommentsResponse,
            string,
            { arg: { postId: number } }
          >
        ) => {
          state.loading.getPostComments = false;
          const postId = action.meta.arg.postId;
          const newComments = action.payload.comments || [];
          const updatePostComments = (post: Post) => {
            if (post.PostID === postId) {
              post.Comments = post.Comments || [];
              const existingIds = new Set(
                post.Comments.map((c) => c.CommentID)
              );
              const uniqueNewComments = newComments.filter(
                (c) => !existingIds.has(c.CommentID)
              );
              post.Comments = [...post.Comments, ...uniqueNewComments];
            }
          };
          state.posts.forEach(updatePostComments);
          state.explorePosts.forEach(updatePostComments);
          state.flicks.forEach(updatePostComments);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePostComments)
          );
          state.savedPosts.forEach(updatePostComments);
          if (state.currentPost && state.currentPost.PostID === postId) {
            updatePostComments(state.currentPost);
          }
        }
      )
      .addCase(
        getPostCommentsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getPostComments = false;
          state.error.getPostComments =
            action.payload ?? "Failed to fetch post comments";
        }
      )
      // Get Comment Replies
      .addCase(getCommentRepliesThunk.pending, (state) => {
        state.loading.getCommentReplies = true;
        state.error.getCommentReplies = null;
      })
      .addCase(
        getCommentRepliesThunk.fulfilled,
        (
          state,
          action: PayloadAction<
            RepliesResponse,
            string,
            { arg: { commentId: number } }
          >
        ) => {
          state.loading.getCommentReplies = false;
          const commentId = action.meta.arg.commentId;
          const newReplies = action.payload.replies || [];
          const updateComment = (comment: Comment): Comment => {
            if (comment.CommentID === commentId) {
              comment.Replies = comment.Replies || [];
              const existingIds = new Set(
                comment.Replies.map((c) => c.CommentID)
              );
              const uniqueNewReplies = newReplies.filter(
                (c) => !existingIds.has(c.CommentID)
              );
              return {
                ...comment,
                Replies: [...comment.Replies, ...uniqueNewReplies],
              };
            }
            if (comment.Replies) {
              return {
                ...comment,
                Replies: comment.Replies.map(updateComment),
              };
            }
            return comment;
          };
          state.posts = state.posts.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          state.explorePosts = state.explorePosts.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          state.flicks = state.flicks.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          state.usersPosts = state.usersPosts.map((userPosts) => ({
            ...userPosts,
            posts: userPosts.posts.map((post) => ({
              ...post,
              Comments: post.Comments?.map(updateComment),
            })),
          }));
          state.savedPosts = state.savedPosts.map((post) => ({
            ...post,
            Comments: post.Comments?.map(updateComment),
          }));
          if (state.currentPost && state.currentPost.Comments) {
            state.currentPost.Comments =
              state.currentPost.Comments.map(updateComment);
          }
        }
      )
      .addCase(
        getCommentRepliesThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.getCommentReplies = false;
          state.error.getCommentReplies =
            action.payload ?? "Failed to fetch comment replies";
        }
      )
      // Record Batch Post Views
      .addCase(recordBatchPostViewsThunk.pending, (state) => {
        state.loading.recordBatchPostViews = true;
        state.error.recordBatchPostViews = null;
      })
      .addCase(recordBatchPostViewsThunk.fulfilled, (state) => {
        state.loading.recordBatchPostViews = false;
      })
      .addCase(
        recordBatchPostViewsThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading.recordBatchPostViews = false;
          state.error.recordBatchPostViews =
            action.payload ?? "Failed to record post views";
        }
      )
      // Handle Follow User from profileSlice
      .addCase(
        followUserThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          const updatePostLikes = (post: Post) => {
            if (post.Likes) {
              post.Likes = post.Likes.map((like) =>
                like.userId === userId ? { ...like, isFollowed: true } : like
              );
            }
          };
          state.posts.forEach(updatePostLikes);
          state.explorePosts.forEach(updatePostLikes);
          state.flicks.forEach(updatePostLikes);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePostLikes)
          );
          state.savedPosts.forEach(updatePostLikes);
          if (state.currentPost) {
            updatePostLikes(state.currentPost);
          }
        }
      )
      .addCase(
        followUserThunk.rejected,
        (
          state,
          action: PayloadAction<string | undefined, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          const updatePostLikes = (post: Post) => {
            if (post.Likes) {
              post.Likes = post.Likes.map((like) =>
                like.userId === userId ? { ...like, isFollowed: false } : like
              );
            }
          };
          state.posts.forEach(updatePostLikes);
          state.explorePosts.forEach(updatePostLikes);
          state.flicks.forEach(updatePostLikes);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePostLikes)
          );
          state.savedPosts.forEach(updatePostLikes);
          if (state.currentPost) {
            updatePostLikes(state.currentPost);
          }
        }
      )
      // Handle Unfollow User from profileSlice
      .addCase(
        unfollowUserThunk.fulfilled,
        (
          state,
          action: PayloadAction<SimpleSuccessResponse, string, { arg: number }>
        ) => {
          const userId = action.meta.arg;
          const updatePostLikes = (post: Post) => {
            if (post.Likes) {
              post.Likes = post.Likes.map((like) =>
                like.userId === userId ? { ...like, isFollowed: false } : like
              );
            }
          };
          state.posts.forEach(updatePostLikes);
          state.explorePosts.forEach(updatePostLikes);
          state.flicks.forEach(updatePostLikes);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePostLikes)
          );
          state.savedPosts.forEach(updatePostLikes);
          if (state.currentPost) {
            updatePostLikes(state.currentPost);
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
          const updatePostLikes = (post: Post) => {
            if (post.Likes) {
              post.Likes = post.Likes.map((like) =>
                like.userId === userId ? { ...like, isFollowed: true } : like
              );
            }
          };
          state.posts.forEach(updatePostLikes);
          state.explorePosts.forEach(updatePostLikes);
          state.flicks.forEach(updatePostLikes);
          state.usersPosts.forEach((userPosts) =>
            userPosts.posts.forEach(updatePostLikes)
          );
          state.savedPosts.forEach(updatePostLikes);
          if (state.currentPost) {
            updatePostLikes(state.currentPost);
          }
        }
      );
  },
});

export const { clearError, clearPosts } = postSlice.actions;

export default postSlice.reducer;