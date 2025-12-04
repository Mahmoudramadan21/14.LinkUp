// app/messages/components/CustomVideoPlayer.tsx
'use client';

import { memo, useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture,
} from 'lucide-react';

/**
 * CustomVideoPlayer
 * A lightweight, fully controlled, accessible video player with modern UI/UX.
 *
 * Features:
 * - Play/Pause with spacebar and click support
 * - Custom seek bar with dynamic gradient progress
 * - Volume slider + mute/unmute toggle
 * - Fullscreen and Picture-in-Picture modes
 * - Auto-hiding controls after 3 seconds of inactivity
 * - Touch + mouse interaction support
 * - Responsive design (max 90vh, centered)
 * - Smooth transitions and hover feedback
 */
const CustomVideoPlayer = memo(({ src }: { src: string }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  /* -------------------------------------------------------------------------- */
  /*                               Utility Functions                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Formats time in seconds to MM:SS string
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* -------------------------------------------------------------------------- */
  /*                              Playback Controls                             */
  /* -------------------------------------------------------------------------- */

  const togglePlay = (): void => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }

    setIsPlaying(!videoRef.current.paused);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(e.target.value);
    if (!videoRef.current) return;

    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = (): void => {
    if (!videoRef.current) return;

    if (isMuted) {
      const restoreVolume = volume > 0 ? volume : 0.5;
      videoRef.current.volume = restoreVolume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            Fullscreen & PiP Controls                       */
  /* -------------------------------------------------------------------------- */

  const enterFullscreen = (): void => {
    videoRef.current?.requestFullscreen?.();
  };

  const enterPIP = (): void => {
    videoRef.current?.requestPictureInPicture?.();
  };

  /* -------------------------------------------------------------------------- */
  /*                            Video Event Handlers                            */
  /* -------------------------------------------------------------------------- */

  const handleTimeUpdate = (): void => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = (): void => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  /* -------------------------------------------------------------------------- */
  /*                           Auto-Hide Controls Logic                         */
  /* -------------------------------------------------------------------------- */

  const resetHideTimeout = (): void => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setShowControls(true);
    hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const events: (keyof HTMLVideoElementEventMap)[] = [
      'play',
      'pause',
      'seeking',
      'volumechange',
      'mousemove',
      'touchstart',
    ];

    events.forEach((event) => video.addEventListener(event, resetHideTimeout));

    // Show controls initially
    resetHideTimeout();

    return () => {
      events.forEach((event) =>
        video.removeEventListener(event, resetHideTimeout)
      );
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                     Render                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      className="relative max-h-[90vh] max-w-full overflow-hidden rounded-lg bg-black"
      onMouseMove={resetHideTimeout}
      onTouchStart={resetHideTimeout}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="max-h-[90vh] w-auto max-w-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        preload="metadata"
        playsInline
        aria-label="Video message"
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="mb-3 w-full cursor-pointer accent-[var(--linkup-purple)] pointer-events-auto"
          style={{
            background: `linear-gradient(to right, var(--linkup-purple) ${
              duration > 0 ? ((currentTime / duration) * 100).toFixed(2) : 0
            }%, #ffffff33 ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
          }}
          aria-label="Seek video"
        />

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between text-white pointer-events-auto">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="hover:opacity-80 transition-opacity"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="hover:opacity-80 transition-opacity"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Volume Slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 accent-[var(--linkup-purple)]"
              aria-label="Volume"
            />

            {/* Time Display */}
            <span className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={enterPIP}
              aria-label="Picture-in-Picture"
              className="hover:opacity-80 transition-opacity"
            >
              <PictureInPicture size={20} />
            </button>

            <button
              onClick={enterFullscreen}
              aria-label="Fullscreen"
              className="hover:opacity-80 transition-opacity"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CustomVideoPlayer.displayName = 'CustomVideoPlayer';

export default CustomVideoPlayer;