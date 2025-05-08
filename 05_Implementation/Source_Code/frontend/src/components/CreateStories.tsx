import React, { useState, useRef, useEffect } from 'react';
import Avatar from '../components/Avatar';
import html2canvas from 'html2canvas';
import { useAppStore } from '@/store/feedStore';
import { Transition } from '@headlessui/react';

interface CreateStoriesProps {
  user?: {
    name: string;
    username: string;
    profilePicture?: string;
  };
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
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { handlePostStory, setError } = useAppStore();

  const backgroundColors = [
    'linear-gradient(135deg, #ff6f61, #8b5cf6)',
    'linear-gradient(135deg, #34d399, #10b981)',
    'linear-gradient(135deg, #60a5fa, #3b82f6)',
    '#000000',
    '#ffffff',
    '#808080',
  ];

  const textColors = [
    '#000000',
    '#ffffff',
    '#808080',
    '#ff0000',
    '#ff6f61',
    '#facc15',
    '#3b82f6',
  ];

  const fontStyles = ['normal', 'bold', 'italic', 'bold italic'];

  // Update preview dimensions dynamically
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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && e.target.files[0].type.startsWith('image/')) {
      setMedia(e.target.files[0]);
      setMediaPosition({ x: 0, y: 0 });
      setMode('preview');
    }
  };

  const handleAddText = () => {
    setMode('preview');
  };

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

        // Create a new canvas with the desired Instagram story dimensions (1080x1920)
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 1080;
        finalCanvas.height = 1920;
        const ctx = finalCanvas.getContext('2d');

        if (ctx) {
          // Calculate scaling to fit the content into 1080x1920 while maintaining aspect ratio
          const scale = Math.min(
            finalCanvas.width / canvas.width,
            finalCanvas.height / canvas.height
          );
          const scaledWidth = canvas.width * scale;
          const scaledHeight = canvas.height * scale;
          const offsetX = (finalCanvas.width - scaledWidth) / 2;
          const offsetY = (finalCanvas.height - scaledHeight) / 2;

          // Draw the scaled content onto the final canvas
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

  const handleMouseDownText = (e: React.MouseEvent) => {
    setIsDraggingText(true);
  };

  const handleMouseDownMedia = (e: React.MouseEvent) => {
    setIsDraggingMedia(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingText && textRef.current) {
      const newX = textPosition.x + e.movementX;
      const newY = textPosition.y + e.movementY;
      setTextPosition({ x: newX, y: newY });
    }
    if (isDraggingMedia && mediaRef.current) {
      const newX = mediaPosition.x + e.movementX;
      const newY = mediaPosition.y + e.movementY;
      setMediaPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingText(false);
    setIsDraggingMedia(false);
  };

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 48));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  };

  useEffect(() => {
    if (text && previewRef.current && textRef.current) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const textRect = textRef.current.getBoundingClientRect();
      const centerX = (previewRect.width - textRect.width) / 2;
      const centerY = (previewRect.height - textRect.height) / 2;
      setTextPosition({ x: centerX, y: centerY });
    }
  }, [text]);

  useEffect(() => {
    if (media && previewRef.current && mediaRef.current) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const mediaRect = mediaRef.current.getBoundingClientRect();
      const centerX = (previewRect.width - mediaRect.width) / 2;
      const centerY = (previewRect.height - mediaRect.height) / 2;
      setMediaPosition({ x: centerX, y: centerY });
    }
  }, [media]);

  if (mode === 'initial') {
    return (
      <div className="create-stories-initial-content">
        <h2 className="create-stories-title">Create Stories</h2>
        <div className="create-stories-options">
          <label className="create-stories-option-btn media-btn">
            <span className="create-stories-plus">+</span>
            <span>Add Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleMediaChange}
              className="create-stories-file-input"
              aria-label="Add image"
            />
          </label>
          <button className="create-stories-option-btn text-btn" onClick={handleAddText}>
            <span className="create-stories-plus">+</span>
            <span>Add Text</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-stories-dialog-content">
      <div className="create-stories-settings">
        <div className="create-stories-user">
          <Avatar
            imageSrc={user.profilePicture || '/avatars/placeholder.jpg'}
            username={user.username}
            size="medium"
            showUsername={false}
          />
          <div>
            <p className="create-stories-name">{user.name}</p>
            <p className="create-stories-username">@{user.username}</p>
          </div>
        </div>
        <div className="create-stories-option">
          <input
            type="text"
            placeholder="Add text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="create-stories-text-input"
            aria-label="Add text to story"
          />
        </div>
        <div className="create-stories-option">
          <label className="create-stories-label">Background Color</label>
          <div className="create-stories-color-options">
            {backgroundColors.map((color, index) => (
              <button
                key={index}
                className="create-stories-color-btn"
                style={{ background: color }}
                onClick={() => setBackgroundColor(color)}
                aria-label={`Select background color ${color}`}
              />
            ))}
          </div>
        </div>
        <div className="create-stories-option">
          <label className="create-stories-label">Text Color</label>
          <div className="create-stories-color-options">
            {textColors.map((color, index) => (
              <button
                key={index}
                className="create-stories-color-btn"
                style={{ backgroundColor: color }}
                onClick={() => setTextColor(color)}
                aria-label={`Select text color ${color}`}
              />
            ))}
          </div>
        </div>
        <div className="create-stories-option">
          <label className="create-stories-label">Style</label>
          <div className="create-stories-style-options">
            {fontStyles.map((style, index) => (
              <button
                key={index}
                className={`create-stories-style-btn ${fontStyle === style ? 'active' : ''}`}
                onClick={() => setFontStyle(style)}
                aria-label={`Select font style ${style}`}
              >
                Aa
              </button>
            ))}
          </div>
        </div>
        <div className="create-stories-option">
          <label className="create-stories-label">Text Size</label>
          <div className="create-stories-size-options">
            <button className="create-stories-size-btn decrease" onClick={decreaseFontSize} aria-label="Decrease text size">
              -
            </button>
            <span className="create-stories-size-value">{fontSize}px</span>
            <button className="create-stories-size-btn increase" onClick={increaseFontSize} aria-label="Increase text size">
              +
            </button>
          </div>
        </div>
        <div className="create-stories-actions">
          <button className="create-stories-discard-btn" onClick={onDiscard} aria-label="Discard story">
            Discard
          </button>
          <button
            className="create-stories-confirm-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label="Confirm and upload story"
          >
            {isLoading ? 'Uploading...' : 'Confirm'}
          </button>
        </div>
      </div>
      <div className="create-stories-preview">
        <h2 className="create-stories-preview-title">Preview</h2>
        <div
          className="create-stories-preview-content"
          ref={previewRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ background: backgroundColor }}
        >
          {media && (
            <div
              ref={mediaRef}
              className="create-stories-preview-media-container"
              onMouseDown={handleMouseDownMedia}
              style={{ transform: `translate(${mediaPosition.x}px, ${mediaPosition.y}px)` }}
            >
              <img
                src={URL.createObjectURL(media)}
                alt="Story media"
                className="create-stories-preview-media"
                loading="lazy"
              />
            </div>
          )}
          {text && (
            <div
              ref={textRef}
              className={`create-stories-preview-text ${fontStyle.replace(' ', '-')}`}
              onMouseDown={handleMouseDownText}
              style={{
                color: textColor,
                transform: `translate(${textPosition.x}px, ${textPosition.y}px)`,
                fontSize: `${fontSize}px`,
                position: 'absolute',
                userSelect: 'none',
              }}
            >
              {text}
            </div>
          )}
        </div>
        <div className="create-stories-preview-placeholder">
          <label className="create-stories-placeholder">
            <span className="create-stories-placeholder-icon">+</span>
            <span>{media ? 'Change Image' : 'Add Image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleMediaChange}
              className="create-stories-file-input"
              aria-label={media ? 'Change image' : 'Add image'}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default CreateStories;