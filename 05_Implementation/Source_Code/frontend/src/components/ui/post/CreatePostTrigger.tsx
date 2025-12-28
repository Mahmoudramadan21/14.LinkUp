import React, { useRef } from "react";
import Image from "next/image";
import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import { FaImage, FaVideo } from "react-icons/fa";
import { User } from "@/types/auth";
import Link from "next/link";

/**
 * Props for the CreatePostTrigger component
 */
interface CreatePostTriggerProps {
  user: User | null;
  onClick: () => void;
  onMediaSelect?: (file: File, isVideo: boolean) => void;
}

/**
 * Compact "Create Post" trigger bar shown in the feed.
 * Allows quick post creation via text click or direct media upload (photo/video).
 */
const CreatePostTrigger: React.FC<CreatePostTriggerProps> = ({
  user,
  onClick,
  onMediaSelect,
}) => {
  // Hidden file inputs for media selection
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection from hidden inputs
   * Resets the input value after selection to allow re-selecting the same file
   */
  const handleMediaChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isVideo: boolean
  ) => {
    const file = e.target.files?.[0];
    if (file && onMediaSelect) {
      onMediaSelect(file, isVideo);
      e.target.value = ""; // Allow selecting the same file again
    }
  };

  return (
    <div className={styles.feed__create_post_trigger_container}>
      {/* Text Input + Avatar */}
      <div className="flex items-center gap-4">
        <Link href={`/${user?.username }`}>
          <Image
            src={user?.profilePicture || "/avatars/default-avatar.svg"}
            alt={`${user?.username || "User"}'s avatar`}
            width={48}
            height={48}
            className={styles.feed__post_avatar}
            data-testid="user-avatar"
          />
        </Link>
        <input
          type="text"
          placeholder="What's on your mind?"
          className={`${styles.feed__create_post_input} ${styles.feed__create_post_trigger}`}
          onClick={onClick}
          readOnly
          aria-label="Open create post modal"
        />
      </div>

      {/* Media Upload Buttons */}
      <div className={styles.feed__create_post_trigger_actions}>
        {/* Photo Upload */}
        <label
          htmlFor="image-upload"
          className={`${styles.feed__create_post_media_label} ${styles.feed__create_post_image_label}`}
        >
          <FaImage /> Photo
          <input
            ref={imageInputRef}
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png"
            className={styles.feed__create_post_media}
            onChange={(e) => handleMediaChange(e, false)}
          />
        </label>

        {/* Video Upload */}
          <label
            htmlFor="video-upload"
            className={`${styles.feed__create_post_media_label} ${styles.feed__create_post_video_label}`}
          >
          <FaVideo /> Video
          <input
            ref={videoInputRef}
            id="video-upload"
            type="file"
            accept="video/mp4"
            className={styles.feed__create_post_media}
            onChange={(e) => handleMediaChange(e, true)}
          />
        </label>
      </div>
    </div>
  );
};

export default CreatePostTrigger;