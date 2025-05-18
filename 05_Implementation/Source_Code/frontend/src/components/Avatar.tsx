import React from 'react';
import { AvatarProps } from '@/types';

/*
 * Avatar Component
 * Displays a user's profile picture with an optional username and plus indicator.
 * Used in user profiles, story previews, and other areas where user identity is shown.
 */
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