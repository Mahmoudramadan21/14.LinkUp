import React, { forwardRef, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from '@/store';
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { FaHeart, FaComment, FaBookmark, FaFlag, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaShare, FaEllipsisH, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import styles from "@/app/feed/feed.module.css";
import { Post as PostType } from "@/types/post";
import Comment from "@/components/ui/post/Comment";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCommentFormData, addCommentSchema } from "@/utils/validationSchemas";
import { likePostThunk, addCommentThunk, savePostThunk, recordBatchPostViewsThunk, getPostCommentsThunk } from "@/store/postSlice";
import { debounce } from "lodash";

interface PostProps {
  post: PostType;
  showCommentForm: boolean;
  setShowCommentForm: React.Dispatch<React.SetStateAction<number | null>>;
  showReplyForm: number | null;
  setShowReplyForm: React.Dispatch<React.SetStateAction<number | null>>;
  showPostMenu: boolean;
  setShowPostMenu: React.Dispatch<React.SetStateAction<number | null>>;
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPostModal: React.Dispatch<React.SetStateAction<number | null>>;
  isInModal?: boolean; // New prop to indicate if the Post is inside a modal
}

const Post = forwardRef<HTMLDivElement, PostProps>((props, ref) => {
  const {
    post,
    showCommentForm,
    setShowCommentForm,
    showReplyForm,
    setShowReplyForm,
    showPostMenu,
    setShowPostMenu,
    setShowEditModal,
    setShowDeleteModal,
    setShowReportModal,
    setShowShareModal,
    setShowUserListModal,
    setShowPostModal,
    isInModal = false, // Default to false (not in modal)
  } = props;


  const { user } = useSelector((state: RootState) => state.auth);

  const dispatch = useDispatch<AppDispatch>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const limit = 10;

  // Debounced function to send batch post views
  const sendBatchViews = useMemo(() => debounce(() => {
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
  }, 10000), [dispatch]);

  // Initialize IntersectionObserver for tracking post views
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const viewedPostId = parseInt(entry.target.getAttribute("data-post-id") || "0");
            if (viewedPostId && !pendingViewsRef.current.includes(viewedPostId)) {
              pendingViewsRef.current.push(viewedPostId);
              sendBatchViews();
            }
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref && "current" in ref && ref.current) {
      observerRef.current.observe(ref.current);
    }

    return () => {
      if (ref && "current" in ref && ref.current) {
        observerRef.current?.unobserve(ref.current);
      }
      observerRef.current?.disconnect();
      sendBatchViews.cancel();
    };
  }, [ref, sendBatchViews]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPostMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowPostMenu]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch((err) => console.error("Failed to play video:", err));
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.duration) {
      const progressPercent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progressPercent);
    }
  }, []);

  const handleLikePost = useMemo(() => debounce(async () => {
    try {
      setAnimatingLike(true);
      await dispatch(likePostThunk(post.PostID)).unwrap();
      setTimeout(() => setAnimatingLike(false), 600);
    } catch (error) {
      console.error("Failed to like post:", error);
      setAnimatingLike(false);
    }
  }, 100), [dispatch, post.PostID]);

  const handleContentClick = useCallback(async () => {
    if (!post.isLiked) {
      await handleLikePost();
    }
  }, [post.isLiked, handleLikePost]);

  const onSubmitComment: SubmitHandler<AddCommentFormData> = async (data) => {
    try {
      await dispatch(addCommentThunk({ postId: post.PostID, data })).unwrap();
      resetComment();
      setShowCommentForm(null);
      if (isInModal) {
        setCurrentPage(1); // Reset to first page after adding a comment
        dispatch(getPostCommentsThunk({ postId: post.PostID, params: { page: 1, limit } }))
          .unwrap()
          .then((response: any) => {
            setHasMoreComments(response.comments?.length === limit);
          });
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleSavePost = useCallback(async () => {
    try {
      setAnimatingSave(true);
      await dispatch(savePostThunk(post.PostID)).unwrap();
      setTimeout(() => setAnimatingSave(false), 500);
    } catch (error) {
      console.error("Failed to save post:", error);
      setAnimatingSave(false);
    }
  }, [dispatch, post.PostID]);

  const getTotalCommentsAndReplies = useCallback((comments: PostType['Comments']) => {
    if (!comments) return 0;
    return comments.reduce((total, comment) => {
      const replyCount = comment.Replies ? comment.Replies.length : 0;
      return total + 1 + replyCount;
    }, 0);
  }, []);

  const handleLoadMoreComments = useCallback(async () => {
    if (isInModal) {
      // When inside a modal, load more comments
      if (post.commentCount <= getTotalCommentsAndReplies(post.Comments)) {
        setHasMoreComments(false);
        return;
      }
      try {
        const nextPage = currentPage + 1;
        const response = await dispatch(
          getPostCommentsThunk({ postId: post.PostID, params: { page: nextPage, limit } })
        ).unwrap();
        setCurrentPage(nextPage);
        setHasMoreComments(response.comments?.length === limit);
      } catch (err) {
        console.error("Failed to load more comments:", err);
      }
    } else {
      // When in feed, open the PostModal
      setShowPostModal(post.PostID);
    }
  }, [isInModal, post.commentCount, post.Comments, post.PostID, currentPage, limit, dispatch, setShowPostModal, getTotalCommentsAndReplies]);

  // Set hasMoreComments and currentPage on modal open
  useEffect(() => {
    if (isInModal && post) {
      const totalLoaded = getTotalCommentsAndReplies(post.Comments);
      setHasMoreComments(post.commentCount > totalLoaded);
      setCurrentPage(Math.ceil(totalLoaded / limit));
    }
  }, [isInModal, post, limit, getTotalCommentsAndReplies]);

  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
    formState: { errors: commentErrors, isSubmitting },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  const renderPostContent = useCallback((postData: PostType, isSharedPost: boolean = false) => (
    <div
      className={`${styles.feed__post_content_wrapper} ${
        isSharedPost ? styles.feed__shared_post : ""
      }`}
      onClick={() => !isSharedPost && handleContentClick()}
      aria-label={isSharedPost ? undefined : "Click to like post"}
    >
      {postData.Content && (
        <p className={`${styles.feed__post_content}`}>{postData.Content}</p>
      )}
      {postData.ImageURL && (
        <Image
          src={postData.ImageURL}
          alt="Post image"
          width={600}
          height={400}
          className={`${styles.feed__post_media}`}
          placeholder="blur"
          blurDataURL="/placeholder.png"
          loading="lazy" // Performance: lazy load images
        />
      )}
      {postData.VideoURL && (
        <div className={`${styles.feed__post_video_wrapper}`}>
          <video
            ref={videoRef}
            src={postData.VideoURL}
            className={`${styles.feed__post_video}`}
            onTimeUpdate={handleProgress}
            aria-label="Post video"
            data-testid="video-player"
            playsInline // Accessibility: Allow inline playback
            preload="metadata" // Performance: Load metadata only initially
          />
          <div className={`${styles.feed__post_video_controls}`}>
            <button
              onClick={handlePlayPause}
              className={`${styles.feed__post_video_play} ${
                isPlaying ? styles.feed__post_video_play__playing : ""
              }`}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              aria-controls={`video-${postData.PostID}`}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <div className={`${styles.feed__post_video_progress}`}>
              <div
                className={`${styles.feed__post_video_progress_bar}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <button
              onClick={handleMuteToggle}
              className={`${styles.feed__post_video_mute}`}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              aria-controls={`video-${postData.PostID}`}
            >
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
          </div>
        </div>
      )}
    </div>
  ), [handleContentClick, handlePlayPause, handleProgress, isPlaying, isMuted, progress]);

  return (
    <article
      ref={ref}
      className={`${styles.feed__post} p-6 ${showCommentForm ? "pb-24" : ""}`}
      aria-labelledby={`post-title-${post.PostID}`}
      data-post-id={post.PostID}
    >
      <div className={styles.feed__post_header}>
        <Image
          src={post.User.ProfilePicture || "/avatars/default-avatar.svg"}
          alt={`${post.User.Username}'s avatar`}
          width={48}
          height={48}
          className={`${styles.feed__post_avatar}`}
          data-testid="avatar"
          loading="lazy" // Performance: lazy load avatars
        />
        <div>
          <p id={`post-title-${post.PostID}`} className={`${styles.feed__post_username}`}>
            {post.User.Username}
          </p>
          <time className={`${styles.feed__post_timestamp}`} dateTime={new Date(post.CreatedAt).toISOString()}>
            {formatDistanceToNow(new Date(post.CreatedAt), {
              addSuffix: true,
            })}
          </time>
        </div>
        <button
          onClick={() => setShowPostMenu(post.PostID)}
          className={`${styles.feed__post_menu_button}`}
          aria-label="Post options"
          aria-haspopup="menu"
          aria-expanded={showPostMenu}
        >
          <FaEllipsisH />
        </button>
        {showPostMenu && (
          <div ref={menuRef} className={styles.feed__post_menu} role="menu">
            {post.isMine && (
              <>
                <button
                  onClick={() => setShowEditModal(post.PostID)}
                  className={styles.feed__post_menu_item}
                  aria-label="Edit post"
                  role="menuitem"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(post.PostID)}
                  className={styles.feed__post_menu_item}
                  aria-label="Delete post"
                  role="menuitem"
                >
                  <FaTrash /> Delete
                </button>
              </>
            )}
            <button
              onClick={() => setShowReportModal(post.PostID)}
              className={`${styles.feed__post_menu_item}`}
              aria-label="Report post"
              role="menuitem"
            >
              <FaFlag /> Report
            </button>
          </div>
        )}
      </div>

      {renderPostContent(post)}

      {post.SharedPost && (
        <div className={styles.feed__shared_post_container}>
          <div className={styles.feed__shared_post_header}>
            <Image
              src={
                post.SharedPost.User.ProfilePicture ||
                "/avatars/default-avatar.svg"
              }
              alt={`${post.SharedPost.User.Username}'s avatar`}
              width={32}
              height={32}
              className={`${styles.feed__shared_post_avatar}`}
              data-testid="shared-avatar"
              loading="lazy"
            />
            <div>
              <p className={`${styles.feed__shared_post_username}`}>
                {post.SharedPost.User.Username}
              </p>
              <time className={`${styles.feed__shared_post_timestamp}`} dateTime={new Date(post.SharedPost.CreatedAt).toISOString()}>
                {formatDistanceToNow(
                  new Date(post.SharedPost.CreatedAt),
                  { addSuffix: true }
                )}
              </time>
            </div>
          </div>
          {renderPostContent(post.SharedPost, true)}
        </div>
      )}

      <div className={`${styles.feed__post_actions}`}>
        <div className={styles.feed__post_actions_interactions}>
          <button
            onClick={handleLikePost}
            className={`${styles.feed__post_action} ${
              post.isLiked ? styles.feed__post_action__liked : ""
            } ${animatingLike ? styles.feed__post_action__like_animate : ""}`}
            aria-label={post.isLiked ? "Unlike post" : "Like post"}
            aria-pressed={post.isLiked}
          >
            <div className={styles.feed__like_wrapper}>
              <FaHeart
                className={`${styles.feed__heart} 
                  ${post.isLiked ? "text-[var(--error)]" : "text-[var(--gray-text-secondary)] dark:text-[var(--gray-dark-text-secondary)]"} 
                  ${animatingLike ? styles.feed__heart_pulse : ""}`}
              />
            </div>
            <span className="ml-1">{String(post.likeCount ?? 0)}</span>
          </button>
          <button
            onClick={() => setShowCommentForm(showCommentForm ? null : post.PostID)}
            className={`${styles.feed__post_action} ${
              showCommentForm ? styles.feed__post_action__comment_animate : ""
            }`}
            aria-label="Comment on post"
            aria-expanded={showCommentForm}
          >
            <FaComment aria-hidden="true" />
            <span className="ml-1">{String(post.commentCount ?? 0)}</span>
          </button>
          <button
            onClick={() => setShowShareModal(post.PostID)}
            className={`${styles.feed__post_action}`}
            aria-label="Share post"
          >
            <FaShare aria-hidden="true" />
            <span className="ml-1">{String(post.shareCount ?? 0)}</span>
          </button>
        </div>

        <div className={styles.feed__post_actions_save}>
          <button
            onClick={handleSavePost}
            className={`${styles.feed__post_action} ${
              post.isSaved ? styles.feed__post_action__saved : ""
            } ${animatingSave ? styles.feed__post_action__save_animate : ""}`}
            aria-label={post.isSaved ? "Unsave post" : "Save post"}
            aria-pressed={post.isSaved}
          >
            <FaBookmark
              className={
                post.isSaved
                  ? "text-[var(--linkup-purple)]"
                  : "text-[var(--gray-text-secondary)] dark:text-[var(--gray-dark-text-secondary)]"
              }
            />
          </button>
        </div>
      </div>

      <div
        className={`${styles.feed__post_likes}`}
        onClick={() => setShowUserListModal(post.PostID)}
        role="button"
        tabIndex={0}
        aria-label="View all likes"
      >
        <div className={styles.feed__post_likes_avatars}>
          {post.Likes?.slice(0, 2).map((user, index) => (
            <Image
              key={index}
              src={user.profilePicture || "/avatars/default-avatar.svg"}
              alt={`${user.username}'s avatar`}
              width={24}
              height={24}
              className={`${styles.feed__post_likes_avatar}`}
              loading="lazy"
            />
          ))}
        </div>
        <p className={`${styles.feed__post_likes_text}`}>
          {post.Likes && post.Likes.length > 0 && (
            <>
              Liked by {post.Likes[0].username}{" "}
              {post.Likes.length > 1 && `and ${post.likeCount - 1} others`}
            </>
          )}
        </p>
      </div>

      {post.Comments && post.Comments.length > 0 && (
        <div className={`${styles.feed__comments}`}>
          {post.Comments.slice(0, isInModal ? undefined : 3).map((comment) => (
            <Comment
              key={comment.CommentID}
              comment={comment}
              showReplyForm={showReplyForm === comment.CommentID}
              setShowReplyForm={setShowReplyForm}
            />
          ))}

          {post.commentCount > 0 && (!isInModal || hasMoreComments) && (
            <div className={styles.feed__load_more_container}>
              <button
                onClick={handleLoadMoreComments}
                className={styles.feed__load_more_button}
                aria-label={isInModal ? "Load more comments" : "View all comments"}
              >
                {isInModal ? "Load More Comments" : "View All Comments"}
              </button>
            </div>
          )}
        </div>
      )}

      {isInModal && !hasMoreComments && post.Comments && post.Comments.length > 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 text-lg mt-2">
          No more comments to load.
        </p>
      )}
      {showCommentForm && (
        <form
          onSubmit={handleCommentSubmit(onSubmitComment)}
          className={`${styles.feed__comment_form} ${styles.feed__form_animate}`}
          aria-label="Comment on post form"
        >
          {/* Avatar */}
          <Image
            src={user?.profilePicture || "/avatars/default-avatar.svg"}
            alt={`${user?.username || "User"}'s avatar`}
            width={40}
            height={40}
            className={`${styles.feed__post_avatar}`}
            data-testid="user-avatar"
          />

          {/* Input + Button Wrapper */}
          <div className={styles.feed__comment_input_group}>
            <input
              {...registerComment("content")}
              placeholder="Post a comment.."
              className={`${styles.feed__comment_input}`}
              aria-invalid={commentErrors.content ? "true" : "false"}
              aria-describedby={commentErrors.content ? "comment-error" : undefined}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.feed__comment_button} ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Submit comment"
            >
              {isSubmitting ? (
                <button className="animate-spin">
                  <FaSpinner className="text-white" />
                </button>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      )}
    </article>
  );
});

Post.displayName = "Post";

export default Post;