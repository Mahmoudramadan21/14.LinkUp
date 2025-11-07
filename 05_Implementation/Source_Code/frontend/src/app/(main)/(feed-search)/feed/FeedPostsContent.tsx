// app/(main)/(feed-search)/feed/FeedPostsContent.tsx
'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { debounce } from 'lodash';
import { getPostsThunk, clearError, recordBatchPostViewsThunk, deletePostThunk } from '@/store/postSlice';
import { RootState, AppDispatch } from '@/store';
import styles from './feed.module.css';
import Post from '@/components/ui/post/Post';
import PostSkeleton from '@/components/ui/post/PostSkeleton';
import CreatePostTrigger from '@/components/ui/post/CreatePostTrigger';
import CreatePostModal from '@/components/ui/post/modals/CreatePostModal';
import EditPostModal from '@/components/ui/post/modals/EditPostModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import ReportModal from '@/components/ui/modal/ReportModal';
import ShareModal from '@/components/ui/post/modals/ShareModal';
import UserListModal from '@/components/ui/modal/UserListModal';
import PostModal from '@/components/ui/post/modals/PostModal';
import CreatingPostIndicator from '@/components/ui/post/CreatingPostIndicator';

/**
 * FeedPostsContent
 * Main component for rendering the social media feed with infinite scrolling,
 * post creation, and modal interactions. Optimized for performance and accessibility.
 */
const FeedPostsContent = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { posts, loading, hasMore } = useSelector((state: RootState) => state.post);
  const { user } = useSelector((state: RootState) => state.auth);

  // Modal and form states
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState<number | null>(null);

  // Media for post creation
  const [preselectedMedia, setPreselectedMedia] = useState<{
    file: File | null;
    isVideo: boolean;
  }>({
    file: null,
    isVideo: false,
  });

  // Refs for infinite scroll and view tracking
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<number>(1);
  const limit = 10;

  // Check if stories modal is active
  const isStoriesModalActive = pathname.includes('/feed/stories');

  // Handle media selection from CreatePostTrigger
  const handleMediaFromTrigger = useCallback(
    (file: File, isVideo: boolean) => {
      setPreselectedMedia({ file, isVideo });
      setShowCreateModal(true);
    },
    []
  );

  // Debounced batch view recording
  const sendBatchViews = useCallback(
    debounce(() => {
      if (pendingViewsRef.current.length === 0) return;

      dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current }))
        .unwrap()
        .then(() => {
          pendingViewsRef.current = [];
        });
    }, 10000),
    [dispatch]
  );

  // Debounced fetch next page for infinite scroll
  const fetchNextPage = useCallback(
    debounce(() => {
      if (hasMore && !isStoriesModalActive && !loading.getPosts) {
        pageRef.current += 1;
        dispatch(getPostsThunk({ page: pageRef.current, limit }));
      }
    }, 300),
    [dispatch, hasMore, loading.getPosts, limit, isStoriesModalActive]
  );

  // Initial posts fetch
  useEffect(() => {
    if (posts.length === 0) {
      dispatch(getPostsThunk({ page: 1, limit }));
    }

    return () => {
      dispatch(clearError('getPosts'));
    };
  }, [dispatch, limit, posts.length]);

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (isStoriesModalActive) {
      fetchNextPage.cancel();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
      fetchNextPage.cancel();
    };
  }, [fetchNextPage, hasMore, isStoriesModalActive]);

  // Setup IntersectionObserver for post view tracking
  useEffect(() => {
    if (isStoriesModalActive) {
      sendBatchViews.cancel();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = parseInt(entry.target.getAttribute('data-post-id') || '0', 10);
            if (postId && !pendingViewsRef.current.includes(postId)) {
              pendingViewsRef.current.push(postId);
              sendBatchViews();
            }
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const postElements = document.querySelectorAll(`.${styles.feed__post}`);
    postElements.forEach((post) => observerRef.current?.observe(post));

    return () => {
      observerRef.current?.disconnect();
      sendBatchViews.cancel();
    };
  }, [posts, sendBatchViews, isStoriesModalActive]);

  // Handle postId from search params
  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId) {
      const postIdNum = parseInt(postId, 10);
      if (!isNaN(postIdNum)) {
        setShowPostModal(postIdNum);
      }
    }
  }, [searchParams]);

  // Sync post modal with URL
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (showPostModal) {
      newSearchParams.set('postId', showPostModal.toString());
    } else {
      newSearchParams.delete('postId');
    }
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [showPostModal, router, searchParams]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCommentForm(null);
        setShowReplyForm(null);
        setShowPostMenu(null);
        setShowCreateModal(false);
        setShowEditModal(null);
        setShowDeleteModal(null);
        setShowReportModal(null);
        setShowShareModal(null);
        setShowUserListModal(null);
        setShowPostModal(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={styles.feed} aria-label="Main social media feed">
      <div className={styles.feed__container}>
        {/* Post Creation */}
        <CreatePostTrigger
          user={user}
          onClick={() => setShowCreateModal(true)}
          onMediaSelect={handleMediaFromTrigger}
          aria-label="Start creating a new post"
        />

        {loading.createPost && <CreatingPostIndicator />}

        {/* Posts List */}
        {loading.getPosts && posts.length === 0 ? (
          <div className="space-y-6">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <p className={styles.feed__empty} aria-live="polite">
            Nothing here yet — follow people and share your first post!
          </p>
        ) : (
          <div className={styles.feed__posts} role="feed">
            {posts.map((post) => (
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
                data-post-id={post.PostID}
              />
            ))}
            {loading.getPosts && hasMore && (
              <div className="mt-6">
                <PostSkeleton />
              </div>
            )}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreatePostModal
            isOpen
            onClose={() => {
              setShowCreateModal(false);
              setPreselectedMedia({ file: null, isVideo: false });
            }}
            user={user}
            preselectedMedia={preselectedMedia}
          />
        )}
        {showEditModal && (
          <EditPostModal
            isOpen
            postId={showEditModal}
            onClose={() => setShowEditModal(null)}
            user={user}
          />
        )}
        {showDeleteModal && (
          <ConfirmationModal
            isOpen
            entityType="post"
            entityId={showDeleteModal}
            actionThunk={deletePostThunk}
            onClose={() => setShowDeleteModal(null)}
            loadingState={loading.deletePost}
          />
        )}
        {showReportModal && (
          <ReportModal
            isOpen
            postId={showReportModal}
            onClose={() => setShowReportModal(null)}
            loadingState={loading.reportPost}
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
            postSource="posts"
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
    </div>
  );
});

FeedPostsContent.displayName = 'FeedPostsContent';

export default FeedPostsContent;