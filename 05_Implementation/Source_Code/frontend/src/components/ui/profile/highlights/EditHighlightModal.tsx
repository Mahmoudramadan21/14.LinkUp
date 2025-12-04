'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { FaArrowLeft, FaCheck, FaUpload, FaTimes } from 'react-icons/fa';
import { RootState, AppDispatch } from '@/store';
import { updateHighlightThunk } from '@/store/highlightSlice';
import { getMyStoriesThunk } from '@/store/storySlice';
import { setIsAnyModalOpen } from '@/store/uiSlice';
import { UpdateHighlightRequest, Highlight } from '@/types/highlight';
import styles from '@/app/(main)/[username]/profile.module.css';

/**
 * Props for the EditHighlightModal component.
 */
interface EditHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlight: Highlight;
}

/**
 * Configuration constants for validation and pagination.
 */
const MAX_TITLE_LENGTH = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_STORIES = 20;
const STORIES_PER_PAGE = 15;
const SKELETON_COUNT = 9;

/**
 * Modal for editing an existing highlight.
 * Features a 3-step wizard:
 * 1. Edit title
 * 2. Add/remove stories (with Selected/All tabs + infinite scroll)
 * 3. Change cover image
 */
const EditHighlightModal: React.FC<EditHighlightModalProps> = memo(
  ({ isOpen, onClose, highlight }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { username } = useParams<{ username: string }>();

    const { myStories, hasMoreMyStories, loading: storyLoading } = useSelector(
      (state: RootState) => state.story
    );
    const { loading: highlightLoading } = useSelector(
      (state: RootState) => state.highlight
    );

    // Form state
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [title, setTitle] = useState(highlight.title);
    const [selectedStories, setSelectedStories] = useState<number[]>(
      highlight.stories.map((s) => s.storyId)
    );
    const [coverImage, setCoverImage] = useState<File | undefined>(undefined);
    const [coverPreview, setCoverPreview] = useState<string | null>(highlight.coverImage);
    const [selectedCoverStoryId, setSelectedCoverStoryId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'selected' | 'all'>('selected');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const memoizedStories = useMemo(() => myStories, [myStories]);

    /**
     * Fetch user's stories when "All Stories" tab is active.
     */
    const fetchMyStories = useCallback(() => {
      if (!username) return;
      dispatch(
        getMyStoriesThunk({
          limit: STORIES_PER_PAGE,
          offset: (page - 1) * STORIES_PER_PAGE,
        })
      );
    }, [dispatch, username, page]);

    // Load stories when viewing "All" tab
    useEffect(() => {
      if (step === 2 && activeTab === 'all' && username) {
        fetchMyStories();
      }
    }, [step, activeTab, fetchMyStories, username]);

    // Infinite scroll for "All Stories" tab
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
     * Update title with character limit.
     */
    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_TITLE_LENGTH) {
        setTitle(value);
      }
    }, []);

    /**
     * Add or remove a story from selection.
     */
    const handleToggleStory = useCallback((storyId: number) => {
      setSelectedStories((prev) => {
        if (prev.includes(storyId)) {
          return prev.filter((id) => id !== storyId);
        }
        if (prev.length >= MAX_STORIES) {
          return prev; 
        }
        return [...prev, storyId];
      });
    }, []);

    /**
     * Convert image URL to File for upload.
     */
    const urlToFile = useCallback(async (url: string, filename: string): Promise<File | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type });
      } catch {
        return null;
      }
    }, []);

    /**
     * Handle custom cover upload with validation.
     */
    const handleUploadCover = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) return;
      if (!ALLOWED_FILE_TYPES.includes(file.type)) return;

      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
      setSelectedCoverStoryId(null);
    }, []);

    /**
     * Use a story as the new cover.
     */
    const handleSelectCoverFromStory = useCallback(
      async (storyId: number) => {
        const story =
          memoizedStories.find((s) => s.storyId === storyId) ||
          highlight.stories.find((s) => s.storyId === storyId);
        if (!story) return;

        const file = await urlToFile(story.mediaUrl, `cover-${storyId}`);
        if (file) {
          setCoverImage(file);
          setCoverPreview(story.mediaUrl);
          setSelectedCoverStoryId(storyId);
        }
      },
      [memoizedStories, highlight.stories, urlToFile]
    );

    /**
     * Submit updated highlight data.
     */
    const handleSubmit = useCallback(() => {
      if (!title.trim() || title.length < 2) return;
      if (selectedStories.length === 0 || selectedStories.length > MAX_STORIES) return;
      if (!username) return;

      onClose();

      const request: UpdateHighlightRequest = {
        title,
        storyIds: selectedStories,
      };

      dispatch(
        updateHighlightThunk({
          highlightId: highlight.highlightId,
          data: request,
          coverImage,
          username,
        })
      )
        .unwrap()
    }, [
      dispatch,
      title,
      selectedStories,
      coverImage,
      username,
      highlight.highlightId,
      onClose,
    ]);

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

  // Focus modal for accessibility and update isAnyModalOpen
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
      dispatch(setIsAnyModalOpen(true));
    }

    // Cleanup function runs when modal unmounts or closes
    return () => {
      dispatch(setIsAnyModalOpen(false));
    };
  }, [isOpen, dispatch]);

    // Keyboard navigation
    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'Backspace' && step > 1) handleBack();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, handleBack, step]);

    // Cleanup preview URL
    useEffect(() => {
      return () => {
        if (coverPreview && coverImage && !selectedCoverStoryId) {
          URL.revokeObjectURL(coverPreview);
        }
      };
    }, [coverPreview, coverImage, selectedCoverStoryId]);
    
    // Prevent body scroll while viewer is open
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, []);

    // Skeleton loader
    const StorySkeleton = useMemo(
      () =>
        Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="w-full h-[200px] rounded-lg animate-pulse bg-neutral-gray"
          />
        )),
      []
    );

    if (!isOpen) return null;

    return (
      <div
        className={`${styles['highlights__modal-overlay']} ${isOpen ? 'opacity-100' : 'opacity-0'} bg-overlay`}
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
          {/* Header */}
          <div className={styles.highlights__modal__header}>
            <button onClick={handleBack} aria-label="Go back" className={styles.highlights__modal__button}>
              <FaArrowLeft size={20} />
            </button>
            <h2 id="edit-highlight-title" className={styles.highlights__modal__title}>
              Edit Highlight
            </h2>
            <button onClick={onClose} aria-label="Close modal" className={styles.highlights__modal__button}>
              <FaTimes size={20} />
            </button>
          </div>

          {/* Main Content */}
          <div className={styles.highlights__modal__main}>
            {/* Step 1: Title */}
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
                <p id="title-char-count" className={styles['highlights__char-count']}>
                  {title.length}/{MAX_TITLE_LENGTH} characters
                </p>
                <button
                  onClick={() => setStep(2)}
                  disabled={!title.trim() || title.length < 2}
                  className={`${styles.highlights__button} ${styles['highlights__button--next']}`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 2: Edit Stories */}
            {step === 2 && (
              <div className={styles.highlights__step}>
                <h3 className={styles.highlights__label}>Edit Stories</h3>

                {/* Tabs */}
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
                  {/* Selected Stories */}
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
                          const formattedDate = new Date(story.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });

                          return (
                            <label
                              key={story.storyId}
                              className={`${styles.highlights__story} ${selectedStories.includes(story.storyId) ? styles['highlights__story--selected'] : ''}`}
                              htmlFor={`story-checkbox-${story.storyId}`}
                              onClick={() => handleToggleStory(story.storyId)}
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
                                checked={selectedStories.includes(story.storyId)}
                                onChange={() => handleToggleStory(story.storyId)}
                                className="sr-only"
                                aria-hidden="true"
                              />
                              {selectedStories.includes(story.storyId) && (
                                <div className={styles.highlights__story__check}>
                                  <FaCheck size={16} />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      {selectedStories.length === 0 && (
                        <p className="text-center text-[var(--text-secondary)]">No stories selected</p>
                      )}
                    </div>
                  </div>

                  {/* All Stories */}
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
                  className={`${styles.highlights__button} ${styles['highlights__button--next']} mt-12`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 3: Choose Cover */}
            {step === 3 && (
              <div className={styles.highlights__step}>
                <h3 className={styles.highlights__label}>Choose Cover</h3>

                <div className={styles.highlights__stories_grid}>
                  {memoizedStories
                    .filter((story) => selectedStories.includes(story.storyId))
                    .map((story) => (
                      <button
                        key={story.storyId}
                        onClick={() => handleSelectCoverFromStory(story.storyId)}
                        className={`${styles.highlights__story} ${
                          selectedCoverStoryId === story.storyId
                            ? styles['highlights__story--selected']
                            : ''
                        }`}
                      >
                        <Image
                          src={story.mediaUrl}
                          alt="Use as cover"
                          width={150}
                          height={200}
                          className={styles.highlights__story__image}
                          loading="lazy"
                        />
                      </button>
                    ))}
                </div>

                <div>
                  <label htmlFor="cover-upload" className={styles['highlights__cover_label']}>
                    <FaUpload /> Upload Cover
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={handleUploadCover}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>

                {coverPreview && (
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    width={150}
                    height={200}
                    className={styles.highlights__cover_preview}
                  />
                )}

                <button
                  onClick={handleSubmit}
                  disabled={highlightLoading.updateHighlight}
                  className={`${styles.highlights__button} ${styles['highlights__button--create']}`}
                >
                  {highlightLoading.updateHighlight ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EditHighlightModal.displayName = 'EditHighlightModal';

export default EditHighlightModal;