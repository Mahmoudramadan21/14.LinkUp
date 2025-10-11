'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from '@/app/feed/feed.module.css';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';
import { ReportPostFormData, reportPostSchema } from '@/utils/validationSchemas';
import { reportStoryThunk } from '@/store/storySlice';
import { AppDispatch } from '@/store';

/**
 * Props for the StoryReportModal component.
 */
interface StoryReportModalProps {
  isOpen: boolean;
  storyId: number | null;
  onClose: () => void;
}

/**
 * StoryReportModal component for reporting a story with a form.
 * Optimized for accessibility, performance, and form validation.
 */
const StoryReportModal: React.FC<StoryReportModalProps> = React.memo(({ isOpen, storyId, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportPostFormData>({
    resolver: zodResolver(reportPostSchema),
    defaultValues: { reason: 'SPAM' }, // Set default value for better UX
  });

  // Handle form submission
  const onSubmit: SubmitHandler<ReportPostFormData> = useCallback(
    async (data) => {
      try {
        if (storyId) {
          await dispatch(reportStoryThunk({ storyId, data })).unwrap();
          reset();
          onClose();
        }
      } catch (error) {
        console.error('Failed to report story:', error);
      }
    },
    [dispatch, storyId, onClose, reset]
  );

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation (e.g., Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.feed__report_modal_overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.feed__report_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="report-modal-title" className={styles.feed__report_modal_title}>
            Report Story
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1"
            aria-label="Close report story modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles.feed__report_form}
          aria-label="Report story form"
        >
          <fieldset className={styles.feed__report_options}>
            <legend className={styles.feed__report_title}>Select Reason</legend>
            {[
              { value: 'SPAM', label: 'Spam' },
              { value: 'HARASSMENT', label: 'Harassment' },
              { value: 'INAPPROPRIATE', label: 'Inappropriate' },
              { value: 'OTHER', label: 'Other' },
            ].map(({ value, label }) => (
              <label key={value} className={styles.feed__report_label}>
                <input
                  type="radio"
                  {...register('reason')}
                  value={value}
                  aria-label={`Select ${label} as report reason`}
                />
                {label}
              </label>
            ))}
          </fieldset>
          {errors.reason && (
            <p id="report-error" className={styles.feed__error} role="alert">
              {errors.reason.message}
            </p>
          )}
          <div className={styles.feed__report_modal_buttons}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__report_button} ${isSubmitting ? styles.feed__report_button_disabled : ''}`}
              aria-label="Submit story report"
            >
              <span className="flex items-center justify-center gap-2">
                Submit Report <FaPaperPlane />
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.feed__report_cancel_button}
              aria-label="Cancel story report"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

StoryReportModal.displayName = 'StoryReportModal';

export default StoryReportModal;