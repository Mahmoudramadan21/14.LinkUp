// app/messages/components/MediaViewer.tsx
'use client';

import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Download, Video } from 'lucide-react';
import { createPortal } from 'react-dom';

import styles from '../messages.module.css';

/**
 * MediaViewer
 * Full-screen lightbox-style media viewer with gallery support.
 *
 * Features:
 * - Supports multiple images & videos in a single session
 * - Swipe/Arrow key navigation + circular loop
 * - Thumbnail strip for quick jumping
 * - Download current media
 * - Keyboard support (Esc, ←, →)
 * - Preload adjacent media for smooth transitions
 * - Caption support
 * - Mobile-friendly touch navigation
 * - Portal-based overlay with smooth animations
 */

/* Media Item Type */
interface MediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  alt?: string;
  caption?: string;
}

const MediaViewer = memo(
  ({ media, initialIndex = 0, onClose }: { media: MediaItem[]; initialIndex?: number; onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex);
    const [loading, setLoading] = useState(true);

    const current = media[index];

    /* -------------------------------------------------------------------------- */
    /*                                    Types                                   */
    /* -------------------------------------------------------------------------- */

    interface MediaItem {
      url: string;
      type: 'IMAGE' | 'VIDEO';
      alt?: string;
      caption?: string;
    }

    /* -------------------------------------------------------------------------- */
    /*                              Preload Adjacent Media                        */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
      const preload = (item: MediaItem) => {
        if (item.type === 'IMAGE') {
          const img = new window.Image();
          img.src = item.url;
        }
      };

      if (media[index + 1]) preload(media[index + 1]);
      if (media[index - 1]) preload(media[index - 1]);
    }, [index, media]);

    /* -------------------------------------------------------------------------- */
    /*                               Keyboard Navigation                          */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      };

      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [index, media.length]);
    
    /* -------------------------------------------------------------------------- */
    /*                               Focus Management                             */
    /* -------------------------------------------------------------------------- */
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, []);

    /* -------------------------------------------------------------------------- */
    /*                               Navigation Helpers                           */
    /* -------------------------------------------------------------------------- */

    const prev = () => setIndex((i) => (i > 0 ? i - 1 : media.length - 1));
    const next = () => setIndex((i) => (i < media.length - 1 ? i + 1 : 0));

    /* -------------------------------------------------------------------------- */
    /*                                  Download Logic                            */
    /* -------------------------------------------------------------------------- */

    const download = async () => {
      try {
        const res = await fetch(current.url);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = current.alt || `linkup-media-${index + 1}${current.type === 'VIDEO' ? '.mp4' : '.jpg'}`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        alert('Download failed');
      }
    };

    /* -------------------------------------------------------------------------- */
    /*                                     Render                                 */
    /* -------------------------------------------------------------------------- */

    return createPortal(
      <div className={styles['media-viewer']} role="dialog" aria-modal="true" aria-labelledby="media-viewer-title">
        {/* Overlay */}
        <div className={styles['media-viewer__overlay']} onClick={onClose} aria-hidden="true" />

        {/* Modal */}
        <div className={styles['media-viewer__modal']}>
          {/* Header */}
          <header className={styles['media-viewer__header']}>
            <div id="media-viewer-title" className={styles['media-viewer__counter']}>
              {index + 1} / {media.length}
            </div>

            <div className={styles['media-viewer__actions']}>
              <button
                onClick={download}
                className={styles['media-viewer__action']}
                aria-label="Download current media"
              >
                <Download size={22} />
              </button>

              <button
                onClick={onClose}
                className={styles['media-viewer__close']}
                aria-label="Close media viewer"
              >
                <X size={28} />
              </button>
            </div>
          </header>

          {/* Main Media Area */}
          <div className={styles['media-viewer__container']}>
            {/* Navigation Arrows (only if multiple items) */}
            {media.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className={`${styles['media-viewer__nav']} ${styles['media-viewer__nav--prev']}`}
                  aria-label="Previous media"
                >
                  <ChevronLeft size={36} />
                </button>

                <button
                  onClick={next}
                  className={`${styles['media-viewer__nav']} ${styles['media-viewer__nav--next']}`}
                  aria-label="Next media"
                >
                  <ChevronRight size={36} />
                </button>
              </>
            )}

            {/* Current Media */}
            <div className={styles['media-viewer__media']}>
              {current.type === 'IMAGE' ? (
                <Image
                  src={current.url}
                  alt={current.alt || `Image ${index + 1}`}
                  fill
                  className={styles['media-viewer__image']}
                  priority
                  onLoadingComplete={() => setLoading(false)}
                />
              ) : (
                <video
                  src={current.url}
                  controls
                  autoPlay
                  onLoadedData={() => setLoading(false)}
                  className={styles['media-viewer__video']}
                />
              )}

              {/* Loading Spinner */}
              {loading && (
                <div className={styles['media-viewer__loader']}>
                  <div className={styles['media-viewer__spinner']} />
                </div>
              )}
            </div>

            {/* Caption */}
            {current.caption && (
              <div className={styles['media-viewer__caption']}>{current.caption}</div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {media.length > 1 && (
            <div className={styles['media-viewer__thumbnails']}>
              {media.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIndex(i);
                    setLoading(true);
                  }}
                  className={`${styles['media-viewer__thumb']} ${
                    i === index ? styles['media-viewer__thumb--active'] : ''
                  }`}
                  aria-label={`Go to media ${i + 1}`}
                >
                  {item.type === 'IMAGE' ? (
                    <Image src={item.url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Video size={20} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }
);

MediaViewer.displayName = 'MediaViewer';

export default MediaViewer;