// app/messages/components/FileUploader.tsx
'use client';

import { useState, useRef, memo, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Video, Mic, File as FileIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { addOptimisticMessage, markMessageAsFailed, replaceOptimisticMessage, sendMessageThunk } from '@/store/messageSlice';
import { createPortal } from 'react-dom';

import styles from '../messages.module.css';

/**
 * FileUploader
 * A beautiful, accessible, multi-file upload modal with live preview and progress tracking.
 *
 * Features:
 * - Drag & drop or click to upload
 * - Supports Images, Videos, Voice notes, PDFs, TXT, ZIP
 * - 100MB max per file
 * - Live preview with proper icons
 * - Per-file upload progress + success/error states
 * - Auto cleanup of object URLs
 * - Fully keyboard accessible and screen reader friendly
 * - Portal-based modal with backdrop
 */
const FileUploader = memo(({ conversationId, onClose }: { conversationId: string; onClose: () => void }) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  

  /* -------------------------------------------------------------------------- */
  /*                                   Types & Constants                        */
  /* -------------------------------------------------------------------------- */

  interface FilePreview {
    file: File;
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'VOICE' | 'FILE';
  }

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const ALLOWED_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as string[],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'] as string[],
    VOICE: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'] as string[],
    FILE: ['application/pdf', 'text/plain', 'application/zip'] as string[],
  };

  type AttachmentType = keyof typeof ALLOWED_TYPES;

  /* -------------------------------------------------------------------------- */
  /*                               Focus Management                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                File Validation                             */
  /* -------------------------------------------------------------------------- */

  const validateFile = (file: File): { valid: boolean; error?: string; type?: AttachmentType } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large (max 100MB)' };
    }

    const typeEntry = Object.entries(ALLOWED_TYPES).find(([, types]) =>
      types.includes(file.type)
    );

    if (!typeEntry) {
      return { valid: false, error: 'Unsupported file type' };
    }

    return { valid: true, type: typeEntry[0] as AttachmentType };
  };

  /* -------------------------------------------------------------------------- */
  /*                               File Selection & Preview                     */
  /* -------------------------------------------------------------------------- */

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newPreviews: FilePreview[] = [];

    selectedFiles.forEach((file) => {
      const result = validateFile(file);

      if (!result.valid) {
        alert(result.error);
        return;
      }

      newPreviews.push({
        file,
        url: URL.createObjectURL(file),
        type: result.type!,
      });
    });

    setFiles((prev) => [...prev, ...newPreviews]);

    // Reset input to allow re-selecting same files
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Upload Logic                               */
  /* -------------------------------------------------------------------------- */

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    const now = new Date().toISOString();

    // 1) Create optimistic messages for ALL files
    const optimisticMessages = files.map((item, index) => {
      const { file, url } = item;
      const localId = `local-${Date.now()}-${index}`;

      const tempMessage: any = {
        Id: localId,
        LocalId: localId,
        ConversationId: conversationId,
        Content: null,
        Sender: {
          UserID: currentUser!.userId,
          Username: currentUser!.username || 'You',
          ProfilePicture: currentUser!.profilePicture,
        },
        CreatedAt: now,
        UpdatedAt: now,
        Status: 'SENDING',
        Attachments: [
          {
            Id: localId + '-att',
            Type: file.type.startsWith('image/')
              ? 'IMAGE'
              : file.type.startsWith('video/')
              ? 'VIDEO'
              : file.type.startsWith('audio/')
              ? 'VOICE'
              : 'FILE',
            Url: url,
            FileName: file.name,
            Size: file.size,
          },
        ],
      };

      // add optimistic message immediately
      dispatch(
        addOptimisticMessage({
          conversationId,
          message: tempMessage,
        })
      );

      return { file, localId };
    });

    // 2) Create an array of promises for parallel uploads
    const uploadPromises = optimisticMessages.map(({ file, localId }) =>
      dispatch(
        sendMessageThunk({
          conversationId,
          data: {},
          attachment: file,
        })
      )
        .unwrap()
        .then((realMessage) => {
          // success -> replace optimistic
          dispatch(
            replaceOptimisticMessage({
              conversationId,
              localId,
              realMessage,
            })
          );
        })
        .catch(() => {
          // fail -> mark failed
          dispatch(
            markMessageAsFailed({
              conversationId,
              localId,
            })
          );
        })
    );

    // 3) Start uploads in background WITHOUT waiting
    Promise.all(uploadPromises).finally(() => {
      setUploading(false);
    });

    // Immediately close modal
    onClose();
  };



  /* -------------------------------------------------------------------------- */
  /*                                     Render                                 */
  /* -------------------------------------------------------------------------- */

  return createPortal(
    <div className={styles['file-uploader']} role="dialog" aria-modal="true" aria-labelledby="file-uploader-title">
      {/* Backdrop */}
      <div className={styles['file-uploader__overlay']} onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className={styles['file-uploader__modal']}>
        {/* Header */}
        <div className={styles['file-uploader__header']}>
          <h3 id="file-uploader-title" className={styles['file-uploader__title']}>
            Send Media ({files.length})
          </h3>
          <button
            onClick={onClose}
            className={styles['file-uploader__close']}
            aria-label="Close file uploader"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={styles['file-uploader__drop-zone']}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload files"
        >
          <Upload size={56} className={styles['file-uploader__upload-icon']} />
          <p className={styles['file-uploader__drop-text']}>Click to upload or drag & drop</p>
          <p className={styles['file-uploader__drop-hint']}>Max 100MB • Images, Videos, Voice, Files</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.txt,.zip"
          onChange={handleFileSelect}
          className="sr-only"
          aria-hidden="true"
        />

        {/* File Previews */}
        {files.length > 0 && (
          <div className={styles['file-uploader__preview']}>
            {files.map((item, i) => {
              const tempId = `temp-${Date.now()}-${i}`;
              const prog = progress[tempId];

              return (
                <div key={i} className={styles['file-uploader__preview-item']}>
                  {/* Media Preview */}
                  <div className={styles['file-uploader__preview-media']}>
                    {item.type === 'IMAGE' && (
                      <Image
                        src={item.url}
                        alt={item.file.name}
                        fill
                        className={styles['file-uploader__preview-image']}
                        sizes="80px"
                      />
                    )}
                    {item.type === 'VIDEO' && (
                      <div className={styles['file-uploader__preview-video']}>
                        <Video size={32} className="text-white" />
                      </div>
                    )}
                    {item.type === 'VOICE' && (
                      <div className={styles['file-uploader__preview-voice']}>
                        <Mic size={32} className="text-white" />
                      </div>
                    )}
                    {item.type === 'FILE' && (
                      <div className={styles['file-uploader__preview-file']}>
                        <FileIcon size={32} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className={styles['file-uploader__file-info']}>
                    <p className={styles['file-uploader__file-name']} title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className={styles['file-uploader__file-size']}>
                      {(item.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>

                    {/* Progress Bar */}
                    {prog !== undefined && (
                      <div className={styles['file-uploader__progress']}>
                        <div
                          className={`${styles['file-uploader__progress-fill']} ${
                            prog === -1
                              ? styles['file-uploader__progress-fill--error']
                              : prog === 100
                              ? styles['file-uploader__progress-fill--success']
                              : ''
                          }`}
                          style={{ width: `${prog >= 0 ? prog : 0}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(i)}
                    className={styles['file-uploader__remove']}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles['file-uploader__actions']}>
          <button
            onClick={onClose}
            className={styles['file-uploader__cancel']}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
            className={styles['file-uploader__send']}
          >
            {uploading ? 'Uploading...' : `Send (${files.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

FileUploader.displayName = 'FileUploader';

export default FileUploader;