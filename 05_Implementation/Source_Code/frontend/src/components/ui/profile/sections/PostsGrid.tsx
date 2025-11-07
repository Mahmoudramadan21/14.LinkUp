'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import Post from '@/components/ui/post/Post';
import PostSkeleton from '@/components/ui/post/PostSkeleton';
import { getUserPostsThunk, getSavedPostsThunk } from '@/store/postSlice';
import PrivateAccessNotice from '../states/PrivateAccessNotice';

interface PostsGridState {
  showCommentForm: number | null;
  showReplyForm: number | null;
  showPostMenu: number | null;
}

interface PostsGridActions {
  setShowCommentForm: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReplyForm: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPostMenu: React.Dispatch<React.SetStateAction<number | null>>;
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPostModal: React.Dispatch<React.SetStateAction<number | null>>;
}

interface PostsGridProps {
  username: string;
  isMine: boolean;
  hasAccess: boolean;
  type: 'posts' | 'saved';
  state: PostsGridState;
  actions: PostsGridActions;
}


/**
 * Grid component displaying user posts or saved posts with infinite scroll.
 * Supports private profile handling, loading states, and empty states.
 */
const PostsGrid: React.FC<PostsGridProps> = memo(
  ({ username, isMine, hasAccess, type, state, actions }) => {

    const { showCommentForm, showReplyForm, showPostMenu } = state;
    
    const {
      setShowCommentForm,
      setShowReplyForm,
      setShowPostMenu,
      setShowEditModal,
      setShowDeleteModal,
      setShowReportModal,
      setShowShareModal,
      setShowUserListModal,
      setShowPostModal,
    } = actions;
    
    const dispatch = useDispatch<AppDispatch>();
    const { usersPosts, savedPosts, loading, hasMoreUsersPosts, hasMoreSavedPosts } =
      useSelector((state: RootState) => state.post);
    const { loading: profileLoading } = useSelector((state: RootState) => state.profile);

    // Current data based on tab type
    const userPosts = usersPosts.find((up) => up.username === username)?.posts || [];
    const postsToShow = type === 'posts' ? userPosts : savedPosts;
    const hasMore =
      type === 'posts'
        ? hasMoreUsersPosts.find((h) => h.username === username)?.hasMore ?? true
        : hasMoreSavedPosts;

    const isLoading = type === 'posts' ? loading.getUserPosts : loading.getSavedPosts;

    const pageRef = useRef(1);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    /**
     * Initial data fetch when component mounts or tab changes.
     */
    useEffect(() => {
      if (type === 'posts' && userPosts.length === 0 && hasAccess) {
        pageRef.current = 1;
        dispatch(getUserPostsThunk({ username, params: { page: 1, limit: 9 } }));
      } else if (type === 'saved' && isMine && savedPosts.length === 0 && hasMore) {
        pageRef.current = 1;
        dispatch(getSavedPostsThunk({ page: 1, limit: 9 }));
      }
    }, [dispatch, username, type, isMine, hasAccess, hasMore, userPosts.length, savedPosts.length]);

    /**
     * Load more posts when sentinel enters viewport.
     */
    const loadMore = useCallback(() => {
      if (!hasMore || isLoading) return;

      pageRef.current += 1;
      const page = pageRef.current;

      if (type === 'posts') {
        dispatch(getUserPostsThunk({ username, params: { page, limit: 9 } }));
      } else if (isMine) {
        dispatch(getSavedPostsThunk({ page, limit: 9 }));
      }
    }, [dispatch, username, type, isMine, hasMore, isLoading]);

    /**
     * Setup IntersectionObserver for infinite scroll.
     */
    useEffect(() => {
      if (!sentinelRef.current) return;

      // Disconnect previous observer
      observerRef.current?.disconnect();

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadMore();
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      observer.observe(sentinelRef.current);
      observerRef.current = observer;

      return () => observer.disconnect();
    }, [loadMore]);

    // Initial loading state
    if ((isLoading || profileLoading.getProfile) && postsToShow.length === 0) {
      return (
        <div className="grid grid-cols-1 gap-4" role="feed" aria-label="Loading posts" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={`skeleton-initial-${i}`} />
          ))}
        </div>
      );
    }

    // Private profile access denied
    if (type === 'posts' && !hasAccess && !isMine && !profileLoading.getProfile) {
      return <PrivateAccessNotice username={username} />;
    }

    // Empty state
    if (postsToShow.length === 0 && !isLoading && !profileLoading.getProfile) {
      return (
        <p className="text-center text-gray-500 py-12 text-lg" aria-live="polite">
          {type === 'posts' ? 'No posts yet.' : 'No saved posts yet.'}
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4" role="feed" aria-label={`${type === 'posts' ? 'User' : 'Saved'} posts`}>
        {/* Posts */}
        {postsToShow.map((post) => (
          <Post
            key={post.PostID}
            post={post}
            state={{
              showCommentForm: showCommentForm === post.PostID,
              showReplyForm: showReplyForm,
              showPostMenu: showPostMenu === post.PostID,
              isInModal: false,
            }}
            actions={{
              setShowCommentForm,
              setShowReplyForm,
              setShowPostMenu,
              setShowEditModal,
              setShowDeleteModal,
              setShowReportModal,
              setShowShareModal,
              setShowUserListModal,
              setShowPostModal,
            }}
          />
        ))}

        {/* Loading more indicator */}
        {isLoading && postsToShow.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            <PostSkeleton />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && postsToShow.length > 0 && (
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
        )}
      </div>
    );
  }
);

PostsGrid.displayName = 'PostsGrid';

export default PostsGrid;