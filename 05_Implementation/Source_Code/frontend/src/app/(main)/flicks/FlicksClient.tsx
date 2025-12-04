'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  Suspense,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import {
  FaHeart,
  FaComment,
  FaShare,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaEllipsisH,
  FaFlag,
  FaPaperPlane,
  FaBookmark,
  FaSpinner,
} from 'react-icons/fa';

import { RootState, AppDispatch } from '@/store';
import {
  getFlicksThunk,
  likePostThunk,
  savePostThunk,
  recordBatchPostViewsThunk,
  getPostCommentsThunk,
  addCommentThunk,
} from '@/store/postSlice';
import { setIsVideoMuted } from '@/store/uiSlice';
import { followUserThunk, unfollowUserThunk } from '@/store/profileSlice';

import { debounce } from 'lodash';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCommentFormData, addCommentSchema } from '@/utils/validationSchemas';

import Comment from '@/components/ui/post/Comment';
import ReportModal from '@/components/ui/modal/ReportModal';
import ShareModal from '@/components/ui/post/modals/ShareModal';
import UserListModal from '@/components/ui/modal/UserListModal';
import TruncatedText from '@/components/ui/post/TruncatedText';
import Link from 'next/link';

import styles from './flicks.module.css';

/**
 * FlickSkeleton - Loading placeholder for video flicks
 * Memoized for performance during infinite scroll
 */
const FlickSkeleton = React.memo(() => (
  <div className={styles['flicks__container']} role="status" aria-label="Loading flick">
    <div className="w-full h-full bg-neutral-gray rounded-2xl animate-pulse" />
    <div className={styles['flicks__overlay']}>
      <div className={styles['flicks__info']}>
        <div className="w-32 h-10 bg-neutral-gray rounded-full animate-pulse" />
        <div className="w-3/4 h-4 bg-neutral-gray rounded-xl mt-2 animate-pulse" />
      </div>
      <div className={styles['flicks__actions']}>
        <div className="w-12 h-12 bg-neutral-gray rounded-full animate-pulse" />
        <div className="w-12 h-12 bg-neutral-gray rounded-full animate-pulse" />
        <div className="w-12 h-12 bg-neutral-gray rounded-full animate-pulse" />
        <div className="w-12 h-12 bg-neutral-gray rounded-full animate-pulse" />
      </div>
    </div>
  </div>
));
FlickSkeleton.displayName = 'FlickSkeleton';

/**
 * FlicksPageClient - Vertical video feed similar to TikTok/Reels
 * Features: Auto-play on scroll, batch view recording, infinite scroll,
 * like/save/comment/share, follow, mute control, full accessibility support.
 */
const FlicksPageClient: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { flicks, loading } = useSelector((state: RootState) => state.post);
  const { user } = useSelector((state: RootState) => state.auth);
  const isVideoMuted = useSelector((state: RootState) => state.ui.isVideoMuted);

  // Pagination & UI States
  const [page, setPage] = useState(1);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [manuallyPaused, setManuallyPaused] = useState<Map<number, boolean>>(new Map());
  const [showCommentModal, setShowCommentModal] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [currentPageComments, setCurrentPageComments] = useState<{ [key: number]: number }>({});

  // Refs
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingViewsRef = useRef<number[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentModalRef = useRef<HTMLDivElement>(null);
  const commentLoadMoreRef = useRef<HTMLDivElement>(null);
  const preLastFlickRef = useRef<HTMLDivElement>(null);

  // Constants
  const limit = 10;
  const commentLimit = 10;

  // Loading states from Redux
  const followLoading = useSelector((state: RootState) => state.profile.loading.followUser);
  const unfollowLoading = useSelector((state: RootState) => state.profile.loading.unfollowUser);

  /* -------------------------------------------------------------------------- */
  /*                               Follow Handling                              */
  /* -------------------------------------------------------------------------- */

  const handleFollowToggle = useCallback(
    (userId: number, currentStatus: boolean | 'pending' | undefined) => {
      if (followLoading[userId] || unfollowLoading[userId]) return;

      if (currentStatus === true || currentStatus === 'pending') {
        dispatch(unfollowUserThunk(userId));
      } else {
        dispatch(followUserThunk(userId));
      }
    },
    [dispatch, followLoading, unfollowLoading]
  );

  /* -------------------------------------------------------------------------- */
  /*                                 Data Fetching                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    dispatch(getFlicksThunk({ page, limit }));
  }, [dispatch, page, limit]);

  /* -------------------------------------------------------------------------- */
  /*                           Video Auto-Play & View Tracking                  */
  /* -------------------------------------------------------------------------- */

  const manuallyPausedMemo = useMemo(() => manuallyPaused, [manuallyPaused]);

  const sendBatchViews = useMemo(
    () =>
      debounce(() => {
        if (pendingViewsRef.current.length > 0) {
          dispatch(recordBatchPostViewsThunk({ postIds: pendingViewsRef.current }));
          pendingViewsRef.current = [];
        }
      }, 10000),
    [dispatch]
  );

  // Intersection Observer for auto-play and view counting
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const postId = Number(video.dataset.postId);

          if (entry.isIntersecting && !manuallyPausedMemo.get(postId)) {
            setPlayingVideoId(postId);
            video.play().catch(() => {});
            if (!pendingViewsRef.current.includes(postId)) {
              pendingViewsRef.current.push(postId);
              sendBatchViews();
            }
          } else {
            video.pause();
            if (postId === playingVideoId) setPlayingVideoId(null);
          }
        });
      },
      { threshold: 0.7 }
    );

    videoRefs.current.forEach((video) => observerRef.current?.observe(video));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [flicks, manuallyPausedMemo, sendBatchViews, playingVideoId]);

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        videoRefs.current.forEach((video) => video.pause());
        setPlayingVideoId(null);
      } else if (playingVideoId !== null) {
        const video = videoRefs.current.get(playingVideoId);
        if (video && !manuallyPausedMemo.get(playingVideoId)) {
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [playingVideoId, manuallyPausedMemo]);

  // Sync global mute state
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      video.muted = isVideoMuted;
    });
  }, [isVideoMuted]);

  /* -------------------------------------------------------------------------- */
  /*                               Infinite Scroll (Flicks)                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading.getFlicks) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (preLastFlickRef.current) observer.observe(preLastFlickRef.current);
    return () => observer.disconnect();
  }, [flicks.length, loading.getFlicks]);

  /* -------------------------------------------------------------------------- */
  /*                               Comments Infinite Scroll                     */
  /* -------------------------------------------------------------------------- */

  const handleLoadMoreComments = useCallback(
    async (postId: number) => {
      const nextPage = (currentPageComments[postId] || 0) + 1;
      await dispatch(
        getPostCommentsThunk({ postId, params: { page: nextPage, limit: commentLimit } })
      );
      setCurrentPageComments((prev) => ({ ...prev, [postId]: nextPage }));
    },
    [dispatch, currentPageComments, commentLimit]
  );

  useEffect(() => {
    if (showCommentModal !== null && commentLoadMoreRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !loading.getPostComments) {
            handleLoadMoreComments(showCommentModal);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(commentLoadMoreRef.current);
      return () => observer.disconnect();
    }
  }, [showCommentModal, loading.getPostComments, handleLoadMoreComments]);

  /* -------------------------------------------------------------------------- */
  /*                               Interaction Handlers                         */
  /* -------------------------------------------------------------------------- */

  const handleLike = useCallback(
    (postId: number) => {
      dispatch(likePostThunk(postId));
    },
    [dispatch]
  );

  const handleSavePost = useCallback(
    (postId: number) => {
      dispatch(savePostThunk(postId));
    },
    [dispatch]
  );

  const toggleMute = useCallback(() => {
    dispatch(setIsVideoMuted(!isVideoMuted));
  }, [dispatch, isVideoMuted]);

  const togglePlayPause = useCallback(
    (postId: number) => {
      const video = videoRefs.current.get(postId);
      if (!video) return;

      if (video.paused) {
        video.play().catch(() => {});
        setPlayingVideoId(postId);
        setManuallyPaused((prev) => new Map(prev).set(postId, false));
      } else {
        video.pause();
        setPlayingVideoId(null);
        setManuallyPaused((prev) => new Map(prev).set(postId, true));
      }
    },
    []
  );

  /* -------------------------------------------------------------------------- */
  /*                                 Comment Form                               */
  /* -------------------------------------------------------------------------- */

  const {
    register: registerComment,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
    formState: { errors: commentErrors, isSubmitting },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  const onSubmitComment = useCallback(
    (postId: number) => (data: AddCommentFormData) => {
      dispatch(addCommentThunk({ postId, data })).then(() => {
        resetComment();
      });
    },
    [dispatch, resetComment]
  );

  /* -------------------------------------------------------------------------- */
  /*                            Accessibility & UX Cleanup                      */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowPostMenu(null);
      if (commentModalRef.current && !commentModalRef.current.contains(e.target as Node))
        setShowCommentModal(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCommentModal(null);
        setShowReplyForm(null);
        setShowPostMenu(null);
        setShowReportModal(null);
        setShowShareModal(null);
        setShowUserListModal(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles['flicks']} role="main" aria-label="Flicks feed">
        <div className={styles['flicks__wrapper']} role="feed" aria-busy={loading.getFlicks}>
          {loading.getFlicks && page === 1 ? (
            Array.from({ length: limit }).map((_, i) => <FlickSkeleton key={`skeleton-${i}`} />)
          ) : (
            flicks.map((flick, index) => {
              const comments = flick.Comments || [];
              const hasMoreComments = flick.commentCount > comments.length;
              const isPreLast = index === flicks.length - 2;

              return (
                <article
                  key={flick.PostID}
                  className={styles['flicks__container']}
                  ref={isPreLast ? preLastFlickRef : null}
                  itemScope
                  itemType="http://schema.org/VideoObject"
                  aria-label={`Flick by ${flick.User.Username}`}
                >
                  {/* Video Element */}
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(flick.PostID, el);
                      else videoRefs.current.delete(flick.PostID);
                    }}
                    data-post-id={flick.PostID}
                    src={flick.VideoURL ?? ''}
                    className={styles.flicks__video}
                    loop
                    muted={isVideoMuted}
                    playsInline
                    preload="metadata"
                    itemProp="contentUrl"
                    aria-describedby={`flick-desc-${flick.PostID}`}
                  />
                  <meta itemProp="name" content={flick.Content || 'Flick video'} />

                  {/* Overlay Content */}
                  <div className={styles['flicks__overlay']}>
                    <div className={styles['flicks__info']}>
                      <div className={styles['flicks__user']}>
                        <Link href={`/${flick.User.Username}`}>
                          <Image
                            src={flick.User.ProfilePicture || '/avatars/default-avatar.svg'}
                            alt=""
                            width={40}
                            height={40}
                            className={styles['flicks__user-avatar']}
                          />
                        </Link>
                        <Link href={`/${flick.User.Username}`}>
                          <p className={`${styles['flicks__user-username']} hover:underline`}>
                            {flick.User.Username}
                          </p>
                        </Link>

                        {user?.userId !== flick.User.UserID && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleFollowToggle(flick.User.UserID, flick.User.isFollowed);
                            }}
                            disabled={followLoading[flick.User.UserID] || unfollowLoading[flick.User.UserID]}
                            className={styles['flicks__follow-status-button']}
                            aria-label={
                              flick.User.isFollowed === true
                                ? `Unfollow ${flick.User.Username}`
                                : `Follow ${flick.User.Username}`
                            }
                          >
                            {followLoading[flick.User.UserID] || unfollowLoading[flick.User.UserID] ? (
                              <FaSpinner className="animate-spin" />
                            ) : flick.User.isFollowed === true ? (
                              'Following'
                            ) : flick.User.isFollowed === 'pending' ? (
                              'Requested'
                            ) : (
                              'Follow'
                            )}
                          </button>
                        )}
                      </div>

                      {flick.Content && (
                        <div
                          id={`flick-desc-${flick.PostID}`}
                          className={styles['flicks__content_wrapper']}
                          itemProp="description"
                        >
                          <TruncatedText text={flick.Content} maxChars={60} className={styles['flicks__content']} />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className={styles['flicks__actions']}>
                      <button
                        onClick={() => setShowPostMenu(flick.PostID)}
                        className={styles['flicks__action-button']}
                        aria-label="More options"
                      >
                        <FaEllipsisH size={24} />
                      </button>

                      {showPostMenu === flick.PostID && (
                        <div ref={menuRef} className={styles['flicks__menu']} role="menu">
                          <button
                            onClick={() => {
                              setShowReportModal(flick.PostID);
                              setShowPostMenu(null);
                            }}
                            className={styles['flicks__menu-item']}
                            role="menuitem"
                          >
                            <FaFlag /> Report
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleLike(flick.PostID)}
                        className={`${styles['flicks__action-button']} ${flick.isLiked ? styles['flicks__action-button--liked'] : ''}`}
                        aria-label={flick.isLiked ? 'Unlike' : 'Like'}
                        aria-pressed={flick.isLiked}
                      >
                        <FaHeart size={28} />
                        <span
                          className={styles['flicks__action-count']}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (flick.likeCount > 0) setShowUserListModal(flick.PostID);
                          }}
                        >
                          {flick.likeCount}
                        </span>
                      </button>

                      <button
                        onClick={() => setShowCommentModal(flick.PostID)}
                        className={styles['flicks__action-button']}
                        aria-label="View comments"
                      >
                        <FaComment size={28} />
                        <span className={styles['flicks__action-count']}>{flick.commentCount}</span>
                      </button>

                      <button
                        onClick={() => setShowShareModal(flick.PostID)}
                        className={styles['flicks__action-button']}
                        aria-label="Share"
                      >
                        <FaShare size={28} />
                        <span className={styles['flicks__action-count']}>{flick.shareCount}</span>
                      </button>

                      <button
                        onClick={() => handleSavePost(flick.PostID)}
                        className={`${styles['flicks__action-button']} ${flick.isSaved ? styles['flicks__action-button--saved'] : ''}`}
                        aria-label={flick.isSaved ? 'Unsave' : 'Save'}
                      >
                        <FaBookmark size={28} />
                      </button>
                    </div>

                    {/* Mute & Play/Pause Controls */}
                    <button onClick={toggleMute} className={styles['flicks__mute-button']} aria-label={isVideoMuted ? 'Unmute' : 'Mute'}>
                      {isVideoMuted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
                    </button>

                    <button
                      onClick={() => togglePlayPause(flick.PostID)}
                      className={styles['flicks__play-pause-button']}
                      aria-label={playingVideoId === flick.PostID && !manuallyPausedMemo.get(flick.PostID) ? 'Pause' : 'Play'}
                    >
                      {playingVideoId === flick.PostID && !manuallyPausedMemo.get(flick.PostID) ? (
                        <FaPause size={42} />
                      ) : (
                        <FaPlay size={42} />
                      )}
                    </button>
                  </div>

                  {/* Comments Modal */}
                  {showCommentModal === flick.PostID && (
                    <div className={styles['flicks__comment-modal']} role="dialog" aria-modal="true" aria-label="Comments">
                      <div ref={commentModalRef} className={styles['flicks__comment-modal-content']}>
                        <div className={styles['flicks__comment-modal-header']}>
                          <h2 className={styles['flicks__comment-modal-title']}>Comments</h2>
                          <button onClick={() => setShowCommentModal(null)} aria-label="Close">
                            ×
                          </button>
                        </div>

                        <div className={styles['flicks__comment-modal-body']}>
                          {comments.map((comment) => (
                            <Comment
                              key={comment.CommentID}
                              comment={comment}
                              showReplyForm={showReplyForm === comment.CommentID}
                              setShowReplyForm={setShowReplyForm}
                            />
                          ))}
                          {hasMoreComments && (
                            <div ref={commentLoadMoreRef} className={styles['flicks__comment-load-more']}>
                              <FaSpinner className="animate-spin" /> Loading more...
                            </div>
                          )}
                        </div>

                        {user && (
                          <form
                            onSubmit={handleCommentSubmit(onSubmitComment(flick.PostID))}
                            className={styles['flicks__comment-form']}
                          >
                            <div className={styles['flicks__comment-form-inner']}>
                              <Image
                                src={user.profilePicture || '/avatars/default-avatar.svg'}
                                alt=""
                                width={32}
                                height={32}
                                className={styles['flicks__comment-form-avatar']}
                              />
                              <input
                                {...registerComment('content')}
                                placeholder="Add a comment..."
                                className={styles['flicks__comment-form-input']}
                                aria-invalid={!!commentErrors.content}
                              />
                              <button type="submit" disabled={isSubmitting} aria-label="Post comment">
                                {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                              </button>
                            </div>
                            {commentErrors.content && (
                              <p className={styles['flicks__comment-form-error']}>
                                {commentErrors.content.message}
                              </p>
                            )}
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}

          {/* Loading skeletons for next page */}
          {loading.getFlicks && page > 1 && (
            Array.from({ length: limit }).map((_, i) => (
              <FlickSkeleton key={`loadmore-skeleton-${i}`} />
            ))
          )}
        </div>

        {/* Global Modals */}
        {showReportModal && (
          <ReportModal 
            isOpen={showReportModal !== null} 
            postId={showReportModal} 
            onClose={() => setShowReportModal(null)} 
            loadingState={loading.reportPost}
          />
        )}
        
        {showShareModal !== null && (
          <ShareModal
            isOpen={showShareModal !== null}
            post={flicks.find((p) => p.PostID === showShareModal)}
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
            postSource="flicks"
          />
        )}
      </div>
    </Suspense>
  );
};

export default FlicksPageClient;