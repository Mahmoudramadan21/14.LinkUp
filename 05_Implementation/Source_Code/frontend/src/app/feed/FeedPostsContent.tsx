'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
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

/**
 * FeedPostsContent component for rendering the feed posts with infinite scroll and modals.
 * Optimized for performance, accessibility, SEO, and best practices.
 */
const FeedPostsContent = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { posts, loading, error, hasMore } = useSelector((state: RootState) => state.post);
  const { user } = useSelector((state: RootState) => state.auth);

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

  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<number>(1);
  const limit = 10;

  // Check if stories modal is active
  const isStoriesModalActive = pathname.includes('/feed/stories');

  // Debounced batch view recording
  const sendBatchViews = useCallback(
    debounce(() => {
      if (pendingViewsRef.current.length > 0) {
        dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current }))
          .unwrap()
          .then(() => {
            pendingViewsRef.current = [];
          })
          .catch((err) => {
            toast.error('Failed to record post views');
            console.error('Failed to record batch post views:', err);
          });
      }
    }, 10000),
    [dispatch]
  );

  // Debounced fetch next page for infinite scroll
  const fetchNextPage = useCallback(
    debounce(() => {
      if (hasMore && !loading.getPosts && !isStoriesModalActive) {
        pageRef.current += 1;
        dispatch(getPostsThunk({ page: pageRef.current, limit }));
      }
    }, 300),
    [dispatch, hasMore, loading.getPosts, limit, isStoriesModalActive]
  );

  // Fetch posts only if none exist
  useEffect(() => {
    if (posts.length === 0 && !loading.getPosts) {
      dispatch(getPostsThunk({ page: 1, limit }));
    }
    return () => {
      dispatch(clearError('getPosts'));
    };
  }, [dispatch, limit, posts.length, loading.getPosts]);

  // Prevent body scroll when stories modal is active
  useEffect(() => {
    if (isStoriesModalActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isStoriesModalActive]);

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (isStoriesModalActive) {
      fetchNextPage.cancel();
      return; // Skip observer when stories modal is open
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
      fetchNextPage.cancel();
    };
  }, [fetchNextPage, isStoriesModalActive]);

  // Setup IntersectionObserver for view tracking
  useEffect(() => {
    if (isStoriesModalActive) {
      sendBatchViews.cancel();
      return; // Skip observer when stories modal is open
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

  // Update URL when showPostModal changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (showPostModal) {
      newSearchParams.set('postId', showPostModal.toString());
    } else {
      newSearchParams.delete('postId');
    }
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [showPostModal, router, searchParams]);

  // Handle errors with toast
  useEffect(() => {
    if (error.getPosts) {
      toast.error(error.getPosts);
      dispatch(clearError('getPosts'));
    }
  }, [error.getPosts, dispatch]);

  // Escape key handler for closing modals
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowShareModal(null);
      setShowCreateModal(false);
      setShowEditModal(null);
      setShowDeleteModal(null);
      setShowPostMenu(null);
      setShowReportModal(null);
      setShowUserListModal(null);
      setShowPostModal(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={styles.feed} role="feed" aria-label="Your social media feed">
      <div className={styles.feed__container}>
        <h1 id="feed-title" className={styles.feed__title}>
          Your Feed
        </h1>

          <CreatePostTrigger
            user={user}
            onClick={() => setShowCreateModal(true)}
            aria-label="Create a new post"
          />

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          user={user}
        />

        {showEditModal !== null && (
          <EditPostModal
            isOpen={true}
            postId={showEditModal}
            onClose={() => setShowEditModal(null)}
            user={user}
          />
        )}

        {showDeleteModal !== null && (
          <ConfirmationModal
            isOpen={true}
            entityType="post"
            entityId={showDeleteModal}
            actionThunk={deletePostThunk}
            onClose={() => setShowDeleteModal(null)}
          />
        )}

        {showReportModal !== null && (
          <ReportModal
            isOpen={true}
            postId={showReportModal}
            onClose={() => setShowReportModal(null)}
          />
        )}

        {showShareModal !== null && (
          <ShareModal
            isOpen={true}
            post={posts.find((p) => p.PostID === showShareModal)}
            onClose={() => setShowShareModal(null)}
          />
        )}

        {showUserListModal !== null && (
          <UserListModal
            isOpen={true}
            onClose={() => setShowUserListModal(null)}
            type="likes"
            id={showUserListModal}
            title="Likes"
          />
        )}

        {showPostModal !== null && (
          <PostModal
            isOpen={true}
            postId={showPostModal}
            onClose={() => setShowPostModal(null)}
            setShowEditModal={setShowEditModal}
            setShowDeleteModal={setShowDeleteModal}
            setShowReportModal={setShowReportModal}
            setShowShareModal={setShowShareModal}
            setShowUserListModal={setShowUserListModal}
          />
        )}

        {loading.getPosts && posts.length === 0 ? (
          <PostSkeleton  />
        ) : error.getPosts ? (
          <div>
            <p className={styles.feed__error} role="alert">
              {error.getPosts}
            </p>
            <button
              onClick={() => dispatch(getPostsThunk({ page: 1, limit }))}
              className={styles.feed__retry_button}
              aria-label="Retry loading posts"
            >
              Retry
            </button>
          </div>
        ) : !loading.getPosts && posts.length === 0 ? (
          <p className={styles.feed__empty} aria-live="polite">
            Nothing here yet — follow people and share your first post!
          </p>
        ) : (
          <div className={styles.feed__posts} role="list">
            {posts.map((post) => (
              <Post
                key={post.PostID}
                post={post}
                showCommentForm={showCommentForm === post.PostID}
                setShowCommentForm={setShowCommentForm}
                showReplyForm={showReplyForm}
                setShowReplyForm={setShowReplyForm}
                showPostMenu={showPostMenu === post.PostID}
                setShowPostMenu={setShowPostMenu}
                setShowEditModal={setShowEditModal}
                setShowDeleteModal={setShowDeleteModal}
                setShowReportModal={setShowReportModal}
                setShowShareModal={setShowShareModal}
                setShowUserListModal={setShowUserListModal}
                setShowPostModal={setShowPostModal}
                isInModal={false}
                data-post-id={post.PostID}
              />
            ))}
            {loading.getPosts && hasMore && <PostSkeleton  />}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
});

FeedPostsContent.displayName = 'FeedPostsContent';

export default FeedPostsContent;
