export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_CODE: "/auth/verify-code",
  RESET_PASSWORD: "/auth/reset-password",
  REFRESH_TOKEN: "/auth/refresh-token", // Added refresh token endpoint
  // Posts
  CREATE_POST: "/posts",
  GET_POSTS: "/posts",
  GET_POST: "/posts/:postId",
  UPDATE_POST: "/posts/:postId",
  DELETE_POST: "/posts/:postId",
  LIKE_POST: "/posts/:postId/like",
  COMMENT_POST: "/posts/:postId/comment",
  SAVE_POST: "/posts/:postId/save",
  REPORT_POST: "/posts/:postId/report",
  // Stories
  CREATE_STORY: "/stories",
  GET_USER_STORIES: "/stories/user/:userId",
  GET_STORY_ANALYTICS: "/stories/:storyId/views",
  GET_STORIES_FEED: "/stories/feed",
  GET_STORY: "/stories/:storyId",
  DELETE_STORY: "/stories/:storyId",
  LIKE_STORY: "/stories/:storyId/like",
  // Profile
  GET_PROFILE: "/profile",
  DELETE_PROFILE: "/profile",
  UPDATE_PROFILE: "/profile/edit",
  CHANGE_PASSWORD: "/profile/change-password",
  UPDATE_PRIVACY: "/profile/privacy",
  GET_USER_POSTS: "/profile/posts/:userId",
  GET_USER_STORIES: "/profile/stories",
  GET_SAVED_POSTS: "/profile/saved-posts",
  FOLLOW_USER: "/profile/follow/:userId",
  GET_FOLLOW_REQUESTS: "/profile/follow-requests/pending",
  ACCEPT_FOLLOW_REQUEST: "/profile/follow-requests/:requestId/accept",
  REJECT_FOLLOW_REQUEST: "/profile/follow-requests/:requestId/reject",
  UNFOLLOW_USER: "/profile/unfollow/:userId",
  GET_FOLLOWERS: "/profile/followers/:userId",
  GET_FOLLOWING: "/profile/following/:userId",
} as const;

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Validation error",
  INVALID_CREDENTIALS: "Invalid credentials",
  TOO_MANY_ATTEMPTS: "Too many login attempts, please try again after 15 minutes",
  SERVER_ERROR: "Internal server error",
} as const;