'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { FaArrowLeft, FaCheck, FaUpload, FaTimes } from 'react-icons/fa';
import { RootState, AppDispatch } from '@/store';
import { updateHighlightThunk } from '@/store/highlightSlice';
import { getMyStoriesThunk } from '@/store/storySlice';
import { UpdateHighlightRequest, Highlight } from '@/types/highlight';
import styles from './highlights.module.css';

/**
 * Props for the EditHighlightModal component.
 */
interface EditHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlight: Highlight; // The highlight to edit
  setIsAnyModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Constants for validation and configuration.
 */
const MAX_TITLE_LENGTH = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_STORIES = 20;
const STORIES_PER_PAGE = 15;
const SKELETON_COUNT = 9;

/**
 * EditHighlightModal component for editing an existing highlight in a multi-step process.
 * Steps: 1. Edit title, 2. Edit stories with tabbed navigation (Selected Stories or All Stories), 3. Choose cover (from stories or upload).
 * Optimized for performance, accessibility, backend compatibility, and styled with highlights.module.css.
 */
const EditHighlightModal: React.FC<EditHighlightModalProps> = memo(({ isOpen, onClose, highlight, setIsAnyModalOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { username } = useParams<{ username: string }>();
  const { myStories, hasMoreMyStories, loading: storyLoading, error: storyError } = useSelector(
    (state: RootState) => state.story
  );
  const { loading: highlightLoading, error: highlightError } = useSelector(
    (state: RootState) => state.highlight
  );

  // State for multi-step form
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState<string>(highlight.title);
  const [selectedStories, setSelectedStories] = useState<number[]>(highlight.stories.map((s) => s.storyId));
  const [coverImage, setCoverImage] = useState<File | undefined>(undefined);
  const [coverPreview, setCoverPreview] = useState<string | null>(highlight.coverImage);
  const [selectedCoverStoryId, setSelectedCoverStoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'selected' | 'all'>('selected'); // Tab state for story selection
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Memoized stories to prevent unnecessary re-renders
  const memoizedStories = useMemo(() => myStories, [myStories]);

  /**
   * Fetches stories for the current user with pagination.
   */
  const fetchMyStories = useCallback(() => {
    if (!username) return;
    dispatch(getMyStoriesThunk({ limit: STORIES_PER_PAGE, offset: (page - 1) * STORIES_PER_PAGE }));
  }, [dispatch, page, username]);

  // Fetch stories when on step 2 and All Stories tab is active
  useEffect(() => {
    if (step === 2 && activeTab === 'all' && username) {
      fetchMyStories();
    }
  }, [step, activeTab, fetchMyStories, username]);

  // Infinite scroll observer for loading more stories in All Stories tab
  useEffect(() => {
    if (step !== 2 || activeTab !== 'all' || !hasMoreMyStories || storyLoading.getMyStories) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [step, activeTab, hasMoreMyStories, storyLoading.getMyStories]);

  /**
   * Handles title input changes with character limit validation.
   * @param e - The input change event.
   */
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_TITLE_LENGTH) {
      setTitle(value);
    } else {
      toast.error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
    }
  }, []);

  /**
   * Toggles story selection for the highlight.
   * @param storyId - The ID of the story to select or deselect.
   */
  const handleToggleStory = useCallback((storyId: number) => {
    setSelectedStories((prev) => {
      if (prev.includes(storyId)) {
        return prev.filter((id) => id !== storyId);
      }
      if (prev.length >= MAX_STORIES) {
        toast.error(`Cannot select more than ${MAX_STORIES} stories`);
        return prev;
      }
      return [...prev, storyId];
    });
  }, []);

  /**
   * Converts a URL to a File object by fetching the image.
   * @param url - The URL of the image.
   * @param filename - The name to give the file.
   * @returns A File object or null if the fetch fails.
   */
  const urlToFile = useCallback(async (url: string, filename: string): Promise<File | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error converting URL to File:', error);
      toast.error('Failed to process selected cover image');
      return null;
    }
  }, []);

  /**
   * Handles cover image upload with validation for file type and size.
   * @param e - The file input change event.
   */
  const handleUploadCover = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Cover image must be under 5MB');
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, WebP allowed');
        return;
      }
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
      setSelectedCoverStoryId(null);
    }
  }, []);

  /**
   * Selects a story's media as the cover image and converts it to a File.
   * @param storyId - The ID of the story to use as cover.
   */
  const handleSelectCoverFromStory = useCallback(
    async (storyId: number) => {
      const story = memoizedStories.find((s) => s.storyId === storyId) || highlight.stories.find((s) => s.storyId === storyId);
      if (story) {
        const file = await urlToFile(story.mediaUrl, `story-${storyId}.${story.mediaUrl.split('.').pop()}`);
        if (file) {
          setCoverImage(file);
          setCoverPreview(story.mediaUrl);
          setSelectedCoverStoryId(storyId);
        }
      }
    },
    [memoizedStories, highlight.stories, urlToFile]
  );

  /**
   * Submits the highlight update request to the backend.
   */
  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }
    if (title.length < 2) {
      toast.error('Title must be at least 2 characters');
      return;
    }
    if (selectedStories.length === 0) {
      toast.error('Please select at least one story');
      return;
    }
    if (selectedStories.length > MAX_STORIES) {
      toast.error(`Cannot select more than ${MAX_STORIES} stories`);
      return;
    }
    if (!username) {
      toast.error('Username is required');
      return;
    }

    const request: UpdateHighlightRequest = {
      title,
      storyIds: selectedStories,
    };

    dispatch(updateHighlightThunk({ highlightId: highlight.highlightId, data: request, coverImage, username }))
      .unwrap()
      .then(() => {
        toast.success('Highlight updated successfully');
        onClose();
      })
      .catch((err) => {
        const errorMsg = Array.isArray(err?.errors)
          ? err.errors.map((e: { msg: string }) => e.msg).join('; ')
          : err?.message || 'Failed to update highlight';
        toast.error(errorMsg);
      });
  }, [dispatch, title, selectedStories, coverImage, username, highlight.highlightId, onClose]);

  /**
   * Handles navigation to the previous step or closes the modal.
   */
  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    } else {
      onClose();
    }
  }, [step, onClose]);

  // Display errors with toast
  useEffect(() => {
    if (storyError.getMyStories) {
      toast.error(storyError.getMyStories);
    }
    if (highlightError.updateHighlight) {
      toast.error(highlightError.updateHighlight);
    }
  }, [storyError.getMyStories, highlightError.updateHighlight]);

  // Focus modal for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
    if (isOpen ) {
      setIsAnyModalOpen(true);
    }
  }, [isOpen, setIsAnyModalOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Backspace' && step > 1) {
        handleBack();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleBack, step]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (coverPreview && coverImage && !selectedCoverStoryId) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview, coverImage, selectedCoverStoryId]);

  /**
   * Renders a skeleton loader for stories with improved visual effect.
   */
  const StorySkeleton = useMemo(
    () => (
      <div className={styles.highlights__skeleton}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className={styles.highlights__skeleton__item}>
            <div className="w-full h-48 rounded-lg bg-[var(--gray-light)] dark:bg-[var(--gray-dark-border)] animate-pulse" />
          </div>
        ))}
      </div>
    ),
    []
  );

  if (!isOpen) return null;

  return (
    <div
      className={`${styles["highlights__modal-overlay"]} ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${styles.highlights__modal} will-transform`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-highlight-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className={styles.highlights__modal__header}>
          <button
            onClick={handleBack}
            aria-label="Go back"
            className={styles.highlights__modal__button}
          >
            <FaArrowLeft size={20} />
          </button>
          <h2 id="edit-highlight-title" className={styles.highlights__modal__title}>
            Edit Highlight
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={styles.highlights__modal__button}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className={styles.highlights__modal__main}>
          {step === 1 && (
            <div className={styles.highlights__step}>
              <label htmlFor="highlight-title" className={styles.highlights__label}>
                Highlight Title
              </label>
              <input
                id="highlight-title"
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter highlight title"
                className={styles.highlights__input}
                aria-required="true"
                maxLength={MAX_TITLE_LENGTH}
                aria-describedby="title-char-count"
              />
              <p id="title-char-count" className={styles["highlights__char-count"]}>
                {title.length}/{MAX_TITLE_LENGTH} characters
              </p>
              <button
                onClick={() => setStep(2)}
                disabled={!title.trim() || title.length < 2}
                className={`${styles.highlights__button} ${styles["highlights__button--next"]}`}
                aria-label="Go to story selection"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.highlights__step}>
              <h3 className={styles.highlights__label}>Edit Stories</h3>
              <div className={styles.highlights__tabs}>
                <button
                  className={`${styles.highlights__tab} ${activeTab === 'selected' ? styles['highlights__tab--active'] : ''}`}
                  onClick={() => setActiveTab('selected')}
                  aria-selected={activeTab === 'selected'}
                  aria-controls="selected-stories-panel"
                  id="selected-stories-tab"
                >
                  Selected Stories
                </button>
                <button
                  className={`${styles.highlights__tab} ${activeTab === 'all' ? styles['highlights__tab--active'] : ''}`}
                  onClick={() => setActiveTab('all')}
                  aria-selected={activeTab === 'all'}
                  aria-controls="all-stories-panel"
                  id="all-stories-tab"
                >
                  All Stories
                </button>
              </div>

              <div className="mt-4 h-96">
                {/* Selected Stories Tab */}
                <div
                  id="selected-stories-panel"
                  role="tabpanel"
                  aria-labelledby="selected-stories-tab"
                  className={`${styles.highlights__tabpanel} ${activeTab === 'selected' ? 'block' : 'hidden'}`}
                >
                  <div className={styles.highlights__stories_grid}>
                    {highlight.stories
                      .filter((story) => selectedStories.includes(story.storyId))
                      .map((story) => {
                        const isSelected = selectedStories.includes(story.storyId);
                        const formattedDate = new Date(story.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <label
                            key={story.storyId}
                            className={`${styles.highlights__story} ${isSelected ? styles['highlights__story--selected'] : ''}`}
                            htmlFor={`story-checkbox-${story.storyId}`}
                            onClick={() => handleToggleStory(story.storyId)}
                            aria-label={`Remove story from ${formattedDate}`}
                          >
                            <div className={styles.highlights__story__date}>{formattedDate}</div>
                            <Image
                              src={story.mediaUrl}
                              alt={`Story from ${formattedDate}`}
                              width={150}
                              height={200}
                              className={styles.highlights__story__image}
                              loading="lazy"
                            />
                            <input
                              id={`story-checkbox-${story.storyId}`}
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStory(story.storyId)}
                              className="sr-only"
                              aria-hidden="true"
                            />
                            {isSelected && (
                              <div className={styles.highlights__story__check}>
                                <FaCheck size={16} />
                              </div>
                            )}
                          </label>
                        );
                      })}
                    {selectedStories.length === 0 && (
                      <p className="text-center text-[var(--gray-text-secondary)]">No stories selected</p>
                    )}
                  </div>
                </div>

                {/* All Stories Tab */}
                <div
                  id="all-stories-panel"
                  role="tabpanel"
                  aria-labelledby="all-stories-tab"
                  className={`${styles.highlights__tabpanel} ${activeTab === 'all' ? 'block' : 'hidden'}`}
                >
                  <div className={styles.highlights__stories_grid}>
                    {memoizedStories.length === 0 && storyLoading.getMyStories ? (
                      StorySkeleton
                    ) : (
                      memoizedStories.map((story) => {
                        const isSelected = selectedStories.includes(story.storyId);
                        const formattedDate = new Date(story.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <label
                            key={story.storyId}
                            className={`${styles.highlights__story} ${isSelected ? styles['highlights__story--selected'] : ''}`}
                            htmlFor={`story-checkbox-${story.storyId}`}
                            onClick={() => handleToggleStory(story.storyId)}
                            aria-label={`Select story from ${formattedDate}`}
                          >
                            <div className={styles.highlights__story__date}>{formattedDate}</div>
                            <Image
                              src={story.mediaUrl}
                              alt={`Story from ${formattedDate}`}
                              width={150}
                              height={200}
                              className={styles.highlights__story__image}
                              loading="lazy"
                            />
                            <input
                              id={`story-checkbox-${story.storyId}`}
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStory(story.storyId)}
                              className="sr-only"
                              aria-hidden="true"
                            />
                            {isSelected && (
                              <div className={styles.highlights__story__check}>
                                <FaCheck size={16} />
                              </div>
                            )}
                          </label>
                        );
                      })
                    )}
                    <div ref={sentinelRef} className="h-1" aria-hidden="true" />
                  </div>
                  {storyLoading.getMyStories && memoizedStories.length > 0 && (
                    <p className={styles.highlights__loading}>Loading more stories...</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={selectedStories.length === 0}
                className={`${styles.highlights__button} ${styles["highlights__button--next"]} mt-4`}
                aria-label="Go to cover selection"
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div className={styles.highlights__step}>
              <h3 className={styles.highlights__label}>Choose Cover</h3>
              <div className={styles.highlights__cover_grid}>
                {memoizedStories
                  .filter((story) => selectedStories.includes(story.storyId))
                  .map((story) => (
                    <button
                      key={story.storyId}
                      onClick={() => handleSelectCoverFromStory(story.storyId)}
                      className={`${styles.highlights__cover} ${
                        selectedCoverStoryId === story.storyId ? styles.highlights__cover__selected : ''
                      }`}
                      aria-label={`Select story ${story.storyId} as cover`}
                    >
                      <Image
                        src={story.mediaUrl}
                        alt={`Story ${story.storyId} cover`}
                        width={150}
                        height={200}
                        className={styles.highlights__cover__image}
                        loading="lazy"
                      />
                    </button>
                  ))}
              </div>
              <div>
                <label htmlFor="cover-upload" className={styles.highlights__upload_label}>
                  <FaUpload /> Upload Cover
                </label>
                <input
                  id="cover-upload"
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleUploadCover}
                  ref={fileInputRef}
                  className="hidden"
                  aria-label="Upload cover image"
                />
                {coverPreview && (
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    width={150}
                    height={200}
                    className={styles.highlights__cover_preview}
                  />
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={highlightLoading.updateHighlight}
                className={`${styles.highlights__button} ${styles["highlights__button--create"]}`}
                aria-label="Save changes"
              >
                {highlightLoading.updateHighlight ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EditHighlightModal.displayName = 'EditHighlightModal';
export default EditHighlightModal;
