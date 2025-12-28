// components/ui/common/CustomVideoPlayer.tsx
'use client';

import { memo, useRef, useState, useEffect, forwardRef, VideoHTMLAttributes } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture,
  SkipBack,
  SkipForward,
  Loader2,
} from 'lucide-react';

interface CustomVideoPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * CustomVideoPlayer
 * Fully accessible, reusable, beautiful video player with all modern controls.
 * Works perfectly on desktop + mobile (touch-friendly).
 */
const CustomVideoPlayer = forwardRef<HTMLVideoElement, CustomVideoPlayerProps>(
  ({ src, poster, autoPlay = false, className = '', onLoadedData, ...videoProps }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Merge external ref with internal
    useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = videoRef.current;
      }
    }, [ref]);

    // Format time: 03:45
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle Play / Pause
    const togglePlay = () => {
      if (videoRef.current?.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current?.pause();
        setIsPlaying(false);
      }
    };

    // Seek by ±10s
    const skip = (seconds: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime += seconds;
      }
    };

    // Volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = parseFloat(e.target.value);
      setVolume(vol);
      if (videoRef.current) {
        videoRef.current.volume = vol;
        setIsMuted(vol === 0);
      }
    };

    // Toggle Mute
    const toggleMute = () => {
      if (videoRef.current) {
        if (isMuted) {
          videoRef.current.volume = volume || 0.5;
          setIsMuted(false);
        } else {
          videoRef.current.volume = 0;
          setIsMuted(true);
        }
      }
    };

    // Fullscreen
    const enterFullscreen = () => {
      videoRef.current?.requestFullscreen();
    };

    // Picture in Picture
    const enterPip = async () => {
      if (videoRef.current && document.pictureInPictureEnabled) {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          }
          await videoRef.current.requestPictureInPicture();
        } catch {
        }
      }
    };

    // Progress bar click
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      if (videoRef.current) {
        videoRef.current.currentTime = percentage * duration;
      }
    };

    // Show/Hide controls on hover/move
    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    useEffect(() => {
      resetControlsTimeout();
      return () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
    }, []);

    return (
      <div
        className={`relative w-full h-full bg-black rounded-lg overflow-hidden group ${className}`}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain max-h-[80vh]"
          autoPlay={autoPlay}
          muted={isMuted}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onLoadedData={(e) => {
            setIsLoading(false);
            onLoadedData?.(e);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          {...videoProps}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            {/* Progress Bar */}
            <div
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-4"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-[var(--linkup-purple)] rounded-full transition-all duration-200"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                <button type="button" onClick={togglePlay} className="p-2 hover:scale-110 transition">
                  {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>

                <button type="button" onClick={() => skip(-10)} className="p-2">
                  <SkipBack size={24} />
                  <span className="text-xs">10</span>
                </button>

                <button type="button" onClick={() => skip(10)} className="p-2">
                  <SkipForward size={24} />
                  <span className="text-xs">10</span>
                </button>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={toggleMute}>
                    {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 accent-[var(--linkup-purple)]"
                  />
                </div>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration || 0)}
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={enterPip} className="p-2">
                  <PictureInPicture size={22} />
                </button>
                <button type="button" onClick={enterFullscreen} className="p-2">
                  <Maximize size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CustomVideoPlayer.displayName = 'CustomVideoPlayer';

export default memo(CustomVideoPlayer);