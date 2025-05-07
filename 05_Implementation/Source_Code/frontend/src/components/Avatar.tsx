import React from 'react';

/*
 * Avatar Component
 * Displays a user's profile picture with an optional username and plus indicator.
 * Used in user profiles, story previews, and other areas where user identity is shown.
 */
interface AvatarProps {
  imageSrc: string; // URL of the user's profile picture
  username: string; // User's display name for alt text and optional username display
  hasPlus?: boolean; // Shows a plus sign (e.g., for new content indication)
  size?: 'small' | 'medium' | 'large' | 'xsmall'; // Determines the avatar size
  showUsername?: boolean; // Toggles visibility of the username below the avatar
}

const Avatar: React.FC<AvatarProps> = ({
  imageSrc,
  username,
  hasPlus = false,
  size = 'medium',
  showUsername = true,
}) => {
  // Handle image loading errors by falling back to a default image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/avatars/placeholder.png'; // Fallback for broken images
  };

  return (
    <div className={`avatar--${size} ${hasPlus ? 'with-plus' : ''}`} data-testid="avatar">
      <div className="avatar__image-wrapper">
        <img
          src={imageSrc}
          alt={`${username}'s profile picture`}
          className="avatar__image"
          onError={handleImageError}
          loading="lazy"
        />
        {hasPlus && (
          <span className="avatar__plus" aria-label="New content indicator">
            +
          </span>
        )}
      </div>
      {showUsername && (
        <span className="avatar__username" aria-label={`Username: ${username}`}>
          {username}
        </span>
      )}
    </div>
  );
};

export default Avatar;