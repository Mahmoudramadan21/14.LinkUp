import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import styles from "@/app/feed/feed.module.css";
import { FaTimes } from "react-icons/fa";
import { User } from "@/types/auth";
import { RootState } from "@/store";
import { UpdatePostFormData, updatePostSchema } from "@/utils/validationSchemas";
import { updatePostThunk } from "@/store/postSlice";

interface EditPostModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
  user: User | null;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  postId,
  onClose,
  user,
}) => {
  const dispatch = useDispatch();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const post = useSelector((state: RootState) =>
    state.post.posts.find((p) => p.PostID === postId)
  );
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdatePostFormData>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      content: post?.Content || "",
    },
  });

  useEffect(() => {
    if (post?.Content) {
      setValue("content", post.Content);
    }
  }, [post, setValue]);

  const onSubmit: SubmitHandler<UpdatePostFormData> = async (data) => {
    try {
      if (postId) {
        await dispatch(updatePostThunk({ postId, data }) as any).unwrap();
        reset();
        onClose();
      }
    } catch (error) {
      console.error("Failed to update post:", error);
      setSubmitError("Failed to update post. Please try again.");
    }
  };

  if (!isOpen || !postId || !post) return null;


  return (
    <div
      className={styles.feed__create_modal_overlay}
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
        <div className="flex justify-between items-center mb-4">
          <h2 id="edit-modal-title" className={styles.feed__create_modal_title}>
            Edit Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1"
            aria-label="Close edit post modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${styles.feed__create_post_form}`}
          aria-label="Edit post form"
        >
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={user?.profilePicture || "/avatars/default-avatar.svg"}
              alt={`${user?.username || "User"}'s avatar`}
              width={40}
              height={40}
              className={`${styles.feed__post_avatar}`}
            />
            <p className={`${styles.feed__post_username}`}>
              {user?.username || "User"}
            </p>
          </div>
          <textarea
            {...register("content")}
            placeholder="What's on your mind?"
            className={`${styles.feed__create_post_input}`}
            aria-invalid={errors.content ? "true" : "false"}
            aria-describedby={errors.content ? "content-error" : undefined}
          />
          {errors.content && (
            <p id="content-error" className={`${styles.feed__error} text-sm`}>
              {errors.content.message}
            </p>
          )}
          {submitError && (
            <p id="submit-error" className={`${styles.feed__error} text-sm text-center`}>
              {submitError}
            </p>
          )}
          <div className={styles.feed__create_post_actions}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__create_post_button} ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Submit updated post"
            >
              {isSubmitting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                "Update Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;