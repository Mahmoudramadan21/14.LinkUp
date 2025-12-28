'use client';

import React, { memo } from 'react';
import styles from '@/app/(main)/(feed-search)/search/search.module.css';

const TABS = ['all', 'people', 'posts'] as const;

export type TabValue = (typeof TABS)[number];

interface SearchTabsProps {
  /** Currently active tab */
  activeTab: TabValue;
  /** Callback when user switches tabs */
  onTabChange: (tab: TabValue) => void;
}

/**
 * SearchTabs
 * Navigation tabs for search results (Top / People / Posts).
 * 
 * - Fully accessible with proper ARIA roles and labels
 * - Keyboard navigable
 * - Optimized with memo for stable reference
 */
const SearchTabs = memo(({ activeTab, onTabChange }: SearchTabsProps) => {
  const getTabLabel = (tab: TabValue): string => {
    switch (tab) {
      case 'all':
        return 'Top';
      case 'people':
        return 'People';
      case 'posts':
        return 'Posts';
      default:
        return String(tab).charAt(0).toUpperCase() + String(tab).slice(1);
    }
  };

  return (
    <nav
      className={styles.search__tabs}
      role="tablist"
      aria-label="Search result filters"
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`search-panel-${tab}`}
          onClick={() => onTabChange(tab)}
          className={`
            ${styles.search__tab}
            ${activeTab === tab ? styles['search__tab--active'] : ''}
          `.trim()}
        >
          {getTabLabel(tab)}
        </button>
      ))}
    </nav>
  );
});

SearchTabs.displayName = 'SearchTabs';

export default SearchTabs;