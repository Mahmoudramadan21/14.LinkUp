import React from 'react';

/*
 * SearchBar Component
 * A simple search input field with an icon for user search functionality.
 * Used in headers or navigation bars to allow users to search the app.
 */
const SearchBar: React.FC = () => {
  return (
    <div className="search-bar" data-testid="search-bar">
      <img
        src="/icons/search.svg"
        alt="Search Icon"
        className="search-bar__icon"
        aria-hidden="true"
        loading="lazy" // Lazy-load icon for performance
      />
      <input
        type="text"
        placeholder="Search"
        className="search-bar__input"
        aria-label="Search LinkUp"
      />
    </div>
  );
};

export default SearchBar;