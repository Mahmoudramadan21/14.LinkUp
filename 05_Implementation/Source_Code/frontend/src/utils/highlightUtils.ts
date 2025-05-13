/*
 * Utility functions for highlight and story navigation
 * Handles advancing and retreating through stories and highlights
 */
import { Story, Highlight } from '@/components/StoryViewer';

/*
 * Advances to the next story or highlight
 */
export const handleNextStory = (
  highlights: Highlight[],
  currentHighlightIndex: number,
  currentStoryIndex: number,
  setCurrentHighlightIndex: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStoryIndex: React.Dispatch<React.SetStateAction<number>>
): void => {
  const currentHighlight = highlights[currentHighlightIndex];
  if (currentStoryIndex + 1 < currentHighlight.stories.length) {
    setCurrentStoryIndex(currentStoryIndex + 1);
  } else if (currentHighlightIndex + 1 < highlights.length) {
    setCurrentHighlightIndex(currentHighlightIndex + 1);
    setCurrentStoryIndex(0);
  } else {
    setCurrentHighlightIndex(0);
    setCurrentStoryIndex(0);
  }
};

/*
 * Retreats to the previous story or highlight
 */
export const handlePrevStory = (
  highlights: Highlight[],
  currentHighlightIndex: number,
  currentStoryIndex: number,
  setCurrentHighlightIndex: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStoryIndex: React.Dispatch<React.SetStateAction<number>>
): void => {
  if (currentStoryIndex > 0) {
    setCurrentStoryIndex(currentStoryIndex - 1);
  } else if (currentHighlightIndex > 0) {
    setCurrentHighlightIndex(currentHighlightIndex - 1);
    setCurrentStoryIndex(highlights[currentHighlightIndex - 1].stories.length - 1);
  }
};

/*
 * Advances to the next story within the current highlight
 */
export const handleNextStoryInHighlight = (
  highlights: Highlight[],
  currentHighlightIndex: number,
  currentStoryIndex: number,
  setCurrentHighlightIndex: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStoryIndex: React.Dispatch<React.SetStateAction<number>>
): void => {
  const currentHighlight = highlights[currentHighlightIndex];
  if (currentStoryIndex + 1 < currentHighlight.stories.length) {
    setCurrentStoryIndex(currentStoryIndex + 1);
  } else if (currentHighlightIndex + 1 < highlights.length) {
    setCurrentHighlightIndex(currentHighlightIndex + 1);
    setCurrentStoryIndex(0);
  }
};

/*
 * Retreats to the previous story within the current highlight
 */
export const handlePrevStoryInHighlight = (
  highlights: Highlight[],
  currentHighlightIndex: number,
  currentStoryIndex: number,
  setCurrentHighlightIndex: React.Dispatch<React.SetStateAction<number>>,
  setCurrentStoryIndex: React.Dispatch<React.SetStateAction<number>>
): void => {
  if (currentStoryIndex > 0) {
    setCurrentStoryIndex(currentStoryIndex - 1);
  } else if (currentHighlightIndex > 0) {
    setCurrentHighlightIndex(currentHighlightIndex - 1);
    setCurrentStoryIndex(highlights[currentHighlightIndex - 1].stories.length - 1);
  }
};