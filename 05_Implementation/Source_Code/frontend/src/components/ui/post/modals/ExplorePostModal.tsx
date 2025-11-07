import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaArrowRight, FaTimes } from "react-icons/fa";
import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import Post from "@/components/ui/post/Post";
import { RootState } from "@/store";

/**
 * Full-screen immersive post viewer for the Explore page.
 * Supports keyboard navigation (← → Esc), swipe-like arrow buttons, and post view tracking.
 */
interface ExplorePostModalActions {
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
}

interface ExplorePostModalProps {
  isOpen: boolean;
  postIndex: number | null;
  onClose: () => void;
  actions: ExplorePostModalActions;
  recordView: (postId: number) => void;
}

const ExplorePostModal: React.FC<ExplorePostModalProps> = ({
  isOpen,
  postIndex,
  onClose,
  actions,
  recordView,
}) => {
  const {
    setShowEditModal,
    setShowDeleteModal,
    setShowReportModal,
    setShowShareModal,
    setShowUserListModal,
  } = actions;
  
  const { explorePosts } = useSelector((state: RootState) => state.post);
  const [currentIndex, setCurrentIndex] = useState(postIndex || 0);
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Sync currentIndex with postIndex prop changes
  useEffect(() => {
    if (postIndex !== null) {
      setCurrentIndex(postIndex);
    }
  }, [postIndex]);

  // Record view when modal opens or currentIndex changes
  useEffect(() => {
    if (isOpen && explorePosts[currentIndex]) {
      const postId = explorePosts[currentIndex].PostID;
      recordView(postId);
    }
  }, [isOpen, currentIndex, explorePosts, recordView]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (event.key === "ArrowRight" && currentIndex < explorePosts.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, explorePosts.length, onClose]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!isOpen || currentIndex < 0 || currentIndex >= explorePosts.length) return null;

  const currentPost = explorePosts[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < explorePosts.length - 1;
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle next post
  const handleNext = () => {
    if (currentIndex < explorePosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className={`${styles.feed__post_modal_overlay} bg-overlay`} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.feed__post_modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.feed__post_modal_header}>
          <h2 id="post-modal-title" className={styles.feed__post_modal_title}>Explore</h2>
          <button
            onClick={onClose}
            className={styles.feed__post_modal_close}
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`${styles.feed__modal_nav_button} left-2`}
          aria-label="Previous post"
        >
          <FaArrowLeft />
        </button>
        )}

        {/* Post Content */}
        <Post
          post={currentPost}
          state={{
            showCommentForm: showCommentForm === currentPost.PostID,
            showReplyForm: showReplyForm,
            showPostMenu: showPostMenu === currentPost.PostID,
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
            setShowPostModal: () => {}, // Not needed in modal
          }}
        />


        {/* Navigation Arrows */}
        {hasNext && (
          <button
            onClick={handleNext}
            disabled={currentIndex === explorePosts.length - 1}
            className={`${styles.feed__modal_nav_button} right-2`}
            aria-label="Next post"
          >
            <FaArrowRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExplorePostModal;