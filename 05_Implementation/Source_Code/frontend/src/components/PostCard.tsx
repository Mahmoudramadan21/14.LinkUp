'use client';
import React, { memo } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import { useAppStore } from '@/store/feedStore';
import PostCardLoading from './PostCardLoading';
import { usePostCard } from '@/hooks/usePostCard';
import { formatTimeAgo, formatCount } from '@/utils/postCardUtils';
import { PostCardProps, PostCardAppStore } from '@/types';

/**
 * PostCard Component
 * Displays a social media post with media, likes, comments, and replies.
 * Supports optimistic updates for likes and comments with rollback on failure.
 * Shows a loading skeleton when isLoading is true.
 */
const PostCard: React.FC<PostCardProps> = ({
  postId,
  userId,
  username,
  profilePicture,
  privacy,
  content,
  imageUrl,
  videoUrl,
  createdAt,
  likeCount,
  commentCount,
  isLiked,
  likedBy,
  comments,
  isLoading = false,
  onPostUpdate,
}) => {
  if (isLoading) {
    return <PostCardLoading />;
  }

  const { authData, setError } = useAppStore() as PostCardAppStore;
  const {
    showComments,
    isPlaying,
    isHovered,
    setIsHovered,
    newComment,
    setNewComment,
    replyingTo,
    setReplyingTo,
    localIsLiked,
    localLikeCount,
    localLikedBy,
    localComments,
    localCommentCount,
    localCommentLikes,
    handleLikeToggle,
    handleCommentLikeToggle,
    handleCommentSubmit,
    handleReplySubmit,
    handleSaveToggle,
    handleToggleComments,
    handleVideoToggle,
    handleReplyClick,
    handleSubmit,
  } = usePostCard({
    postId,
    initialLikeCount: likeCount,
    initialCommentCount: commentCount,
    initialIsLiked: isLiked,
    initialLikedBy: likedBy,
    initialComments: comments,
    onPostUpdate,
    authData,
    setError,
  });

  return (
    <article
      className="post-card"
      data-testid="post-card"
      itemScope
      itemType="http://schema.org/SocialMediaPosting"
    >
      <div className="post-card__header">
        <Avatar
          imageSrc={profilePicture}
          username={username}
          size="small"
          showUsername={false}
          aria-hidden="true"
          width={32}
          height={32}
          loading="lazy"
        />
        <div className="post-card__header-info">
          <Link
            href={`/profile/${username}`}
            className="post-card__username"
            prefetch={false}
            itemProp="author"
          >
            @{username}
          </Link>
          <div className="post-card__meta">
            <span className="post-card__privacy" itemProp="accessMode">
              {privacy.charAt(0) + privacy.slice(1).toLowerCase()}
            </span>
            <span className="post-card__time">{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
        <div className="post-card__actions">
          <button
            type="button"
            className="post-card__button--more"
            aria-label="More options for post"
          >
            <span className="post-card__dots">⋯</span>
          </button>
        </div>
      </div>
      <div className="post-card__content">
        {content && (
          <p className="post-card__caption" itemProp="text">
            {content}
          </p>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Image posted by ${username}`}
            className="post-card__media"
            width={600}
            height={400}
            loading="lazy"
            itemProp="image"
          />
        )}
        {videoUrl && (
          <div
            className="post-card__video-wrapper"
            onClick={handleVideoToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            <video
              src={videoUrl}
              className="post-card__video"
              controls={false}
              playsInline
              preload="metadata"
              width={600}
              height={400}
              itemProp="video"
            />
            {!isPlaying && (
              <div
                className={`post-card__video-control ${isHovered ? 'post-card__video-control--visible' : ''}`}
              >
                <img
                  src="/icons/play.svg"
                  alt="Play"
                  className="post-card__video-control-icon"
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="post-card__actions-bar">
        <button
          type="button"
          className="post-card__button--like"
          onClick={handleLikeToggle}
          aria-label={localIsLiked ? 'Unlike post' : 'Like post'}
        >
          <img
            src={localIsLiked ? '/icons/liked.svg' : '/icons/like.svg'}
            alt={localIsLiked ? 'Unlike' : 'Like'}
            className="post-card__action-icon"
            width={20}
            height={20}
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(localLikeCount)}</span>
        </button>
        <button
          type="button"
          className="post-card__button--comment"
          onClick={handleToggleComments}
          aria-label="View comments"
        >
          <img
            src="/icons/comment.svg"
            alt="Comment"
            className="post-card__action-icon"
            width={20}
            height={20}
            loading="lazy"
          />
          <span className="post-card__action-count">{formatCount(localCommentCount)}</span>
        </button>
        <button
          type="button"
          className="post-card__button--save"
          onClick={handleSaveToggle}
          aria-label="Save post"
        >
          <img
            src="/icons/save.svg"
            alt="Save"
            className="post-card__action-icon"
            width={20}
            height={20}
            loading="lazy"
          />
        </button>
      </div>
      {localLikedBy.length > 0 && (
        <div className="post-card__likes">
          <div className="post-card__likes-avatars">
            {localLikedBy.slice(0, 3).map((user, index) => (
              <img
                key={index}
                src={user.profilePicture}
                alt={`${user.username}'s avatar`}
                className="post-card__avatar--like"
                width={24}
                height={24}
                loading="lazy"
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="post-card__likes-text">
            Liked by {localLikedBy[0].username}{' '}
            {localLikeCount > 1 ? `and ${localLikeCount - 1} others` : ''}
          </span>
        </div>
      )}
      {showComments && (
        <div className="post-card__comments" role="list" aria-live="polite">
          <div className="post-card__comments-list">
            {localComments.map((comment) => (
              <div
                key={comment.commentId}
                className={`post-card__comment ${
                  comment.isPending ? 'post-card__comment--pending' : ''
                }`}
                role="listitem"
              >
                <Avatar
                  imageSrc={comment.profilePicture || '/avatars/placeholder.jpg'}
                  username={comment.username}
                  size="xsmall"
                  showUsername={false}
                  aria-hidden="true"
                  width={24}
                  height={24}
                  loading="lazy"
                />
                <div className="post-card__comment-content">
                  <span className="post-card__comment-username">{comment.username}</span>
                  <p className="post-card__comment-text">{comment.content}</p>
                  <div className="post-card__comment-actions">
                    <button
                      type="button"
                      className="post-card__button--comment-like"
                      onClick={() =>
                        handleCommentLikeToggle(`comment-${comment.commentId}`, comment.commentId, false)
                      }
                      aria-label={
                        localCommentLikes[`comment-${comment.commentId}`]?.isLiked
                          ? 'Unlike comment'
                          : 'Like comment'
                      }
                    >
                      {localCommentLikes[`comment-${comment.commentId}`]?.isLiked ? 'Unlike' : 'Like'}
                      {localCommentLikes[`comment-${comment.commentId}`]?.likeCount > 0 && (
                        <span>
                          {' '}
                          ({formatCount(localCommentLikes[`comment-${comment.commentId}`].likeCount)})
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="post-card__button--reply"
                      onClick={() => handleReplyClick(comment.commentId, comment.username)}
                      aria-label="Reply to comment"
                    >
                      Reply
                    </button>
                    <span className="post-card__comment-time">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="post-card__replies" role="list">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.commentId}
                          className={`post-card__reply ${
                            reply.isPending ? 'post-card__reply--pending' : ''
                          }`}
                          role="listitem"
                        >
                          <Avatar
                            imageSrc={reply.profilePicture || '/avatars/placeholder.jpg'}
                            username={reply.username}
                            size="xsmall"
                            showUsername={false}
                            aria-hidden="true"
                            width={24}
                            height={24}
                            loading="lazy"
                          />
                          <div className="post-card__reply-content">
                            {reply.replyingToUsername && (
                              <span className="post-card__reply-to">
                                Replying to @{reply.replyingToUsername}
                              </span>
                            )}
                            <span className="post-card__reply-username">{reply.username}</span>
                            <p className="post-card__reply-text">{reply.content}</p>
                            <div className="post-card__reply-actions">
                              <button
                                type="button"
                                className="post-card__button--reply-like"
                                onClick={() =>
                                  handleCommentLikeToggle(
                                    `reply-${comment.commentId}-${reply.commentId}`,
                                    reply.commentId,
                                    true
                                  )
                                }
                                aria-label={
                                  localCommentLikes[
                                    `reply-${comment.commentId}-${reply.commentId}`
                                  ]?.isLiked
                                    ? 'Unlike reply'
                                    : 'Like reply'
                                }
                              >
                                {localCommentLikes[
                                  `reply-${comment.commentId}-${reply.commentId}`
                                ]?.isLiked
                                  ? 'Unlike'
                                  : 'Like'}
                                {localCommentLikes[
                                  `reply-${comment.commentId}-${reply.commentId}`
                                ]?.likeCount > 0 && (
                                  <span>
                                    {' '}
                                    (
                                    {formatCount(
                                      localCommentLikes[
                                        `reply-${comment.commentId}-${reply.commentId}`
                                      ].likeCount
                                    )}
                                    )
                                  </span>
                                )}
                              </button>
                              <span className="post-card__reply-time">
                                {formatTimeAgo(reply.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="post-card__comment-input">
            <label htmlFor={`comment-input-${postId}`} className="sr-only">
              {replyingTo !== null ? 'Write a reply' : 'Write a comment'}
            </label>
            <input
              id={`comment-input-${postId}`}
              type="text"
              placeholder={replyingTo !== null ? 'Write a reply...' : 'Post a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="post-card__input--comment"
              aria-label={replyingTo !== null ? 'Write a reply' : 'Write a comment'}
            />
            {replyingTo !== null && (
              <button
                type="button"
                className="post-card__button--cancel"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment('');
                }}
                aria-label="Cancel reply"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="post-card__button--submit"
              onClick={handleSubmit}
              aria-label={replyingTo !== null ? 'Submit reply' : 'Submit comment'}
            >
              {replyingTo !== null ? 'Reply' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default memo(PostCard);