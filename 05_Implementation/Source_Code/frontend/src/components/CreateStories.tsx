import React, { useState, useRef, useEffect } from 'react';
import Avatar from '../components/Avatar';
import html2canvas from 'html2canvas';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

/*
 * CreateStories Component
 * Allows users to create and customize stories with text, media, and styling options.
 * Used for sharing ephemeral content with draggable text and media overlays.
 */
interface CreateStoriesProps {
  user: {
    name: string; // User's display name
    username: string; // User's unique handle
    profilePicture: string; // URL of the user's profile picture
  };
  onShare: (story: {
    text: string;
    media?: File;
    backgroundColor?: string;
    textColor: string;
    position: { x: number; y: number };
    fontSize: number;
  }) => void; // Callback for sharing the story
  onDiscard: () => void; // Callback for discarding the story
}

const CreateStories: React.FC<CreateStoriesProps> = ({
  user = {
    name: 'Noor Ahmad',
    username: 'noor_ahmed',
    profilePicture: '/avatars/placeholder.jpg',
  },
  onShare,
  onDiscard,
}) => {
  const [mode, setMode] = useState<'initial' | 'text' | 'media'>('initial');
  const [text, setText] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(135deg, #ff6f61, #8b5cf6)');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontStyle, setFontStyle] = useState('normal');
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(18);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [positionMedia, setPositionMedia] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<number>(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const videoFrameRef = useRef<HTMLCanvasElement | null>(null);

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

  // Load FFmpeg for video processing on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
    };
    loadFFmpeg();
  }, []);

  // Handle media file selection and reset related states
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        currentTimeRef.current = 0;
      }
      setPositionMedia({ x: 0, y: 0 });
    }
  };

  // Share the story and reset the form
  const handleShare = () => {
    if ((mode === 'text' && text) || (mode === 'media' && (text || media))) {
      onShare({
        text,
        media: mode === 'media' ? media || undefined : undefined,
        backgroundColor,
        textColor,
        position,
        fontSize,
      });
      setText('');
      setMedia(null);
      setBackgroundColor('linear-gradient(135deg, #ff6f61, #8b5cf6)');
      setTextColor('#ffffff');
      setFontStyle('normal');
      setPosition({ x: 0, y: 0 });
      setFontSize(18);
      setPositionMedia({ x: 0, y: 0 });
      setMode('initial');
    }
  };

  // Start dragging the text element
  const handleMouseDownText = (e: React.MouseEvent) => {
    setIsDraggingText(true);
  };

  // Update position of text or media while dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingText && textRef.current) {
      const newX = position.x + e.movementX;
      const newY = position.y + e.movementY;
      setPosition({ x: newX, y: newY });
    } else if (isDraggingMedia && mediaRef.current) {
      const newX = positionMedia.x + e.movementX;
      const newY = positionMedia.y + e.movementY;
      setPositionMedia({ x: newX, y: newY });
    }
  };

  // Stop dragging on mouse up or leave
  const handleMouseUp = () => {
    setIsDraggingText(false);
    setIsDraggingMedia(false);
  };

  // Start dragging the media element
  const handleMouseDownMedia = (e: React.MouseEvent) => {
    setIsDraggingMedia(true);
  };

  // Toggle video playback
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        currentTimeRef.current = videoRef.current.currentTime;
        videoRef.current.pause();
      } else {
        videoRef.current.currentTime = currentTimeRef.current;
        videoRef.current.play().catch((error) => {
          console.error('Video playback failed:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle preview click to toggle video playback
  const handlePreviewClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        currentTimeRef.current = videoRef.current.currentTime;
        videoRef.current.pause();
      } else {
        videoRef.current.currentTime = currentTimeRef.current;
        videoRef.current.play().catch((error) => {
          console.error('Video playback failed:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Capture a frame from the video for overlay
  const captureVideoFrame = async () => {
    if (!videoRef.current || !previewRef.current) return null;

    const video = videoRef.current;
    video.currentTime = 1; // Capture frame at 1 second
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for seek

    const canvas = document.createElement('canvas');
    canvas.width = videoDimensions.width;
    canvas.height = videoDimensions.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    videoFrameRef.current = canvas;
    return canvas.toDataURL('image/png');
  };

  // Download the story as an image or video
  const handleDownload = async () => {
    if (!media || !previewRef.current) return;

    if (media.type.startsWith('video/')) {
      if (!ffmpegRef.current || !videoRef.current) return;

      const ffmpeg = ffmpegRef.current;
      const videoFrameDataUrl = await captureVideoFrame();
      if (!videoFrameDataUrl) return;

      const videoElement = videoRef.current;
      videoElement.style.display = 'none';
      const frameImg = document.createElement('img');
      frameImg.src = videoFrameDataUrl;
      frameImg.style.width = `${videoDimensions.width}px`;
      frameImg.style.height = `${videoDimensions.height}px`;
      mediaRef.current?.appendChild(frameImg);

      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
      });

      frameImg.remove();
      videoElement.style.display = 'block';

      const overlayDataUrl = canvas.toDataURL('image/png');

      await ffmpeg.writeFile('input.mp4', await fetchFile(media));
      await ffmpeg.writeFile('overlay.png', await fetchFile(overlayDataUrl));

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'overlay.png',
        '-filter_complex', '[0:v][1:v]overlay=0:0,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
        '-c:a', 'copy',
        'output.mp4',
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'story.mp4';
      link.click();
    } else {
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'story.png';
      link.click();
    }
  };

  // Pause video when playback state changes
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Center text on the preview when it changes
  useEffect(() => {
    if (text && previewRef.current && textRef.current) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const textRect = textRef.current.getBoundingClientRect();
      const centerX = (previewRect.width - textRect.width) / 2;
      const centerY = (previewRect.height - textRect.height) / 2;
      setPosition({ x: centerX, y: centerY });
    }
  }, [text]);

  // Update video dimensions when metadata is loaded
  const handleVideoMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };

  // Increase the font size up to a maximum of 48px
  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 2, 48));
  };

  // Decrease the font size down to a minimum of 12px
  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  };

  if (mode === 'initial') {
    return (
      <div className="create-stories-container" data-testid="create-stories">
        <div className="create-stories-initial">
          <h2 className="create-stories-title">Create Stories</h2>
          <div className="create-stories-options">
            <button className="create-stories-option-btn media-btn" onClick={() => setMode('media')}>
              <span className="create-stories-plus">+</span>
              <span>Add Media</span>
            </button>
            <button className="create-stories-option-btn text-btn" onClick={() => setMode('text')}>
              <span className="create-stories-plus">+</span>
              <span>Add Text</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-stories-container" data-testid="create-stories">
      <div className="create-stories-settings">
        <div className="create-stories-user">
          <Avatar
            imageSrc={user.profilePicture}
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
          <button className="create-stories-download-btn" onClick={handleDownload} aria-label="Download story">
            Download
          </button>
          <button className="create-stories-share-btn" onClick={handleShare} aria-label="Share story">
            Share
          </button>
        </div>
      </div>
      <div className="create-stories-preview">
        <h2 className="create-stories-preview-title">Preview</h2>
        <div
          className="create-stories-preview-content"
          ref={previewRef}
          onClick={handlePreviewClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ background: backgroundColor }}
        >
          {mode === 'media' && media && (
            <div
              ref={mediaRef}
              className="create-stories-preview-media-container"
              onMouseDown={handleMouseDownMedia}
            >
              {media.type.startsWith('video/') ? (
                <>
                  <video
                    ref={videoRef}
                    src={URL.createObjectURL(media)}
                    className="create-stories-preview-media"
                    autoPlay
                    loop
                    onLoadedMetadata={handleVideoMetadata}
                  />
                  <button className="create-stories-play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause video' : 'Play video'}>
                    <img
                      src="/icons/play.svg"
                      alt={isPlaying ? 'Pause' : 'Play'}
                      className="create-stories-play-icon"
                      loading="lazy"
                    />
                  </button>
                </>
              ) : (
                <img
                  src={URL.createObjectURL(media)}
                  alt="Story media"
                  className="create-stories-preview-media"
                  loading="lazy"
                />
              )}
            </div>
          )}
          {text && (
            <div
              ref={textRef}
              className={`create-stories-preview-text ${fontStyle.replace(' ', '-')}`}
              onMouseDown={handleMouseDownText}
              style={{ color: textColor, left: position.x, top: position.y, fontSize: `${fontSize}px` }}
            >
              {text}
            </div>
          )}
        </div>
        {mode === 'media' && (
          <div className="create-stories-preview-placeholder">
            <label className="create-stories-placeholder">
              <span className="create-stories-placeholder-icon">+</span>
              <span>{media ? 'Change Media' : 'Add Media'}</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="create-stories-file-input"
                aria-label={media ? 'Change media' : 'Add media'}
              />
            </label>
          </div>
        )}
        {mode === 'text' && !media && (
          <div className="create-stories-preview-placeholder">
            <div className="create-stories-placeholder">
              <span className="create-stories-placeholder-icon">+</span>
              <span>Add Media</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStories;