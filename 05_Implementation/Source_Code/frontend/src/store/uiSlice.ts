// store/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isAnyModalOpen: boolean;
  isMobileMessagesSidebarOpen: boolean;
  isVideoMuted: boolean;
  currentPlayingVideoId: number | null;
}

const initialState: UiState = {
  isAnyModalOpen: false,
  isMobileMessagesSidebarOpen: false,
  isVideoMuted: true, // Default to muted for better UX and autoplay compatibility
  currentPlayingVideoId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsAnyModalOpen(state, action: PayloadAction<boolean>) {
      state.isAnyModalOpen = action.payload;
    },
    setIsMobileMessagesSidebarOpen(state, action: PayloadAction<boolean>) {
      state.isMobileMessagesSidebarOpen = action.payload;
    },
    setIsVideoMuted(state, action: PayloadAction<boolean>) {
      state.isVideoMuted = action.payload;
    },
    setCurrentPlayingVideoId(state, action: PayloadAction<number | null>) {
      state.currentPlayingVideoId = action.payload;
    },
  },
});

export const { setIsAnyModalOpen, setIsMobileMessagesSidebarOpen, setIsVideoMuted, setCurrentPlayingVideoId } = uiSlice.actions;
export default uiSlice.reducer;