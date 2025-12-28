'use client';

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Message } from '@/types/message';

import {
  CornerDownLeft,
  MoreHorizontal,
  Edit2,
  Trash2,
  FileText,
  Download,
  Play,
  Image as ImageIcon,
} from 'lucide-react';

import styles from '@/app/(main)/messages/messages.module.css';
import AudioPlayer from './AudioPlayer';
import MediaViewer from './MediaViewer';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import LinkPreview from './LinkPreview';
import { deleteMessageThunk } from '@/store/messageSlice';

/**
 * MessageBubble
 * Core message rendering component with full feature support.
 *
 * Features:
 * - Rich text with clickable URLs
 * - Image, Video, Voice, File attachments
 * - Story reply previews
 * - Reply-to-message preview with scroll-to
 * - Link preview (OpenGraph)
 * - Edit/Delete menu for message owner
 * - Full media lightbox (MediaViewer)
 * - Deleted message state
 * - Proper ARIA labels and keyboard navigation
 */
const MessageBubble = memo(
  ({
    message,
    onEditStart,
    onReplyStart,
    scrollToMessage,
  }: {
    message: Message;
    onEditStart: (id: string, content: string) => void;
    onReplyStart: (id: string, content: string, sender: string) => void;
    scrollToMessage: (id: string) => void;
  }) => {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const { loading } = useSelector((state: RootState) => state.message);
    const isOwner = user?.userId === message.Sender.UserID;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerMedia, setViewerMedia] = useState<any[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    const menuRef = useRef<HTMLDivElement>(null);

    /* -------------------------------------------------------------------------- */
    /*                               Utility Functions                            */
    /* -------------------------------------------------------------------------- */

    const extractFirstUrl = (text: string): string | null => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = text?.match(urlRegex);
      return matches ? matches[0] : null;
    };

    const renderMessageContent = (text: string) => {
      if (!text) return null;

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);

      return parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline break-all text-[var(--link-color)]"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      });
    };

    /* -------------------------------------------------------------------------- */
    /*                           Click Outside Menu Handler                       */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsMenuOpen(false);
        }
      };

      if (isMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    /* -------------------------------------------------------------------------- */
    /*                               Media Viewer Logic                           */
    /* -------------------------------------------------------------------------- */

    const openViewer = useCallback(
      (clickedAttachment: any, allAttachments: any[]) => {
        const mediaItems = allAttachments
          .filter((a) => ['IMAGE', 'VIDEO'].includes(a.Type))
          .map((a) => ({
            url: a.Url,
            type: a.Type as 'IMAGE' | 'VIDEO',
            alt: a.FileName ?? 'Media attachment',
            caption: message.Content,
          }));

        const index = mediaItems.findIndex((m) => m.url === clickedAttachment.Url);
        setViewerMedia(mediaItems);
        setViewerIndex(index >= 0 ? index : 0);
        setIsViewerOpen(true);
      },
      [message.Content]
    );

    /* -------------------------------------------------------------------------- */
    /*                               Story Navigation                             */
    /* -------------------------------------------------------------------------- */

    const goToStory = () => {
      if (!message.storyReference?.isExpired && message.storyReference?.storyId) {
        router.push(
          `/feed/stories/${message.storyReference.username}?storyId=${message.storyReference.storyId}`
        );
      }
    };

    /* -------------------------------------------------------------------------- */
    /*                             Replied Message Handler                        */
    /* -------------------------------------------------------------------------- */

    const handleReplyClick = () => {
      if (message.ReplyTo?.Id) {
        scrollToMessage(message.ReplyTo.Id);
      }
    };

    /* -------------------------------------------------------------------------- */
    /*                                 Deleted Message                            */
    /* -------------------------------------------------------------------------- */

    if (message.IsDeleted) {
      return (
        <article
          className={`${styles.message__group} ${isOwner ? styles['message--sent'] : styles['message--received']}`}
          id={`msg-${message.Id}`}
        >
          <div className={`${styles.message} ${isOwner ? styles['message--sent'] : styles['message--received']}`}>
            <Link href={`/${message.Sender.Username}`} prefetch={false}>
              <Image
                src={message.Sender.ProfilePicture || '/avatars/default-avatar.svg'}
                alt=""
                width={40}
                height={40}
                className={styles.message__avatar}
                loading="lazy"
              />
            </Link>

            <div className={styles.message__content}>
              <div className={`${styles.message__bubble} ${isOwner ? styles['message__bubble--sent'] : styles['message__bubble--received']}`}>
                <p className={styles.message__deleted}>This message was deleted</p>
              </div>
            </div>
          </div>
        </article>
      );
    }

    /* -------------------------------------------------------------------------- */
    /*                                     Render                                 */
    /* -------------------------------------------------------------------------- */

    return (
      <>
        <article
          className={`${styles.message__group} ${isOwner ? styles['message--sent'] : styles['message--received']} ${
            message.Attachments?.[0]?.Type === 'VOICE' ? styles['message--voice'] : ''
          }
          ${message.Status === "SENDING" ? styles['message--sending'] : ''}
          `}
          id={`msg-${message.Id}`}
          aria-labelledby={`msg-${message.Id}-header`}
        >
          {/* Main Message Row */}
          <div className={`${styles.message} ${isOwner ? styles['message--sent'] : styles['message--received']}`}>
            {/* Avatar */}
            <Link href={`/${message.Sender.Username}`} prefetch={false} className='h-fit'>
              <Image
                src={message.Sender.ProfilePicture || '/avatars/default-avatar.svg'}
                alt=""
                width={40}
                height={40}
                className={styles.message__avatar}
                loading="lazy"
              />
            </Link>

            {/* Message Content */}
            <div className={styles.message__content}>
              {/* Header: Username + Time */}
              <header
                id={`msg-${message.Id}-header`}
                className={`${styles.message__header} ${isOwner ? styles['message--sent'] : styles['message--received']}`}
              >
                <Link
                  href={`/${message.Sender.Username}`}
                  className={`${styles.message__username} hover:underline`}
                  prefetch={false}
                >
                  {message.Sender.Username}
                </Link>
                <time className={styles.message__timestamp}>
                  {format(new Date(message.CreatedAt), 'HH:mm')}
                </time>
              </header>

              {/* Story Reference Preview */}
              {message.storyReference && (
                <div
                  className={`${styles.message__story} ${
                    message.storyReference.isExpired ? styles['message__story--expired'] : ''
                  }`}
                  onClick={goToStory}
                  role={message.storyReference.isExpired ? undefined : 'button'}
                  tabIndex={message.storyReference.isExpired ? undefined : 0}
                  aria-label={message.storyReference.isExpired ? 'Expired story' : 'View story'}
                >
                  <div className="flex items-center gap-2">
                    {message.storyReference.mediaUrl ? (
                      message.storyReference.mediaUrl.endsWith('.mp4') ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black">
                          <video src={message.storyReference.mediaUrl} className="w-full h-full object-cover" muted loop />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play size={16} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={message.storyReference.mediaUrl}
                          alt="Story preview"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <ImageIcon size={20} className="text-white" />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {(() => {
                          const sender = message.Sender.Username;
                          const storyOwner = message.storyReference!.username;
                          const isMe = sender === user?.username;

                          if (isMe && storyOwner !== user?.username) return `You replied to ${storyOwner}'s story`;
                          if (!isMe && storyOwner === user?.username) return `${sender} replied to your story`;
                          if (!isMe && storyOwner !== user?.username) return `${sender} replied to ${storyOwner}'s story`;
                          return 'You replied to your story';
                        })()}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {message.storyReference.isExpired ? 'Expired' : 'Tap to view'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reply Preview */}
              {message.ReplyTo && (
                <div
                  className={styles.message__reply}
                  onClick={handleReplyClick}
                  role="button"
                  tabIndex={0}
                  aria-label="Scroll to replied message"
                >
                  <p className={styles.message__reply__sender}>
                    Replying to {isOwner ? "yourself" : "@" + message.Sender.Username}
                  </p>
                  <p className={styles.message__reply__text}>
                    {message.ReplyTo.Content || '[Attachment]'}
                  </p>
                </div>
              )}

              {/* Main Bubble */}
              <div className={`${styles.message__bubble} ${isOwner ? styles['message__bubble--sent'] : styles['message__bubble--received']}`}>
                {/* Text Content */}
                {message.Content && (
                  <p className={`${styles.message__text} break-words`}>
                    {renderMessageContent(message.Content)}
                  </p>
                )}

                {/* Link Preview */}
                {extractFirstUrl(message.Content || '') && (
                  <LinkPreview url={extractFirstUrl(message.Content || '')!} />
                )}

                {/* Attachments */}
                {message.Attachments?.length > 0 && (
                  <div className={styles.message__attachments}>
                    {message.Attachments.map((att) => (
                      <div key={att.Id}>
                        {att.Type === 'IMAGE' && (
                          <Image
                            src={att.Url}
                            alt={att.FileName ?? 'Image attachment'}
                            width={450}
                            height={250}
                            className={`${styles.message__image} cursor-pointer`}
                            onClick={() => openViewer(att, message.Attachments!)}
                          />
                        )}
                        {att.Type === 'VIDEO' && (
                          <video
                            src={att.Url}
                            className={`${styles.message__video} cursor-pointer`}
                            muted
                            loop
                            autoPlay
                            onClick={() => openViewer(att, message.Attachments!)}
                          />
                        )}
                        {att.Type === 'VOICE' && (
                          <AudioPlayer src={att.Url} isSending={message.Status === "SENDING"} theme={isOwner ? 'sent' : 'received'} />
                        )}
                        {att.Type === 'FILE' && (
                          <a
                            href={att.Url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.message__file}
                          >
                            <FileText size={18} />
                            <span className={styles.message__file__name}>{att.FileName}</span>
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta: Edited indicator */}
                <div className={`${styles.message__meta} ${isOwner ? styles['message__meta--sent'] : styles['message__meta--received']}`}>
                  {message.IsEdited && <span className="ml-1">edited</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {message.Status !== "SENDING" && (
            <div className={styles.message__actions}>
              <button
                className={`${styles.message__action} ${styles['message__action--reply']}`}
                onClick={() => onReplyStart(message.Id, message.Content || '', message.Sender.Username)}
                aria-label="Reply to this message"
              >
                <CornerDownLeft size={16} />
              </button>

              {isOwner && (
                <div className="relative" ref={menuRef}>
                  <button
                    className={styles.message__action}
                    onClick={() => setIsMenuOpen((v) => !v)}
                    aria-label="More options"
                    aria-expanded={isMenuOpen}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {isMenuOpen && (
                    <menu className={styles.message__menu}>
                      <button
                        className={styles.message__menu__item}
                        onClick={() => {
                          setIsMenuOpen(false);
                          onEditStart(message.Id, message.Content || '');
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className={`${styles.message__menu__item} ${styles['message__menu__item--danger']}`}
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </menu>
                  )}
                </div>
              )}
            </div>
          )}
        </article>

        {/* Media Lightbox */}
        {isViewerOpen && (
          <MediaViewer
            media={viewerMedia}
            initialIndex={viewerIndex}
            onClose={() => setIsViewerOpen(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <ConfirmationModal
            isOpen={showDeleteModal}
            entityId={message.Id}
            entityType="message"
            onClose={() => setShowDeleteModal(false)}
            actionThunk={() => deleteMessageThunk(message.Id)}
            loadingState={loading.deleteMessage[message.Id]}
          />
        )}
      </>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;