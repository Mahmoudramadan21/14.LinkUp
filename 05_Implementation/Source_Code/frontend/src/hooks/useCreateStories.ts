'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/feedStore';
import { AppStore, CreateStoriesProps } from '@/types';
import { validateImageFile, generateStoryCanvas, centerElement } from '@/utils/createStoriesUtils';

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

export const useCreateStories = ({ onDiscard }: CreateStoriesProps) => {
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
      const { x, y } = centerElement(previewRef.current, textRef.current);
      setTextPosition({ x, y });
    }
  }, [text]);

  // Center media on initial render
  useEffect(() => {
    if (media && previewRef.current && mediaRef.current) {
      const { x, y } = centerElement(previewRef.current, mediaRef.current);
      setMediaPosition({ x, y });
    }
  }, [media]);

  // Handle media file selection with validation
  const handleMediaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setMedia(file);
      setMediaPosition({ x: 0, y: 0 });
      setMode('preview');
      setLocalError('');
    }
  }, []);

  // Switch to preview mode for text
  const handleAddText = useCallback(() => {
    setMode('preview');
  }, []);

  // Handle drag start for text
  const handleMouseDownText = useCallback((e: React.MouseEvent) => {
    setIsDraggingText(true);
  }, []);

  // Handle drag start for media
  const handleMouseDownMedia = useCallback((e: React.MouseEvent) => {
    setIsDraggingMedia(true);
  }, []);

  // Handle drag movement
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
  }, [isDraggingText, isDraggingMedia]);

  // Stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDraggingText(false);
    setIsDraggingMedia(false);
  }, []);

  // Keyboard drag for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent, type: 'text' | 'media') => {
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
  }, []);

  // Close dialog on backdrop click or Escape key
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onDiscard();
    }
  }, [onDiscard]);

  const handleBackdropKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onDiscard();
    }
  }, [onDiscard]);

  // Increase font size
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 2, 48));
  }, []);

  // Decrease font size
  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  }, []);

  // Confirm and upload story
  const handleConfirm = useCallback(async () => {
    if (previewRef.current && (text || media) && !isLoading) {
      setIsLoading(true);
      try {
        const file = await generateStoryCanvas(previewRef.current, previewDimensions);
        await handlePostStory(file);
        onDiscard();
      } catch (err: any) {
        setError(err.message || 'Failed to post story');
      } finally {
        setIsLoading(false);
      }
    }
  }, [text, media, isLoading, previewDimensions, handlePostStory, onDiscard, setError]);

  return {
    mode,
    setMode,
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
    setLocalError,
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
  };
};