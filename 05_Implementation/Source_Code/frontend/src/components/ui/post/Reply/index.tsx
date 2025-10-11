import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from '@/store';
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { FaHeart, FaEllipsisH, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import styles from "@/app/feed/feed.module.css";
import { Comment as CommentType } from "@/types/post";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCommentFormData, addCommentSchema } from "@/utils/validationSchemas";
import { editCommentThunk, deleteCommentThunk } from "@/store/postSlice";

interface ReplyProps {
  reply: CommentType;
  likes: {
    onLike: () => Promise<void>;
    loading: boolean;
  };
}
  const Reply: React.FC<ReplyProps> = ({ reply, likes }) => {
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showReplyMenu, setShowReplyMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);

  // Edit reply form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<AddCommentFormData>({
    resolver: zodResolver(addCommentSchema),
  });

  // Initialize edit form with current reply content
  useEffect(() => {
    if (isEditing) {
      setEditValue("content", reply.Content);
    }
  }, [isEditing, reply.Content, setEditValue]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowReplyMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle ESC key for closing modals and menus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowReplyMenu(false);
        setIsEditing(false);
        setShowDeleteReplyModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onSubmitEdit: SubmitHandler<AddCommentFormData> = async (data) => {
    try {
      await dispatch(editCommentThunk({ commentId: reply.CommentID, data })).unwrap();
      setIsEditing(false);
      resetEdit();
    } catch (error) {
      console.error("Failed to edit reply:", error);
    }
  };

  return (
    <div
      className={`${styles.feed__reply}`}
      aria-label={`Reply by ${reply.User.Username}`}
    >
      <div className={styles.feed__comment_header}>
        <Image
          src={reply.User.ProfilePicture || "/avatars/default-avatar.svg"}
          alt={`${reply.User.Username}'s avatar`}
          width={24}
          height={24}
          className={`${styles.feed__comment_avatar}`}
          data-testid="reply-avatar"
        />
        <div>
          <p className={`${styles.feed__comment_username}`}>
            {reply.User.Username}
          </p>
          <p className={`${styles.feed__comment_timestamp}`}>
            {formatDistanceToNow(new Date(reply.CreatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        {reply.isMine && (
          <button
            onClick={() => setShowReplyMenu(true)}
            className={`${styles.feed__post_menu_button}`}
            aria-label="Reply options"
          >
            <FaEllipsisH />
          </button>
        )}
        {showReplyMenu && (
          <div ref={menuRef} className={styles.feed__post_comment_menu}>
            <button
              onClick={() => {
                setIsEditing(true);
                setShowReplyMenu(false);
              }}
              className={styles.feed__post_menu_item}
              aria-label="Edit reply"
            >
              <FaEdit /> Edit
            </button>
            <button
              onClick={() => {
                setShowDeleteReplyModal(true);
                setShowReplyMenu(false);
              }}
              className={styles.feed__post_menu_item}
              aria-label="Delete reply"
            >
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>


      <p className={styles.feed__comment_content}>{reply.Content}</p>

      <div className={`${styles.feed__comment_actions}`}>
        <button
          onClick={likes.onLike}
          disabled={likes.loading}
          className={`${styles.feed__comment_action} ${
            reply.isLiked ? styles.feed__comment_action__liked : ""
          } ${likes.loading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={reply.isLiked ? "Unlike reply" : "Like reply"}
        >
          <div className={styles.feed__like_wrapper}>
            <FaHeart
              className={reply.isLiked ? "text-red-500" : ""}
              aria-hidden="true"
            />
          </div>
          <span className="ml-1">{String(reply.likeCount ?? 0)}</span>
        </button>
      </div>

      {isEditing && (
        <form
          onSubmit={handleEditSubmit(onSubmitEdit)}
          className={`${styles.feed__reply_form} ${styles.feed__form_animate} flex flex-col gap-2 w-full`}
          aria-label="Edit reply form"
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
            <div className={styles.feed__reply_input_group}>
              <input
                {...registerEdit("content")}
                defaultValue={reply.Content}
                placeholder="Edit your reply..."
                className={`${styles.feed__reply_input}`}
                aria-invalid={editErrors.content ? "true" : "false"}
                aria-describedby={editErrors.content ? "edit-reply-error" : undefined}
              />
              
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className={`${styles.feed__reply_button} ${styles.feed__button_animate} ${
                  isSubmittingEdit ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Submit edited reply"
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
              <p id="edit-reply-error" className={`${styles.feed__error}`}>
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

      <ConfirmationModal
        isOpen={showDeleteReplyModal}
        entityType="comment"
        entityId={reply.CommentID}
        actionThunk={deleteCommentThunk}
        onClose={() => setShowDeleteReplyModal(false)}
      />
    </div>
  );
};

export default Reply;
