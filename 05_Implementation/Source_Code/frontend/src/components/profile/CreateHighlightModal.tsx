'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { FaArrowLeft, FaCheck, FaUpload, FaTimes } from 'react-icons/fa';
import { RootState, AppDispatch } from '@/store';
import { createHighlightThunk } from '@/store/highlightSlice';
import { getMyStoriesThunk } from '@/store/storySlice';
import { CreateHighlightRequest } from '@/types/highlight';
import styles from './highlights.module.css';

/**
 * Props for the CreateHighlightModal component.
 */
interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Constants for validation and configuration.
 */
const MAX_TITLE_LENGTH = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_STORIES = 20;
const STORIES_PER_PAGE = 15;
const SKELETON_COUNT = 9; // Increased for better visual effect

/**
 * CreateHighlightModal component for creating a new highlight in a multi-step process.
 * Steps: 1. Enter title, 2. Select stories with infinite scroll, 3. Choose cover (from selected stories or upload).
 * Optimized for performance, accessibility, backend compatibility, and styled with highlights.module.css.
 */
const CreateHighlightModal: React.FC<CreateHighlightModalProps> = memo(({ isOpen, onClose }) => {
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
  const [title, setTitle] = useState<string>('');
  const [selectedStories, setSelectedStories] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedCoverStoryId, setSelectedCoverStoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
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

  // Fetch stories when on step 2
  useEffect(() => {
    if (step === 2 && username) {
      fetchMyStories();
    }
  }, [step, fetchMyStories, username]);

  // Infinite scroll observer for loading more stories
  useEffect(() => {
    if (step !== 2 || !hasMoreMyStories || storyLoading.getMyStories) return;

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
  }, [step, hasMoreMyStories, storyLoading.getMyStories]);

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
  const handleSelectStory = useCallback((storyId: number) => {
    setSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
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
      const story = memoizedStories.find((s) => s.storyId === storyId);
      if (story) {
        const file = await urlToFile(story.mediaUrl, `story-${storyId}.${story.mediaUrl.split('.').pop()}`);
        if (file) {
          setCoverImage(file);
          setCoverPreview(story.mediaUrl);
          setSelectedCoverStoryId(storyId);
        }
      }
    },
    [memoizedStories, urlToFile]
  );

  /**
   * Submits the highlight creation request to the backend.
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
    if (!coverImage) {
      toast.error('Please select or upload a cover image');
      return;
    }

    const request: CreateHighlightRequest = {
      title,
      storyIds: selectedStories,
    };

    dispatch(createHighlightThunk({ data: request, coverImage, username }))
      .unwrap()
      .then(() => {
        toast.success('Highlight created successfully');
        onClose();
      })
      .catch((err) => {
        const errorMsg = Array.isArray(err?.errors)
          ? err.errors.map((e: { msg: string }) => e.msg).join('; ')
          : err?.message || 'Failed to create highlight';
        toast.error(errorMsg);
      });
  }, [dispatch, title, selectedStories, coverImage, username, onClose]);

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
    if (highlightError.createHighlight) {
      toast.error(highlightError.createHighlight);
    }
  }, [storyError.getMyStories, highlightError.createHighlight]);

  // Focus modal for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

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
            <div className="w-full h-full rounded-lg bg-[var(--gray-light)] dark:bg-[var(--gray-dark-border)] animate-pulse" />
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
        aria-labelledby="create-highlight-title"
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
          <h2 id="create-highlight-title" className={styles.highlights__modal__title}>
            Create New Highlight
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
              <h3 className={styles.highlights__label}>Select Stories</h3>
              <div className={styles["highlights__stories-grid"]}>
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
                        onClick={() => handleSelectStory(story.storyId)}
                        aria-label={`Select story from ${formattedDate}`}
                      >
                        <div className={styles.highlights__story__date}>
                          {formattedDate}
                        </div>
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
                          onChange={() => handleSelectStory(story.storyId)}
                          className="sr-only" // Hide visually but keep for accessibility
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
              <button
                onClick={() => setStep(3)}
                disabled={selectedStories.length === 0}
                className={`${styles.highlights__button} ${styles["highlights__button--next"]}`}
                aria-label="Go to cover selection"
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div className={styles.highlights__step}>
              <h3 className={styles.highlights__label}>Choose Cover</h3>
              <div className={styles["highlights__cover-grid"]}>
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
                <label htmlFor="cover-upload" className={styles["highlights__upload-label"]}>
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
                    className={styles["highlights__cover-preview"]}
                  />
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={highlightLoading.createHighlight || !coverImage}
                className={`${styles.highlights__button} ${styles["highlights__button--create"]}`}
                aria-label="Create highlight"
              >
                {highlightLoading.createHighlight ? 'Creating...' : 'Create'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CreateHighlightModal.displayName = 'CreateHighlightModal';
export default CreateHighlightModal;