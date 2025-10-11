import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaArrowRight, FaTimes } from "react-icons/fa";
import styles from "@/app/feed/feed.module.css";
import Post from "@/components/ui/post/Post";
import { RootState } from "@/store";

interface ExplorePostModalProps {
  isOpen: boolean;
  postIndex: number | null;
  onClose: () => void;
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
}

const ExplorePostModal: React.FC<ExplorePostModalProps> = ({
  isOpen,
  postIndex,
  onClose,
  setShowEditModal,
  setShowDeleteModal,
  setShowReportModal,
  setShowShareModal,
  setShowUserListModal,
}) => {
  const { explorePosts } = useSelector((state: RootState) => state.post);
  const [currentIndex, setCurrentIndex] = useState(postIndex || 0);
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (postIndex !== null) {
      setCurrentIndex(postIndex);
    }
  }, [postIndex]);

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

  if (!isOpen || currentIndex < 0 || currentIndex >= explorePosts.length) return null;

  const currentPost = explorePosts[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < explorePosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className={styles.feed__post_modal_overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.feed__post_modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.feed__post_modal_header}>
          <h2 id="post-modal-title" className={styles.feed__post_modal_title}>Explore</h2>
          <button
            onClick={onClose}
            className={styles.feed__post_modal_close}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`${styles.feed__modal_nav_button} left-2`}
          aria-label="Previous post"
        >
          <FaArrowLeft />
        </button>

        <Post
          post={currentPost}
          showCommentForm={showCommentForm === currentPost.PostID}
          setShowCommentForm={setShowCommentForm}
          showReplyForm={showReplyForm}
          setShowReplyForm={setShowReplyForm}
          showPostMenu={showPostMenu === currentPost.PostID}
          setShowPostMenu={setShowPostMenu}
          setShowEditModal={setShowEditModal}
          setShowDeleteModal={setShowDeleteModal}
          setShowReportModal={setShowReportModal}
          setShowShareModal={setShowShareModal}
          setShowUserListModal={setShowUserListModal}
          setShowPostModal={() => {}} // Not needed in modal
          isInModal={true} // Pass isInModal as true
        />

        <button
          onClick={handleNext}
          disabled={currentIndex === explorePosts.length - 1}
          className={`${styles.feed__modal_nav_button} right-2`}
          aria-label="Next post"
        >
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default ExplorePostModal;