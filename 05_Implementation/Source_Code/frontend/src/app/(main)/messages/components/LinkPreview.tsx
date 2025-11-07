// app/messages/components/LinkPreview.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

import styles from '../messages.module.css';

/**
 * LinkPreview
 * Fetches and displays rich OpenGraph preview for any URL using microlink.io API.
 *
 * Features:
 * - Automatic fetching on mount
 * - Graceful loading skeleton
 * - Fallback site name from hostname
 * - Responsive image with proper alt text
 * - Secure external link with target="_blank" + rel="noopener"
 * - Silently fails (returns null) on error or no data – no broken UI
 */
export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------------------------------- */
  /*                                    Types                                   */
  /* -------------------------------------------------------------------------- */

  interface OpenGraphData {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Fetch Preview Data                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        const result = await response.json();

        if (result.data) {
          const hostname = new URL(url).hostname.replace(/^www\./, '');

          setData({
            title: result.data.title ?? undefined,
            description: result.data.description ?? undefined,
            image: typeof result.data.image === 'object' ? result.data.image.url : result.data.image,
            siteName: result.data.publisher || hostname,
          });
        }
      } catch {
        // Silently fail – we don't want to break the chat UI
        // In production, you might log this to monitoring service
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  /* -------------------------------------------------------------------------- */
  /*                                 Loading State                              */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className={styles['link-preview--loading']}>
        <div className={`${styles.skeleton} ${styles['skeleton--title']}`} />
        <div className={`${styles.skeleton} ${styles['skeleton--line']}`} />
        <div className={`${styles.skeleton} ${styles['skeleton--short']}`} />
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             No Data / Error Fallback                       */
  /* -------------------------------------------------------------------------- */

  if (!data) {
    return null;
  }

  /* -------------------------------------------------------------------------- */
  /*                                     Render                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles['link-preview']}
      aria-label={`Open link: ${data.title || url}`}
    >
      {/* Preview Image */}
      {data.image && (
        <div className={styles['link-preview__image']}>
          <Image
            src={data.image}
            alt={data.title || 'Link preview image'}
            className="object-cover"
            width={240}
            height={240}
            unoptimized
          />
        </div>
      )}

      {/* Text Content */}
      <div className={styles['link-preview__content']}>
        {data.siteName && (
          <p className={styles['link-preview__site']}>{data.siteName}</p>
        )}
        {data.title && (
          <p className={styles['link-preview__title']}>{data.title}</p>
        )}
        {data.description && (
          <p className={styles['link-preview__description']}>{data.description}</p>
        )}
      </div>
    </a>
  );
}

LinkPreview.displayName = 'LinkPreview';