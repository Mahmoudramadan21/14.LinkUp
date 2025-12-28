'use client';

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import { RootState, AppDispatch } from '@/store';
import {
  getConversationsThunk,
  searchConversationsThunk,
} from '@/store/messageSlice';
import { setIsMobileMessagesSidebarOpen } from '@/store/uiSlice';

import ConversationListSkeleton from './ConversationListSkeleton';
import { Search, X } from 'lucide-react';

import styles from '@/app/(main)/messages/messages.module.css';

/**
 * ConversationList
 * Main sidebar component for the messages section.
 *
 * Features:
 * - Infinite scroll loading for recent conversations and search results
 * - Real-time debounced search with dedicated results section
 * - Mobile-first design with overlay, swipe-to-close, and outside-click handling
 * - Full keyboard navigation and screen reader support
 * - Active conversation highlighting and unread message badges
 * - Responsive layout with smooth slide-in animation on mobile
 */
const ConversationList = memo(() => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const {
    conversations,
    hasMoreConversations,
    loading,
    conversationsPagination,
    search,
    currentConversationId,
  } = useSelector((state: RootState) => state.message);

  const isMobileSidebarOpen = useSelector(
    (state: RootState) => state.ui.isMobileMessagesSidebarOpen
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Refs for infinite scroll and debouncing
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchSentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* -------------------------------------------------------------------------- */
  /*                            Navigation & Mobile Behavior                    */
  /* -------------------------------------------------------------------------- */

  const handleSelectConversation = useCallback(
    (id: string) => {
      router.push(`/messages/${id}`);
      if (window.innerWidth < 768) {
        dispatch(setIsMobileMessagesSidebarOpen(false));
      }
    },
    [router, dispatch]
  );

  // Close sidebar when clicking outside (mobile only)
  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const sidebar = document.querySelector(`.${styles['messages__sidebar']}`);
      if (sidebar && !sidebar.contains(e.target as Node)) {
        dispatch(setIsMobileMessagesSidebarOpen(false));
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMobileSidebarOpen, dispatch]);

  /* -------------------------------------------------------------------------- */
  /*                                  Search Logic                              */
  /* -------------------------------------------------------------------------- */

  const handleSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const q = query.trim();
        if (q) {
          dispatch(searchConversationsThunk({ q, page: 1, limit: 20 }));
        } else {
          dispatch({ type: 'message/clearSearch' });
        }
      }, 300);
    },
    [dispatch]
  );

  /* -------------------------------------------------------------------------- */
  /*                     Infinite Scroll: Recent Conversations                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasMoreConversations &&
          !loading.getConversations
        ) {
          dispatch(
            getConversationsThunk({
              page: (conversationsPagination?.page || 1) + 1,
              limit: 20,
            })
          );
        }
      },
      { rootMargin: '100px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [
    dispatch,
    hasMoreConversations,
    loading.getConversations,
    conversationsPagination?.page,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                      Infinite Scroll: Search Results                       */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          search.hasMore &&
          !search.loading &&
          search.query
        ) {
          dispatch(
            searchConversationsThunk({
              q: search.query,
              page: (search.pagination?.page || 1) + 1,
              limit: 20,
            })
          );
        }
      },
      { rootMargin: '100px' }
    );

    if (searchSentinelRef.current) observer.observe(searchSentinelRef.current);
    return () => observer.disconnect();
  }, [dispatch, search.hasMore, search.loading, search.query, search.pagination?.page]);

  /* -------------------------------------------------------------------------- */
  /*                               Conversation Item Render                     */
  /* -------------------------------------------------------------------------- */

  const renderConversationItem = useCallback(
    (conv: any) => {
      const isActive = conv.conversationId === currentConversationId;
      const participant = conv.otherParticipant;

      return (
        <div
          key={conv.conversationId}
          onClick={() => handleSelectConversation(conv.conversationId)}
          onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv.conversationId)}
          className={`${styles['messages__conversation_item']} ${
            isActive ? styles['messages__conversation_item--active'] : ''
          }`}
          role="button"
          tabIndex={0}
          aria-label={`Open chat with ${participant?.Username || 'Unknown'}`}
          aria-current={isActive ? 'page' : undefined}
        >
          <div className={styles['messages__avatar_wrapper']}>
            <Image
              src={participant?.ProfilePicture || '/avatars/default-avatar.svg'}
              alt=""
              width={48}
              height={48}
              className="avatar--lg"
              loading="lazy"
            />
            {conv.unreadCount > 0 && (
              <span className={styles['messages__unread_badge']}>
                {conv.unreadCount}
              </span>
            )}
          </div>

          <div className={styles['messages__conversation_info']}>
            <div className={styles['messages__username']}>
              {participant?.Username || 'Deleted User'}
            </div>
            {conv.lastMessage && (
              <div className={styles['messages__last_message']}>
                {conv.lastMessage.content}
              </div>
            )}
          </div>

          {conv.updatedAt && (
            <time className={styles['messages__timestamp']}>
              {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
            </time>
          )}
        </div>
      );
    },
    [currentConversationId, handleSelectConversation]
  );

  /* -------------------------------------------------------------------------- */
  /*                                     Render                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => dispatch(setIsMobileMessagesSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`${styles['messages__sidebar']} fixed md:relative left-0 top-[60px] md:top-0 z-50 w-full md:w-auto h-[calc(100vh-60px)] md:h-auto transform transition-transform duration-300 ease-in-out bg-[var(--section-bg)] border-r border-[var(--border-color)] ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
        aria-label="Messages sidebar"
      >
        {/* Header */}
        <header className={styles['messages__sidebar_header']}>
          <h2 className={styles['messages__sidebar_title']}>Messages</h2>
          <button
            onClick={() => dispatch(setIsMobileMessagesSidebarOpen(false))}
            className="md:hidden p-2 rounded-md hover:bg-[var(--hover-bg)] focus-ring"
            aria-label="Close messages sidebar"
          >
            <X size={24} />
          </button>
        </header>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-[var(--border-color)]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] focus-ring text-sm placeholder:text-[var(--text-muted)]"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className={styles['messages__list']} role="list">
          {/* Search Results Section */}
          {search.query && search.results.length > 0 && (
            <>
              <h3 className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
                Search Results
              </h3>
              {search.results.map(renderConversationItem)}
              {search.hasMore && <div ref={searchSentinelRef} className="h-1" />}
              {search.loading && (
                <p className="text-center text-sm text-[var(--text-muted)] py-3">
                  Loading more results...
                </p>
              )}
            </>
          )}

          {/* Section Title */}
          <h3 className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
            {search.query && search.results.length > 0
              ? 'All Conversations'
              : 'Recent Conversations'}
          </h3>

          {/* Loading Skeleton */}
          {loading.getConversations && conversations.length === 0 && (
            <ConversationListSkeleton />
          )}

          {/* Empty State */}
          {!loading.getConversations && conversations.length === 0 && !search.query && (
            <div className={styles['messages__empty_state']}>
              <svg
                className={styles['messages__empty_icon']}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className={styles['messages__empty_title']}>No messages yet</h3>
              <p className={styles['messages__empty_desc']}>
                Start a conversation by replying to a story or searching for a friend.
              </p>
            </div>
          )}

          {/* Conversation Items */}
          {conversations.map(renderConversationItem)}

          {/* Load More Trigger */}
          {hasMoreConversations && <div ref={sentinelRef} className="h-1" />}
        </div>
      </aside>
    </>
  );
});

ConversationList.displayName = 'ConversationList';

export default ConversationList;