import React from "react";
import Image from "next/image";
import styles from "@/app/feed/feed.module.css";
import { FaImage, FaVideo } from "react-icons/fa";
import { User } from "@/types/auth";

interface CreatePostTriggerProps {
  user: User | null;
  onClick: () => void;
}

const CreatePostTrigger: React.FC<CreatePostTriggerProps> = ({
  user,
  onClick,
}) => {
  return (
    <div className={`${styles.feed__create_post_trigger_container}`}>
      <div className="flex items-center gap-4">
        <Image
          src={user?.profilePicture || "/avatars/default-avatar.svg"}
          alt={`${user?.username || "User"}'s avatar`}
          width={48}
          height={48}
          className={`${styles.feed__post_avatar}`}
          data-testid="user-avatar"
        />
        <input
          type="text"
          placeholder="What's on your mind?"
          className={`${styles.feed__create_post_input} ${styles.feed__create_post_trigger}`}
          onClick={onClick}
          readOnly
          aria-label="Open create post modal"
        />
      </div>
      <div className={`${styles.feed__create_post_trigger_actions}`}>
        <label
          htmlFor="image-upload"
          className={`${styles.feed__create_post_media_label} ${styles.feed__create_post_image_label}`}
        >
          <FaImage /> Photo
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png"
            className={`${styles.feed__create_post_media}`}
          />
        </label>
        <label
          htmlFor="video-upload"
          className={`${styles.feed__create_post_media_label} ${styles.feed__create_post_video_label}`}
        >
          <FaVideo /> Video
          <input
            id="video-upload"
            type="file"
            accept="video/mp4"
            className={`${styles.feed__create_post_media}`}
          />
        </label>
      </div>
    </div>
  );
};

export default CreatePostTrigger;