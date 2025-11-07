// app/(main)/(feed-search)/search/components/SearchEmptyState.tsx
'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Search, Users, FileText } from 'lucide-react';

type TabType = 'all' | 'people' | 'posts';

interface SearchEmptyStateProps {
  query: string;
  activeTab: TabType;
}

/**
 * SearchEmptyState
 * Beautiful, accessible empty state shown when no search results are found.
 * 
 * Features:
 * - Dynamic icon, title, and message per tab
 * - Helpful tips and "Back to Home" CTA
 * - Full keyboard & screen reader support
 * - Optimized with memo
 */
const SearchEmptyState = memo(({ query, activeTab }: SearchEmptyStateProps) => {
  const messages = {
    all: {
      Icon: Search,
      title: `No results found for "${query}"`,
      message: 'Try searching for people, posts, hashtags, or different keywords.',
      showTip: true,
    },
    people: {
      Icon: Users,
      title: `No people found for "${query}"`,
      message: 'Try a different name, username, or check spelling.',
      showTip: false,
    },
    posts: {
      Icon: FileText,
      title: `No posts found for "${query}"`,
      message: 'Try using different keywords, hashtags, or check your spelling.',
      showTip: false,
    },
  } as const;

  const { Icon, title, message, showTip } = messages[activeTab];

  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <div className="mb-8 text-[var(--text-muted)] opacity-70">
        <Icon size={80} strokeWidth={1.2} aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-primary-bold font-semibold mb-3">
        {title}
      </h2>

      {/* Message */}
      <p className="text-secondary max-w-md leading-relaxed">
        {message}
      </p>

      {/* Back to Home Button (only in "All" tab) */}
      {activeTab === 'all' && (
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[var(--linkup-purple)] text-white rounded-full font-medium hover:bg-[var(--linkup-purple-light)] focus:outline-none focus:ring-4 focus:ring-[var(--linkup-purple)] focus:ring-opacity-30 transition-shadow"
          prefetch={false}
        >
          Back to Home
        </Link>
      )}

      {/* Search Tip */}
      {showTip && (
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          Tip: You don’t need @ or # — just type naturally!
        </p>
      )}
    </div>
  );
});

SearchEmptyState.displayName = 'SearchEmptyState';

export default SearchEmptyState;