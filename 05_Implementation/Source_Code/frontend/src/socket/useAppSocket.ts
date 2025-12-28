'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';

import { AppDispatch, RootState } from '@/store';
import {
  receiveNewMessage,
  receiveMessageEdited,
  receiveMessageDeleted,
  receiveMessagesRead,
  receiveConversationCreated,
  receiveConversationsUpdated,
  receiveTyping,
  stopTypingDisplay,
} from '@/store/messageSlice';

import {
  receiveNewNotification,
  receiveUnreadCountUpdate,
  removeNotificationsByIds,
} from "@/store/notificationSlice";

/**
 * useAppSocket
 * Singleton WebSocket manager for real-time messaging + notifications features.
 *
 * Features:
 * - Singleton socket instance (no duplicates)
 * - Auto connect on authenticated user
 * - Full event handling for messages AND notifications
 * - Smart room join/leave when switching conversations
 * - Proper cleanup of typing timeouts & socket listeners
 * - Debounced typing:start emission
 */
export const useAppSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userId = useSelector((state: RootState) => state.auth.user?.userId);
  const currentConversationId = useSelector(
    (state: RootState) => state.message.currentConversationId
  );
  const typingIndicators = useSelector(
    (state: RootState) => state.message.typingIndicators
  );

  const prevConversationId = useRef<string | null>(null);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /* -------------------------------------------------------------------------- */
  /*                               Socket Singleton                                */
  /* -------------------------------------------------------------------------- */

  const socketRef = useRef<Socket | null>(null);

  const getSocket = useCallback((): Socket => {
    if (socketRef.current) return socketRef.current;

    const url = process.env.NEXT_PUBLIC_API_URL || "wss://api.linkup.com";

    const socket = io(url, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;
    return socket;
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                             Typing Timeout Management                            */
  /* -------------------------------------------------------------------------- */

  const clearTypingTimeout = useCallback(
    (conversationId: string, userId: number) => {
      const key = `${conversationId}:${userId}`;
      const timeoutId = typingTimeouts.current.get(key);
      if (timeoutId) {
        clearTimeout(timeoutId);
        typingTimeouts.current.delete(key);
      }
    },
    []
  );

  const clearAllTypingTimeouts = useCallback(() => {
    typingTimeouts.current.forEach((id) => clearTimeout(id));
    typingTimeouts.current.clear();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                         Main Socket Connection & Listeners                         */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.connect();

    /* ----------------------------- Messages Event Handlers ----------------------------- */

    const handleNewMessage = (data: any) => {
      dispatch(receiveNewMessage({ ...data, currentUserId: userId }));

      if (
        data.Sender.UserID !== userId &&
        currentConversationId === data.ConversationId
      ) {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit("messages:read", {
            conversationId: data.ConversationId,
            lastMessageId: data.Id,
          });
        }
      }
    };

    const handleMessageEdited = (data: any) => {
      dispatch(receiveMessageEdited(data));
    };

    const handleMessageDeleted = (data: any) => {
      dispatch(receiveMessageDeleted(data));
    };

    const handleMessagesRead = (data: any) => {
      dispatch(receiveMessagesRead(data));
    };

    const handleConversationCreated = (data: any) => {
      dispatch(receiveConversationCreated({ ...data, currentUserId: userId }));
    };

    const handleConversationsUpdated = (data: any) => {
      dispatch(receiveConversationsUpdated(data));
    };

    const handleTyping = (data: {
      conversationId: string;
      userId: number;
      username: string;
      isTyping: boolean;
    }) => {
      dispatch(receiveTyping(data));

      if (data.isTyping) {
        clearTypingTimeout(data.conversationId, data.userId);
        const timeoutId = setTimeout(() => {
          dispatch(
            stopTypingDisplay({
              conversationId: data.conversationId,
              userId: data.userId,
            })
          );
        }, 3000);
        typingTimeouts.current.set(
          `${data.conversationId}:${data.userId}`,
          timeoutId
        );
      } else {
        clearTypingTimeout(data.conversationId, data.userId);
      }
    };

    /* ----------------------------- Notifications Event Handlers ----------------------------- */

    const handleNewNotification = (data: any) => {
      dispatch(receiveNewNotification(data));
    };

    const handleDeletedNotifications = ({
      notificationIds,
    }: {
      notificationIds: number[];
    }) => {
      dispatch(removeNotificationsByIds({ notificationIds }));
    };

    const handleUnreadCountUpdate = (data: { count: number }) => {
      dispatch(receiveUnreadCountUpdate({ count: data.count }));
    };

    /* ------------------------------- Listeners ------------------------------- */

    // Messages Events
    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleMessageEdited);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("messages:read", handleMessagesRead);
    socket.on("conversation:created", handleConversationCreated);
    socket.on("conversations:updated", handleConversationsUpdated);
    socket.on("typing", handleTyping);

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:deleted", handleDeletedNotifications);
    socket.on("unreadNotificationsCount", handleUnreadCountUpdate);

    // Connection Events
    socket.on("connect", () =>
      console.log("%cWebSocket connected", "color: #34d399")
    );
    socket.on("disconnect", (reason) =>
      console.warn("WebSocket disconnected:", reason)
    );
    socket.on("connect_error", () => console.error("WebSocket error"));

    /* -------------------------------- Cleanup -------------------------------- */

    return () => {
      // Messages Listeners
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleMessageEdited);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("messages:read", handleMessagesRead);
      socket.off("conversation:created", handleConversationCreated);
      socket.off("conversations:updated", handleConversationsUpdated);
      socket.off("typing", handleTyping);

      // Notifications Listeners
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:deleted", handleDeletedNotifications);
      socket.off("unreadNotificationsCount", handleUnreadCountUpdate);

      clearAllTypingTimeouts();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, dispatch, clearTypingTimeout, clearAllTypingTimeouts, getSocket]);

  /* -------------------------------------------------------------------------- */
  /*                               Room Join / Leave                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!currentConversationId || !userId) return;

    const socket = getSocket();
    const room = `conversation:${currentConversationId}`;

    const joinRoom = () => {
      if (!socket.connected) return;

      // Leave previous room
      if (
        prevConversationId.current &&
        prevConversationId.current !== currentConversationId
      ) {
        const prevRoom = `conversation:${prevConversationId.current}`;
        socket.emit("conversation:leave", prevRoom);

        // Clear typing indicators of previous conversation
        const oldIndicators =
          typingIndicators[prevConversationId.current] || [];
        oldIndicators.forEach(({ userId }) => {
          clearTypingTimeout(prevConversationId.current!, userId);
          dispatch(
            stopTypingDisplay({
              conversationId: prevConversationId.current!,
              userId,
            })
          );
        });
      }

      socket.emit("conversation:join", room);
      prevConversationId.current = currentConversationId;
    };

    if (socket.connected) {
      joinRoom();
    }

    const handleConnect = () => joinRoom();
    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      if (socket.connected) {
        socket.emit("conversation:leave", room);
      }
    };
  }, [
    currentConversationId,
    userId,
    dispatch,
    clearTypingTimeout,
    typingIndicators,
    getSocket,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                     Mark Messages as Read when Opening Chat                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!currentConversationId || !userId) return;

    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit("messages:read", {
      conversationId: currentConversationId,
    });
  }, [currentConversationId, userId, getSocket]);

  /* -------------------------------------------------------------------------- */
  /*                               Final Cleanup                                    */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    return () => clearAllTypingTimeouts();
  }, [clearAllTypingTimeouts]);
};

/* -------------------------------------------------------------------------- */
/*                            Typing Emit Hooks (Reusable)                           */
/* -------------------------------------------------------------------------- */

/**
 * Emits typing:start with 1-second rate limiting per conversation
 */
export const useSendTypingStart = () => {
  const lastEmitRef = useRef<Record<string, number>>({});

  return useCallback((conversationId: string) => {
    const socket = (globalThis as any).socketRef?.current || null;
    if (!socket?.connected || !conversationId) return;

    const now = Date.now();
    const last = lastEmitRef.current[conversationId] || 0;

    if (now - last < 1000) return; // Max 1 emit per second

    socket.emit('typing:start', { conversationId });
    lastEmitRef.current[conversationId] = now;
  }, []);
};

/**
 * Emits typing:stop immediately
 */
export const useSendTypingStop = () => {
  return useCallback((conversationId: string) => {
    const socket = (globalThis as any).socketRef?.current || null;
    if (!socket?.connected || !conversationId) return;

    socket.emit('typing:stop', { conversationId });
  }, []);
};