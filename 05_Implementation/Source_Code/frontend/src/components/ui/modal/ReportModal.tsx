import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import { FaTimes, FaSpinner } from "react-icons/fa";

import { ReportPostFormData, reportPostSchema } from "@/utils/validationSchemas";
import { reportPostThunk } from "@/store/postSlice";

interface ReportModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
  loadingState?: boolean;
}

/**
 * ReportModal Component
 * Allows users to report a post by selecting a predefined reason.
 * Uses react-hook-form with Zod validation and dispatches a Redux thunk on submission.
 */
const ReportModal: React.FC<ReportModalProps> = ({ isOpen, postId, onClose, loadingState }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportPostFormData>({
    resolver: zodResolver(reportPostSchema),
  });

  /**
   * Handles form submission: reports the post via Redux thunk,
   * resets the form, and closes the modal on success.
   */
  const onSubmit: SubmitHandler<ReportPostFormData> = async (data) => {
    if (!postId) return;

    try {
      await dispatch(reportPostThunk({ postId, data }) as any).unwrap();
      reset();
      onClose();
    } catch {
      // Error is silently handled – no console output in production
    }
  };

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Do not render if modal is closed
  if (!isOpen) return null;

  return (
    <div
      className={styles.feed__report_modal_overlay}
      onClick={onClose}
      role="presentation"
    >
      {/* Modal content – stops click propagation to prevent closing when clicking inside */}
      <div
        className={styles.feed__report_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        tabIndex={-1}
      >
        {/* Header: Title + Close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 id="report-modal-title" className={styles.feed__report_modal_title}>
            Report Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1"
            aria-label="Close report modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Report form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles.feed__report_form}
          aria-label="Report post form"
        >
          {/* Reason selection */}
          <fieldset className={styles.feed__report_options}>
            <legend className={styles.feed__report_title}>
              Select Reason:
            </legend>

            <label className={styles.feed__report_label}>
              <input type="radio" {...register("reason")} value="SPAM" />
              Spam
            </label>

            <label className={styles.feed__report_label}>
              <input type="radio" {...register("reason")} value="HARASSMENT" />
              Harassment
            </label>

            <label className={styles.feed__report_label}>
              <input type="radio" {...register("reason")} value="INAPPROPRIATE" />
              Inappropriate
            </label>

            <label className={styles.feed__report_label}>
              <input type="radio" {...register("reason")} value="OTHER" />
              Other
            </label>
          </fieldset>

          {/* Validation error message for reason field */}
          {errors.reason && (
            <p id="report-error" className={styles.feed__error}>
              {errors.reason.message}
            </p>
          )}

          {/* Action buttons */}
          <div className={styles.feed__report_modal_buttons}>
            <button
              type="submit"
              className={styles.feed__report_button}
              aria-label="Submit report"
            >
              <span className="flex items-center justify-center gap-2">
                {loadingState ? (
                  <>
                    <FaSpinner className="animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </span>
            </button>

            <button
              onClick={onClose}
              className={styles.feed__report_cancel_button}
              aria-label="Cancel report"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;