"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { debounce } from "lodash";

import { RootState, AppDispatch } from "@/store";
import {
  getExplorePostsThunk,
  deletePostThunk,
  recordBatchPostViewsThunk,
} from "@/store/postSlice";

import ExplorePostModal from "@/components/ui/post/modals/ExplorePostModal";
import EditPostModal from "@/components/ui/post/modals/EditPostModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import ReportModal from "@/components/ui/modal/ReportModal";
import ShareModal from "@/components/ui/post/modals/ShareModal";
import UserListModal from "@/components/ui/modal/UserListModal";

import styles from "./explore.module.css";

/**
 * ExplorePageClient Component
 * Displays a grid of trending/public posts for discovery.
 * Supports image/video posts, modal viewing, editing, deletion, reporting, and sharing.
 * Implements debounced batch view recording for performance optimization.
 */
const ExplorePageClient = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { explorePosts, loading, error } = useSelector((state: RootState) => state.post);

  // Modal visibility states
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState<number | null>(null);

  // Track pending post view recordings to batch send
  const pendingViewsRef = useRef<Set<number>>(new Set());

  /**
   * Debounced function to send batched post view records
   * Sends accumulated post IDs every 8 seconds to reduce API calls
   */
  const sendBatchViews = useCallback(
    debounce(() => {
      const ids = Array.from(pendingViewsRef.current);
      if (ids.length === 0) return;

      dispatch(recordBatchPostViewsThunk({ postIds: ids }))
        .unwrap()
        .then(() => {
          pendingViewsRef.current.clear();
        })
        .catch(() => {
          // View recording failed - silently ignore (non-critical)
          pendingViewsRef.current.clear();
        });
    }, 8000),
    [dispatch]
  );

  /**
   * Handle post tile click - opens full post modal and records view
   */
  const handlePostClick = useCallback(
    (index: number) => {
      const post = explorePosts[index];
      if (!post?.PostID) return;

      pendingViewsRef.current.add(post.PostID);
      sendBatchViews();
      setShowPostModal(index);
    },
    [explorePosts, sendBatchViews]
  );

  /**
   * Record a single post view (used by modal when navigating between posts)
   */
  const recordView = useCallback(
    (postId: number) => {
      pendingViewsRef.current.add(postId);
      sendBatchViews();
    },
    [sendBatchViews]
  );

  /* -------------------------------------------------------------------------- */
  /*                               Data Fetching                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    // Initial load: fetch first page of explore posts
    dispatch(getExplorePostsThunk({ page: 1, limit: 10 }));

    // Cleanup on unmount: flush pending views immediately
    return () => {
      sendBatchViews.flush?.();

      const pendingIds = Array.from(pendingViewsRef.current);
      if (pendingIds.length > 0) {
        dispatch(recordBatchPostViewsThunk({ postIds: pendingIds })).finally(() => {
          pendingViewsRef.current.clear();
        });
      }
    };
  }, [dispatch, sendBatchViews]);

  /* -------------------------------------------------------------------------- */
  /*                              Keyboard Navigation                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowReportModal(null);
        setShowShareModal(null);
        setShowEditModal(null);
        setShowDeleteModal(null);
        setShowUserListModal(null);
        setShowPostModal(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Suspense fallback={<p>Loading explore...</p>}>
      <div className={styles.explore} aria-label="Explore posts">
        <div className={styles.explore__container}>
          <h1 className={styles.explore__title}>Explore</h1>

          {/* Modals */}
          {showEditModal && (
            <EditPostModal
              isOpen={showEditModal !== null}
              postId={showEditModal}
              onClose={() => setShowEditModal(null)}
              user={null}
            />
          )}

          {showDeleteModal && (
            <ConfirmationModal
              isOpen={showDeleteModal !== null}
              entityType="post"
              entityId={showDeleteModal}
              actionThunk={deletePostThunk}
              onClose={() => setShowDeleteModal(null)}
              loadingState={loading.deletePost}
            />
          )}

          {showReportModal && (
            <ReportModal
              isOpen={showReportModal !== null}
              postId={showReportModal}
              onClose={() => setShowReportModal(null)}
              loadingState={loading.reportPost}
            />
          )}

          {showShareModal && (
            <ShareModal
              isOpen={showShareModal !== null}
              post={explorePosts.find((p) => p.PostID === showShareModal)}
              onClose={() => setShowShareModal(null)}
            />
          )}

          {showUserListModal && (
            <UserListModal
              isOpen={showUserListModal !== null}
              onClose={() => setShowUserListModal(null)}
              type="likes"
              id={showUserListModal}
              title="Likes"
              postSource="explorePosts"
            />
          )}

          {showPostModal && (
            <ExplorePostModal
              isOpen={showPostModal !== null}
              postIndex={showPostModal}
              onClose={() => setShowPostModal(null)}
              actions={{
                setShowEditModal,
                setShowDeleteModal,
                setShowReportModal,
                setShowShareModal,
                setShowUserListModal,
              }}
              recordView={recordView}
            />
          )}

          {/* Posts Grid */}
          <div role="region" aria-live="polite">
            {loading.getExplorePosts ? (
              <p className={styles.explore__loading}>Loading posts...</p>
            ) : error.getExplorePosts ? (
              <p className={styles.explore__error}>{error.getExplorePosts}</p>
            ) : explorePosts.length === 0 ? (
              <p className={styles.explore__empty}>No posts to explore yet!</p>
            ) : (
              <div className={styles.explore__posts_grid}>
                {explorePosts.map((post, index) => (
                  <div
                    key={post.PostID}
                    className={styles.explore__post_tile}
                    onClick={() => handlePostClick(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handlePostClick(index)}
                    aria-label={`View post by ${post.User.Username}`}
                  >
                    {post.ImageURL ? (
                      <Image
                        src={post.ImageURL}
                        alt={`Post by ${post.User.Username}`}
                        width={800}
                        height={1000}
                        className={styles.explore__post_image}
                        sizes="(max-width: 768px) 50vw, 20vw"
                        placeholder="blur"
                        blurDataURL="/placeholder.png"
                        style={{ width: "100%", height: "auto" }}
                        priority={index < 6}
                      />
                    ) : post.VideoURL ? (
                      <video
                        src={post.VideoURL}
                        className={styles.explore__post_video}
                        muted
                        loop
                        autoPlay
                        playsInline
                        style={{ width: "100%", height: "auto", borderRadius: "0.5rem" }}
                      />
                    ) : (
                      <div className={styles.explore__post_tile_placeholder}>
                        <p className="text-center text-gray-500 p-8">{post.Content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default ExplorePageClient;