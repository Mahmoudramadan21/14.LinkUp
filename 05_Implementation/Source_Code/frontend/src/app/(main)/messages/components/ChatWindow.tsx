// app/messages/components/ChatWindow.tsx
'use client';

import {
  useState,
  memo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import Link from 'next/link';
import { RootState, AppDispatch } from '@/store';
import { getMessagesThunk } from '@/store/messageSlice';
import { setIsMobileMessagesSidebarOpen } from '@/store/uiSlice'; // New import
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import styles from '../messages.module.css';
import { Menu } from 'lucide-react'; // New import for hamburger icon

/* -------------------------------------------------------------------------- */
/*                         Inline Skeleton Components                         */
/* -------------------------------------------------------------------------- */

/**
 * Renders pulsing skeleton bubbles alternating between received and sent.
 */
const MessageBubbleSkeleton = () => {
  const skeletons = Array.from({ length: 2 });

  return (
    <div className="flex flex-col gap-6">
      {skeletons.map((_, i) => {
        const isSent = i % 2 === 1;

        return (
          <div
            key={i}
            className={`flex items-start gap-3 animate-pulse ${
              isSent ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-neutral-gray shrink-0" />

            {/* Message block (header + bubble) */}
            <div
              className={`flex flex-col ${
                isSent ? 'items-end' : 'items-start'
              }`}
              style={{ maxWidth: '70%' }}
            >
              {/* ===== HEADER (username + date) ===== */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-20 rounded bg-neutral-gray" /> {/* username */}
                <div className="h-3 w-10 rounded bg-neutral-gray" /> {/* date */}
              </div>

              {/* ===== MESSAGE BUBBLE ===== */}
              <div
                className={`rounded-lg p-3 w-36 ${
                  isSent
                    ? 'bg-[var(--card-bg)] text-[var(--text-primary)] rounded-tr-none border border-[var(--border-color)]'
                    : 'bg-[var(--card-bg)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-color)]'
                }`}
              >
                <div className="h-3 w-full rounded bg-neutral-gray mb-2" />
                <div className="h-4 w-2/3 rounded bg-neutral-gray mt-2" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Typing Bubble Component                        */
/* -------------------------------------------------------------------------- */

const TypingBubble = memo(({ username, profilePicture }: { username: string; profilePicture?: string | null }) => {
  return (
    <div className="flex items-start gap-3 py-4">
      {/* Avatar */}
      <Image
        src={profilePicture || '/avatars/default-avatar.svg'}
        alt={`${username}'s avatar`}
        width={40}
        height={40}
        className="avatar--md"
        loading="lazy"
      />

      {/* Bubble with typing dots */}
      <div className="flex flex-col mt-auto">
        <div className="bg-[var(--card-bg)] text-[var(--text-primary)] rounded-lg rounded-tl-none border border-[var(--border-color)] p-3 inline-block">
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
});

TypingBubble.displayName = 'TypingBubble';

/**
 * Simple centered spinner used while loading older messages (infinite scroll).
 */
const InfiniteScrollLoader = () => (
  <div className="flex justify-center py-4">
    <div className="w-8 h-8 border-4 border-[var(--linkup-purple)] border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Renders a pulsing skeleton for the chat header during loading.
 */
const HeaderSkeleton = () => {
  return (
    <header className={`${styles['messages__chat_header']} animate-pulse`}>
      {/* Avatar skeleton */}
      <div className="w-10 h-10 rounded-full bg-neutral-gray shrink-0" />

      {/* Title skeleton */}
      <div className="h-5 w-32 rounded bg-neutral-gray" />
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/*                               ChatWindow Component                         */
/* -------------------------------------------------------------------------- */

const ChatWindow = memo(() => {

  /* --------------------------- Redux Hooks --------------------------- */
  const dispatch = useDispatch<AppDispatch>();
  const { currentConversationId, messagesByConversation } = useSelector(
    (state: RootState) => state.message
  );

  const loading = useSelector((state: RootState) =>
    currentConversationId
      ? state.message.loading.getMessages[currentConversationId] ?? false
      : false
  );

  const conversation = currentConversationId
    ? messagesByConversation[currentConversationId]
    : null;

  const participant = useSelector((state: RootState) =>
    state.message.conversations.find(
      (c) => c.conversationId === currentConversationId
    )?.otherParticipant
  );

  const typingIndicators = useSelector((state: RootState) =>
    currentConversationId
      ? state.message.typingIndicators[currentConversationId] ?? []
      : []
  );

  /* -------------------------- Local State -------------------------- */
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    sender: string;
  } | null>(null);

  /* --------------------------- Refs --------------------------- */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  /* ----------------------- Typing Indicator ----------------------- */
  const typingUsers = typingIndicators
    .filter((ind) => ind.isTyping)
    .map((ind) => ind.username);

  /* ----------------------- Helper Flags ----------------------- */
  const isInitialLoad = !conversation?.messages?.length && loading;
  const isInfiniteLoading = conversation?.hasMore && loading;

  /* ----------------------- Message Fetching ----------------------- */
  const fetchMessages = useCallback(
    (params: { limit: number; before?: string } = { limit: 30 }) => {
      if (currentConversationId) {
        dispatch(
          getMessagesThunk({
            conversationId: currentConversationId,
            params,
          })
        );
      }
    },
    [currentConversationId, dispatch]
  );


  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const offset = el.offsetTop - container.offsetTop - 100;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 2000);
    }
  }, []);


  /* Initial fetch when conversation is selected but empty */
  useEffect(() => {
    if (!conversation?.messages?.length) {
      fetchMessages();
    }
  }, [fetchMessages, conversation?.messages?.length]);

  /* --------------------- Infinite Scroll Observer --------------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          conversation?.hasMore &&
          !loading
        ) {
          const firstMessageId = conversation.messages[0]?.CreatedAt;
          prevMessagesLengthRef.current = conversation.messages.length;
          fetchMessages({ limit: 30, before: firstMessageId });
        }
      },
      { threshold: 0.1, rootMargin: '100px 0px 0px 0px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [conversation?.hasMore, loading, conversation?.messages, fetchMessages]);

  /* --------------------- Scroll Position Logic --------------------- */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentLength = conversation?.messages?.length ?? 0;

    // First load → scroll to bottom
    if (prevMessagesLengthRef.current === 0 && currentLength > 0) {
      container.scrollTop = container.scrollHeight;
    }
    // Loading older messages → maintain scroll position
    else if (currentLength > prevMessagesLengthRef.current) {
      if (isUserNearBottom(container)) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
}


    prevMessagesLengthRef.current = currentLength;
  }, [conversation?.messages]);

  const isUserNearBottom = useCallback((container: HTMLDivElement, threshold = 150) => {
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const hasTyping = typingUsers.length > 0;

    if (!hasTyping || !isUserNearBottom(container)) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [typingUsers, isUserNearBottom]);

  /* --------------------- Accessibility Focus --------------------- */
  useEffect(() => {
    messagesContainerRef.current?.focus();
  }, [currentConversationId]);

  /* --------------------------------------------------------------------- */
  /*                                 Render                                */
  /* --------------------------------------------------------------------- */

  /* Empty state – no conversation selected */
  if (!currentConversationId) {
    return (
      <section
        className={`${styles['messages__chat_window']} ${styles['messages__empty_state']}`}
        aria-live="polite"
        role="status"
      >
        <p className={styles['messages__empty_desc']}>
          Select a conversation to start chatting
        </p>
      </section>
    );
  }

  return (
    <section
      className={styles['messages__chat_window']}
      aria-labelledby="chat-header"
    >
      {/* -------------------------- Header -------------------------- */}
      {loading || !participant ? (
        <HeaderSkeleton />
      ) : (
        <header
          className={styles['messages__chat_header']}
          id="chat-header"
        >
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 focus-ring rounded-md"
            onClick={() => dispatch(setIsMobileMessagesSidebarOpen(true))}
            aria-label="Open conversations list"
          >
            <Menu size={24} className="text-[var(--text-primary)]" />
          </button>

          <Link href={`/${participant?.Username}`} title={`View ${participant?.Username}'s profile`}>
            <Image
              src={participant?.ProfilePicture || '/avatars/default-avatar.svg'}
              alt={`Profile picture of ${participant?.Username}`}
              width={40}
              height={40}
              className="avatar--md"
              loading="lazy"
            />
          </Link>

          <Link href={`/${participant?.Username}`} className={`${styles['messages__chat_title']}`}>
            {participant?.Username}
          </Link>
        </header>
      )}

      {/* ----------------------- Messages Area ----------------------- */}
      {isInitialLoad ? (
        /* ---- First load skeleton ---- */
        <div
          className={styles['messages__chat_messages']}
          role="log"
          aria-live="polite"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-2">
              <MessageBubbleSkeleton />
            </div>
          ))}
        </div>
      ) : (
        /* ---- Normal message list ---- */
        <div
          ref={messagesContainerRef}
          className={styles['messages__chat_messages']}
          role="log"
          aria-live="polite"
          tabIndex={-1}
        >
          {/* Infinite‑scroll loader (centered) */}
          {isInfiniteLoading && <InfiniteScrollLoader />}

          {/* Sentinel for IntersectionObserver */}
          {conversation?.hasMore && (
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          )}

          {/* Actual messages */}
          {conversation?.messages?.map((msg) => (
            <MessageBubble
              key={msg.LocalId || msg.Id}
              message={msg}
              onEditStart={(id, content) => {
                setEditingMessage({ id, content });
                setReplyingTo(null);
              }}
              onReplyStart={(id, content, sender) => {
                setReplyingTo({ id, content, sender });
                setEditingMessage(null);
              }}
              scrollToMessage={scrollToMessage}
            />
          ))}

          {/* ----------------------- Typing Indicator ----------------------- */}
          {typingUsers.length > 0 && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              {typingUsers.map((username) => (
                <TypingBubble
                  key={username}
                  username={username}
                  profilePicture={participant?.ProfilePicture}
                />
              ))}
            </div>
          )}

          {/* Anchor for scrolling to bottom */}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      )}

      {/* --------------------------- Input --------------------------- */}
      <MessageInput
        conversationId={currentConversationId}
        editingMessage={editingMessage}
        replyingTo={replyingTo}
        onEditCancel={() => setEditingMessage(null)}
        onReplyCancel={() => setReplyingTo(null)}
      />
    </section>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow;