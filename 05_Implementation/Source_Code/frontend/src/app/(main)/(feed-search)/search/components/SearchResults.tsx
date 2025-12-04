// app/(main)/(feed-search)/search/components/SearchResults.tsx
'use client';

import React, { memo } from 'react';
import Link from 'next/link';

import SearchUserCard from './SearchUserCard';
import UserSkeleton from './UserSkeleton';
import Post from '@/components/ui/post/Post';
import PostSkeleton from '@/components/ui/post/PostSkeleton';
import SearchEmptyState from './SearchEmptyState';

import styles from '../search.module.css';

type TabType = 'all' | 'people' | 'posts';

interface SearchResultsProps {
  activeTab: TabType;
  query: string;
  users: any[];
  posts: any[];
  userLoading: boolean;
  postLoading: boolean;
  hasMoreSearchPosts: boolean;
  displayedUsers: any[];
  onFollow: (id: number, followed: boolean | 'pending') => void;
  isFollowingLoading: Record<number, boolean>;
  isUnfollowingLoading: Record<number, boolean>;
  modalStates: any;
  sentinelRef: React.Ref<HTMLDivElement>;
}

/**
 * SearchResults
 * Renders search results based on active tab with proper loading states,
 * skeletons, empty states, and infinite scroll support.
 */
const SearchResults = memo(
  ({
    activeTab,
    query,
    users,
    posts,
    userLoading,
    postLoading,
    hasMoreSearchPosts,
    displayedUsers,
    onFollow,
    isFollowingLoading,
    isUnfollowingLoading,
    modalStates,
    sentinelRef,
  }: SearchResultsProps) => {
    const isInitialLoading =
      (userLoading || postLoading) && users.length === 0 && posts.length === 0;

    const hasResults =
      activeTab === 'people'
        ? users.length > 0
        : activeTab === 'posts'
        ? posts.length > 0
        : users.length > 0 || posts.length > 0;

    // Initial loading state with skeletons
    if (isInitialLoading) {
      return (
        <>
          {/* People skeletons */}
          {(activeTab === 'all' || activeTab === 'people') && userLoading && (
            <section aria-labelledby="heading-people" className="space-y-4">
              <h2 id="heading-people" className={styles.search__heading}>
                People
              </h2>
              <div className={styles.search__users}>
                {Array.from({ length: 4 }, (_, i) => (
                  <UserSkeleton key={`user-skeleton-${i}`} />
                ))}
              </div>
            </section>
          )}

          {/* Posts skeletons */}
          {(activeTab === 'all' || activeTab === 'posts') && postLoading && (
            <section aria-labelledby="heading-posts" className="space-y-6">
              <h2 id="heading-posts" className={styles.search__heading}>
                Posts
              </h2>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </section>
          )}
        </>
      );
    }

    return (
      <>
        {/* People Results */}
        {(activeTab === 'all' || activeTab === 'people') && users.length > 0 && (
          <section id="search-panel-people" role="tabpanel" aria-labelledby="heading-people">
            <h2 id="heading-people" className={styles.search__heading}>
              People {users.length > 0 && `(${users.length})`}
            </h2>

            <div className={styles.search__users}>
              {displayedUsers.map((user) => (
                <SearchUserCard
                  key={user.userId}
                  user={user}
                  onFollow={onFollow}
                  isFollowingLoading={isFollowingLoading}
                  isUnfollowingLoading={isUnfollowingLoading}
                />
              ))}

              {/* View all link in "All" tab */}
              {activeTab === 'all' && users.length > 3 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&tab=people`}
                  className={styles['search__view-all']}
                  prefetch={false}
                >
                  View all people →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Posts Results */}
        {(activeTab === 'all' || activeTab === 'posts') && (
          <section id="search-panel-posts" role="tabpanel" aria-labelledby="heading-posts">
            <h2 id="heading-posts" className={styles.search__heading}>
              Posts {posts.length > 0 && `(${posts.length})`}
            </h2>

            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.PostID} className={styles.search__post}>
                    <Post
                      post={post}
                      state={{
                        showCommentForm: modalStates.showCommentForm === post.PostID,
                        showReplyForm: modalStates.showReplyForm,
                        showPostMenu: modalStates.showPostMenu === post.PostID,
                        isInModal: false,
                      }}
                      actions={{
                        setShowCommentForm: modalStates.setShowCommentForm,
                        setShowReplyForm: modalStates.setShowReplyForm,
                        setShowPostMenu: modalStates.setShowPostMenu,
                        setShowEditModal: modalStates.setShowEditModal,
                        setShowDeleteModal: modalStates.setShowDeleteModal,
                        setShowReportModal: modalStates.setShowReportModal,
                        setShowShareModal: modalStates.setShowShareModal,
                        setShowUserListModal: modalStates.setShowUserListModal,
                        setShowPostModal: modalStates.setShowPostModal,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {/* Infinite scroll sentinel */}
            {hasMoreSearchPosts && (
              <div ref={sentinelRef} className="h-10" aria-hidden="true" />
            )}
          </section>
        )}

        {/* Empty State */}
        {!hasResults && !isInitialLoading && (
          <SearchEmptyState query={query} activeTab={activeTab} />
        )}
      </>
    );
  }
);

SearchResults.displayName = 'SearchResults';

export default SearchResults;