'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import styles from '@/app/feed/feed.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  entityId: number | null;
  entityType: 'post' | 'story' | 'comment' | 'highlight' | 'removeStoryFromHighlight';
  onClose: () => void;
  actionThunk: (id: number) => any; 
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  entityId,
  entityType,
  onClose,
  actionThunk,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle action based on entity type
  const handleAction = useCallback(async () => {
    try {
      if (entityId) {
        await dispatch(actionThunk(entityId)).unwrap();
        onClose();
      }
    } catch (error) {
      console.error(`Failed to perform action on ${entityType}:`, error);
    }
  }, [dispatch, actionThunk, entityId, entityType, onClose]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation (e.g., Escape key)
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

  // Dynamic title and message based on entity type
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
          message: 'Are you sure you want to remove this story from the highlight? This action cannot be undone.',
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
      className={styles.feed__delete_modal_overlay}
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
            className={styles.feed__delete_button}
            aria-label={`Confirm ${entityType}`}
          >
            Confirm
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