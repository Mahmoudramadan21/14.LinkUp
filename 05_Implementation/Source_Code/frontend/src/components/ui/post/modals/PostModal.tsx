'use client';

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import { debounce } from "lodash";

import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import Post from "@/components/ui/post/Post";

import {
  getPostByIdThunk,
  getPostCommentsThunk,
  recordBatchPostViewsThunk,
} from "@/store/postSlice";
import { RootState, AppDispatch } from "@/store";

interface PostModalActions {
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
}

interface PostModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
  actions: PostModalActions;
}


/**
 * Full-screen modal for viewing a single post with full details and interactions.
 * Fetches post data if not available, loads initial comments, and tracks views via IntersectionObserver.
 * Supports Escape key to close and manages internal UI states for comments/replies/menu.
 */
const PostModal: React.FC<PostModalProps> = ({ isOpen, postId, onClose, actions }) => {
  const {
    setShowEditModal,
    setShowDeleteModal,
    setShowReportModal,
    setShowShareModal,
    setShowUserListModal,
  } = actions;

  const dispatch = useDispatch<AppDispatch>();

  const { posts, currentPost, usersPosts, loading, error } = useSelector(
    (state: RootState) => state.post
  );


  // Find post either in main list or in currentPost (from getPostById)
  const selectedPost =
    posts.find((p) => p.PostID === postId) ||
    usersPosts
      .flatMap((u) => u.posts)
      .find((p) => p.PostID === postId) ||
    (currentPost?.PostID === postId ? currentPost : null);


  useEffect(() => {
    if (!isOpen || !postId) return;

    const needsFetch =
      !selectedPost ||
      !currentPost ||
      currentPost.PostID !== postId;

    if (needsFetch) {
      dispatch(getPostByIdThunk(postId));
    }
  }, [isOpen, postId, selectedPost, currentPost, dispatch]);

  // Local UI states for comment/reply forms and post menu
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);

  // Refs
  const modalRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);

  /**
   * Debounced batch view recorder
   * Sends accumulated post IDs every 10 seconds to reduce API calls
   */
  const sendBatchViews = debounce(() => {
    if (pendingViewsRef.current.length > 0) {
      dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current }))
        .unwrap()
        .then(() => {
          pendingViewsRef.current = []; // Clear after success
        })
    }
  }, 10000);

  // Setup IntersectionObserver to track when post becomes visible (view counted)
  useEffect(() => {
    if (!isOpen || !postId || !modalRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const viewedPostId = Number(entry.target.getAttribute("data-post-id"));

            if (
              viewedPostId &&
              !pendingViewsRef.current.includes(viewedPostId)
            ) {
              pendingViewsRef.current.push(viewedPostId);
              sendBatchViews();
            }

            // Stop observing once viewed post
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 } // Count view when 60% of modal is visible
    );

    observerRef.current.observe(modalRef.current);

    return () => {
      observerRef.current?.disconnect();
      sendBatchViews.flush(); // Send any pending views on cleanup
    };
  }, [isOpen, postId, sendBatchViews]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load initial comments when modal opens
  useEffect(() => {
    if (isOpen && postId) {
      dispatch(getPostCommentsThunk({ postId, params: { page: 1, limit: 10 } }));
    }
  }, [isOpen, postId, dispatch]);

  // Close modal on Escape key and reset local states
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        setShowCommentForm(null);
        setShowReplyForm(null);
        setShowPostMenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Early return if modal is closed or no postId
  if (!isOpen || !postId) return null;

  return (
    <div
      className={styles.feed__post_modal_overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={styles.feed__post_modal}
        data-post-id={postId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.feed__post_modal_header}>
          <h2 id="post-modal-title" className={styles.feed__post_modal_title}>
            Post
          </h2>
          <button
            onClick={onClose}
            className={styles.feed__post_modal_close}
            aria-label="Close post modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.feed__post_modal_content}>
          {loading.getPostById ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-[var(--blue-action)]"></div>
              <p className="mt-4 text-[var(--text-secondary)]">Loading post...</p>
            </div>
          ) : error.getPostById ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className={styles.feed__error}>{error.getPostById}</p>
              <button
                onClick={() => dispatch(getPostByIdThunk(postId))}
                className="rounded-lg bg-[var(--blue-action)] px-6 py-2.5 font-medium text-white transition hover:bg-[var(--blue-action-hover)]"
              >
                Try Again
              </button>
            </div>
          ) : !selectedPost ? (
            <p className="py-12 text-center text-[var(--text-secondary)]">
              Post not found.
            </p>
          ) : (
            <Post
              post={selectedPost}
              state={{
                showCommentForm: showCommentForm === selectedPost.PostID,
                showReplyForm: showReplyForm,
                showPostMenu: showPostMenu === selectedPost.PostID,
                isInModal: true, 
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
                setShowPostModal: () => {}, // No-op in modal
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PostModal;