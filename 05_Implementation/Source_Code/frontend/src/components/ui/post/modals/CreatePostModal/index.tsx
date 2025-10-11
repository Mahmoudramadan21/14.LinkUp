import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import styles from "@/app/feed/feed.module.css";
import { FaTimes, FaImage } from "react-icons/fa";
import { User } from "@/types/auth";
import { CreatePostFormData, createPostSchema } from "@/utils/validationSchemas";
import { createPostThunk } from "@/store/postSlice";
import { CreatePostRequest } from "@/types/post";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const dispatch = useDispatch();
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideoPreview, setIsVideoPreview] = useState<boolean>(false);
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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name, file.type, file.size);
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setIsVideoPreview(isVideo || file.type.startsWith("video/"));
      setValue("media", file);
    } else {
      console.log("No file selected");
      setSelectedFile(null);
      setPreview(null);
      setIsVideoPreview(false);
      setValue("media", undefined);
    }
  };

  const handleRemoveMedia = () => {
    setPreview(null);
    setSelectedFile(null);
    setIsVideoPreview(false);
    setValue("media", undefined);
  };

  const onSubmit: SubmitHandler<CreatePostFormData> = async (data) => {
    try {
      console.log("Form data:", data);
      console.log("Selected file:", selectedFile);
      const payload: CreatePostRequest = {
        content: data.content || undefined,
        media: selectedFile || undefined,
      };
      console.log("Payload for createPostThunk:", payload);
      await dispatch(createPostThunk(payload) as any).unwrap();
      reset();
      setPreview(null);
      setSelectedFile(null);
      setIsVideoPreview(false);
      setValue("media", undefined);
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  if (!isOpen) return null;

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
        aria-labelledby="create-modal-title"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="create-modal-title" className={styles.feed__create_modal_title}>
            Create Post
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1"
            aria-label="Close create post modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`${styles.feed__create_post_form}`}
          aria-label="Create a new post form"
        >
          <div className="flex items-center gap-4 mb-4">
            <Image
              src={user?.profilePicture || "/avatars/default-avatar.svg"}
              alt={`${user?.username || "User"}'s avatar`}
              width={40}
              height={40}
              className={`${styles.feed__post_avatar}`}
              data-testid="modal-user-avatar"
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
            <p id="content-error" className={`${styles.feed__error}`}>
              {errors.content.message}
            </p>
          )}
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
                  alt="Media preview"
                  width={600}
                  height={300}
                  className={`${styles.feed__create_post_preview}`}
                />
              )}
              <button
                onClick={handleRemoveMedia}
                className={styles.feed__create_post_remove_preview}
                aria-label="Remove media preview"
              >
                <FaTimes />
              </button>
            </div>
          )}
          {errors.media && (
            <p id="media-error" className={`${styles.feed__error}`}>
              {errors.media.message}
            </p>
          )}
          <div className={styles.feed__create_post_actions}>
            <label
              htmlFor="media-upload-modal"
              className={styles.feed__create_post_media_label}
            >
              <FaImage /> Add Photo/Video
              <input
                id="media-upload-modal"
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                onChange={(e) => handleMediaChange(e)}
                className={styles.feed__create_post_media}
                aria-describedby={errors.media ? "media-error" : undefined}
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__create_post_button} ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Submit post"
            >
              {isSubmitting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                "Post Now"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;