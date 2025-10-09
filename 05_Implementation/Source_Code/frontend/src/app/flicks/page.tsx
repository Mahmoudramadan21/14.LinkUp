"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { FaHeart, FaComment, FaShare, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaEllipsisH, FaFlag, FaPaperPlane, FaBookmark } from "react-icons/fa";
import { RootState, AppDispatch } from "@/store";
import { Post } from "@/types/post";
import { getFlicksThunk, likePostThunk, savePostThunk, recordBatchPostViewsThunk, getPostCommentsThunk, addCommentThunk } from "@/store/postSlice";
import { debounce } from "lodash";
import Comment from "@/components/ui/post/Comment";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCommentFormData, addCommentSchema } from "@/utils/validationSchemas";
import ReportModal from "@/components/ui/modal/ReportModal";
import ShareModal from "@/components/ui/post/modals/ShareModal";
import UserListModal from "@/components/ui/modal/UserListModal";
import styles from "./flicks.module.css";

const FlicksPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { flicks, loading } = useSelector((state: RootState) => state.post);
  const { user } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [muted, setMuted] = useState<Map<number, boolean>>(new Map());
  const [manuallyPaused, setManuallyPaused] = useState<Map<number, boolean>>(new Map());
  const [showCommentModal, setShowCommentModal] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [currentPageComments, setCurrentPageComments] = useState<{ [key: number]: number }>({});
  const [hasMoreComments, setHasMoreComments] = useState<{ [key: number]: boolean }>({});
  const [comments, setComments] = useState<{ [key: number]: Post['Comments'] }>({});
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentModalRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const limit = 5; // Load 5 flicks per page
  const commentLimit = 10; // Comments per page

  // Fetch flicks on mount and page change
  useEffect(() => {
    dispatch(getFlicksThunk({ page, limit }));
  }, [dispatch, page]);

  // Initialize muted and manuallyPaused states for new videos
  useEffect(() => {
    flicks.forEach((flick) => {
      if (!muted.has(flick.PostID)) {
        setMuted((prev) => new Map(prev).set(flick.PostID, true));
      }
      if (!manuallyPaused.has(flick.PostID)) {
        setManuallyPaused((prev) => new Map(prev).set(flick.PostID, false));
      }
    });
  }, [flicks, manuallyPaused, muted]);

  // Debounced batch view recording
  const sendBatchViews = React.useMemo(() => debounce(() => {
    if (pendingViewsRef.current.length > 0) {
      dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current }))
        .unwrap()
        .then(() => {
          pendingViewsRef.current = [];
        })
        .catch((error) => {
          console.error("Failed to record batch post views:", error);
        });
    }
  }, 20000), [dispatch]);

  // Setup IntersectionObserver for auto-playing videos and view tracking
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const postId = Number(video.dataset.postId);
          if (entry.isIntersecting && !manuallyPaused.get(postId)) {
            setPlayingVideoId(postId);
            video.play().catch((err) => console.error("Video play error:", err));
            if (!pendingViewsRef.current.includes(postId)) {
              pendingViewsRef.current.push(postId);
              sendBatchViews();
            }
          } else if (!manuallyPaused.get(postId)) {
            video.pause();
            if (postId === playingVideoId) {
              setPlayingVideoId(null);
            }
          }
        });
      },
      { threshold: 0.7 } // Play when 70% of video is visible
    );

    videoRefs.current.forEach((video) => {
      observerRef.current?.observe(video);
    });

    return () => {
      videoRefs.current.forEach((video) => {
        observerRef.current?.unobserve(video);
      });
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [flicks, manuallyPaused, sendBatchViews, playingVideoId]);

  useEffect(() => {
    if (pendingViewsRef.current.length > 0) {
      sendBatchViews();
    }
    return () => sendBatchViews.cancel();
  }, [flicks, sendBatchViews]);

  // Load more flicks when reaching the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading.getFlicks) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [loading.getFlicks]);

  // Handle click outside for post menu and comment modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPostMenu(null);
      }
      if (commentModalRef.current && !commentModalRef.current.contains(event.target as Node)) {
        setShowCommentModal(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modals and menus on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCommentModal(null);
        setShowReplyForm(null);
        setShowPostMenu(null);
        setShowReportModal(null);
        setShowShareModal(null);
        setShowUserListModal(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Trap focus in comment modal
  useEffect(() => {
    if (showCommentModal !== null) {
      const modal = commentModalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Tab") {
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      };

      firstElement?.focus();
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showCommentModal]);

  const handleLike = async (postId: number) => {
    try {
      await dispatch(likePostThunk(postId)).unwrap();
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleSavePost = async (postId: number) => {
    try {
      await dispatch(savePostThunk(postId)).unwrap();
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  const toggleMute = (postId: number) => {
    setMuted((prev) => {
      const newMuted = new Map(prev);
      const isCurrentlyMuted = newMuted.get(postId) || false;
      const newMutedState = !isCurrentlyMuted;
      newMuted.set(postId, newMutedState);
      const video = videoRefs.current.get(postId);
      if (video) {
        video.muted = newMutedState;
      }
      return newMuted;
    });
  };

  const togglePlayPause = (postId: number) => {
    const video = videoRefs.current.get(postId);
    if (video) {
      if (video.paused) {
        video.play().catch((err) => console.error("Video play error:", err));
        setPlayingVideoId(postId);
        setManuallyPaused((prev) => new Map(prev).set(postId, false));
      } else {
        video.pause();
        setPlayingVideoId(null);
        setManuallyPaused((prev) => new Map(prev).set(postId, true));
      }
    }
  };

  const handleLoadMoreComments = async (postId: number) => {
    const currentPage = (currentPageComments[postId] || 0) + 1;
    try {
      const response = await dispatch(
        getPostCommentsThunk({ postId, params: { page: currentPage, limit: commentLimit } })
      ).unwrap();
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), ...(response.comments || [])],
      }));
      setCurrentPageComments((prev) => ({ ...prev, [postId]: currentPage }));
      setHasMoreComments((prev) => ({
        ...prev,
        [postId]: (response.comments?.length || 0) === commentLimit,
      }));
    } catch (err) {
      console.error("Failed to load more comments:", err);
    }
  };

  const onSubmitComment = (postId: number) => async (data: AddCommentFormData) => {
    try {
      await dispatch(addCommentThunk({ postId, data })).unwrap();
      resetComment();

      const response = await dispatch(
        getPostCommentsThunk({ postId, params: { page: 1, limit: commentLimit } })
      ).unwrap();

      setComments((prev) => ({ ...prev, [postId]: response.comments || [] }));
      setCurrentPageComments((prev) => ({ ...prev, [postId]: 1 }));
      setHasMoreComments((prev) => ({
        ...prev,
        [postId]: (response.comments?.length || 0) === commentLimit,
      }));
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
    formState: { errors: commentErrors, isSubmitting },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  const getTotalCommentsAndReplies = useCallback((commentsList: Post['Comments']) => {
    if (!commentsList) return 0;
    return commentsList.reduce((total, comment) => {
      const replyCount = comment.Replies ? comment.Replies.length : 0;
      return total + 1 + replyCount;
    }, 0);
  }, []);

  return (
    <div className={styles["flicks"]}>
      <div className={styles["flicks__wrapper"]}>
        {flicks.map((flick) => {
          const currentFlickComments = comments[flick.PostID] || flick.Comments || [];
          return (
            <div
              key={flick.PostID}
              className={styles["flicks__container"]}
              aria-label={`Flick by ${flick.User.Username}`}
            >
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(flick.PostID, el);
                } else {
                  videoRefs.current.delete(flick.PostID);
                }
              }}
              data-post-id={flick.PostID}
              src={flick.VideoURL ?? ""}
              className={styles.flicks__video}
              loop
              muted
              playsInline
              autoPlay
              aria-label={`Video by ${flick.User.Username}`}
            />
              <div className={styles["flicks__overlay"]}>
                <div className={styles["flicks__info"]}>
                  <div className={styles["flicks__user"]}>
                    <Image
                      src={flick.User.ProfilePicture || "/avatars/default-avatar.svg"}
                      alt={`${flick.User.Username}'s avatar`}
                      width={40}
                      height={40}
                      className={styles["flicks__user-avatar"]}
                    />
                    <p className={styles["flicks__user-username"]}>{flick.User.Username}</p>
                  </div>
                  {flick.Content && (
                    <p className={styles["flicks__content"]}>{flick.Content}</p>
                  )}
                </div>
                <div className={styles["flicks__actions"]}>
                  <button
                    onClick={() => setShowPostMenu(flick.PostID)}
                    className={styles["flicks__action-button"]}
                    aria-label="Flick options"
                  >
                    <FaEllipsisH size={24} />
                  </button>
                  {showPostMenu === flick.PostID && (
                    <div ref={menuRef} className={styles["flicks__menu"]}>
                      <button
                        onClick={() => {
                          setShowReportModal(flick.PostID);
                          setShowPostMenu(null);
                        }}
                        className={styles["flicks__menu-item"]}
                        aria-label="Report flick"
                      >
                        <FaFlag /> Report
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleLike(flick.PostID)}
                    className={`${styles["flicks__action-button"]} ${flick.isLiked ? styles["flicks__action-button--liked"] : ""}`}
                    aria-label={flick.isLiked ? "Unlike flick" : "Like flick"}
                  >
                    <FaHeart size={28} />
                    <span className={styles["flicks__action-count"]}>{flick.likeCount}</span>
                  </button>
                  <button
                    onClick={() => setShowCommentModal(flick.PostID)}
                    className={styles["flicks__action-button"]}
                    aria-label="Comment on flick"
                  >
                    <FaComment size={28} />
                    <span className={styles["flicks__action-count"]}>{flick.commentCount}</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(flick.PostID)}
                    className={styles["flicks__action-button"]}
                    aria-label="Share flick"
                  >
                    <FaShare size={28} />
                    <span className={styles["flicks__action-count"]}>{flick.shareCount}</span>
                  </button>
                  <button
                    onClick={() => handleSavePost(flick.PostID)}
                    className={`${styles["flicks__action-button"]} ${flick.isSaved ? styles["flicks__action-button--saved"] : ""}`}
                    aria-label={flick.isSaved ? "Unsave flick" : "Save flick"}
                  >
                    <FaBookmark size={28} />
                  </button>
                </div>
                <button
                  onClick={() => toggleMute(flick.PostID)}
                  className={styles["flicks__mute-button"]}
                  aria-label={(muted.get(flick.PostID) || false) ? "Unmute video" : "Mute video"}
                >
                  {(muted.get(flick.PostID) || false) ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
                </button>
                <button
                  onClick={() => togglePlayPause(flick.PostID)}
                  className={styles["flicks__play-pause-button"]}
                  aria-label={playingVideoId === flick.PostID && !manuallyPaused.get(flick.PostID) ? "Pause video" : "Play video"}
                >
                  {playingVideoId === flick.PostID && !manuallyPaused.get(flick.PostID) ? (
                    <FaPause size={48} />
                  ) : (
                    <FaPlay size={48} />
                  )}
                </button>
              </div>
              {showCommentModal === flick.PostID && (
                <div className={styles["flicks__comment-modal"]}>
                  <div ref={commentModalRef} className={styles["flicks__comment-modal-content"]}>
                    <div className={styles["flicks__comment-modal-header"]}>
                      <h2 className={styles["flicks__comment-modal-title"]}>Comments</h2>
                      <button
                        onClick={() => setShowCommentModal(null)}
                        className={styles["flicks__comment-modal-close"]}
                        aria-label="Close comments"
                      >
                        ✕
                      </button>
                    </div>
                    <div className={styles["flicks__comment-modal-body"]}>
                      {flick.commentCount > getTotalCommentsAndReplies(currentFlickComments) && hasMoreComments[flick.PostID] && (
                        <div className={styles["flicks__comment-load-more"]}>
                          <button
                            onClick={() => handleLoadMoreComments(flick.PostID)}
                            className={styles["flicks__load-more-button"]}
                            aria-label="Load more comments"
                          >
                            Load More Comments
                          </button>
                        </div>
                      )}
                      {currentFlickComments.map((comment) => (
                        <Comment
                          key={comment.CommentID}
                          comment={comment}
                          showReplyForm={showReplyForm === comment.CommentID}
                          setShowReplyForm={setShowReplyForm}
                        />
                      ))}
                    </div>
                    {user && (
                      <form
                        onSubmit={handleCommentSubmit(onSubmitComment(flick.PostID))}
                        className={styles["flicks__comment-form"]}
                        aria-label="Comment on flick form"
                      >
                        <div className={styles["flicks__comment-form-inner"]}>
                          <Image
                            src={user.profilePicture || "/avatars/default-avatar.svg"}
                            alt="Your avatar"
                            width={32}
                            height={32}
                            className={styles["flicks__comment-form-avatar"]}
                          />
                          <input
                            {...registerComment("content")}
                            placeholder="Add a comment..."
                            className={styles["flicks__comment-form-input"]}
                            aria-invalid={!!commentErrors.content}
                            aria-describedby={commentErrors.content ? "comment-error" : undefined}
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${styles["flicks__comment-form-button"]} ${isSubmitting ? styles["flicks__comment-form-button--disabled"] : ""}`}
                            aria-label="Submit comment"
                          >
                            {isSubmitting ? (
                              <span className={styles["flicks__comment-form-spinner"]}></span>
                            ) : (
                              <FaPaperPlane />
                            )}
                          </button>
                        </div>
                        {commentErrors.content && (
                          <p id="comment-error" className={styles["flicks__comment-form-error"]}>
                            {commentErrors.content.message}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={loadMoreRef} className={styles["flicks__load-more"]} />
        {loading.getFlicks && (
          <div className={styles["flicks__loading"]}>
            <span className={styles["flicks__loading-spinner"]}>⏳</span>
            Loading more flicks...
          </div>
        )}
      </div>

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
          post={flicks.find((p) => p.PostID === showShareModal)}
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
    </div>
  );
};

export default FlicksPage;