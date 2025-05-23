'use client';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { PostModalProps } from '@/types';

// Lazy-load PostCard
const PostCard = dynamic(() => import('./PostCard'), { ssr: false });

/**
 * PostModal Component
 * Displays a post in a modal dialog with a blurred backdrop.
 * Supports closing via outside click, Escape key, or close button.
 */
const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, post, onPostUpdate }) => {
  const dialogRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Close modal on Escape key
  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Apply focus trap
  useFocusTrap(dialogRef);

  if (!isOpen) return null;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="post-modal__wrapper"
        onClose={onClose}
        open={isOpen}
      >
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="post-modal__backdrop"
            ref={backdropRef}
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            tabIndex={0}
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="post-modal__container">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className="post-modal__content"
              as="section"
              ref={dialogRef}
              aria-labelledby="post-modal-title"
              aria-modal="true"
              itemScope
              itemType="http://schema.org/SocialMediaPosting"
            >
              <h2 id="post-modal-title" className="sr-only">
                Post Details
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="post-modal__button--close"
                aria-label="Close post modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="post-modal__icon--close"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <PostCard
                postId={post.postId}
                userId={post.userId}
                username={post.username}
                profilePicture={post.profilePicture}
                privacy={post.privacy}
                content={post.content}
                imageUrl={post.imageUrl}
                videoUrl={post.videoUrl}
                createdAt={post.createdAt}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                isLiked={post.isLiked}
                likedBy={post.likedBy}
                comments={post.comments}
                onPostUpdate={onPostUpdate}
              />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

// Custom hook for focus trapping
function useFocusTrap(dialogRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialogRef]);
}

export default memo(PostModal);