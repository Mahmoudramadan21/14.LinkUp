import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from '@/store';import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { FaHeart, FaComment, FaEllipsisH, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import styles from "@/app/feed/feed.module.css";
import { Comment as CommentType } from "@/types/post";
import Reply from "../Reply";
import ConfirmationModal from "../../modal/ConfirmationModal";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReplyCommentFormData, replyCommentSchema, AddCommentFormData, addCommentSchema } from "@/utils/validationSchemas";
import { replyToCommentThunk, likeCommentThunk, editCommentThunk, deleteCommentThunk, getCommentRepliesThunk } from "@/store/postSlice";

interface CommentProps {
  comment: CommentType;
  showReplyForm: boolean;
  setShowReplyForm: React.Dispatch<React.SetStateAction<number | null>>;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  showReplyForm,
  setShowReplyForm,
}) => {
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  const dispatch = useDispatch<AppDispatch>();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCommentMenu, setShowCommentMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [page, setPage] = useState(1); // Track pagination for replies

  // Access loading state for fetching replies
  const isLoadingReplies = useSelector((state: RootState) => state.post.loading.getCommentReplies);

  // Reply form
  const {
    register: registerReply,
    handleSubmit: handleReplySubmit,
    reset: resetReply,
    formState: { errors: replyErrors, isSubmitting: isSubmittingReply },
  } = useForm<ReplyCommentFormData>({
    resolver: zodResolver(replyCommentSchema),
  });

  // Edit comment form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  // Initialize edit form with current comment content
  useEffect(() => {
    if (isEditing) {
      setEditValue("content", comment.Content);
    }
  }, [isEditing, comment.Content, setEditValue]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCommentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle ESC key for closing modals and menus
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

  const onSubmitReply: SubmitHandler<ReplyCommentFormData> = async (data) => {
    try {
      await dispatch(replyToCommentThunk({ commentId: comment.CommentID, data })).unwrap();
      resetReply();
      setShowReplyForm(null);
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  const onSubmitEdit: SubmitHandler<AddCommentFormData> = async (data) => {
    try {
      await dispatch(editCommentThunk({ commentId: comment.CommentID, data })).unwrap();
      setIsEditing(false);
      resetEdit();
    } catch (error) {
      console.error("Failed to edit comment:", error);
    }
  };

  const handleLikeComment = async () => {
    try {
      await dispatch(likeCommentThunk(comment.CommentID)).unwrap();
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    try {
      await dispatch(likeCommentThunk(replyId)).unwrap();
    } catch (error) {
      console.error("Failed to like reply:", error);
    }
  };

  const handleLoadMoreReplies = async () => {
    try {
      await dispatch(
        getCommentRepliesThunk({
          commentId: comment.CommentID,
          params: { page, limit: 3 },
        })
      ).unwrap();
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load more replies:", error);
    }
  };

  // Determine if "Load more replies" button should be shown
  const showLoadMoreButton =
    comment.replyCount > 3 &&
    comment.replyCount > (comment.Replies?.length || 0);

  return (
    <div
      className={`${styles.feed__comment} p-4`}
      aria-label={`Comment by ${comment.User.Username}`}
    >
      <div className={styles.feed__comment_header}>
        <Image
          src={comment.User.ProfilePicture || "/avatars/default-avatar.svg"}
          alt={`${comment.User.Username}'s avatar`}
          width={32}
          height={32}
          className={`${styles.feed__comment_avatar}`}
          data-testid="avatar"
        />
        <div>
          <p className={`${styles.feed__comment_username}`}>
            {comment.User.Username}
          </p>
          <p className={`${styles.feed__comment_timestamp}`}>
            {formatDistanceToNow(new Date(comment.CreatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        {comment.isMine && (
          <button
            onClick={() => setShowCommentMenu(true)}
            className={`${styles.feed__post_menu_button}`}
            aria-label="Comment options"
          >
            <FaEllipsisH />
          </button>
        )}
        {showCommentMenu && (
          <div ref={menuRef} className={styles.feed__post_comment_menu}>
            <button
              onClick={() => {
                setIsEditing(true);
                setShowCommentMenu(false);
              }}
              className={styles.feed__post_menu_item}
              aria-label="Edit comment"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={() => {
                setShowDeleteCommentModal(true);
                setShowCommentMenu(false);
              }}
              className={styles.feed__post_menu_item}
              aria-label="Delete comment"
            >
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>

      <p className={styles.feed__comment_content}>{comment.Content}</p>

      <div className={`${styles.feed__comment_actions}`}>
        <button
          onClick={handleLikeComment}
          className={`${styles.feed__comment_action} ${
            comment.isLiked ? styles.feed__comment_action__liked : ""
          }`}
          aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
        >
          <div className={styles.feed__like_wrapper}>
            <FaHeart
              className={comment.isLiked ? "text-red-500" : ""}
              aria-hidden="true"
            />
          </div>
          <span className="ml-1">{String(comment.likeCount ?? 0)}</span>
        </button>
        <button
          onClick={() => setShowReplyForm(showReplyForm ? null : comment.CommentID)}
          className={`${styles.feed__comment_action} ${
            showReplyForm ? styles.feed__comment_action__comment_animate : ""
          }`}
          aria-label="Reply to comment"
        >
          <FaComment aria-hidden="true" />
          <span className="ml-1">{String(comment.replyCount ?? 0)}</span>
        </button>
      </div>

      {comment.Replies && comment.Replies.length > 0 && (
        <div className={`${styles.feed__replies}`}>
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

      {showReplyForm && (
        <form
          onSubmit={handleReplySubmit(onSubmitReply)}
          className={`${styles.feed__reply_form} ${styles.feed__form_animate} flex flex-col gap-2 w-fulls`}
          aria-label="Reply to comment form"
        >
          <div className={styles.feed__reply_wrapper}>
            {/* Avatar */}
            <Image
              src={user?.profilePicture || "/avatars/default-avatar.svg"}
              alt={`${user?.username || "User"}'s avatar`}
              width={40}
              height={40}
              className={styles.feed__post_avatar}
              style={{ width: "3rem", height: "3rem" }}
              data-testid="user-avatar"
            />

            {/* Input + Button */}
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
                {isSubmittingReply ? (
                  <button className="animate-spin">
                    <FaSpinner className="text-white" />
                  </button>
                ) : (
                  "Reply"
                )}
              </button>
            </div>
          </div>

          {replyErrors.content && (
            <p id="reply-error" className={styles.feed__error}>
              {replyErrors.content.message}
            </p>
          )}
        </form>
      )}

      
      {isEditing && (
        <form
          onSubmit={handleEditSubmit(onSubmitEdit)}
          className={`${styles.feed__comment_form} ${styles.feed__form_animate} flex flex-col gap-2 w-full`}
          style={{position: "relative"}}
          aria-label="Edit comment form"
        >
          <div className={styles.feed__reply_wrapper}>
            {/* Avatar */}
            <Image
              src={user?.profilePicture || "/avatars/default-avatar.svg"}
                alt={`${user?.username || "User"}'s avatar`}
                width={40}
                height={40}
                className={styles.feed__post_avatar}
                style={{ width: "3rem", height: "3rem" }}
                data-testid="user-avatar"
            />
            <div className={styles.feed__comment_input_group}>
                <input
                  {...registerEdit("content")}
                  defaultValue={comment.Content}
                  placeholder="Edit your comment..."
                  className={`${styles.feed__comment_input}`}
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
                  {isSubmittingEdit ? (
                    <button className="animate-spin">
                      <FaSpinner className="text-white" />
                    </button>
                  ) : (
                    "Update"
                  )}
                </button>
            </div>
          </div>

          {editErrors.content && (
            <p id="edit-comment-error" className={`${styles.feed__error}`}>
              {editErrors.content.message}
            </p>
          )}

          <p className="text-xs text-[var(--gray-text-secondary)] dark:text-[var(--gray-dark-text-secondary)] mt-1">
            Press Esc to{" "}
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="underline text-[var(--blue-action)] cursor-pointer"
            >
              cancel
            </button>
          </p>
        </form> 
      )}

      {showLoadMoreButton && (
        <button
          onClick={handleLoadMoreReplies}
          disabled={isLoadingReplies}
          className={`${styles.feed__load_more_button} mt-2 flex items-center text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={`Load more replies for comment by ${comment.User.Username}`}
        >
          {isLoadingReplies ? (
            <button className="animate-spin mr-2">
              <FaSpinner className="text-white" />
            </button>
          ) : null}
          Load more replies
        </button>
      )}

      <ConfirmationModal
        isOpen={showDeleteCommentModal}
        entityType="comment"
        entityId={comment.CommentID}
        actionThunk={deleteCommentThunk}
        onClose={() => setShowDeleteCommentModal(false)}
      />
    </div>
  );
};

export default Comment;
