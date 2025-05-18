'use client';
import React from 'react';
import './SearchBar.css';
import { SearchBarProps } from '@/types';

/*
 * SearchBar Component
 * A search input with an icon for finding users or content.
 * Optimized for accessibility with ARIA attributes and semantic HTML.
 */
const SearchBar: React.FC<SearchBarProps> = () => {
  // Handle form submission (extendable for search logic)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Future: Implement search logic here
  };

  return (
    <form
      className="search-bar__container"
      role="search"
      aria-label="Search LinkUp"
      onSubmit={handleSubmit}
      data-testid="search-bar"
    >
      <label htmlFor="search-input" className="search-bar__label">
        Search
      </label>
      <img
        src="/icons/search.svg"
        alt="Search icon"
        className="search-bar__icon"
        aria-hidden="true"
        loading="lazy"
      />
      <input
        id="search-input"
        type="text"
        placeholder="Search"
        className="search-bar__input"
        aria-label="Search LinkUp"
      />
    </form>
  );
};

export default SearchBar;