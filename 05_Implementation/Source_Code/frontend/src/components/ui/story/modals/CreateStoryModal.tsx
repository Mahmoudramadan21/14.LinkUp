// components/ui/CreateStoryModal.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaPlus,
  FaTimes,
  FaFont,
  FaTrash,
  FaUndo,
  FaRedo,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from 'react-icons/fa';
import { createStoryThunk } from '@/store/storySlice';
import type { AppDispatch } from '@/store';
import { CreateStoryRequest } from '@/types/story';
import { RootState } from '@/store';
import NextImage from 'next/image';
import styles from '@/app/(main)/(feed-search)/feed/stories.module.css';

// Memoized constants for gradients, fonts, and colors to prevent recreation on re-renders
const GRADIENTS = [
  { colors: ['#800080', '#A52A2A'], css: 'linear-gradient(to bottom, #800080, #A52A2A)' },
  { colors: ['#008000', '#ADFF2F'], css: 'linear-gradient(to bottom, #008000, #ADFF2F)' },
] as const;

const FONTS = ['Lora', 'Montserrat', 'Pacifico', 'Roboto Condensed', 'Oswald', 'Playfair Display'] as const;

const COLORS = [
  // Grayscale
  '#000000',
  '#4B4B4B',
  '#808080',
  '#B3B3B3',
  '#FFFFFF',
  // Red
  '#FF0000',
  '#FF6347',
  '#DC143C',
  // Orange
  '#FFA500',
  '#FF8C00',
  // Yellow
  '#FFFF00',
  '#FFD700',
  // Green
  '#008000',
  '#32CD32',
  '#00FF7F',
  // Blue
  '#0000FF',
  '#1E90FF',
  '#87CEEB',
  // Purple
  '#800080',
  '#8A2BE2',
  // Pink
  '#FFC0CB',
  '#FF69B4',
  // Cyan / Teal
  '#00FFFF',
  '#20B2AA',
] as const;

// Types for canvas content
interface TextObject {
  content: string;
  x: number;
  y: number;
  font: string;
  color: string;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

interface MediaObject {
  element: HTMLImageElement | null;
  src: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasState {
  media: MediaObject;
  texts: TextObject[];
  gradientIndex: number;
}

interface DragState {
  isDragging: boolean;
  type: 'media' | 'text' | null;
  textIndex: number | null;
  startX: number;
  startY: number;
}

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CreateStoryModal component for creating and editing stories with image and text overlays.
 * Allows users to upload media, add styled text, and manipulate canvas elements.
 * Optimized for performance, accessibility, SEO (where applicable), and best practices.
 */
const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'media' | 'text' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFont, setTextFont] = useState('Lora'); // Default to Lora
  const [textSize, setTextSize] = useState(30);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFontsLoaded, setIsFontsLoaded] = useState(false); // Track font loading status

  const [canvasState, setCanvasState] = useState<CanvasState>({
    media: { element: null, src: null, x: 0, y: 0, width: 540, height: 960 },
    texts: [],
    gradientIndex: 0,
  });
  const history = useRef<CanvasState[]>([
    { media: { element: null, src: null, x: 0, y: 0, width: 540, height: 960 }, texts: [], gradientIndex: 0 },
  ]);
  
  const redoStack = useRef<CanvasState[]>([]);
  const objectUrls = useRef<string[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const dragState = useRef<DragState>({
    isDragging: false,
    type: null,
    textIndex: null,
    startX: 0,
    startY: 0,
  });

  // Memoize gradients, fonts, colors
  const gradients = useMemo(() => GRADIENTS, []);
  const fonts = useMemo(() => FONTS, []);
  const colors = useMemo(() => COLORS, []);

  /**
   * Loads an image from a URL and returns a Promise resolving to an HTMLImageElement.
   * @param src - The URL of the image to load.
   */
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.alt = 'Story media'; // Accessibility: alt text for image
    });
  }, []);

  /**
   * Draws the canvas based on the current state, including media and text.
   * @param state - The current canvas state.
   */
  const drawCanvas = useCallback(
    (state: CanvasState) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true }); // Optimize context for frequent reads
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, 540, 960);

      // Draw background
      if (state.media.element && state.media.src) {
        if (mode === 'media') {
          const gradient = ctx.createLinearGradient(0, 0, 0, 960);
          const [c1, c2] = gradients[state.gradientIndex].colors;
          gradient.addColorStop(0, c1);
          gradient.addColorStop(1, c2);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 540, 960);
        }
        ctx.drawImage(state.media.element, state.media.x, state.media.y, state.media.width, state.media.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, 960);
        const [c1, c2] = gradients[state.gradientIndex].colors;
        gradient.addColorStop(0, c1);
        gradient.addColorStop(1, c2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 540, 960);
      }

      // Draw texts
      state.texts.forEach((text, index) => {
        ctx.font = `${text.fontSize}px ${text.font}`;
        ctx.fillStyle =
          dragState.current.isDragging && dragState.current.type === 'text' && dragState.current.textIndex === index
            ? '#FFD700' // Highlight dragging text
            : text.color;
        ctx.textAlign = text.align;
        ctx.textBaseline = 'middle';
        if (dragState.current.isDragging && dragState.current.type === 'text' && dragState.current.textIndex === index) {
          ctx.save();
          ctx.translate(text.x, text.y);
          ctx.scale(1.1, 1.1); // Visual feedback for dragging
          ctx.fillText(text.content, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(text.content, text.x, text.y);
        }
      });
    },
    [mode, gradients]
  );

  /**
   * Preloads fonts and sets isFontsLoaded when ready.
   * Uses Promise.allSettled for better error handling.
   */
  useEffect(() => {
    const loadFonts = async () => {
      try {
        await document.fonts.ready; // Wait for all fonts to be ready
        const fontPromises = fonts.map((font) =>
          document.fonts
            .load(`400 ${textSize}px ${font}`)
            .then(() => {
              return { status: 'fulfilled', value: font };
            })
            .catch((error) => {
              return { status: 'rejected', reason: error };
            })
        );
        const results = await Promise.allSettled(fontPromises);
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          console.log(`${failed.length} fonts failed to load, using fallbacks`);
        } else {
          console.log('All fonts loaded successfully');
        }
        setIsFontsLoaded(true);
        if (isOpen && canvasRef.current) {
          drawCanvas(canvasState);
        }
      } catch {
        setIsFontsLoaded(true); // Allow text addition even if fonts fail
      }
    };
    if (isOpen) {
      loadFonts();
    }
  }, [isOpen, textSize, canvasState, drawCanvas, fonts]);

  /**
   * Initializes the canvas with a gradient background when the modal opens.
   */
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 960);
        const [c1, c2] = gradients[0].colors;
        gradient.addColorStop(0, c1);
        gradient.addColorStop(1, c2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 540, 960);
      }
    }
  }, [isOpen, gradients]);

  /**
   * Restores a canvas state with its associated image element.
   * @param state - The canvas state to restore.
   */
  const restoreStateWithImage = useCallback(
    async (state: CanvasState): Promise<CanvasState> => {
      if (!state.media.src) {
        return { ...state, media: { ...state.media, element: null } };
      }
      try {
        const img = await loadImage(state.media.src);
        return { ...state, media: { ...state.media, element: img } };
      } catch {
        return { ...state, media: { ...state.media, element: null } };
      }
    },
    [loadImage]
  );

  /**
   * Redraws the canvas whenever the canvas state or modal visibility changes.
   */
  useEffect(() => {
    if (isOpen && canvasRef.current && isFontsLoaded) {
      drawCanvas(canvasState);
    }
  }, [canvasState, isOpen, isFontsLoaded, drawCanvas]);

  /**
   * Cleans up resources when the modal closes or unmounts.
   */
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (!isOpen) {
        setCanvasState({
          media: { element: null, src: null, x: 0, y: 0, width: 540, height: 960 },
          texts: [],
          gradientIndex: 0,
        });
        history.current = [
          { media: { element: null, src: null, x: 0, y: 0, width: 540, height: 960 }, texts: [], gradientIndex: 0 },
        ];
        redoStack.current = [];
        setMode(null);
      }
    };
  }, [isOpen]);

  /**
   * Saves the current canvas state to history for undo/redo functionality.
   * Limits history to 10 states for performance.
   */
  const saveState = useCallback(() => {
    const stateToSave = {
      ...canvasState,
      media: { ...canvasState.media, element: null },
    };
    history.current = [...history.current, stateToSave].slice(-10);
    redoStack.current = [];
  }, [canvasState]);

  /**
   * Undoes the last canvas action.
   */
  const undo = useCallback(async () => {
    if (history.current.length <= 1) return;
    const currentState = { ...canvasState, media: { ...canvasState.media, element: null } };
    redoStack.current = [...redoStack.current, currentState];
    const prevState = history.current[history.current.length - 2];
    history.current = history.current.slice(0, -1);
    const restoredState = await restoreStateWithImage(prevState);
    setCanvasState(restoredState);
  }, [canvasState, restoreStateWithImage]);

  /**
   * Redoes the last undone canvas action.
   */
  const redo = useCallback(async () => {
    if (redoStack.current.length === 0) return;
    const currentState = { ...canvasState, media: { ...canvasState.media, element: null } };
    history.current = [...history.current, currentState];
    const nextState = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    const restoredState = await restoreStateWithImage(nextState);
    setCanvasState(restoredState);
  }, [canvasState, restoreStateWithImage]);

  /**
   * Handles keyboard shortcuts for undo/redo.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          undo();
        } else if (e.key === 'y') {
          redo();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, undo, redo]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  /**
   * Handles mode selection (media or text).
   * @param newMode - The selected mode ("media" or "text").
   */
  const handleModeSelect = useCallback(
    async (newMode: 'media' | 'text') => {
      setMode(newMode);
      const newState = { ...canvasState, gradientIndex: newMode === 'media' ? 0 : 1 };
      if (newMode === 'text' && !newState.media.src) {
        try {
          setCanvasState(newState);
          saveState();
        } catch {
          // Silently handle errors
        }
      } else {
        setCanvasState(newState);
        saveState();
      }
    },
    [canvasState, saveState]
  );

  /**
   * Handles media file upload (images only).
   * @param file - The uploaded file.
   */
  const handleMediaUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    if (!canvasRef.current) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      return;
    }

    setMode('media');
    setIsUploading(true);
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);

    try {
      const img = await loadImage(url);
      const aspectRatio = img.height / img.width;
      const scaledHeight = aspectRatio * 540;
      const newState = {
        ...canvasState,
        media: { element: img, src: url, x: 0, y: 0, width: 540, height: Math.min(scaledHeight, 960) },
      };
      setCanvasState(newState);
      saveState();
    } catch {
      // Silently handle errors
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles drag-and-drop for media files.
   * @param e - The drag event.
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleMediaUpload(file);
    }
  };

  /**
   * Calculates the bounding box of a text object for precise click detection.
   * @param text - The text object.
   * @param ctx - The canvas 2D context.
   */
  const getTextBounds = useCallback(
    (text: TextObject, ctx: CanvasRenderingContext2D) => {
      if (!ctx) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      ctx.font = `${text.fontSize}px ${text.font}`;
      ctx.textAlign = text.align;
      ctx.textBaseline = 'middle';
      const metrics = ctx.measureText(text.content);
      const width = metrics.width;
      let x = text.x;

      if (text.align === 'center') {
        x -= width / 2;
      } else if (text.align === 'right') {
        x -= width;
      }

      const height = text.fontSize * 1.5;
      const padding = 30;
      return {
        x: x - padding,
        y: text.y - height / 2 - padding,
        width: width + 2 * padding,
        height: height + 2 * padding,
      };
    },
    []
  );

  /**
   * Unified handler for pointer down events (mouse/touch) to initiate dragging.
   * @param e - The pointer event.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) {
        return;
      }
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        return;
      }

      canvasRef.current.setPointerCapture(e.pointerId); // Capture pointer for better touch support

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check for text click (prioritize topmost text)
      let textIndex = -1;
      for (let i = canvasState.texts.length - 1; i >= 0; i--) {
        const text = canvasState.texts[i];
        const bounds = getTextBounds(text, ctx);
        if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
          textIndex = i;
          break;
        }
      }

      if (textIndex !== -1) {
        dragState.current = {
          isDragging: true,
          type: 'text',
          textIndex,
          startX: x - canvasState.texts[textIndex].x,
          startY: y - canvasState.texts[textIndex].y,
        };
        drawCanvas(canvasState);
        return;
      }

      // Check for media click
      if (
        canvasState.media.element &&
        x >= canvasState.media.x &&
        x <= canvasState.media.x + canvasState.media.width &&
        y >= canvasState.media.y &&
        y <= canvasState.media.y + canvasState.media.height
      ) {
        dragState.current = {
          isDragging: true,
          type: 'media',
          textIndex: null,
          startX: x - canvasState.media.x,
          startY: y - canvasState.media.y,
        };
        drawCanvas(canvasState);
      }
    },
    [canvasState, drawCanvas, getTextBounds]
  );

  /**
   * Unified handler for pointer move events (mouse/touch) for dragging.
   * @param e - The pointer event.
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!dragState.current.isDragging || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const updatePosition = () => {
        setCanvasState((prev) => {
          if (dragState.current.type === 'media' && prev.media.element) {
            const newX = Math.max(0, Math.min(x - dragState.current.startX, 540 - prev.media.width));
            const newY = Math.max(0, Math.min(y - dragState.current.startY, 960 - prev.media.height));
            return { ...prev, media: { ...prev.media, x: newX, y: newY } };
          } else if (dragState.current.type === 'text' && dragState.current.textIndex !== null) {
            const newX = x - dragState.current.startX;
            const newY = y - dragState.current.startY;
            const newTexts = [...prev.texts];
            newTexts[dragState.current.textIndex] = { ...newTexts[dragState.current.textIndex], x: newX, y: newY };
            return { ...prev, texts: newTexts };
          }
          return prev;
        });
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    },
    []
  );

  /**
   * Unified handler for pointer up events (mouse/touch) to end dragging.
   * @param e - The pointer event.
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragState.current.isDragging) {
        if (canvasRef.current) {
          canvasRef.current.releasePointerCapture(e.pointerId);
        }
        dragState.current = { isDragging: false, type: null, textIndex: null, startX: 0, startY: 0 };
        saveState();
        drawCanvas(canvasState);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    },
    [canvasState, drawCanvas, saveState]
  );

  /**
   * Adds text to the canvas at the specified or default position.
   * @param e - Optional pointer event for click-based positioning.
   */
  const addText = useCallback(
    (e?: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) {
        return;
      }
      if (!textInput.trim()) {
        return;
      }
      if (!isFontsLoaded) {
        return;
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e ? e.clientX - rect.left : 270;
      const y = e ? e.clientY - rect.top : 480;


      // Add new text with current font and properties
      const newText = {
        content: textInput,
        x,
        y,
        font: textFont,
        color: textColor,
        fontSize: textSize,
        align: textAlign,
      };
      setCanvasState((prev) => {
        const newState = { ...prev, texts: [...prev.texts, newText] };
        requestAnimationFrame(() => drawCanvas(newState)); // Use RAF for smooth rendering
        return newState;
      });
      setTextInput('');
      saveState();
    },
    [
      textInput,
      textFont,
      textColor,
      textSize,
      textAlign,
      isFontsLoaded,
      saveState,
      drawCanvas,
      getTextBounds,
      canvasState.texts,
    ]
  );

  /**
   * Clears the canvas content (media and/or text based on mode).
   */
  const clearCanvas = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      media: mode === 'text' ? prev.media : { element: null, src: null, x: 0, y: 0, width: 540, height: 960 },
      texts: [],
    }));
    saveState();
  }, [mode, saveState]);

  /**
   * Submits the canvas content as a story.
   */
  const handleSubmit = useCallback(() => {
    if (!canvasRef.current || !user) {
      return;
    }

    onClose();

    setIsSubmitting(true);

    const dataUrl = canvasRef.current.toDataURL('image/webp', 0.92);

    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'story.webp', { type: 'image/webp' });
        const request: CreateStoryRequest = { media: file };

        return dispatch(createStoryThunk(request)).unwrap();
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [dispatch, onClose, user]);

  return (
    <div
      className={styles['create-story-modal__overlay']}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-story-modal-title"
    >
      <div className={`${styles['create-story-modal__container']} scrollbar scrollbar-thin`}>
        <div className={styles['create-story-modal__header']}>
          <h2 id="create-story-modal-title" className={styles['create-story-modal__title']}>
            Create Story
          </h2>
          <button
            onClick={onClose}
            className={styles['create-story-modal__close']}
            aria-label="Close create story modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className={styles['create-story-modal__content']}>
          {mode === null ? (
            <div className={styles['create-story-modal__mode-selector']}>
              <label
                htmlFor="media-upload"
                className={`${styles['create-story-modal__mode-btn']} ${styles['create-story-modal__mode-btn--media']}`}
                aria-label="Add image to story"
              >
                <FaPlus size={24} className={styles['create-story-modal__mode-icon']} />
                Add Image
                <input
                  id="media-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMediaUpload(e.target.files?.[0] || null)}
                  className="hidden"
                  ref={fileInputRef}
                  aria-label="Upload image for story"
                />
              </label>
              <button
                onClick={() => handleModeSelect('text')}
                className={`${styles['create-story-modal__mode-btn']} ${styles['create-story-modal__mode-btn--text']}`}
                aria-label="Add text to story"
              >
                <FaPlus size={24} className={styles['create-story-modal__mode-icon']} />
                Add Text
              </button>
            </div>
          ) : (
            <div className={styles['create-story-modal__toolbar']}>
              <div className={styles['create-story-modal__user']}>
                <NextImage
                  src={user?.profilePicture || '/avatars/default-avatar.svg'}
                  alt={`${user?.profileName || 'User'}'s profile picture`}
                  className={styles['create-story-modal__avatar']}
                  width={40}
                  height={40}
                  loading="lazy" // Performance: lazy load avatar
                />
                <div>
                  <p className={styles['create-story-modal__username']}>{user?.profileName || 'User'}</p>
                  <p className={styles['create-story-modal__handle']}>{`@${user?.username || 'user'}`}</p>
                </div>
              </div>

              <div className={styles['create-story-modal__text-input']}>
                <label htmlFor="text-input" className={styles['create-story-modal__text-input-label']}>
                  Text
                </label>
                <input
                  id="text-input"
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Add text..."
                  className={styles['create-story-modal__text-input-field']}
                  style={{ fontFamily: textFont }} // Preview selected font
                  aria-label="Enter text for story"
                  disabled={!isFontsLoaded} // Disable until fonts are loaded
                />
              </div>

              <div className={styles['create-story-modal__color-picker']}>
                <p id="color-picker-label" className={styles['create-story-modal__color-picker-label']}>
                  Color
                </p>
                <div
                  className={styles['create-story-modal__color-options']}
                  role="group"
                  aria-labelledby="color-picker-label"
                >
                  {colors.map((color) => (
                    <button
                      key={color}
                      style={{ backgroundColor: color }}
                      className={`${styles['create-story-modal__color-option']} ${
                        textColor === color ? styles['create-story-modal__color-option--selected'] : ''
                      }`}
                      onClick={() => setTextColor(color)}
                      aria-label={`Select text color ${color}`}
                      aria-pressed={textColor === color}
                    />
                  ))}
                </div>
              </div>

              <div className={styles['create-story-modal__font-picker']}>
                <p id="font-picker-label" className={styles['create-story-modal__font-picker-label']}>
                  Font
                </p>
                <div
                  className={styles['create-story-modal__font-options']}
                  role="group"
                  aria-labelledby="font-picker-label"
                >
                  {fonts.map((font) => (
                    <button
                      key={font}
                      className={`${styles['create-story-modal__font-option']} ${
                        textFont === font ? styles['create-story-modal__font-option--selected'] : ''
                      }`}
                      style={{ fontFamily: font }}
                      onClick={() => setTextFont(font)}
                      aria-label={`Select font ${font}`}
                      disabled={!isFontsLoaded} // Disable until fonts are loaded
                      aria-pressed={textFont === font}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles['create-story-modal__size-slider']}>
                <label htmlFor="text-size-slider" className={styles['create-story-modal__size-slider-label']}>
                  Text Size
                </label>
                <input
                  id="text-size-slider"
                  type="range"
                  min="10"
                  max="60"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className={styles['create-story-modal__size-slider-field']}
                  aria-label="Adjust text size"
                />
              </div>

              <div className={styles['create-story-modal__alignment']}>
                <p id="alignment-label" className={styles['create-story-modal__alignment-label']}>
                  Alignment
                </p>
                <div
                  className={styles['create-story-modal__alignment-options']}
                  role="group"
                  aria-labelledby="alignment-label"
                >
                  {[
                    { align: 'left', icon: <FaAlignLeft /> },
                    { align: 'center', icon: <FaAlignCenter /> },
                    { align: 'right', icon: <FaAlignRight /> },
                  ].map(({ align, icon }) => (
                    <button
                      key={align}
                      className={`${styles['create-story-modal__alignment-option']} ${
                        textAlign === align ? styles['create-story-modal__alignment-option--selected'] : ''
                      }`}
                      onClick={() => setTextAlign(align as 'left' | 'center' | 'right')}
                      aria-label={`Set text alignment to ${align}`}
                      aria-pressed={textAlign === align}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles['create-story-modal__actions']}>
                {/* Group 1: Media & Text */}
                <div className={styles['create-story-modal__actions-group']}>
                  <label
                    htmlFor="add-media-upload"
                    className={`${styles['create-story-modal__action-btn']} ${styles['create-story-modal__action-btn--add-media']}`}
                  >
                    Add Image
                    <input
                      id="add-media-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMediaUpload(e.target.files?.[0] || null)}
                      className="hidden"
                      aria-label="Upload image for story"
                    />
                  </label>

                  <button
                    onClick={() => addText()}
                    className={`${styles['create-story-modal__action-btn']} ${styles['create-story-modal__action-btn--add-text']} ${
                      !isFontsLoaded || !textInput.trim()
                        ? styles['create-story-modal__action-btn--disabled']
                        : ''
                    }`}
                    aria-label="Add text to canvas"
                    disabled={!isFontsLoaded || !textInput.trim()}
                  >
                    <FaFont size={16} /> Add Text
                  </button>
                </div>

                {/* Group 2: History */}
                <div className={styles['create-story-modal__actions-group']}>
                  <button
                    onClick={undo}
                    className={`${styles['create-story-modal__action-btn']} ${styles['create-story-modal__action-btn--undo']} ${
                      history.current.length <= 1
                        ? styles['create-story-modal__action-btn--disabled']
                        : ''
                    }`}
                    disabled={history.current.length <= 1}
                    aria-label="Undo last action"
                  >
                    <FaUndo size={16} />
                  </button>

                  <button
                    onClick={redo}
                    className={`${styles['create-story-modal__action-btn']} ${styles['create-story-modal__action-btn--redo']} ${
                      redoStack.current.length === 0
                        ? styles['create-story-modal__action-btn--disabled']
                        : ''
                    }`}
                    disabled={redoStack.current.length === 0}
                    aria-label="Redo last action"
                  >
                    <FaRedo size={16} />
                  </button>
                </div>

                {/* Group 3: Actions */}
                <div className={styles['create-story-modal__actions-group']}>
                  <button
                    onClick={clearCanvas}
                    className={`${styles['create-story-modal__action-btn']} ${styles['create-story-modal__action-btn--discard']}`}
                    aria-label="Clear canvas"
                  >
                    <FaTrash size={16} /> Clear
                  </button>

                  <button
                    onClick={handleSubmit}
                    className={`${styles['create-story-modal__action-btn']} ${styles['create-story-modal__action-btn--share']} ${
                      isSubmitting
                        ? styles['create-story-modal__action-btn--disabled']
                        : ''
                    }`}
                    disabled={isSubmitting}
                    aria-label="Share story"
                  >
                    {isSubmitting ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`${styles['create-story-modal__canvas-wrapper']} ${!mode ? 'hidden' : ''} ${
              isUploading ? styles['create-story-modal__canvas-wrapper--uploading'] : ''
            }`}
          >
            {isUploading && (
              <div className={styles['create-story-modal__uploading']}>
                <p className={styles['create-story-modal__uploading-text']}>Uploading...</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className={`${styles['create-story-modal__canvas']} ${
                canvasState.media.element || canvasState.texts.length > 0 ? styles['create-story-modal__canvas--draggable'] : ''
              } ${dragState.current.isDragging ? styles['create-story-modal__canvas--dragging'] : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={(e) => {
                if (!dragState.current.isDragging && textInput.trim() && isFontsLoaded) {
                  addText(e as unknown as React.PointerEvent<HTMLCanvasElement>);
                }
              }}
              aria-label="Story editor canvas. Use toolbar to add and edit content."
              role="img" // Treat canvas as image for accessibility
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CreateStoryModal);