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
  size?: 'xsmall' | 'small' | 'medium' | 'large'; // Determines the avatar size
  showUsername?: boolean; // Toggles visibility of the username below the avatar
  isInteractive?: boolean; // Indicates if the avatar is clickable (e.g., profile link)
}

const Avatar: React.FC<AvatarProps> = ({
  imageSrc,
  username,
  hasPlus = false,
  size = 'medium',
  showUsername = true,
  isInteractive = false,
}) => {
  // Handle image loading errors by falling back to a default image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/avatars/placeholder.png';
  };

  // Determine the appropriate element based on interactivity
  const Element = isInteractive ? 'button' : 'figure';

  return (
    <Element
      className={`avatar avatar--${size} ${hasPlus ? 'avatar--has-plus' : ''}`}
      data-testid="avatar"
      {...(isInteractive ? { type: 'button', 'aria-label': `View ${username}'s profile` } : { role: 'figure' })}
    >
      <div className="avatar__image-wrapper">
        <img
          src={imageSrc}
          alt={`${username}'s profile picture`}
          className="avatar__image"
          onError={handleImageError}
          loading="lazy"
          width={size === 'large' ? 96 : size === 'medium' ? 64 : size === 'small' ? 40 : 28}
          height={size === 'large' ? 96 : size === 'medium' ? 64 : size === 'small' ? 40 : 28}
          itemProp="image"
        />
        {hasPlus && (
          <span className="avatar__plus" aria-hidden="true">
            +
          </span>
        )}
      </div>
      {showUsername && (
        <figcaption className="avatar__username" data-testid="avatar-username">
          {username}
        </figcaption>
      )}
    </Element>
  );
};

export default Avatar;