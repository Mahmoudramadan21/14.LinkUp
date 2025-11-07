'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';

import { RootState, AppDispatch } from '@/store';
import { setCurrentConversationId } from '@/store/messageSlice';

import ChatWindow from '../components/ChatWindow';

/**
 * ChatPage - Dynamic route for individual conversations (/messages/[id])
 *
 * Responsibilities:
 * - Validate that the conversation ID from URL is valid and exists
 * - Set the current active conversation in Redux state
 * - Redirect to /messages if the conversation doesn't exist or ID is missing
 * - Render the full chat interface via ChatWindow component
 */
export default function ChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string | undefined;

  const { conversations, loading } = useSelector((state: RootState) => state.message);

  // Derived state
  const isLoadingConversations = loading.getConversations;
  const isLoadingMessages = conversationId ? loading.getMessages?.[conversationId] : false;
  const conversationExists = conversations.some((c) => c.conversationId === conversationId);

  /* -------------------------------------------------------------------------- */
  /*                          Validate Conversation & Redirect                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    // Case 1: No conversation ID in URL → redirect to main messages page
    if (!conversationId) {
      router.replace('/messages');
      return;
    }

    // Case 2: Valid ID → mark as current conversation
    dispatch(setCurrentConversationId(conversationId));

    // Case 3: Conversation loaded but doesn't exist → redirect to avoid broken state
    if (
      !isLoadingConversations &&
      !isLoadingMessages &&
      !conversationExists
    ) {
      router.replace('/messages');
    }
  }, [
    conversationId,
    conversationExists,
    dispatch,
    router,
    isLoadingConversations,
    isLoadingMessages,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  // ChatWindow handles its own loading/empty/error states
  return <ChatWindow />;
}