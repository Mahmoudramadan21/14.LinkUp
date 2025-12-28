// app/(main)/(feed-search)/search/SearchPageClient.tsx
'use client';

import React, {
  memo,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '@/store';
import {
  searchUsersThunk,
  clearSearchResults,
  followUserThunk,
  unfollowUserThunk,
} from '@/store/profileSlice';
import {
  searchPostsThunk,
  clearSearchPostResults,
  deletePostThunk,
} from '@/store/postSlice';

import SearchTabs, { TabValue } from '@/components/ui/search/SearchTabs';
import SearchResults from '@/components/ui/search/SearchResults';

import EditPostModal from '@/components/ui/post/modals/EditPostModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import ReportModal from '@/components/ui/modal/ReportModal';
import ShareModal from '@/components/ui/post/modals/ShareModal';
import UserListModal from '@/components/ui/modal/UserListModal';
import PostModal from '@/components/ui/post/modals/PostModal';

import styles from './search.module.css';

/**
 * SearchPageClient
 * Client-side search page with tabs, infinite scroll, and full post interaction support.
 * 
 * Features:
 * - Real-time search with debounced requests
 * - Tabbed results (All / People / Posts)
 * - Follow/unfollow from search results
 * - Full post modals (edit, delete, report, share, likes, comments)
 * - Keyboard navigation (Escape to close modals)
 */
const SearchPageClient = memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const query = searchParams.get('q')?.trim() ?? '';

  const activeTab = (searchParams.get('tab') as TabValue | null) ?? 'all';

  const {
    searchResults: users,
    loading: { searchUsers: userLoading, followUser, unfollowUser },
  } = useSelector((state: RootState) => state.profile);

  const {
    searchPostResults: posts,
    loading: { searchPosts: postLoading, deletePost: deletePostLoading, reportPost: reportPostLoading },
    hasMoreSearchPosts,
  } = useSelector((state: RootState) => state.post);

  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  // Modal states
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState<number | null>(null);

  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Search handler (debounced in child components or via useEffect)
  const performSearch = useCallback(
    (q: string, page: number) => {
      if (q.length < 2) return;

      dispatch(searchUsersThunk({ query: q, page, limit: 10 }));

      if (activeTab !== 'people') {
        dispatch(searchPostsThunk({ query: q, page, limit: 10 }));
      }
    },
    [dispatch, activeTab]
  );

  // Reset results and trigger new search on query/tab change
  useEffect(() => {
    pageRef.current = 1;
    dispatch(clearSearchResults());
    dispatch(clearSearchPostResults());

    if (query.length >= 2) {
      performSearch(query, 1);
    }
  }, [query, activeTab, performSearch, dispatch]);

  // Infinite scroll for posts
  useEffect(() => {
    if (!sentinelRef.current || activeTab === 'people') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasMoreSearchPosts &&
          !postLoading &&
          query.length >= 2
        ) {
          pageRef.current += 1;
          performSearch(query, pageRef.current);
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMoreSearchPosts, postLoading, activeTab, query, performSearch]);

  // Change search tab
  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/search?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Follow/Unfollow handler
  const handleFollow = useCallback(
    (userId: number, isFollowed: boolean | 'pending') => {
      const action = isFollowed === true ? unfollowUserThunk : followUserThunk;
      dispatch(action(userId));
    },
    [dispatch]
  );

  // Close all modals on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCommentForm(null);
        setShowReplyForm(null);
        setShowPostMenu(null);
        setShowEditModal(null);
        setShowDeleteModal(null);
        setShowReportModal(null);
        setShowShareModal(null);
        setShowUserListModal(null);
        setShowPostModal(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Early return: query too short
  if (query.length < 2) {
    return (
      <div className={styles.search} role="status" aria-live="polite">
        <p className={styles.search__empty}>
          Please enter at least 2 characters to search.
        </p>
      </div>
    );
  }

  const displayedUsers = activeTab === 'all' ? users.slice(0, 3) : users;

  const modalStates = {
    showCommentForm,
    setShowCommentForm,
    showReplyForm,
    setShowReplyForm,
    showPostMenu,
    setShowPostMenu,
    setShowEditModal,
    setShowDeleteModal,
    setShowReportModal,
    setShowShareModal,
    setShowUserListModal,
    setShowPostModal,
  };

  return (
    <div
      className={styles.search}
      role="search"
      aria-label={`Search results for "${query}"`}
    >
      {/* Tabs */}
      <SearchTabs activeTab={activeTab} onTabChange={setTab} />

      {/* Results */}
      <div className={styles.search__content}>
        <SearchResults
          activeTab={activeTab}
          query={query}
          users={users}
          posts={posts}
          userLoading={userLoading}
          postLoading={postLoading}
          hasMoreSearchPosts={hasMoreSearchPosts}
          displayedUsers={displayedUsers}
          onFollow={handleFollow}
          isFollowingLoading={followUser}
          isUnfollowingLoading={unfollowUser}
          modalStates={modalStates}
          sentinelRef={sentinelRef}
        />
      </div>

      {/* Global Modals */}
      {showEditModal && (
        <EditPostModal
          isOpen
          postId={showEditModal}
          onClose={() => setShowEditModal(null)}
          user={currentUser}
          postSource="searchedPosts"
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen
          entityType="post"
          entityId={showDeleteModal}
          actionThunk={deletePostThunk}
          onClose={() => setShowDeleteModal(null)}
          loadingState={deletePostLoading}
        />
      )}

      {showReportModal && (
        <ReportModal
          isOpen
          postId={showReportModal}
          onClose={() => setShowReportModal(null)}
          loadingState={reportPostLoading}
        />
      )}

      {showShareModal && (
        <ShareModal
          isOpen
          post={posts.find((p) => p.PostID === showShareModal)}
          onClose={() => setShowShareModal(null)}
        />
      )}

      {showUserListModal && (
        <UserListModal
          isOpen
          onClose={() => setShowUserListModal(null)}
          type="likes"
          id={showUserListModal}
          title="Likes"
          postSource="searchedPosts"
        />
      )}

      {showPostModal && (
        <PostModal
          isOpen={!!showPostModal}
          postId={showPostModal}
          onClose={() => setShowPostModal(null)}
          actions={{
            setShowEditModal,
            setShowDeleteModal,
            setShowReportModal,
            setShowShareModal,
            setShowUserListModal,
          }}
        />
      )}
    </div>
  );
});

SearchPageClient.displayName = 'SearchPageClient';

export default SearchPageClient;