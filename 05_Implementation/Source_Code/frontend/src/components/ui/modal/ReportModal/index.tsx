import React from "react";
import { useDispatch } from "react-redux";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "@/app/feed/feed.module.css";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import { ReportPostFormData, reportPostSchema } from "@/utils/validationSchemas";
import { reportPostThunk } from "@/store/postSlice";

interface ReportModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  postId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportPostFormData>({
    resolver: zodResolver(reportPostSchema),
  });

  const onSubmit: SubmitHandler<ReportPostFormData> = async (data) => {
    try {
      if (postId) {
        await dispatch(reportPostThunk({ postId, data }) as any).unwrap();
        reset();
        onClose();
      }
    } catch (error) {
      console.error("Failed to report post:", error);
    }
  };

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
      >
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${styles.feed__report_form}`}
          aria-label="Report post form"
        >
          <fieldset className={styles.feed__report_options}>
            <legend className={styles.feed__report_title}>
              Select Reason:
            </legend>
            <label className={styles.feed__report_label}>
              <input
                type="radio"
                {...register("reason")}
                value="SPAM"
              />
              Spam
            </label>
            <label className={styles.feed__report_label}>
              <input
                type="radio"
                {...register("reason")}
                value="HARASSMENT"
              />
              Harassment
            </label>
            <label className={styles.feed__report_label}>
              <input
                type="radio"
                {...register("reason")}
                value="INAPPROPRIATE"
              />
              Inappropriate
            </label>
            <label className={styles.feed__report_label}>
              <input
                type="radio"
                {...register("reason")}
                value="OTHER"
              />
              Other
            </label>
          </fieldset>
          {errors.reason && (
            <p id="report-error" className={`${styles.feed__error}`}>
              {errors.reason.message}
            </p>
          )}
          <div className={styles.feed__report_modal_buttons}>
            <button
              type="submit"
              disabled={false}
              className={`${styles.feed__report_button}`}
              aria-label="Submit report"
            >
              <span className="flex items-center justify-center gap-2">
                Submit Report <FaPaperPlane />
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