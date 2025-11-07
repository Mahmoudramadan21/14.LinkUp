'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import styles from '@/app/(main)/(feed-search)/feed/feed.module.css';
import { FaTimes, FaImage, FaSpinner } from 'react-icons/fa';
import { User } from '@/types/auth';
import { CreatePostFormData, createPostSchema } from '@/utils/validationSchemas';
import { createPostThunk } from '@/store/postSlice';
import { CreatePostRequest } from '@/types/post';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  preselectedMedia?: { file: File | null; isVideo: boolean };
}

/**
 * Modal for creating a new post with text and optional media (image/video).
 * Supports pre-selected media from feed and proper memory cleanup.
 */
const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  user,
  preselectedMedia,
}) => {
  const dispatch = useDispatch();
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideoPreview, setIsVideoPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
  });

  // Handle preselected media (e.g., from camera/gallery picker)
  useEffect(() => {
    if (preselectedMedia?.file) {
      setSelectedFile(preselectedMedia.file);
      const url = URL.createObjectURL(preselectedMedia.file);
      setPreview(url);
      setIsVideoPreview(preselectedMedia.isVideo);
      setValue('media', preselectedMedia.file);
    }
  }, [preselectedMedia, setValue]);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setIsVideoPreview(false);
      setValue('media', undefined);
      return;
    }

    // Revoke previous preview
    if (preview) URL.revokeObjectURL(preview);

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setIsVideoPreview(file.type.startsWith('video/'));
    setValue('media', file);
  };

  const handleRemoveMedia = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setIsVideoPreview(false);
    setValue('media', undefined);
  };

  const onSubmit: SubmitHandler<CreatePostFormData> = async (data) => {
    onClose();

    reset();
    setPreview(null);
    setSelectedFile(null);
    setIsVideoPreview(false);
    setValue("media", undefined);
    
    try {
      console.log("Form data:", data);
      console.log("Selected file:", selectedFile);
      const payload: CreatePostRequest = {
        content: data.content || undefined,
        media: selectedFile || undefined,
      };
      console.log("Payload for createPostThunk:", payload);
      await dispatch(createPostThunk(payload) as any).unwrap();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.feed__create_modal_overlay} bg-overlay`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.feed__create_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 id="create-modal-title" className={styles.feed__create_modal_title}>
            Create Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1 transition"
            aria-label="Close create post modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.feed__create_post_form}>
          {/* User Info */}
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={user?.profilePicture || '/avatars/default-avatar.svg'}
              alt={`${user?.username || 'User'}'s profile picture`}
              width={40}
              height={40}
              className="avatar--md"
              loading="lazy"
              placeholder="blur"
              blurDataURL="/avatars/default-avatar-blur.svg"
            />
            <p className={styles.feed__post_username}>
              {user?.username || 'User'}
            </p>
          </div>

          {/* Content Input */}
          <textarea
            {...register('content')}
            placeholder="What's on your mind?"
            className={`${styles.feed__create_post_input} focus-ring min-h-32 resize-none`}
            rows={4}
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? 'content-error' : undefined}
          />
          {errors.content && (
            <p id="content-error" className={styles.feed__error} role="alert">
              {errors.content.message}
            </p>
          )}

          {/* Media Preview */}
          {preview && (
            <div className={styles.feed__create_post_preview_wrapper}>
              {isVideoPreview ? (
                <video
                  src={preview}
                  controls
                  className={`${styles.feed__create_post_preview} ${styles.feed__create_post_video_preview}`}
                  aria-label="Video preview"
                />
              ) : (
                <Image
                  src={preview}
                  alt="Image preview"
                  width={600}
                  height={400}
                  className={styles.feed__create_post_preview}
                  style={{ objectFit: 'cover' }}
                />
              )}
              <button
                type="button"
                onClick={handleRemoveMedia}
                className={styles.feed__create_post_remove_preview}
                aria-label="Remove media"
              >
               <FaTimes size={20} />
              </button>
            </div>
          )}

          {errors.media && (
            <p id="media-error" className={styles.feed__error} role="alert">
              {errors.media.message}
            </p>
          )}

          {/* Actions */}
          <div className={styles.feed__create_post_actions}>
            <label htmlFor="media-upload-modal" className={styles.feed__create_post_media_label}>
              <FaImage size={20} /> Add Photo/Video
              <input
                id="media-upload-modal"
                type="file"
                accept="image/jpeg,image/png,video/mp4,video/quicktime"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__create_post_button} ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              aria-label="Post now"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                'Post Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;