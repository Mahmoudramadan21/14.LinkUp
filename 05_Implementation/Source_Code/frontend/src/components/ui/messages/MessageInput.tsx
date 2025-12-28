'use client';

import { useRef, useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  sendMessageThunk,
  editMessageThunk,
} from '@/store/messageSlice';
import { FaPaperPlane, FaPlus, FaMicrophone, FaTimes } from 'react-icons/fa';
import { CornerDownLeft } from 'lucide-react';

import FileUploader from './FileUploader';
import VoiceRecorder from './VoiceRecorder';
import { useSendTypingStart, useSendTypingStop } from '@/socket/useAppSocket';

import styles from '@/app/(main)/messages/messages.module.css';

interface MessageInputProps {
  conversationId: string;
  editingMessage?: { id: string; content: string } | null;
  replyingTo?: { id: string; content: string; sender: string } | null;
  onEditCancel?: () => void;
  onReplyCancel?: () => void;
}

export default function MessageInput({
  conversationId,
  editingMessage,
  replyingTo,
  onEditCancel,
  onReplyCancel,
}: MessageInputProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const [showUploader, setShowUploader] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const isEditing = !!editingMessage;
  const isReplying = !!replyingTo;

  const loading = useSelector((state: RootState) =>
    isEditing
      ? state.message.loading.editMessage[editingMessage!.id] ?? false
      : state.message.loading.sendMessage
  );

  /* -------------------------------------------------------------------------- */
  /*                               Typing Indicators                            */
  /* -------------------------------------------------------------------------- */
  const sendTypingStart = useSendTypingStart();
  const sendTypingStop = useSendTypingStop();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleTypingChange = (value: string) => {
    setContent(value);

    if (!conversationId || !value.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStop(conversationId);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      sendTypingStart(conversationId);
    }, 300);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(conversationId);
    }, 3000);
  };

  /* -------------------------------------------------------------------------- */
  /*                            Sync Editing State                              */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (isEditing && editingMessage) {
      setContent(editingMessage.content);
      setAttachment(null);
      setAttachmentPreview(null);
    } else {
      setContent('');
    }
  }, [editingMessage, isEditing]);

  /* -------------------------------------------------------------------------- */
  /*                             Attachment Preview                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (attachment) {
      const url = URL.createObjectURL(attachment);
      setAttachmentPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAttachmentPreview(null);
    }
  }, [attachment]);

  /* -------------------------------------------------------------------------- */
  /*                                 Submit Handler                             */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed && !attachment) return;

    // ===== Edit Message =====
    if (isEditing && editingMessage) {
      dispatch(
        editMessageThunk({
          messageId: editingMessage.id,
          data: { content: trimmed },
        })
      ).then(() => {
        onEditCancel?.();
        setContent('');
      });
      return;
    }

    // ===== Send Message (Backend only) =====
    try {
      await dispatch(
        sendMessageThunk({
          conversationId,
          data: {
            content: trimmed || undefined,
            replyToId: replyingTo?.id,
          },
          attachment: attachment || undefined,
        })
      ).unwrap();

      // Clear UI after success
      setContent('');
      setAttachment(null);
      onReplyCancel?.();
      sendTypingStop(conversationId);
    } catch {
      console.error('Failed to send message');
    }
  };


  /* -------------------------------------------------------------------------- */
  /*                                 Cancel Handlers                            */
  /* -------------------------------------------------------------------------- */
  const cancelEdit = () => {
    onEditCancel?.();
    setContent('');
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const cancelReply = () => {
    onReplyCancel?.();
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Cleanup                                  */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                     Render                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <>
      <form onSubmit={handleSubmit} className={styles['messages__input_container']}>
        <div className={styles['messages__input_wrapper']}>

          {/* Attachment Preview */}
          {attachmentPreview && (
            <div className="relative mb-2 max-w-xs">
              {attachment?.type.startsWith('image/') ? (
                <img src={attachmentPreview} alt="Preview" className="max-h-48 rounded-lg" />
              ) : attachment?.type.startsWith('video/') ? (
                <video src={attachmentPreview} controls className="max-h-48 rounded-lg" />
              ) : (
                <div className="bg-[var(--section-bg)] border border-[var(--border-color)] rounded-lg p-3 flex items-center gap-3">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{attachment?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {(attachment!.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={removeAttachment}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <FaTimes size={14} />
              </button>
            </div>
          )}

          {/* Message Textarea */}
          <textarea
            value={content}
            onChange={(e) => handleTypingChange(e.target.value)}
            placeholder={
              isEditing
                ? 'Edit message...'
                : isReplying
                ? 'Reply to message...'
                : 'Type a message...'
            }
            className={`${styles['messages__input']} p-md ${isEditing || attachmentPreview ? 'pr-[160px]' : 'pr-[135px]'}`}
            rows={1}
            autoFocus
          />

          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Cancel Edit Button */}
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="p-sm text-[var(--text-muted)] hover:text-[var(--linkup-purple)] transition-colors"
                aria-label="Cancel editing"
              >
                <FaTimes size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="p-sm text-[var(--text-muted)] hover:text-[var(--linkup-purple)] transition-colors"
              aria-label="Attach file or media"
            >
              <FaPlus size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="p-sm text-[var(--text-muted)] hover:text-[var(--linkup-purple)] transition-colors"
              aria-label="Record voice message"
            >
              <FaMicrophone size={18} />
            </button>

            <button
              type="submit"
              disabled={loading || (!content.trim() && !attachment)}
              className={styles['messages__send_button']}
              aria-label={isEditing ? 'Update message' : 'Send message'}
            >
              <FaPaperPlane size={18} />
            </button>
          </div>
        </div>

        {/* Reply Preview */}
        {isReplying && replyingTo && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--section-bg)] rounded-lg mt-2 text-sm border border-[var(--border-color)]">
            <CornerDownLeft size={16} className="text-[var(--linkup-purple)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate">
                Replying to {replyingTo.sender}
              </p>
              <p className="text-[var(--text-muted)] truncate">{replyingTo.content || '[Attachment]'}</p>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
            >
              <FaTimes size={14} />
            </button>
          </div>
        )}

        {isEditing && (
          <div className="text-xs text-[var(--text-muted)] mt-1 px-2">
            Editing message...
          </div>
        )}
      </form>

      {/* Modals */}
      {showUploader && (
        <FileUploader 
          conversationId={conversationId}
          onClose={() => setShowUploader(false)}
        />
      )}

      {showVoiceRecorder && (
        <VoiceRecorder
          conversationId={conversationId}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </>
  );
}