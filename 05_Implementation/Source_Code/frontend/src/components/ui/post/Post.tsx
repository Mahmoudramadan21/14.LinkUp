import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  FaFlag,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaEllipsisH,
  FaEdit,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";

import HeartIcon from "/public/icons/HeartIcon.svg"
import EnvelopeIcon from "/public/icons/EnvelopeIcon.svg"
import ShareIcon from "/public/icons/ShareIcon.svg"
import BookmarkIcon from "/public/icons/BookmarkIcon.svg"

import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import { Post as PostType } from "@/types/post";
import Comment from "@/components/ui/post/Comment";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCommentFormData, addCommentSchema } from "@/utils/validationSchemas";
import {
  likePostThunk,
  addCommentThunk,
  savePostThunk,
  recordBatchPostViewsThunk,
  getPostCommentsThunk,
} from "@/store/postSlice";
import { setIsVideoMuted } from "@/store/uiSlice";
import { debounce } from "lodash";
import Link from "next/link";
import TruncatedText from "../common/TruncatedText";
import { followUserThunk, unfollowUserThunk } from "@/store/profileSlice";

/**
 * Skeleton component for loading comments
 */
const CommentSkeleton = React.memo(() => (
  <div
    className={styles.feed__comment_skeleton_container}
    role="status"
    aria-label="Loading comment"
  >
    <div className={styles.feed__comment_skeleton_header}>
      <div className={styles.feed__comment_skeleton_avatar} aria-hidden="true" />
      <div className={styles.feed__comment_skeleton_username} aria-hidden="true" />
    </div>
    <div className={styles.feed__comment_skeleton_content} aria-hidden="true" />
    <div className={styles.feed__comment_skeleton_actions}>
      <div className={styles.feed__comment_skeleton_action} aria-hidden="true" />
      <div className={styles.feed__comment_skeleton_action} aria-hidden="true" />
    </div>
  </div>
));
CommentSkeleton.displayName = "CommentSkeleton";

/**
 * Props for the main Post component
 */
interface PostActions {
  setShowCommentForm: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReplyForm: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPostMenu: React.Dispatch<React.SetStateAction<number | null>>;
  setShowEditModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowReportModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowShareModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowUserListModal: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPostModal: React.Dispatch<React.SetStateAction<number | null>>;
}

interface PostState {
  showCommentForm: boolean;
  showReplyForm: number | null;
  showPostMenu: boolean;
  isInModal?: boolean;
}

interface PostProps {
  post: PostType;
  state: PostState;
  actions: PostActions;
}


/**
 * Video player with autoplay, mute toggle, progress bar, and pause-on-scroll behavior
 */
const VideoPlayer: React.FC<{ src: string; postId: number }> = ({ src, postId }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pausedManually, setPausedManually] = useState(false);
  const isMuted = useSelector((state: RootState) => state.ui.isVideoMuted);
  const dispatch = useDispatch<AppDispatch>();

  // Pause all other videos when one starts playing
  const pauseOtherVideos = useCallback(() => {
    document.querySelectorAll("video").forEach((video) => {
      if (video !== videoRef.current && !video.paused) {
        video.pause();
      }
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setPausedManually(true);
    } else {
      pauseOtherVideos();
      videoRef.current.play();
      setIsPlaying(true);
      setPausedManually(false);
    }
  }, [isPlaying, pauseOtherVideos]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      dispatch(setIsVideoMuted(videoRef.current.muted));
    }
  }, [dispatch]);

  const handleProgress = useCallback(() => {
    if (videoRef.current?.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  }, []);

  // Sync global mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Autoplay when 50%+ visible + handle tab visibility
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isPlaying) {
        video.pause();
        setIsPlaying(false);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && document.visibilityState === "visible" && !pausedManually) {
          pauseOtherVideos();
          video.play();
          setIsPlaying(true);
        } else if (isPlaying) {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (isPlaying) video.pause();
    };
  }, [isPlaying, pausedManually, pauseOtherVideos]);

  return (
    <div className={styles.feed__post_video_wrapper}>
      <video
        ref={videoRef}
        id={`video-${postId}`}
        src={src}
        className={styles.feed__post_video}
        onTimeUpdate={handleProgress}
        playsInline
        muted={isMuted}
        loop
        preload="auto"
        itemProp="contentUrl"
        aria-label="Post video"
      />
      <div className={styles.feed__post_video_controls}>
        <button
          onClick={handlePlayPause}
          className={`${styles.feed__post_video_play} ${isPlaying ? styles.feed__post_video_play__playing : ""}`}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          aria-controls={`video-${postId}`}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <div className={styles.feed__post_video_progress}>
          <div
            className={styles.feed__post_video_progress_bar}
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <button
          onClick={handleMuteToggle}
          className={styles.feed__post_video_mute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          aria-controls={`video-${postId}`}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
    </div>
  );
};

/**
 * Main Post component - displays a single post in feed or modal
 */
const Post = forwardRef<HTMLDivElement, PostProps>((props, ref) => {
  const { post, state, actions } = props;
  const {
    showCommentForm,
    showReplyForm,
    showPostMenu,
    isInModal = false,
  } = state;

  const {
    setShowCommentForm,
    setShowReplyForm,
    setShowPostMenu,
    setShowEditModal,
    setShowDeleteModal,
    setShowReportModal,
    setShowShareModal,
    setShowUserListModal,
    setShowPostModal,
  } = actions;

  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  // Refs & State
  const menuRef = useRef<HTMLDivElement>(null);
  const commentLoadMoreRef = useRef<HTMLDivElement>(null);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const limit = 10;

  // Follow state
  const followLoading = useSelector(
    (state: RootState) => state.profile.loading.followUser[post.User.UserID] || false
  );
  const unfollowLoading = useSelector(
    (state: RootState) => state.profile.loading.unfollowUser[post.User.UserID] || false
  );
  const isFollowStatusLoading = followLoading || unfollowLoading;
  const followState = post.User.isFollowed;

  const followAriaLabel = isFollowStatusLoading
    ? `Processing follow action for ${post.User.Username}`
    : followState === false
    ? `Follow ${post.User.Username}`
    : followState === true
    ? `Unfollow ${post.User.Username}`
    : `Cancel follow request for ${post.User.Username}`;

  const displayedCommentsCount = isInModal
    ? post.Comments?.length || 0
    : Math.min(post.Comments?.length || 0, 3);

  // Batch view tracking (debounced)
  const sendBatchViews = useMemo(
    () =>
      debounce(() => {
        if (pendingViewsRef.current.length > 0) {
          dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current })).unwrap();
          pendingViewsRef.current = [];
        }
      }, 10000),
    [dispatch]
  );

  // Track post views via IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = parseInt(entry.target.getAttribute("data-post-id") || "0", 10);
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

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPostMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowPostMenu]);

  // Infinite scroll for comments in modal
  useEffect(() => {
    if (!isInModal || !commentLoadMoreRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreComments && !isLoadingComments) {
          handleLoadMoreComments();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(commentLoadMoreRef.current);
    return () => observer.disconnect();
  }, [isInModal, hasMoreComments, isLoadingComments]);

  // Load initial comments in modal
  useEffect(() => {
    if (isInModal && post) {
      setCurrentPage(1);
      setIsLoadingComments(true);
      dispatch(getPostCommentsThunk({ postId: post.PostID, params: { page: 1, limit } }))
        .unwrap()
        .then((res: any) => {
          setHasMoreComments((res.comments?.length || 0) === limit);
        })
        .finally(() => setIsLoadingComments(false));
    }
  }, [isInModal, post.PostID, dispatch, limit]);

  // Actions
  const handleLikePost = useMemo(
    () =>
      debounce(async () => {
        setAnimatingLike(true);
        await dispatch(likePostThunk(post.PostID)).unwrap();
        setTimeout(() => setAnimatingLike(false), 600);
      }, 100),
    [dispatch, post.PostID]
  );

  const handleSavePost = useCallback(async () => {
      setAnimatingSave(true);
      await dispatch(savePostThunk(post.PostID)).unwrap();
      setTimeout(() => setAnimatingSave(false), 500);
    }, [dispatch, post.PostID]);

  const handleLoadMoreComments = useCallback(async () => {
    if (isInModal) {
      const totalLoaded = post.Comments?.length || 0;
      if (post.commentCount <= totalLoaded) {
        setHasMoreComments(false);
        return;
      }
      setIsLoadingComments(true);
      const nextPage = currentPage + 1;
      const res = await dispatch(
        getPostCommentsThunk({ postId: post.PostID, params: { page: nextPage, limit } })
      ).unwrap();
      setCurrentPage(nextPage);
      setHasMoreComments((res.comments?.length || 0) === limit);
      setIsLoadingComments(false);
    } else {
      setShowPostModal(post.PostID);
    }
  }, [
    isInModal,
    currentPage,
    limit,
    post.PostID,
    post.commentCount,
    post.Comments,
    dispatch,
    setShowPostModal,
  ]);

  const toggleFollowStatus = useCallback(() => {
    if (isFollowStatusLoading) return;
    const isFollowing = followState === true || followState === "pending";
    if (isFollowing) {
      dispatch(unfollowUserThunk(post.User.UserID));
    } else {
      dispatch(followUserThunk(post.User.UserID));
    }
  }, [dispatch, post.User.UserID, followState, isFollowStatusLoading]);

  const onSubmitComment: SubmitHandler<AddCommentFormData> = async (data) => {
    await dispatch(addCommentThunk({ postId: post.PostID, data })).unwrap();
    resetComment();
    setShowCommentForm(null);

    if (isInModal) {
      setCurrentPage(1);
      setIsLoadingComments(true);
      const res = await dispatch(
        getPostCommentsThunk({ postId: post.PostID, params: { page: 1, limit } })
      ).unwrap();
      setHasMoreComments((res.comments?.length || 0) === limit);
      setIsLoadingComments(false);
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

  const renderPostContent = useCallback(
    (postData: PostType, isShared: boolean = false) => (
      <div
        className={`${styles.feed__post_content_wrapper} ${isShared ? styles.feed__shared_post : ""}`}
        itemProp="content"
      >
        {postData.Content && (
          <TruncatedText text={postData.Content} maxChars={200} className={styles.feed__post_content} />
        )}
        {postData.ImageURL && (
          <Image
            src={postData.ImageURL}
            alt={postData.Content || "Post image"}
            width={600}
            height={400}
            className={styles.feed__post_media}
            placeholder="blur"
            blurDataURL="/placeholder.png"
            loading="lazy"
            itemProp="image"
          />
        )}
        {postData.VideoURL && <VideoPlayer src={postData.VideoURL} postId={postData.PostID} />}
      </div>
    ),
    []
  );

  return (
    <article
      ref={ref}
      className={`${styles.feed__post} ${isInModal ? styles.feed__post_in_modal : ""}`}
      aria-labelledby={`post-title-${post.PostID}`}
      data-post-id={post.PostID}
      itemScope
      itemType="http://schema.org/SocialMediaPosting"
    >
      {/* Header */}
      <div className={styles.feed__post_header}>
        <Link href={`/${post.User.Username}`}>
          <Image
            src={post.User.ProfilePicture || "/avatars/default-avatar.svg"}
            alt={`${post.User.Username}'s avatar`}
            width={48}
            height={48}
            className="avatar--md"
            loading="lazy"
          />
        </Link>

        <div className="flex flex-col flex-grow ml-2">
          <Link href={`/${post.User.Username}`} className={`${styles.feed__post_username} hover:underline`} itemProp="author">
            {post.User.Username}
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-1">
            <time className={styles.feed__post_timestamp} dateTime={new Date(post.CreatedAt).toISOString()} itemProp="datePublished">
              {formatDistanceToNow(new Date(post.CreatedAt), { addSuffix: true })}
            </time>
            {post.isSuggested && <span className="hidden md:block text-[var(--text-secondary)]">•</span>}
            {post.isSuggested && (
              <span className={styles.feed__suggested_badge} aria-label="Suggested for you">
                Suggested for you
              </span>
            )}
          </div>
        </div>

        {post.isSuggested && (
          <button
            onClick={toggleFollowStatus}
            disabled={isFollowStatusLoading}
            aria-label={followAriaLabel}
            className="text-sm font-medium text-[var(--linkup-purple)] hover:underline"
          >
            {isFollowStatusLoading ? <FaSpinner className="animate-spin" /> : followState === false ? "Follow" : followState === true ? "Following" : "Requested"}
          </button>
        )}

        <button
          onClick={() => setShowPostMenu(post.PostID)}
          className={styles.feed__post_menu_button}
          aria-label="Post options"
          aria-haspopup="menu"
        >
          <FaEllipsisH />
        </button>

        {showPostMenu && (
          <div ref={menuRef} className={styles.feed__post_menu} role="menu">
            {post.isMine && (
              <>
                <button onClick={() => setShowEditModal(post.PostID)} className={styles.feed__post_menu_item} role="menuitem">
                  <FaEdit /> Edit
                </button>
                <button onClick={() => setShowDeleteModal(post.PostID)} className={styles.feed__post_menu_item} role="menuitem">
                  <FaTrash /> Delete
                </button>
              </>
            )}
            <button onClick={() => setShowReportModal(post.PostID)} className={styles.feed__post_menu_item} role="menuitem">
              <FaFlag /> Report
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {renderPostContent(post)}
      {post.SharedPost && (
        <div className={styles.feed__shared_post_container} itemProp="sharedContent">
          <div className={styles.feed__shared_post_header}>
            <Link href={`/${post.SharedPost.User.Username}`}>
              <Image
                src={post.SharedPost.User.ProfilePicture || "/avatars/default-avatar.svg"}
                alt={`${post.SharedPost.User.Username}'s avatar`}
                width={32}
                height={32}
                className="avatar--md"
                loading="lazy"
              />
            </Link>
             <div className="flex flex-col flex-grow ml-1">
              <Link href={`/${post.SharedPost.User.Username}`} className={`${styles.feed__shared_post_username} hover:underline`}>
                {post.SharedPost.User.Username}
              </Link>
              <time className={styles.feed__shared_post_timestamp}>
                {formatDistanceToNow(new Date(post.SharedPost.CreatedAt), { addSuffix: true })}
              </time>
            </div>
          </div>
          {renderPostContent(post.SharedPost, true)}
        </div>
      )}

      {/* Actions */}
      <div className={styles.feed__post_actions}>
        <div className={styles.feed__post_actions_interactions}>
          <button
            onClick={handleLikePost}
            className={`${styles.feed__post_action} ${post.isLiked ? styles.feed__post_action__liked : ""} ${animatingLike ? styles.feed__post_action__like_animate : ""}`}
            aria-label={post.isLiked ? "Unlike post" : "Like post"}
            aria-pressed={post.isLiked}
          >
            <div className={styles.feed__like_wrapper}>
              <HeartIcon className={`${post.isLiked ? "text-[var(--error)] fill-[var(--error)]" : ""} w-5 h-5`} aria-hidden="true"/>
            </div>
              {!!post.likeCount && (
                <span 
                  className="ml-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserListModal(post.PostID);
                  }}
                >
                  {post.likeCount}
                </span>
              )}
          </button>

          <button
            onClick={() => setShowCommentForm(showCommentForm ? null : post.PostID)}
            className={`${styles.feed__post_action} ${showCommentForm ? styles.feed__post_action__comment_animate : ""}`}
            aria-label="Comment on post"
          >
            <EnvelopeIcon className="w-5 h-5" aria-hidden="true"/>
            {!!post.commentCount && <span className="ml-2">{post.commentCount}</span>}
          </button>

          <button onClick={() => setShowShareModal(post.PostID)} className={styles.feed__post_action} aria-label="Share post">
            <ShareIcon className="w-5 h-5" aria-hidden="true"/>
            {!!post.shareCount && <span className="ml-2">{post.shareCount}</span>}
          </button>
        </div>

        <button
          onClick={handleSavePost}
          className={`${styles.feed__post_action} ${post.isSaved ? styles.feed__post_action__saved : ""} ${animatingSave ? styles.feed__post_action__save_animate : ""}`}
          aria-label={post.isSaved ? "Unsave post" : "Save post"}
        >
          <BookmarkIcon className={`${post.isSaved ? "text-[var(--linkup-purple)] fill-[var(--linkup-purple)]" : ""} w-5 h-5`} aria-hidden="true"/>
        </button>
      </div>

      {/* Likes Preview */}
      {post.Likes && post.Likes.length > 0 && (
        <div
          className={styles.feed__post_likes}
          onClick={() => setShowUserListModal(post.PostID)}
          role="button"
          tabIndex={0}
          aria-label="View who liked this post"
        >
          <div className={styles.feed__post_likes_avatars}>
            {post.Likes.slice(0, 2).map((liker, i) => (
              <Image
                key={i}
                src={liker.profilePicture || "/avatars/default-avatar.svg"}
                alt={`${liker.username}'s avatar`}
                width={24}
                height={24}
                className={styles.feed__post_likes_avatar}
                loading="lazy"
              />
            ))}
          </div>
          <p className={styles.feed__post_likes_text}>
            Liked by {post.Likes[0].username}
            {post.likeCount > 1 &&
              ` and ${post.likeCount - 1} other${post.likeCount - 1 === 1 ? "" : "s"}`}
          </p>
        </div>
      )}

      {/* Comments */}
      {post.Comments && post.Comments.length > 0 && (
        <div className={styles.feed__comments} role="region" aria-label="Comments">
          {post.Comments.slice(0, isInModal ? undefined : 3).map((comment) => (
            <Comment
              key={comment.CommentID}
              comment={comment}
              showReplyForm={showReplyForm === comment.CommentID}
              setShowReplyForm={setShowReplyForm}
            />
          ))}

          {isInModal && isLoadingComments && (
            <p className="text-center text-secondary mt-4">Loading comments...</p>
          )}

          {!isInModal && post.commentCount > displayedCommentsCount && (
            <button onClick={handleLoadMoreComments} className={styles.feed__load_more_button}>
              View all {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {isInModal && !hasMoreComments && post.Comments && post.Comments.length > 0 && (
        <p className="text-center text-secondary mt-4">No more comments to load.</p>
      )}

      {/* Comment Form */}
      {showCommentForm && (
        <form onSubmit={handleCommentSubmit(onSubmitComment)} className={`${styles.feed__comment_form} ${styles.feed__form_animate}`}>
          <Image
            src={user?.profilePicture || "/avatars/default-avatar.svg"}
            alt="Your avatar"
            width={40}
            height={40}
            className="avatar--md"
            loading="lazy"
          />
          <div className={styles.feed__comment_input_wrapper}>
            <div className={styles.feed__comment_input_group}>
              <input
                {...registerComment("content")}
                placeholder="Write a comment..."
                className={styles.feed__comment_input}
                aria-invalid={!!commentErrors.content}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.feed__comment_button} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? <FaSpinner className="animate-spin" /> : "Post"}
              </button>
            </div>
            {commentErrors.content && (
              <p className={styles.feed__comment_error}>{commentErrors.content.message}</p>
            )}
          </div>
        </form>
      )}

      {/* Load more trigger for infinite scroll */}
      {isInModal && hasMoreComments && <div ref={commentLoadMoreRef} />}
    </article>
  );
});

Post.displayName = "Post";

export default Post;