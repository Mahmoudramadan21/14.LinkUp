// pages/profile/highlights/[userId].tsx
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useProfileStore } from '@/store/profileStore';
import Loading from '@/components/Loading';
import MainLayout from '@/layout/MainLayout';
import { getAuthData } from '@/utils/auth';

const HighlightsPage = () => {
  const router = useRouter();
  const { userId } = router.query;
  const authData = getAuthData();
  const { highlights, fetchHighlights, highlightsLoading } = useProfileStore();

  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch highlights when component mounts
  useEffect(() => {
    if (userId && typeof userId === 'string') {
      fetchHighlights(parseInt(userId));
    }
  }, [userId, fetchHighlights]);

  // Start timer when playing
  useEffect(() => {
    if (isPlaying && highlights.length > 0 && highlights[currentHighlightIndex].stories.length > 0) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 15) {
            handleNextStory();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (!isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentHighlightIndex, currentStoryIndex, highlights]);

  // Reset progress when changing story
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);

  const handleNextStory = () => {
    const currentHighlight = highlights[currentHighlightIndex];
    if (currentStoryIndex + 1 < currentHighlight.stories.length) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentHighlightIndex + 1 < highlights.length) {
      setCurrentHighlightIndex(currentHighlightIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      setCurrentHighlightIndex(0);
      setCurrentStoryIndex(0);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex(currentHighlightIndex - 1);
      setCurrentStoryIndex(highlights[currentHighlightIndex - 1].stories.length - 1);
    }
  };

  const handleNextStoryInHighlight = () => {
    const currentHighlight = highlights[currentHighlightIndex];
    if (currentStoryIndex + 1 < currentHighlight.stories.length) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentHighlightIndex + 1 < highlights.length) {
      setCurrentHighlightIndex(currentHighlightIndex + 1);
      setCurrentStoryIndex(0);
    }
  };

  const handlePrevStoryInHighlight = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentHighlightIndex > 0) {
      setCurrentHighlightIndex(currentHighlightIndex - 1);
      setCurrentStoryIndex(highlights[currentHighlightIndex - 1].stories.length - 1);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    if (typeof userId === 'string') {
      router.push(`/profile/${authData?.username}`);
    } else {
      router.push('/profile');
    }
  };

  if (highlightsLoading) {
    return <Loading />;
  }

  if (highlights.length === 0) {
    return (
      <MainLayout title="LinkUp | Highlights">
        <div className="story-page">
          No highlights available
        </div>
      </MainLayout>
    );
  }

  const currentHighlight = highlights[currentHighlightIndex];
  const currentStory = currentHighlight.stories[currentStoryIndex];
  const totalStories = currentHighlight.stories.length;

  return (
    <MainLayout title="LinkUp | Highlights">
      <div className="story-page">
        {/* Header */}
        <div className="story-header">
          <div className="story-header__info">
            <Image
              src={currentHighlight.coverImage || '/placeholder.jpg'}
              alt={currentHighlight.title}
              width={40}
              height={40}
              style={{ width: "40px", height: "40px" }}
              className="story-header__image"
            />
            <div>
              <p className="story-header__title">{currentHighlight.title}</p>
              <p className="story-header__timestamp">3w</p>
            </div>
          </div>
          <button onClick={handleClose} className="story-header__close">×</button>
        </div>

        {/* Story Viewer with 6:19 aspect ratio */}
        <div className="story-viewer">
          <div className="story-viewer__content" style={{ aspectRatio: '6 / 19' }}>
            <div className="story-viewer__image">
              <Image
                src={currentStory.mediaUrl}
                alt={currentHighlight.title}
                layout="fill"
                objectFit="contain"
                objectPosition="center"
              />
            </div>
            {/* Progress Bar with Play/Pause Button */}
            <div className="story-viewer__progress">
              <div className="progress-bar">
                {Array.from({ length: totalStories }, (_, i) => (
                  <div
                    key={`${currentHighlightIndex}-${i}`} // Ensure re-render on story change
                    className="progress-bar__item"
                  >
                    <div
                      className={`progress-bar__fill ${i === currentStoryIndex ? 'progress-bar__fill--active' : ''}`}
                      style={{
                        width: i < currentStoryIndex ? '100%' : i > currentStoryIndex ? '0%' : undefined,
                        backgroundColor: i <= currentStoryIndex ? 'white' : 'gray',
                        animationPlayState: i === currentStoryIndex ? (isPlaying ? 'running' : 'paused') : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>
              <button className="play-pause-button" onClick={togglePlayPause}>
                <Image
                  src={isPlaying ? "/icons/pause.svg" : "/icons/play.svg"}
                  alt={isPlaying ? "Pause" : "Play"}
                  width={16}
                  height={16}
                  style={{ width: "16px", height: "16px" }}
                />
              </button>
            </div>
            {/* Navigation Buttons */}
            <button
              onClick={handlePrevStoryInHighlight}
              className="nav-button nav-button--prev"
            >
              <Image src="/icons/prev.svg" alt="Previous" width={18} height={18} style={{ width: "18px", height: "18px" }} />
            </button>
            <button
              onClick={handleNextStoryInHighlight}
              className="nav-button nav-button--next"
            >
              <Image src="/icons/next.svg" alt="Next" width={18} height={18} style={{ width: "18px", height: "18px" }} />
            </button>
            {/* Controls */}
            <div className="story-viewer__controls">
              <input
                type="text"
                placeholder="Reply to rajausame..."
                className="story-viewer__input"
              />
              <button className="story-viewer__button">
                <Image src="/icons/like.svg" alt="Like" width={20} height={20} />
              </button>
              <button className="story-viewer__button">
                <Image src="/icons/share.svg" alt="Share" width={20} height={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default memo(HighlightsPage);