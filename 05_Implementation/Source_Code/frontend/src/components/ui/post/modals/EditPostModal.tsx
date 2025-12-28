'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import styles from '@/app/(main)/(feed-search)/feed/feed.module.css';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { User } from '@/types/auth';
import { RootState } from '@/store';
import { UpdatePostFormData, updatePostSchema } from '@/utils/validationSchemas';
import { updatePostThunk } from '@/store/postSlice';

type PostSource = 'posts' | 'usersPosts' | 'flicks' | 'explorePosts' | 'savedPosts' | 'searchedPosts';

interface EditPostModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
  user: User | null;
  postSource?: PostSource;
}

/**
 * Modal for editing an existing post's text content.
 * Only allows editing the caption (media cannot be changed).
 */
const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  postId,
  onClose,
  user,
  postSource
}) => {
  const dispatch = useDispatch();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Efficiently select the post based on the source it originally came from.
  const post = useSelector((state: RootState) => {
    switch (postSource) {
      case 'posts':
        return state.post.posts.find(p => p.PostID === postId);
      case 'explorePosts':
        return state.post.explorePosts.find(p => p.PostID === postId);
      case 'flicks':
        return state.post.flicks.find(p => p.PostID === postId);
      case 'savedPosts':
        return state.post.savedPosts.find(p => p.PostID === postId);
      case 'searchedPosts':
        return state.post.searchPostResults.find(p => p.PostID === postId);
      case 'usersPosts':
        return state.post.usersPosts.flatMap(u => u.posts).find(p => p.PostID === postId);
      default:
        return null;
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePostFormData>({
    resolver: zodResolver(updatePostSchema),
  });

  // Sync form with post content when modal opens or post changes
  useEffect(() => {
    if (isOpen && post?.Content !== undefined) {
      setValue('content', post.Content);
      setSubmitError(null); // Clear previous errors
    }
  }, [isOpen, post, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError(null);
    }
  }, [isOpen, reset]);
  
  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const onSubmit: SubmitHandler<UpdatePostFormData> = async (data) => {
    try {
      if (postId) {
        await dispatch(updatePostThunk({ postId, data }) as any).unwrap();
        reset();
        onClose();
      }
    } catch {
      setSubmitError("Failed to update post. Please try again.");
    }
  };

  if (!isOpen || !postId || !post) return null;

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
        aria-labelledby="edit-modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 id="edit-modal-title" className={styles.feed__create_modal_title}>
            Edit Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1 transition"
            aria-label="Close edit post modal"
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
            placeholder="Edit your post..."
            className={`${styles.feed__create_post_input} focus-ring min-h-32 resize-none`}
            rows={5}
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? 'content-error' : undefined}
          />
          {errors.content && (
            <p id="content-error" className={styles.feed__error} role="alert">
              {errors.content.message}
            </p>
          )}

          {/* Submit Error */}
          {submitError && (
            <p className={`${styles.feed__error} text-center mt-2`} role="alert">
              {submitError}
            </p>
          )}

          {/* Submit Button */}
          <div className={styles.feed__create_post_actions} style={{ justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__create_post_button} min-w-32 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              aria-label="Update post"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin inline mr-2" /> Updating...
                </>
              ) : (
                'Update Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;