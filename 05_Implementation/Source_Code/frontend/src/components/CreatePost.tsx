'use client';
import React, { memo, useState } from 'react';
import clsx from 'clsx';
import Avatar from './Avatar';
import Button from './Button';
import { CreatePostProps } from '@/types';

const CreatePost: React.FC<CreatePostProps> = ({ user, onPostSubmit }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  // Validate and handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      setImage(file);
      setError('');
    }
  };

  // Validate and handle video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please upload a valid video file.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('Video size must be less than 50MB.');
        return;
      }
      setVideo(file);
      setError('');
    }
  };

  // Submit post if valid
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() || image || video) {
      onPostSubmit(content, image || undefined, video || undefined);
      setContent('');
      setImage(null);
      setVideo(null);
      setError('');
    } else {
      setError('Please add content, an image, or a video.');
    }
  };

  return (
    <form
      className="create-post"
      role="form"
      aria-label="Create a new post"
      onSubmit={handleSubmit}
      data-testid="create-post"
    >
      <div className="create-post__header">
        <Avatar
          imageSrc={user.profilePicture}
          username={user.username}
          size="medium"
          showUsername={false}
        />
        <input
          type="text"
          placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
          className="create-post__field"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label="Post content"
          maxLength={280}
          itemProp="comment"
        />
      </div>
      <div className="create-post__divider"></div>
      <div className="create-post__options">
        <label
          className="create-post__option create-post__option--image"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.querySelector('input')?.click()}
        >
          <img
            src="/icons/image.svg"
            alt=""
            className="create-post__option-icon"
            loading="lazy"
            width={20}
            height={20}
            aria-hidden="true"
          />
          <span>Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="create-post__file-input"
            id="image-upload"
            aria-label="Upload an image"
            aria-describedby={error ? 'create-post-error' : undefined}
          />
        </label>
        <label
          className="create-post__option create-post__option--video"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.querySelector('input')?.click()}
        >
          <img
            src="/icons/upload-video.svg"
            alt=""
            className="create-post__option-icon"
            loading="lazy"
            width={20}
            height={20}
            aria-hidden="true"
          />
          <span>Video</span>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="create-post__file-input"
            id="video-upload"
            aria-label="Upload a video"
            aria-describedby={error ? 'create-post-error' : undefined}
          />
        </label>
        <Button type="submit" ariaLabel="Submit post" variant="primary" size="medium">
          Post
        </Button>
      </div>
      {error && (
        <span
          id="create-post-error"
          className="create-post__error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </form>
  );
};

export default memo(CreatePost);