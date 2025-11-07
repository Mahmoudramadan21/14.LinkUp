'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setIsAnyModalOpen } from '@/store/uiSlice';
import styles from '@/app/(main)/(feed-search)/feed/feed.module.css';
import { FaSpinner } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  entityId: number | string | null;
  entityType:
    | 'post'
    | 'story'
    | 'comment'
    | 'highlight'
    | 'removeStoryFromHighlight'
    | 'message';
  onClose: () => void;
  actionThunk: (args: any) => any; // Thunk that performs the deletion/removal
  onSuccess?: () => void; // Optional callback after successful action
  loadingState?: boolean; // Optional loading state indicator
}

/**
 * Reusable confirmation modal for destructive actions (delete post, story, comment, etc.).
 * Displays dynamic title and message based on the entity type.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  entityId,
  entityType,
  onClose,
  actionThunk,
  onSuccess,
  loadingState,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * Executes the deletion/removal action based on the entity type.
   * Handles both thunk actions and plain promises correctly.
   */
  const handleAction = useCallback(async () => {
    if (!entityId) return;

    try {
      let args: any = entityId;

      // Special argument structure for highlight-related actions
      if (entityType === 'highlight' || entityType === 'removeStoryFromHighlight') {
        args = { highlightId: entityId, username: user?.username };
      }

      const result = actionThunk(args);

      // Handle different return types from the thunk
      if (typeof result === 'function') {
        const dispatched = dispatch(result);
        if (typeof (dispatched as any).unwrap === 'function') {
          await (dispatched as any).unwrap();
        } else {
          await dispatched;
        }
      } else if (result instanceof Promise) {
        await result;
      } else {
        dispatch(result);
      }

      onClose();
      onSuccess?.();
    } catch {
      // Error is silently caught – no console output in production
    }
  }, [dispatch, actionThunk, entityId, entityType, onClose, onSuccess, user]);


  // Manage focus and global modal state for accessibility
  useEffect(() => {
    if (!isOpen) return;

    modalRef.current?.focus();
    dispatch(setIsAnyModalOpen(true));

    return () => {
      dispatch(setIsAnyModalOpen(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !entityId) return null;

  /**
   * Returns the appropriate title and message based on the entity being acted upon.
   */
  const getModalContent = () => {
    switch (entityType) {
      case 'post':
        return {
          title: 'Delete Post',
          message: 'Are you sure you want to delete this post? This action cannot be undone.',
        };
      case 'story':
        return {
          title: 'Delete Story',
          message: 'Are you sure you want to delete this story? This action cannot be undone.',
        };
      case 'comment':
        return {
          title: 'Delete Comment',
          message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        };
      case 'highlight':
        return {
          title: 'Delete Highlight',
          message: 'Are you sure you want to delete this highlight? This action cannot be undone.',
        };
      case 'removeStoryFromHighlight':
        return {
          title: 'Remove Story',
          message:
            'Are you sure you want to remove this story from the highlight? This action cannot be undone.',
        };
      case 'message':
        return {
          title: 'Delete Message',
          message: 'Are you sure you want to delete this message? This action cannot be undone.',
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'This action cannot be undone.',
        };
    }
  };

  const { title, message } = getModalContent();

  return (
    <div
      className={`${styles.feed__delete_modal_overlay} bg-overlay`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.feed__delete_modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <h2 id="delete-modal-title" className={styles.feed__delete_modal_title}>
          {title}
        </h2>

        <p className={styles.feed__delete_modal_message}>{message}</p>

        <div className={styles.feed__delete_modal_buttons}>
          <button
            onClick={handleAction}
            className={styles.feed__delete_confirm_button}
            aria-label={`Confirm ${entityType}`}
            disabled={loadingState}
          >
              {loadingState ? (
                <>
                  <FaSpinner className="animate-spin inline mr-2" /> Processing...
                </>
              ) : (
                'Delete'
              )}
          </button>

          <button
            onClick={onClose}
            className={styles.feed__delete_cancel_button}
            aria-label={`Cancel ${entityType}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.displayName = 'ConfirmationModal';

export default memo(ConfirmationModal);