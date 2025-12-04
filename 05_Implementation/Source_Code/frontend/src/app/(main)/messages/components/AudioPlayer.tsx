// app/messages/components/AudioPlayer.tsx
'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

import styles from '../messages.module.css';

interface AudioPlayerProps {
  src: string;
  isSending: boolean;
  theme: 'sent' | 'received';
  className?: string;
}

/**
 * Utility: Draw a rounded rectangle manually on Canvas
 * Used for smooth waveform bars with rounded caps
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * AudioPlayer Component
 * A fully custom, accessible, high-performance voice message player
 * Features:
 * - Dynamic waveform visualization from actual audio data
 * - Smooth seeking (mouse + touch + keyboard)
 * - Real-time progress animation
 * - Responsive canvas with device pixel ratio support
 * - Play/pause, loading, and error states
 * - Full keyboard navigation and screen reader support
 */
export default function AudioPlayer({
  src,
  isSending,
  theme,
  className = '',
}: AudioPlayerProps) {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Waveform data
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  // const offlineCtxRef = useRef<OfflineAudioContext | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Utility: Format seconds into MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate seek position from mouse/touch X coordinate
  const getSeekTime = (clientX: number): number => {
    const progress = progressRef.current;
    if (!progress || duration <= 0) return 0;
    const { left, width } = progress.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - left) / width));
    return percent * duration;
  };

  // Derived value for progress bar
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  /* -------------------------------------------------------------------------- */
  /*                               Waveform Rendering                           */
  /* -------------------------------------------------------------------------- */

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformPeaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = 3;
    const barGap = 2;
    const numBars = Math.floor(width / (barWidth + barGap));
    const step = Math.max(1, Math.floor(waveformPeaks.length / numBars));
    const progressX = (progressPercentage / 100) * width;

    // Colors from CSS variables (sent/received themes)
    const colorInactive = getComputedStyle(document.documentElement)
      .getPropertyValue(theme === 'sent' ? '--audio-waveform-sent' : '--audio-waveform-received')
      .trim();

    const colorActive = getComputedStyle(document.documentElement)
      .getPropertyValue(theme === 'sent' ? '--audio-waveform-sent-progress' : '--audio-waveform-received-progress')
      .trim();

    for (let i = 0; i < numBars; i++) {
      const peak = waveformPeaks[i * step] ?? 0;
      const barHeight = Math.max(4, peak * height * 3.5);
      const x = i * (barWidth + barGap);
      const y = (height - barHeight) / 2;

      ctx.fillStyle = x + barWidth / 2 <= progressX ? colorActive : colorInactive;
      roundedRect(ctx, x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }
  }, [waveformPeaks, progressPercentage, theme]);

  /* -------------------------------------------------------------------------- */
  /*                             Real-time Progress Update                      */
  /* -------------------------------------------------------------------------- */

  const updateCurrentTime = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isSeeking) {
      setCurrentTime(audio.currentTime);
      drawWaveform();
    }
    animationRef.current = requestAnimationFrame(updateCurrentTime);
  }, [isSeeking, drawWaveform]);

  useEffect(() => {
    if (isPlaying && !isSeeking) {
      animationRef.current = requestAnimationFrame(updateCurrentTime);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isSeeking, updateCurrentTime]);

  /* -------------------------------------------------------------------------- */
  /*                             Canvas Resize Handling                         */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      drawWaveform();
    };

    updateCanvasSize();

    const observer = new ResizeObserver(updateCanvasSize);
    const parent = canvas.parentElement;
    if (parent) observer.observe(parent);
    resizeObserverRef.current = observer;

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [drawWaveform]);

  /* -------------------------------------------------------------------------- */
  /*                           Generate Waveform from Audio                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const generateWaveformPeaks = async () => {
      // Wait until audio metadata is loaded
      await new Promise<void>((resolve) => {
        if (audio.readyState >= 2) return resolve();
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          resolve();
        };
        audio.addEventListener('canplay', onCanPlay);
      });

      if (cancelled) return;

      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        const samples = 120;
        const blockSize = Math.floor(channelData.length / samples);
        const peaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j]);
          }
          peaks.push(sum / blockSize);
        }

        const maxPeak = Math.max(...peaks, 1);
        setWaveformPeaks(peaks.map(p => p / maxPeak));
      } catch {
        setError(true);
      }
    };

    const handleLoadedMetadata = () => {
      const d = audio.duration;
      setDuration(isFinite(d) ? d : 0);
      setIsLoading(false);
      generateWaveformPeaks();
    };

    const handleError = () => {
      setError(true);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      drawWaveform();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      cancelled = true;
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, drawWaveform]);

  /* -------------------------------------------------------------------------- */
  /*                                Audio Source Sync                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && src) {
      audio.src = src;
      audio.load();
    }
  }, [src]);

  /* -------------------------------------------------------------------------- */
  /*                             Play/Pause Control                             */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  /* -------------------------------------------------------------------------- */
  /*                                  Seeking Logic                             */
  /* -------------------------------------------------------------------------- */

  const startSeeking = (clientX: number) => {
    setIsSeeking(true);
    const time = getSeekTime(clientX);
    setCurrentTime(time);
    seekRef.current = time;
    drawWaveform();
  };

  const updateSeeking = (clientX: number) => {
    if (!isSeeking) return;
    const time = getSeekTime(clientX);
    setCurrentTime(time);
    seekRef.current = time;
    drawWaveform();
  };

  const endSeeking = () => {
    if (isSeeking && audioRef.current && seekRef.current !== null) {
      audioRef.current.currentTime = seekRef.current;
    }
    setIsSeeking(false);
    seekRef.current = null;
    drawWaveform();
  };

  const handleMouseDown = (e: React.MouseEvent) => startSeeking(e.clientX);
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startSeeking(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isSeeking) return;

    const handleMouseMove = (e: MouseEvent) => updateSeeking(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      updateSeeking(e.touches[0].clientX);
    };
    const handleUp = () => endSeeking();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isSeeking]);

  /* -------------------------------------------------------------------------- */
  /*                               Keyboard Navigation                          */
  /* -------------------------------------------------------------------------- */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!audioRef.current || duration <= 0) return;

    let newTime = currentTime;

    if (e.key === ' ') {
      e.preventDefault();
      setIsPlaying(prev => !prev);
      return;
    }
    if (e.key === 'ArrowRight') newTime = Math.min(duration, currentTime + 5);
    else if (e.key === 'ArrowLeft') newTime = Math.max(0, currentTime - 5);
    else if (e.key === 'Home') newTime = 0;
    else if (e.key === 'End') newTime = duration;
    else return;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    drawWaveform();
    e.preventDefault();
  };

  const togglePlayPause = () => {
    if (isLoading || error) return;
    setIsPlaying(prev => !prev);
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      className={`
        ${styles.audio_player}
        ${theme === 'sent' ? styles['audio_player--sent'] : styles['audio_player--received']}
        ${className}
      `.trim()}
      role="region"
      aria-label="Voice message player"
    >
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading || error}
        className={styles.audio_player__play_button}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        aria-pressed={isPlaying}
      >
        {isLoading || isSending ? (
          <div className={styles.audio_player__spinner} />
        ) : error ? (
          <Volume2 size={20} className={styles.audio_player__error_icon} />
        ) : isPlaying ? (
          <Pause size={20} />
        ) : (
          <Play size={20} className={styles.audio_player__play_icon} />
        )}
      </button>

      {/* Seekable Progress Bar with Waveform */}
      <div
        ref={progressRef}
        className={styles.audio_player__progress}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-label={`Seek: ${formatTime(currentTime)} of ${formatTime(duration)}`}
      >
        <canvas ref={canvasRef} className={styles.audio_player__canvas} />
      </div>

      {/* Current Time Display */}
      <span className={styles.audio_player__time} aria-live="polite">
        {error && !isSending ? 'Failed' : formatTime(currentTime)}
      </span>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="metadata" playsInline crossOrigin="anonymous" />
    </div>
  );
}