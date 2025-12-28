// src/store/listenerMiddleware.ts
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { updateHasUnviewedStories } from "./profileSlice";
import type { RootState } from "./index";

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  predicate: (action) =>
    action.type === "story/recordStoryView/fulfilled",
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const storyFeed = state.story.storyFeed;

    storyFeed.forEach((item) => {
      const hasUnviewed = item.stories.some((s) => !s.isViewed && !s.isMine);

      if (item.username) {
        listenerApi.dispatch(
          updateHasUnviewedStories({
            username: item.username,
            hasUnviewedStories: hasUnviewed,
          })
        );
      }
    });
  },
});
