import React, { useState } from 'react';
import Avatar from '../components/Avatar';

/*
 * CreatePost Component
 * Allows users to create a new post with text, image, or video content.
 * Used in social feeds or user dashboards for posting updates.
 */
interface CreatePostProps {
  user: {
    name: string; // User's display name
    username: string; // User's unique handle
    profilePicture: string; // URL of the user's profile picture
  };
  onPostSubmit: (content: string, image?: File, video?: File) => void; // Callback for submitting the post
}

const CreatePost: React.FC<CreatePostProps> = ({
  user = {
    name: 'Noor Ahmad',
    username: 'noor_ahmed',
    profilePicture: 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp',
  },
  onPostSubmit,
}) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  // Submit the post if content, image, or video is provided
  const handleSubmit = () => {
    if (content.trim() || image || video) {
      onPostSubmit(content, image || undefined, video || undefined);
      setContent('');
      setImage(null);
      setVideo(null);
    }
  };

  return (
    <div className="create-post-container" data-testid="create-post">
      <div className="create-post-header">
        <Avatar
          imageSrc={user.profilePicture}
          username={user.username}
          size="medium"
          showUsername={false}
        />
        <input
          type="text"
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          className="create-post-field"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label="Create a new post"
        />
      </div>
      <div className="create-post-divider"></div>
      <div className="create-post-options">
        <label className="create-post-option image-option">
          <img
            src="/icons/image.svg"
            alt="Upload image"
            className="create-post-option-icon"
            loading="lazy"
          />
          <span>Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="create-post-file-input"
            aria-label="Upload an image"
          />
        </label>
        <label className="create-post-option video-option">
          <img
            src="/icons/upload-video.svg"
            alt="Upload video"
            className="create-post-option-icon"
            loading="lazy"
          />
          <span>Video</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="create-post-file-input"
            aria-label="Upload a video"
          />
        </label>
        <button onClick={handleSubmit} className="create-post-option submit-option">
          <span>Post</span>
        </button>
      </div>
    </div>
  );
};

export default CreatePost;