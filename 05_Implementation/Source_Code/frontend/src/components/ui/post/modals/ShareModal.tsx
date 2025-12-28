'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from '@/app/(main)/(feed-search)/feed/feed.module.css';
import {
  FaTimes,
  FaPaperPlane,
  FaShare,
  FaCopy,
  FaSpinner,
} from 'react-icons/fa';
import { Post as PostType } from '@/types/post';
import { SharePostFormData, sharePostSchema } from '@/utils/validationSchemas';
import { sharePostThunk } from '@/store/postSlice';

interface ShareModalProps {
  isOpen: boolean;
  post: PostType | undefined;
  onClose: () => void;
}

/**
 * Modal for sharing/reposting a post with optional caption,
 * native sharing (mobile), and link copying.
 */
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

  // Repost with caption
  const onSubmit: SubmitHandler<SharePostFormData> = async (data) => {
    if (!post) return;

    onClose();

    try {
      await dispatch(sharePostThunk({ postId: post.PostID, data }) as any).unwrap();
    } finally {
      reset();
    }
  };

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fallback copy for older browsers
  const fallbackCopyText = (text: string): boolean => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  };

  // Native Web Share API (mobile) + fallback
  const handleNativeShare = async () => {
    if (!post) {
      setShareStatus('Post not available.');
      setTimeout(() => setShareStatus(null), 3000);
      return;
    }

    const url = `${window.location.origin}/feed?postId=${post.PostID}`;
    const shareData: ShareData = {
      title: `Post by ${post.User.Username}`,
      text: post.Content || 'Check out this post!',
      url,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        setShareStatus('Opening share menu...');
        await navigator.share(shareData);
        setShareStatus('Shared successfully!');
        setTimeout(() => setShareStatus(null), 2000);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus('Link copied to clipboard!');
        setTimeout(() => setShareStatus(null), 2000);
      } catch {
        setShareUrl(url);
        setShareStatus('Please copy the link manually below.');
        setTimeout(() => setShareStatus(null), 5000);
      }
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!post) return;

    const url = `${window.location.origin}/feed?postId=${post.PostID}`;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus('Link copied to clipboard!');
        setTimeout(() => setShareStatus(null), 2000);
      } catch {
        const success = fallbackCopyText(url);
        setShareStatus(
          success
            ? 'Link copied to clipboard!'
            : 'Copy failed. Select and copy the link below.'
        );
        if (!success) setShareUrl(url);
        setTimeout(() => setShareStatus(null), 3000);
      }
    } else {
      const success = fallbackCopyText(url);
      setShareStatus(
        success ? 'Link copied!' : 'Please copy the link manually.'
      );
      if (!success) setShareUrl(url);
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  const renderPostContent = (postData: PostType) => (
    <div className={styles.feed__post_content_wrapper}>
      {postData.Content && (
        <p className={styles.feed__post_content}>{postData.Content}</p>
      )}
    </div>
  );

  if (!isOpen || !post) return null;

  return (
    <div
      className={`${styles.feed__share_modal_overlay} bg-overlay`}
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
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 id="share-modal-title" className={styles.feed__share_modal_title}>
            Share This Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1 transition"
            aria-label="Close share modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Post Preview */}
        <div className="mb-4 p-4 bg-neutral-gray rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Preview
          </h3>
          {post.SharedPost ? renderPostContent(post.SharedPost) : renderPostContent(post)}
        </div>

        {/* Status Message */}
        {shareStatus && (
          <p
            className={`text-center mb-4 font-medium ${
              shareStatus.includes('failed') || shareStatus.includes('Failed')
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
            role="status"
            aria-live="polite"
          >
            {shareStatus}
          </p>
        )}

        {/* Manual URL (fallback) */}
        {shareUrl && (
          <div className="mb-4">
            <p className="text-center text-sm text-red-600 dark:text-red-400 mb-2">
              Copy the link below:
            </p>
            <input
              type="text"
              value={shareUrl}
              readOnly
              className={`${styles.feed__share_input} w-full text-center font-mono text-sm`}
              onClick={(e) => e.currentTarget.select()}
              aria-label="Post URL"
            />
          </div>
        )}

        {/* Repost with Caption + Share Options */}
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
          <textarea
            {...register('caption')}
            placeholder="Add a caption to your repost (optional)..."
            className={styles.feed__share_input}
            rows={3}
            aria-invalid={!!errors.caption}
            aria-describedby={errors.caption ? 'caption-error' : undefined}
          />
          {errors.caption && (
            <p id="caption-error" className={`${styles.feed__error} text-sm mt-1`}>
              {errors.caption.message}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 justify-center">
            {/* Repost Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__share_button} flex-1 min-w-[150px] flex items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Reposting...
                </>
              ) : (
                <>
                  Repost <FaPaperPlane />
                </>
              )}
            </button>

            {/* Share via Apps */}
            <button
              onClick={handleNativeShare}
              disabled={isSubmitting || shareStatus === 'Opening share menu...'}
              className={`${styles.feed__share_native_button} flex-1 min-w-[150px] flex items-center justify-center gap-2 transition ${
                isSubmitting || shareStatus === 'Opening share menu...'
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90'
              }`}
              aria-label="Share using device apps"
            >
              <FaShare /> Share via Apps
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              disabled={isSubmitting}
              className={`${styles.feed__share_copy_button} flex-1 min-w-[150px] flex items-center justify-center gap-2 transition ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              aria-label="Copy post link"
            >
              <FaCopy /> Copy Link
            </button>
          </div>
        </form>


        {/* Cancel Button */}
        <button
          onClick={onClose}
          className={`${styles.feed__share_close_button} w-full`}
          aria-label="Cancel sharing"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ShareModal;