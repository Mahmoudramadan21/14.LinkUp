import { combineReducers } from "@reduxjs/toolkit";
import authReducer, { logoutThunk } from "./authSlice";
import postReducer from "./postSlice";
import storyReducer from "./storySlice";
import profileReducer from "./profileSlice";
import highlightReducer from "./highlightSlice";
import notificationReducer from "./notificationSlice";
import messageReducer from "./messageSlice";
import uiReducer from "./uiSlice";

const appReducer = combineReducers({
  auth: authReducer,
  post: postReducer,
  story: storyReducer,
  profile: profileReducer,
  highlight: highlightReducer,
  notification: notificationReducer,
  message: messageReducer,
  ui: uiReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === logoutThunk.fulfilled.type) {
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;
