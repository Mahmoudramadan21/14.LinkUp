'use client';
import React, { memo, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Transition } from '@headlessui/react';
import html2canvas from 'html2canvas';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useAppStore } from '@/store/feedStore';

// Interface for user data
interface User {
  name: string;
  username: string;
  profilePicture?: string;
}

// Interface for store actions
interface AppStore {
  handlePostStory: (file: File) => Promise<void>;
  setError: (error: string) => void;
}

// Props for CreateStories component
interface CreateStoriesProps {
  user?: User;
  onDiscard: () => void;
}

const CreateStories: React.FC<CreateStoriesProps> = ({
  user = {
    name: 'Noor Ahmad',
    username: 'noor_ahmed',
    profilePicture: '/avatars/placeholder.jpg',
  },
  onDiscard,
}) => {
  const [mode, setMode] = useState<'initial' | 'preview'>('initial');
  const [text, setText] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(135deg, #ff6f61, #8b5cf6)');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontSize, setFontSize] = useState(18);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mediaPosition, setMediaPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState('');
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const { handlePostStory, setError } = useAppStore() as AppStore;

  // Background color options
  const backgroundColors = [
    'linear-gradient(135deg, #ff6f61, #8b5cf6)',
    'linear-gradient(135deg, #34d399, #10b981)',
    'linear-gradient(135deg, #60a5fa, #3b82f6)',
    '#000000',
    '#ffffff',
    '#808080',
  ];

  // Text color options
  const textColors = [
    '#000000',
    '#ffffff',
    '#808080',
    '#ff0000',
    '#ff6f61',
    '#facc15',
    '#3b82f6',
  ];

  // Font style options
  const fontStyles = ['normal', 'bold', 'italic', 'bold italic'];

  // Open dialog on mount
  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  // Update preview dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        setPreviewDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mode]);

  // Center text on initial render
  useEffect(() => {
    if (text && previewRef.current && textRef.current) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const textRect = textRef.current.getBoundingClientRect();
      const centerX = (previewRect.width - textRect.width) / 2;
      const centerY = (previewRect.height - textRect.height) / 2;
      setTextPosition({ x: centerX, y: centerY });
    }
  }, [text]);

  // Center media on initial render
  useEffect(() => {
    if (media && previewRef.current && mediaRef.current) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const mediaRect = mediaRef.current.getBoundingClientRect();
      const centerX = (previewRect.width - mediaRect.width) / 2;
      const centerY = (previewRect.height - mediaRect.height) / 2;
      setMediaPosition({ x: centerX, y: centerY });
    }
  }, [media]);

  // Handle media file selection with validation
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setLocalError('Please upload a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('Image size must be less than 5MB.');
        return;
      }
      setMedia(file);
      setMediaPosition({ x: 0, y: 0 });
      setMode('preview');
      setLocalError('');
    }
  };

  // Switch to preview mode for text
  const handleAddText = () => {
    setMode('preview');
  };

  // Handle drag start for text
  const handleMouseDownText = (e: React.MouseEvent) => {
    setIsDraggingText(true);
  };

  // Handle drag start for media
  const handleMouseDownMedia = (e: React.MouseEvent) => {
    setIsDraggingMedia(true);
  };

  // Handle drag movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingText && textRef.current) {
      setTextPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
    if (isDraggingMedia && mediaRef.current) {
      setMediaPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  // Stop dragging
  const handleMouseUp = () => {
    setIsDraggingText(false);
    setIsDraggingMedia(false);
  };

  // Keyboard drag for accessibility
  const handleKeyDown = (e: React.KeyboardEvent, type: 'text' | 'media') => {
    const step = 10; // Pixels to move per key press
    const updatePosition = type === 'text' ? setTextPosition : setMediaPosition;
    if (e.key === 'ArrowUp') {
      updatePosition((prev) => ({ ...prev, y: prev.y - step }));
    } else if (e.key === 'ArrowDown') {
      updatePosition((prev) => ({ ...prev, y: prev.y + step }));
    } else if (e.key === 'ArrowLeft') {
      updatePosition((prev) => ({ ...prev, x: prev.x - step }));
    } else if (e.key === 'ArrowRight') {
      updatePosition((prev) => ({ ...prev, x: prev.x + step }));
    }
  };

  // Close dialog on backdrop click or Escape key
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onDiscard();
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onDiscard();
    }
  };

  // Increase font size
  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 48));
  };

  // Decrease font size
  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  };

  // Confirm and upload story
  const handleConfirm = async () => {
    if (previewRef.current && (text || media) && !isLoading) {
      setIsLoading(true);
      try {
        const canvas = await html2canvas(previewRef.current, {
          useCORS: true,
          backgroundColor: null,
          scale: 2,
          width: previewDimensions.width,
          height: previewDimensions.height,
        });

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 1080;
        finalCanvas.height = 1920;
        const ctx = finalCanvas.getContext('2d');

        if (ctx) {
          const scale = Math.min(
            finalCanvas.width / canvas.width,
            finalCanvas.height / canvas.height
          );
          const scaledWidth = canvas.width * scale;
          const scaledHeight = canvas.height * scale;
          const offsetX = (finalCanvas.width - scaledWidth) / 2;
          const offsetY = (finalCanvas.height - scaledHeight) / 2;

          ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

          const imageDataUrl = finalCanvas.toDataURL('image/png');
          const blob = await (await fetch(imageDataUrl)).blob();
          const file = new File([blob], 'story.png', { type: 'image/png' });

          await handlePostStory(file);
          onDiscard();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to post story');
      } finally {
        setIsLoading(false);
      }
    }
  };

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