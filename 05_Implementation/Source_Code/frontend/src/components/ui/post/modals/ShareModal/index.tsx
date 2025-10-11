import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "@/app/feed/feed.module.css";
import { FaTimes, FaPaperPlane, FaShare, FaCopy } from "react-icons/fa";
import { Post as PostType } from "@/types/post";
import { SharePostFormData, sharePostSchema } from "@/utils/validationSchemas";
import { sharePostThunk } from "@/store/postSlice";

interface ShareModalProps {
  isOpen: boolean;
  post: PostType | undefined;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, post, onClose }) => {
  const dispatch = useDispatch();
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SharePostFormData>({
    resolver: zodResolver(sharePostSchema),
  });

  const onSubmit: SubmitHandler<SharePostFormData> = async (data) => {
    try {
      if (post) {
        await dispatch(sharePostThunk({ postId: post.PostID, data }) as any).unwrap();
        setShareStatus("Reposted successfully!");
        setTimeout(() => setShareStatus(null), 2000);
        reset();
        onClose();
      }
    } catch (error) {
      console.error("Failed to share post:", error);
      setShareStatus("Failed to repost. Please try again.");
      setTimeout(() => setShareStatus(null), 2000);
    }
  };

  const fallbackCopyText = (text: string): boolean => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.error("Fallback copy failed:", err);
      document.body.removeChild(textarea);
      return false;
    }
  };

  const handleNativeShare = async () => {
    if (!post) {
      setShareStatus("Post not found.");
      setTimeout(() => setShareStatus(null), 3000);
      return;
    }

    const shareUrl = `${window.location.origin}/post/${post.PostID}`;
    const shareData: ShareData = {
      title: `Post by ${post.User.Username}`,
      text: post.Content || "Check out this awesome post!",
      url: shareUrl,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        setShareStatus("Opening share menu...");
        await navigator.share(shareData);
        setShareStatus("Shared successfully!");
        setTimeout(() => setShareStatus(null), 2000);
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareStatus("Link copied to clipboard!");
          setTimeout(() => setShareStatus(null), 2000);
        } catch (clipboardError) {
          console.error("Clipboard copy failed:", clipboardError);
          setShareUrl(shareUrl);
          setShareStatus(
            "Share API not supported and clipboard copy failed. Please copy the link manually."
          );
          setTimeout(() => setShareStatus(null), 4000);
        }
      }
    } catch (shareError) {
      console.error("Failed to share post:", shareError);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Share failed. Link copied to clipboard!");
        setTimeout(() => setShareStatus(null), 2000);
      } catch (clipboardError) {
        console.error("Clipboard copy failed after share error:", clipboardError);
        setShareUrl(shareUrl);
        setShareStatus("Share failed. Please copy the link manually.");
        setTimeout(() => setShareStatus(null), 4000);
      }
    }
  };

  const handleCopyLink = async () => {
    if (!post) return;

    const url = `${window.location.origin}/post/${post.PostID}`;
    setShareUrl(url);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied to clipboard!");
        setShareUrl(null);
        setTimeout(() => setShareStatus(null), 2000);
      } catch (error) {
        console.error("Failed to copy link:", error);
        const success = fallbackCopyText(url);
        setShareStatus(
          success
            ? "Link copied to clipboard!"
            : "Copy failed. Please copy the link manually."
        );
        setTimeout(() => setShareStatus(null), 3000);
      }
    } else {
      const success = fallbackCopyText(url);
      setShareStatus(
        success
          ? "Link copied to clipboard!"
          : "Copy failed. Please copy the link manually."
      );
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  if (!isOpen || !post) return null;

  const renderPostContent = (postData: PostType) => (
    <div className={`${styles.feed__post_content_wrapper}`}>
      {postData.Content && (
        <p className={`${styles.feed__post_content}`}>{postData.Content}</p>
      )}
    </div>
  );

  return (
    <div
      className={styles.feed__share_modal_overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.feed__share_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="share-modal-title" className={styles.feed__share_modal_title}>
            Share This Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1"
            aria-label="Close share modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Preview</h3>
          {post.SharedPost ? renderPostContent(post.SharedPost) : renderPostContent(post)}
        </div>
        {shareStatus && (
          <p
            className={`${
              shareStatus.includes("Failed") || shareStatus.includes("failed")
                ? styles.feed__error
                : styles.feed__success
            } text-center mb-4`}
            role="alert"
          >
            {shareStatus}
          </p>
        )}
        {shareUrl && (
          <div className="mb-4">
            <p className={`${styles.feed__error} text-center text-sm`}>
              Please copy this link manually:
            </p>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={`${styles.feed__share_input} w-full text-center mt-2`}
              onClick={(e) => e.currentTarget.select()}
              aria-label="Post URL for manual copying"
            />
          </div>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${styles.feed__share_form} mb-4`}
          aria-label="Repost with caption form"
        >
          <textarea
            {...register("caption")}
            placeholder="Add a caption to your repost..."
            className={`${styles.feed__share_input}`}
            aria-invalid={errors.caption ? "true" : "false"}
            aria-describedby={errors.caption ? "share-error" : undefined}
          />
          {errors.caption && (
            <p id="share-error" className={`${styles.feed__error} text-sm`}>
              {errors.caption.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.feed__share_button} mt-2 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Repost with caption"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  Repost <FaPaperPlane />
                </>
              )}
            </span>
          </button>
        </form>
        <div className={styles.feed__share_options}>
          <button
            onClick={handleNativeShare}
            disabled={shareStatus === "Opening share menu..." || isSubmitting}
            className={`${styles.feed__share_native_button} flex items-center justify-center gap-2 ${
              (shareStatus === "Opening share menu..." || isSubmitting)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            aria-label="Share via apps"
            aria-busy={shareStatus === "Opening share menu..." ? "true" : "false"}
          >
            <FaShare /> Share via Apps
          </button>
          <button
            onClick={handleCopyLink}
            disabled={isSubmitting}
            className={`${styles.feed__share_copy_button} flex items-center justify-center gap-2 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Copy link"
          >
            Copy Link <FaCopy />
          </button>
        </div>
        <button
          onClick={onClose}
          className={`${styles.feed__share_close_button} mt-4`}
          aria-label="Cancel share"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ShareModal;