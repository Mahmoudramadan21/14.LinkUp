import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaTimes } from "react-icons/fa";
import styles from "@/app/feed/feed.module.css";
import {
  getPostByIdThunk,
  getPostCommentsThunk,
  recordBatchPostViewsThunk,
} from "@/store/postSlice";
import { RootState, AppDispatch } from "@/store";
import { debounce } from "lodash";
import Post from "@/components/ui/post/Post";

interface PostModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
}

const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  postId,
  onClose,
  setShowEditModal,
  setShowDeleteModal,
  setShowReportModal,
  setShowShareModal,
  setShowUserListModal,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, currentPost, loading, error } = useSelector(
    (state: RootState) => state.post
  );

  // Select post: either from Redux posts array or currentPost
  const selectedPost = posts.find((p) => p.PostID === postId) || currentPost;

  // Local UI states for handling forms and menu
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);

  // Refs for modal and observer
  const modalRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);

  // Debounced function to batch post views
  const sendBatchViews = debounce(() => {
    if (pendingViewsRef.current.length > 0) {
      dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current }))
        .unwrap()
        .then(() => {
          pendingViewsRef.current = []; // Clear after successful send
        })
        .catch((error) => {
          console.error("Failed to record batch post views:", error);
        });
    }
  }, 10000);

  // Observe modal for post view tracking
  useEffect(() => {
    if (isOpen && postId) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const viewedPostId = parseInt(
                entry.target.getAttribute("data-post-id") || "0"
              );
              if (
                viewedPostId &&
                !pendingViewsRef.current.includes(viewedPostId)
              ) {
                pendingViewsRef.current.push(viewedPostId);
                sendBatchViews();
              }
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 } // Trigger when 50% of post is visible
      );

      if (modalRef.current) {
        observerRef.current.observe(modalRef.current);
      }

      return () => {
        if (modalRef.current) {
          observerRef.current?.unobserve(modalRef.current);
        }
        observerRef.current?.disconnect();
      };
    }
  }, [isOpen, postId, sendBatchViews]);

  // Fetch post details if not in state
  useEffect(() => {
    if (isOpen && postId && !selectedPost) {
      dispatch(getPostByIdThunk(postId));
    }
  }, [isOpen, postId, selectedPost, dispatch]);

  // Fetch initial comments on open
  useEffect(() => {
    if (isOpen && postId) {
      dispatch(getPostCommentsThunk({ postId, params: { page: 1, limit: 10 } }));
    }
  }, [isOpen, postId, dispatch]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        setShowPostMenu(null);
        setShowCommentForm(null);
        setShowReplyForm(null);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !postId) return null;

  return (
    <div
      className={styles.feed__post_modal_overlay}
      role="dialog"
      aria-labelledby="post-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={styles.feed__post_modal}
        data-post-id={postId}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.feed__post_modal_header}>
          <h2 id="post-modal-title" className={styles.feed__post_modal_title}>
            Post
          </h2>
          <button
            onClick={onClose}
            className={styles.feed__post_modal_close}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className={styles.feed__post_modal_content}>
          {loading.getPostById ? (
            <p className={styles.feed__loading}>Loading post details...</p>
          ) : error.getPostById ? (
            <div>
              <p className={`${styles.feed__error} text-center text-sm`}>
                {error.getPostById}
              </p>
              <button
                onClick={() => dispatch(getPostByIdThunk(postId))}
                className={styles.feed__likes_pagination_button}
                aria-label="Retry loading post"
              >
                Retry
              </button>
            </div>
          ) : !selectedPost ? (
            <p className={styles.feed__loading}>Loading post details...</p>
          ) : (
            // ✅ Use Post component here
            <Post
              post={selectedPost}
              showCommentForm={showCommentForm === selectedPost.PostID}
              setShowCommentForm={setShowCommentForm}
              showReplyForm={showReplyForm}
              setShowReplyForm={setShowReplyForm}
              showPostMenu={showPostMenu === selectedPost.PostID}
              setShowPostMenu={setShowPostMenu}
              setShowEditModal={setShowEditModal}
              setShowDeleteModal={setShowDeleteModal}
              setShowReportModal={setShowReportModal}
              setShowShareModal={setShowShareModal}
              setShowUserListModal={setShowUserListModal}
              setShowPostModal={() => {}}
              isInModal={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PostModal;