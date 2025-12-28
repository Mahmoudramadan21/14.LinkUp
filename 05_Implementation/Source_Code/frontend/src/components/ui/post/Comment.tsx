import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  FaEllipsisH,
  FaEdit,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";

import HeartIcon from "/public/icons/HeartIcon.svg"
import EnvelopeIcon from "/public/icons/EnvelopeIcon.svg"

import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import { Comment as CommentType } from "@/types/post";
import Reply from "./Reply";
import ConfirmationModal from "../modal/ConfirmationModal";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReplyCommentFormData,
  replyCommentSchema,
  AddCommentFormData,
  addCommentSchema,
} from "@/utils/validationSchemas";
import {
  replyToCommentThunk,
  likeCommentThunk,
  editCommentThunk,
  deleteCommentThunk,
  getCommentRepliesThunk,
} from "@/store/postSlice";
import Link from "next/link";
import TruncatedText from "../common/TruncatedText";

/**
 * Props for the Comment component
 */
interface CommentProps {
  comment: CommentType;
  showReplyForm: boolean;
  setShowReplyForm: React.Dispatch<React.SetStateAction<number | null>>;
}

/**
 * Individual comment component with support for:
 * - Liking
 * - Replying
 * - Editing (owner only)
 * - Deleting (owner only)
 * - Loading more replies (pagination)
 */
const Comment: React.FC<CommentProps> = ({ comment, showReplyForm, setShowReplyForm }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  // UI State
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCommentMenu, setShowCommentMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [page, setPage] = useState(1);

  // Loading state for replies pagination
  const isLoadingReplies = useSelector(
    (state: RootState) => state.post.loading.getCommentReplies
  );

  const isDeletingComment = useSelector(
    (state: RootState) => state.post.loading.deleteComment
  );

  // Reply Form Setup
  const {
    register: registerReply,
    handleSubmit: handleReplySubmit,
    reset: resetReply,
    formState: { errors: replyErrors, isSubmitting: isSubmittingReply },
  } = useForm<ReplyCommentFormData>({
    resolver: zodResolver(replyCommentSchema),
  });

  // Edit Comment Form Setup
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  // Pre-fill edit form when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue("content", comment.Content);
    }
  }, [isEditing, comment.Content, setEditValue]);

  // Close comment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCommentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global ESC key handler for closing menus/modals/forms
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCommentMenu(false);
        setIsEditing(false);
        setShowDeleteCommentModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Submit new reply
  const onSubmitReply: SubmitHandler<ReplyCommentFormData> = async (data) => {
    await dispatch(replyToCommentThunk({ commentId: comment.CommentID, data })).unwrap();
    resetReply();
    setShowReplyForm(null);
  };

  // Submit edited comment
  const onSubmitEdit: SubmitHandler<AddCommentFormData> = async (data) => {
    await dispatch(editCommentThunk({ commentId: comment.CommentID, data })).unwrap();
    setIsEditing(false);
    resetEdit();
  };

  // Toggle like on the main comment
  const handleLikeComment = async () => {
    await dispatch(likeCommentThunk(comment.CommentID)).unwrap();
  };

  // Toggle like on a reply
  const handleLikeReply = async (replyId: number) => {
    await dispatch(likeCommentThunk(replyId)).unwrap();
  };

  // Load next page of replies
  const handleLoadMoreReplies = async () => {
    await dispatch(
      getCommentRepliesThunk({
        commentId: comment.CommentID,
        params: { page, limit: 3 },
      })
    ).unwrap();
    setPage((prev) => prev + 1);
  };

  // Show "Load more" only if there are more replies than currently loaded
  const showLoadMoreButton =
    comment.replyCount > 3 && comment.replyCount > (comment.Replies?.length || 0);

  return (
    <div className={`${styles.feed__comment} p-4`} aria-label={`Comment by ${comment.User.Username}`}>
      {/* Comment Header: Avatar, Username, Timestamp, Menu */}
      <div className={styles.feed__comment_header}>
        <Link href={`/${comment.User.Username}`}>
          <Image
            src={comment.User.ProfilePicture || "/avatars/default-avatar.svg"}
            alt={`${comment.User.Username}'s avatar`}
            width={32}
            height={32}
            className={styles.feed__comment_avatar}
            data-testid="avatar"
          />
        </Link>

        <div>
          <Link href={`/${comment.User.Username}`} className={`${styles.feed__comment_username} hover:underline`}>
            {comment.User.Username}
          </Link>
          <p className={styles.feed__comment_timestamp}>
            {formatDistanceToNow(new Date(comment.CreatedAt), { addSuffix: true })}
          </p>
        </div>

        {/* Options menu (visible only to comment owner) */}
        {comment.isMine && (
          <button
            onClick={() => setShowCommentMenu(true)}
            className={styles.feed__post_menu_button}
            aria-label="Comment options"
          >
            <FaEllipsisH />
          </button>
        )}

        {/* Dropdown menu for Edit/Delete */}
        {showCommentMenu && (
          <div ref={menuRef} className={styles.feed__post_comment_menu}>
            <button
              onClick={() => {
                setIsEditing(true);
                setShowCommentMenu(false);
              }}
              className={styles.feed__post_comment_menu_item}
              aria-label="Edit comment"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={() => {
                setShowDeleteCommentModal(true);
                setShowCommentMenu(false);
              }}
              className={styles.feed__post_comment_menu_item}
              aria-label="Delete comment"
            >
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Comment Content */}
      <TruncatedText text={comment.Content} maxChars={150} className={styles.feed__comment_content} />

      {/* Like & Reply Actions */}
      <div className={styles.feed__comment_actions}>
        <button
          onClick={handleLikeComment}
          className={`${styles.feed__comment_action} ${comment.isLiked ? styles.feed__comment_action__liked : ""}`}
          aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
        >
          <div className={styles.feed__like_wrapper}>
            <HeartIcon className={`${comment.isLiked ? "text-[var(--error)] fill-[var(--error)]" : ""} w-4 h-4`} aria-hidden="true"/>
          </div>
          <span className="ml-1">{String(comment.likeCount ?? 0)}</span>
        </button>

        <button
          onClick={() => setShowReplyForm(showReplyForm ? null : comment.CommentID)}
          className={`${styles.feed__comment_action} ${showReplyForm ? styles.feed__comment_action__comment_animate : ""}`}
          aria-label="Reply to comment"
        >
          <EnvelopeIcon className="w-4 h-4" aria-hidden="true"/>
          <span className="ml-1">{String(comment.replyCount ?? 0)}</span>
        </button>
      </div>

      {/* Render Replies */}
      {comment.Replies && comment.Replies.length > 0 && (
        <div className={styles.feed__replies}>
          {comment.Replies.map((reply) => (
            <Reply
              key={reply.CommentID}
              reply={reply}
              likes={{
                onLike: () => handleLikeReply(reply.CommentID),
                loading: false,
              }}
            />
          ))}
        </div>
      )}

      {/* Reply Form (when active) */}
      {showReplyForm && (
        <form
          onSubmit={handleReplySubmit(onSubmitReply)}
          className={`${styles.feed__reply_form} ${styles.feed__form_animate}`}
          aria-label="Reply to comment form"
        >
          <Image
            src={user?.profilePicture || "/avatars/default-avatar.svg"}
            alt={`${user?.username || "User"}'s avatar`}
            width={40}
            height={40}
            className="avatar--md"
            style={{ width: "3rem", height: "3rem" }}
            data-testid="user-avatar"
          />

          <div className={styles.feed__comment_reply_wrapper}>
            <div className={styles.feed__reply_input_group}>
              <input
                {...registerReply("content")}
                placeholder="Write a reply..."
                className={styles.feed__reply_input}
                aria-invalid={replyErrors.content ? "true" : "false"}
                aria-describedby={replyErrors.content ? "reply-error" : undefined}
              />
              <button
                type="submit"
                disabled={isSubmittingReply}
                className={`${styles.feed__reply_button} ${styles.feed__button_animate} ${
                  isSubmittingReply ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Submit reply"
              >
                {isSubmittingReply ? <FaSpinner className="animate-spin" /> : "Reply"}
              </button>
            </div>

            {replyErrors.content && (
              <p id="reply-error" className={styles.feed__reply_error}>
                {replyErrors.content.message}
              </p>
            )}
          </div>
        </form>
      )}

      {/* Edit Form (replaces comment content when editing) */}
      {isEditing && (
        <form
          onSubmit={handleEditSubmit(onSubmitEdit)}
          className={`${styles.feed__comment_form} ${styles.feed__form_animate}`}
          style={{ position: "relative" }}
          aria-label="Edit comment form"
        >
          <Image
            src={user?.profilePicture || "/avatars/default-avatar.svg"}
            alt={`${user?.username || "User"}'s avatar`}
            width={40}
            height={40}
            className="avatar--md"
            style={{ width: "3rem", height: "3rem" }}
            data-testid="user-avatar"
          />

          <div className={styles.feed__comment_input_wrapper}>
            <div className={styles.feed__comment_input_group}>
              <input
                {...registerEdit("content")}
                defaultValue={comment.Content}
                placeholder="Edit your comment..."
                className={styles.feed__comment_input}
                aria-invalid={editErrors.content ? "true" : "false"}
                aria-describedby={editErrors.content ? "edit-comment-error" : undefined}
              />
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className={`${styles.feed__comment_button} ${
                  isSubmittingEdit ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Submit edited comment"
              >
                {isSubmittingEdit ? <FaSpinner className="animate-spin" /> : "Update"}
              </button>
            </div>

            {editErrors.content && (
              <p id="edit-comment-error" className={styles.feed__comment_error}>
                {editErrors.content.message}
              </p>
            )}

            <p className="text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)] mt-1">
              Press Esc to{" "}
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="underline text-[var(--blue-action)] cursor-pointer"
              >
                cancel
              </button>
            </p>
          </div>
        </form>
      )}

      {/* Load More Replies Button */}
      {showLoadMoreButton && (
        <button
          onClick={handleLoadMoreReplies}
          disabled={isLoadingReplies}
          className={`${styles.feed__load_more_button} mt-2 flex items-center text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={`Load more replies for comment by ${comment.User.Username}`}
        >
          {isLoadingReplies && <FaSpinner className="animate-spin mr-2" />}
          Load more replies
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteCommentModal && (
        <ConfirmationModal
          isOpen={showDeleteCommentModal}
          entityType="comment"
          entityId={comment.CommentID}
          actionThunk={deleteCommentThunk}
          onClose={() => setShowDeleteCommentModal(false)}
          loadingState={isDeletingComment}
        />
      )}
    </div>
  );
};

export default Comment;