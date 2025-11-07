import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import postReducer from "./postSlice";
import storyReducer from "./storySlice";
import profileReducer from "./profileSlice";
import highlightReducer from "./highlightSlice";
import messageSlice from "./messageSlice";
import uiReducer from "./uiSlice";

/**
 * Configures the Redux store with auth reducer
 */
const store = configureStore({
  reducer: {
    auth: authReducer,
    post: postReducer,
    story: storyReducer,
    profile: profileReducer,
    highlight: highlightReducer,
    message: messageSlice,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
