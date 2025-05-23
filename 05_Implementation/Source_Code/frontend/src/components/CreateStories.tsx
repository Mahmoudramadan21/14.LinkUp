'use client';
import React, { memo } from 'react';
import clsx from 'clsx';
import { Transition } from '@headlessui/react';
import Avatar from './Avatar';
import Button from './Button';
import { useCreateStories } from '@/hooks/useCreateStories';
import { CreateStoriesProps } from '@/types';

const CreateStories: React.FC<CreateStoriesProps> = ({
  user = {
    name: 'Noor Ahmad',
    username: 'noor_ahmed',
    profilePicture: '/avatars/placeholder.jpg',
  },
  onDiscard,
}) => {
  const {
    mode,
    text,
    setText,
    media,
    backgroundColor,
    setBackgroundColor,
    textColor,
    setTextColor,
    fontStyle,
    setFontStyle,
    fontSize,
    textPosition,
    mediaPosition,
    isDraggingText,
    isDraggingMedia,
    isLoading,
    error,
    previewDimensions,
    textRef,
    mediaRef,
    previewRef,
    dialogRef,
    backdropRef,
    backgroundColors,
    textColors,
    fontStyles,
    handleMediaChange,
    handleAddText,
    handleMouseDownText,
    handleMouseDownMedia,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    handleBackdropClick,
    handleBackdropKeyDown,
    increaseFontSize,
    decreaseFontSize,
    handleConfirm,
  } = useCreateStories({ onDiscard });

  return (
    <Transition
      show={true}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="create-stories__backdrop"
        ref={backdropRef}
        onClick={handleBackdropClick}
        onKeyDown={handleBackdropKeyDown}
        tabIndex={0}
      >
        {mode === 'initial' ? (
          <div className="create-stories__initial-content">
            <h2 className="create-stories__title" id="create-stories-title">
              Create Stories
            </h2>
            <div className="create-stories__options">
              <label
                className="create-stories__option-btn create-stories__option-btn--media"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.querySelector('input')?.click()}
              >
                <span className="create-stories__plus">+</span>
                <span>Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaChange}
                  className="create-stories__file-input"
                  id="media-upload"
                  aria-label="Add image"
                  aria-describedby={error ? 'create-stories-error' : undefined}
                />
              </label>
              <Button
                variant="primary"
                size="large"
                onClick={handleAddText}
                ariaLabel="Add text to story"
              >
                <span className="create-stories__plus">+</span>
                Add Text
              </Button>
            </div>
            {error && (
              <span
                id="create-stories-error"
                className="create-stories__error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </span>
            )}
          </div>
        ) : (
          <dialog
            className="create-stories__dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-stories-title"
          >
            <div className="create-stories__dialog-content">
              <div className="create-stories__settings">
                <div className="create-stories__user">
                  <Avatar
                    imageSrc={user.profilePicture || '/avatars/placeholder.jpg'}
                    username={user.username}
                    size="medium"
                    showUsername={false}
                  />
                  <div>
                    <p className="create-stories__name">{user.name}</p>
                    <p className="create-stories__username">@{user.username}</p>
                  </div>
                </div>
                <div className="create-stories__option">
                  <input
                    type="text"
                    placeholder="Add text..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="create-stories__text-input"
                    aria-label="Add text to story"
                    maxLength={100}
                  />
                </div>
                <div className="create-stories__option">
                  <label className="create-stories__label">Background Color</label>
                  <div className="create-stories__color-options">
                    {backgroundColors.map((color, index) => (
                      <button
                        key={index}
                        className={clsx('create-stories__color-btn', {
                          'create-stories__color-btn--active': backgroundColor === color,
                        })}
                        style={{ background: color }}
                        onClick={() => setBackgroundColor(color)}
                        aria-label={`Select background color ${color}`}
                        aria-pressed={backgroundColor === color}
                      />
                    ))}
                  </div>
                </div>
                <div className="create-stories__option">
                  <label className="create-stories__label">Text Color</label>
                  <div className="create-stories__color-options">
                    {textColors.map((color, index) => (
                      <button
                        key={index}
                        className={clsx('create-stories__color-btn', {
                          'create-stories__color-btn--active': textColor === color,
                        })}
                        style={{ backgroundColor: color }}
                        onClick={() => setTextColor(color)}
                        aria-label={`Select text color ${color}`}
                        aria-pressed={textColor === color}
                      />
                    ))}
                  </div>
                </div>
                <div className="create-stories__option">
                  <label className="create-stories__label">Style</label>
                  <div className="create-stories__style-options">
                    {fontStyles.map((style, index) => (
                      <button
                        key={index}
                        className={clsx('create-stories__style-btn', {
                          'create-stories__style-btn--active': fontStyle === style,
                        })}
                        onClick={() => setFontStyle(style)}
                        aria-label={`Select font style ${style}`}
                        aria-pressed={fontStyle === style}
                      >
                        Aa
                      </button>
                    ))}
                  </div>
                </div>
                <div className="create-stories__option">
                  <label className="create-stories__label">Text Size</label>
                  <div className="create-stories__size-options">
                    <button
                      className="create-stories__size-btn create-stories__size-btn--decrease"
                      onClick={decreaseFontSize}
                      aria-label="Decrease text size"
                    >
                      -
                    </button>
                    <span className="create-stories__size-value">{fontSize}px</span>
                    <button
                      className="create-stories__size-btn create-stories__size-btn--increase"
                      onClick={increaseFontSize}
                      aria-label="Increase text size"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="create-stories__actions">
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={onDiscard}
                    ariaLabel="Discard story"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    ariaLabel="Confirm and upload story"
                  >
                    {isLoading ? 'Uploading...' : 'Confirm'}
                  </Button>
                </div>
                {error && (
                  <span
                    id="create-stories-error"
                    className="create-stories__error"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </span>
                )}
              </div>
              <div className="create-stories__preview">
                <h2 className="create-stories__preview-title" id="create-stories-title">
                  Preview
                </h2>
                <div
                  className="create-stories__preview-content"
                  ref={previewRef}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ background: backgroundColor }}
                >
                  {media && (
                    <div
                      ref={mediaRef}
                      className="create-stories__preview-media-container"
                      onMouseDown={handleMouseDownMedia}
                      onKeyDown={(e) => handleKeyDown(e, 'media')}
                      tabIndex={0}
                      aria-label="Move story media with arrow keys"
                      style={{
                        transform: `translate(${mediaPosition.x}px, ${mediaPosition.y}px)`,
                      }}
                    >
                      <img
                        src={URL.createObjectURL(media)}
                        alt="Story media preview"
                        className="create-stories__preview-media"
                        loading="lazy"
                        width={previewDimensions.width}
                        height={previewDimensions.height}
                        itemProp="image"
                      />
                    </div>
                  )}
                  {text && (
                    <div
                      ref={textRef}
                      className={clsx('create-stories__preview-text', `create-stories__preview-text--${fontStyle.replace(' ', '-')}`)}
                      onMouseDown={handleMouseDownText}
                      onKeyDown={(e) => handleKeyDown(e, 'text')}
                      tabIndex={0}
                      aria-label="Move story text with arrow keys"
                      style={{
                        color: textColor,
                        fontSize: `${fontSize}px`,
                        transform: `translate(${textPosition.x}px, ${textPosition.y}px)`,
                      }}
                    >
                      {text}
                    </div>
                  )}
                </div>
                <div className="create-stories__preview-placeholder">
                  <label
                    className="create-stories__placeholder"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.querySelector('input')?.click()}
                  >
                    <span className="create-stories__placeholder-icon">+</span>
                    <span>{media ? 'Change Image' : 'Add Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMediaChange}
                      className="create-stories__file-input"
                      id="change-media-upload"
                      aria-label={media ? 'Change image' : 'Add image'}
                      aria-describedby={error ? 'create-stories-error' : undefined}
                    />
                  </label>
                </div>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </Transition>
  );
};

export default memo(CreateStories);