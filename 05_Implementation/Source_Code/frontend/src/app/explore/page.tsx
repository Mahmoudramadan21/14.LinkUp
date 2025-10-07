"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { getExplorePostsThunk, deletePostThunk } from "@/store/postSlice";
import { RootState, AppDispatch } from "@/store";
import styles from "./explore.module.css";
import ExplorePostModal from "@/components/ui/post/modals/ExplorePostModal";
import EditPostModal from "@/components/ui/post/modals/EditPostModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import ReportModal from "@/components/ui/modal/ReportModal";
import ShareModal from "@/components/ui/post/modals/ShareModal";
import UserListModal from "@/components/ui/modal/UserListModal";

const ExplorePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { explorePosts, loading, error } = useSelector((state: RootState) => state.post);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState<number | null>(null);

  // Fetch explore posts on mount
  useEffect(() => {
    dispatch(getExplorePostsThunk({ page: 1, limit: 30 }));
  }, [dispatch]);

  const handlePostClick = (index: number) => {
    setShowPostModal(index);
  };

  return (
    <div className={styles.explore}>
      <div className={styles.explore__container}>
        <h1 className={styles.explore__title}>Explore</h1>

        <EditPostModal
          isOpen={showEditModal !== null}
          postId={showEditModal}
          onClose={() => setShowEditModal(null)}
          user={null} // Adjust based on your auth setup
        />

        <ConfirmationModal
          isOpen={showDeleteModal !== null}
          entityType="post"
          entityId={showDeleteModal}
          actionThunk={deletePostThunk}
          onClose={() => setShowDeleteModal(null)}
        />

        <ReportModal
          isOpen={showReportModal !== null}
          postId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />

        <ShareModal
          isOpen={showShareModal !== null}
          post={explorePosts.find((p) => p.PostID === showShareModal)}
          onClose={() => setShowShareModal(null)}
        />

        <UserListModal
          isOpen={showUserListModal !== null}
          onClose={() => setShowUserListModal(null)}
          type="likes"
          id={showUserListModal}
          title="Likes"
        />

        <ExplorePostModal
          isOpen={showPostModal !== null}
          postIndex={showPostModal}
          onClose={() => setShowPostModal(null)}
          setShowEditModal={setShowEditModal}
          setShowDeleteModal={setShowDeleteModal}
          setShowReportModal={setShowReportModal}
          setShowShareModal={setShowShareModal}
          setShowUserListModal={setShowUserListModal}
        />

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
                aria-label={`View post by ${post.User.Username}`}
              >
                {post.ImageURL ? (
                  <Image
                    src={post.ImageURL}
                    alt={`Post by ${post.User.Username}`}
                    width={300}
                    height={300}
                    className={styles.explore__post_image}
                    placeholder="blur"
                    blurDataURL="/placeholder.png"
                  />
                ) : post.VideoURL ? (
                  <video
                    src={post.VideoURL}
                    className={styles.explore__post_video}
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <div className={styles.explore__post_tile}>
                    <p>{post.Content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;