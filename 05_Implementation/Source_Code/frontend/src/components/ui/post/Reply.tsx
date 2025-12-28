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

import styles from "@/app/(main)/(feed-search)/feed/feed.module.css";
import { Comment as CommentType } from "@/types/post";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddCommentFormData, addCommentSchema } from "@/utils/validationSchemas";
import { editCommentThunk, deleteCommentThunk } from "@/store/postSlice";
import Link from "next/link";
import TruncatedText from "../common/TruncatedText";

/**
 * Props for the Reply component
 */
interface ReplyProps {
  reply: CommentType;
  likes: {
    onLike: () => Promise<void>;
    loading: boolean;
  };
}

/**
 * Single reply component (nested under a main comment)
 * Supports liking, editing, and deleting (owner only)
 */
const Reply: React.FC<ReplyProps> = ({ reply, likes }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.post);
  const dispatch = useDispatch<AppDispatch>();

  // UI State
  const menuRef = useRef<HTMLDivElement>(null);
  const [showReplyMenu, setShowReplyMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);

  // Edit Reply Form
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
      setEditValue("content", reply.Content);
    }
  }, [isEditing, reply.Content, setEditValue]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowReplyMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus/modals with Escape key
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

  // Submit edited reply
  const onSubmitEdit: SubmitHandler<AddCommentFormData> = async (data) => {
    await dispatch(editCommentThunk({ commentId: reply.CommentID, data })).unwrap();
    setIsEditing(false);
    resetEdit();
  };

  return (
    <div className={styles.feed__reply} aria-label={`Reply by ${reply.User.Username}`}>
      {/* Reply Header: Avatar, Username, Timestamp, Menu */}
      <div className={styles.feed__comment_header}>
        <Link href={`/${reply.User.Username}`}>
          <Image
            src={reply.User.ProfilePicture || "/avatars/default-avatar.svg"}
            alt={`${reply.User.Username}'s avatar`}
            width={24}
            height={24}
            className={styles.feed__comment_avatar}
            data-testid="reply-avatar"
          />
        </Link>

        <div>
          <Link href={`/${reply.User.Username}`} className={`${styles.feed__comment_username} hover:underline`}>
            {reply.User.Username}
          </Link>
          <p className={styles.feed__comment_timestamp}>
            {formatDistanceToNow(new Date(reply.CreatedAt), { addSuffix: true })}
          </p>
        </div>

        {/* Options menu (owner only) */}
        {reply.isMine && (
          <button
            onClick={() => setShowReplyMenu(true)}
            className={styles.feed__post_menu_button}
            aria-label="Reply options"
          >
            <FaEllipsisH />
          </button>
        )}

        {/* Dropdown menu */}
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

      {/* Reply Content */}
      {!isEditing && (
        <TruncatedText
          text={reply.Content}
          maxChars={150}
          className={styles.feed__comment_content}
        />
      )}

      {/* Like Action */}
      <div className={styles.feed__comment_actions}>
        <button
          onClick={likes.onLike}
          disabled={likes.loading}
          className={`${styles.feed__comment_action} ${
            reply.isLiked ? styles.feed__comment_action__liked : ""
          } ${likes.loading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={reply.isLiked ? "Unlike reply" : "Like reply"}
        >
          <div className={styles.feed__like_wrapper}>
            <HeartIcon className={`${reply.isLiked ? "text-[var(--error)] fill-[var(--error)]" : ""} w-4 h-4`} aria-hidden="true"/>
          </div>
          <span className="ml-1">{String(reply.likeCount ?? 0)}</span>
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleEditSubmit(onSubmitEdit)}
          className={`${styles.feed__reply_form} ${styles.feed__form_animate}`}
          aria-label="Edit reply form"
        >
          <Image
            src={user?.profilePicture || "/avatars/default-avatar.svg"}
            alt="Your avatar"
            width={40}
            height={40}
            className="avatar--md"
            style={{ width: "3rem", height: "3rem" }}
            data-testid="user-avatar"
          />

          <div className={styles.feed__comment_reply_wrapper}>
            <div className={styles.feed__reply_input_group}>
              <input
                {...registerEdit("content")}
                placeholder="Edit your reply..."
                className={styles.feed__reply_input}
                aria-invalid={editErrors.content ? "true" : "false"}
                aria-describedby={editErrors.content ? "edit-reply-error" : undefined}
              />
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className={`${styles.feed__reply_button} ${styles.feed__button_animate} ${
                  isSubmittingEdit ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Update reply"
              >
                {isSubmittingEdit ? <FaSpinner className="animate-spin" /> : "Update"}
              </button>
            </div>

            {editErrors.content && (
              <p id="edit-reply-error" className={styles.feed__reply_error}>
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

      {/* Delete Confirmation Modal */}
      {showDeleteReplyModal && (
        <ConfirmationModal
          isOpen={showDeleteReplyModal}
          entityType="comment"
          entityId={reply.CommentID}
          actionThunk={deleteCommentThunk}
          onClose={() => setShowDeleteReplyModal(false)}
          loadingState={loading.deleteComment}
        />
      )}
    </div>
  );
};

export default Reply;