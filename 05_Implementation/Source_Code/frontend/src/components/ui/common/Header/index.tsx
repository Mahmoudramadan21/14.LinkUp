'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaHistory,
  FaTimesCircle,
} from 'react-icons/fa';

import SearchIcon from "/public/icons/SearchIcon.svg";
import HomeIcon from "/public/icons/HomeIcon.svg";
import ProfileIcon from "/public/icons/ProfileIcon.svg";
import UsersIcon from "/public/icons/UsersIcon.svg";
import CompassIcon from "/public/icons/CompassIcon.svg";
import VideoIcon from "/public/icons/VideoIcon.svg";
import EnvelopeIcon from "/public/icons/EnvelopeIcon.svg";
import SignOutAltIcon from "/public/icons/SignOutAltIcon.svg";

import { RootState, AppDispatch } from '@/store';
import { useTheme } from 'next-themes';
import { clearFeedPosts, getPostsThunk } from '@/store/postSlice';

import styles from './header.module.css';
import { logoutThunk } from '@/store/authSlice';
import NotificationDropdown from './NotificationDropdown';

/* -------------------------------------------------------------------------- */
/*                            Search History Management                       */
/* -------------------------------------------------------------------------- */

const SEARCH_HISTORY_KEY = 'linkup_search_history';
const MAX_HISTORY_ITEMS = 7;

const saveSearchQuery = (query: string): void => {
  if (!query.trim()) return;

  const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]') as string[];
  const updated = [query, ...history.filter((q) => q !== query)].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
};

const getSearchHistory = (): string[] => {
  return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]') as string[];
};

/* -------------------------------------------------------------------------- */
/*                          Search Suggestions Dropdown                             */
/* -------------------------------------------------------------------------- */

interface SuggestionItem {
  type: 'search' | 'history';
  value: string;
}

const SearchSuggestions = memo(
  ({
    query,
    history,
    onSelect,
    onClear,
  }: {
    query: string;
    history: string[];
    onSelect: (q: string) => void;
    onClear: () => void;
  }) => {
    const filteredHistory = query
      ? history.filter((q) => q.toLowerCase().includes(query.toLowerCase()))
      : history;

    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const items = useMemo<SuggestionItem[]>(() => {
      return query
        ? [
            { type: 'search' as const, value: query },
            ...filteredHistory.map((v) => ({ type: 'history' as const, value: v })),
          ]
        : filteredHistory.map((v) => ({ type: 'history' as const, value: v }));
    }, [query, filteredHistory]);

    /* --------------------------- Keyboard Navigation -------------------------- */

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + items.length) % items.length);
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
          e.preventDefault();
          const item = items[highlightedIndex];
          onSelect(item.type === 'search' ? query : item.value);
        } else if (e.key === 'Escape') {
          setHighlightedIndex(-1);
        }
      },
      [highlightedIndex, items, query, onSelect]
    );

    useEffect(() => {
      itemRefs.current[highlightedIndex]?.focus();
    }, [highlightedIndex]);

    useEffect(() => {
      setHighlightedIndex(query ? 0 : -1);
    }, [query]);

    if (items.length === 0 && !query) return null;

    return (
      <div
        id="search-suggestions"
        className={`${styles['header__search-suggestions']} shadow-xl rounded-b-2xl bg-[var(--card-bg)] border border-[var(--border-color)] overflow-hidden`}
        role="listbox"
        aria-label="Search suggestions"
        onKeyDown={handleKeyDown}
      >
        {query && filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
            No results found for &quot;<strong>{query}</strong>&quot;
          </div>
        ) : (
          <>
            {/* Direct Search Option */}
            {query && (
              <button
                ref={(el) => {
                  itemRefs.current[0] = el;
                }}
                onClick={() => onSelect(query)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-3 text-sm transition-colors hover:bg-[var(--hover-bg)] ${
                  highlightedIndex === 0 ? 'bg-[var(--hover-bg)]' : ''
                }`}
                role="option"
                aria-selected={highlightedIndex === 0}
              >
                <span>Search for &quot;{query}&quot;</span>
                <SearchIcon className="text-[var(--linkup-purple)] w-5 h-5" aria-hidden="true" />
              </button>
            )}

            {/* History Items */}
            {filteredHistory.map((item, index) => {
              const actualIndex = query ? index + 1 : index;
              return (
                <button
                  key={item}
                  ref={(el) => {
                    itemRefs.current[actualIndex] = el;
                  }}
                  onClick={() => onSelect(item)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-3 text-sm transition-colors hover:bg-[var(--hover-bg)] ${
                    highlightedIndex === actualIndex ? 'bg-[var(--hover-bg)]' : ''
                  }`}
                  role="option"
                  aria-selected={highlightedIndex === actualIndex}
                >
                  <div className="flex items-center gap-3">
                    <FaHistory className="text-[var(--text-secondary)] text-sm" />
                    <span className="truncate max-w-[200px]">{item}</span>
                  </div>
                  <FaTimesCircle
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--error)] cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newHistory = history.filter((q) => q !== item);
                      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
                      onClear();
                    }}
                    aria-label={`Remove "${item}" from search history`}
                  />
                </button>
              );
            })}
          </>
        )}
      </div>
    );
  }
);
SearchSuggestions.displayName = 'SearchSuggestions';

/* -------------------------------------------------------------------------- */
/*                                 Header Component                                  */
/* -------------------------------------------------------------------------- */

const Header = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadConversationsCount } = useSelector((state: RootState) => state.message);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  const searchFormRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* --------------------------- Sync URL Search Query -------------------------- */

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (pathname === '/search') {
      const queryParam = searchParams.get('q')?.trim() || '';
      setSearchQuery(queryParam);
    } else {
      setSearchQuery('');
    }
  }, [pathname, searchParams]);

  /* ------------------------------- Load History ------------------------------ */

  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  /* -------------------------- Close Suggestions on Click Outside ------------------------- */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchFormRef.current && !searchFormRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsMobileSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ----------------------------- Mobile Search Handling ---------------------------- */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileSearchActive(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------------------------------- Search Logic --------------------------------- */

  const performSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      saveSearchQuery(trimmed);
      setSearchHistory((prev) => [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, MAX_HISTORY_ITEMS));

      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setShowSuggestions(false);
      setIsMobileSearchActive(false);
      inputRef.current?.blur();
    },
    [router]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        performSearch(searchQuery);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setIsMobileSearchActive(false);
        inputRef.current?.blur();
      }
    },
    [searchQuery, performSearch]
  );

  /* -------------------------------- Mobile Menu -------------------------------- */

  const toggleMobileMenu = useCallback(() => setIsMenuOpen((v) => !v), []);
  const closeMobileMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && closeMobileMenu();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeMobileMenu]);

  const navigationLinks = [
    { href: '/feed', icon: <HomeIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Home' },
    { href: `/${user?.username || ''}`, icon: <ProfileIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Profile' },
    { href: '/connections', icon: <UsersIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Connections' },
    { href: '/explore', icon: <CompassIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Explore' },
    { href: '/flicks', icon: <VideoIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Flicks' },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = useCallback(async () => {
    await dispatch(logoutThunk()).unwrap();
    router.push('/login');
  }, [dispatch, router]);

  return (
    <header className={styles['header__container']} role="banner" aria-label="Main header">
      {/* Logo - Refreshes feed on click */}
      <button
        onClick={() => {
          closeMobileMenu();
          if (pathname !== '/feed') router.push('/feed');
          dispatch(clearFeedPosts());
          dispatch(getPostsThunk({ page: 1, limit: 10 }));
        }}
        className="bg-transparent border-none p-0 cursor-pointer flex-shrink-0"
        aria-label="Go to home feed"
      >
        <Image
          src="/svgs/logo.svg"
          alt="LinkUp"
          width={120}
          height={40}
          priority
          fetchPriority="high"
          className={`${styles['header__logo']} dark:invert transition-transform hover:scale-105`}
        />
      </button>

      {/* Search Bar */}
      <form
        className={`${styles['header__search']} ${isMobileSearchActive ? styles['header__search--mobile-active'] : ''}`}
        onSubmit={(e) => {
          e.preventDefault();
          performSearch(searchQuery);
        }}
        role="search"
        ref={searchFormRef}
      >
        <SearchIcon className={styles['header__search-icon']} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            setShowSuggestions(true);
            if (window.innerWidth <= 768) setIsMobileSearchActive(true);
          }}
          onKeyDown={handleInputKeyDown}
          className={styles['header__search-input']}
          aria-label="Search LinkUp"
          autoComplete="off"
          enterKeyHint="search"
        />

        {showSuggestions && (
          <SearchSuggestions
            query={searchQuery}
            history={searchHistory}
            onSelect={performSearch}
            onClear={() => setSearchHistory(getSearchHistory())}
          />
        )}
      </form>

      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleMobileMenu}
        className={styles['header__menu-toggle']}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        aria-controls="main-nav"
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Main Navigation */}
      <nav
        id="main-nav"
        className={`${styles['header__nav']} ${isMenuOpen ? styles['header__nav--open'] : ''}`}
        role="navigation"
        aria-label="Primary navigation"
      >
        {navigationLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            onClick={closeMobileMenu}
            className={`${styles['header__nav-link']} ${pathname === link.href ? styles['header__nav-link--active'] : ''} w-10 h-10 bg-[var(--card-bg)]`}
            aria-current={pathname === link.href ? 'page' : undefined}
            aria-label={`Go to ${link.label} page`}
          >
            {link.icon}
            <span className={styles['header__nav-label']}>{link.label}</span>
          </Link>
        ))}
        <button
          onClick={() => {
            handleLogout();
            closeMobileMenu();
          }}
          className={`${styles['header__nav-link']} ${styles["header__nav-logout"]}`}
          aria-label="Logout"
        >
          <SignOutAltIcon className="w-6 h-6" aria-hidden="true" />
          <span className={styles['header__nav-label']}>Logout</span>
        </button>
      </nav>

      {/* Right Action Buttons */}
      <div className={styles['header__actions']}>
        <NotificationDropdown />
        <Link href="/messages" className={`${styles['header__nav-link']} ${styles["header__action-messages"]}`} aria-label="Messages">
          <EnvelopeIcon className="w-6 h-6" aria-hidden="true"/>
          {unreadConversationsCount > 0 && (
            <span className={styles['header__messages-badge']}>
              {unreadConversationsCount > 99 ? '99+' : unreadConversationsCount}
            </span>
          )}
        </Link>
        <button onClick={toggleTheme} className={styles['header__nav-link']} aria-label="Toggle theme">
          <span className="inline-block w-5 h-5">
            {mounted ? (
              theme === 'dark' ? <FaSun /> : <FaMoon />
            ) : (
              <FaMoon className="text-transparent" />
            )}
          </span>
        </button>
      </div>
    </header>
  );
});
Header.displayName = 'Header';

export default Header;
