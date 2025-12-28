'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';

import { AppDispatch, RootState } from '@/store';
import { setIsMobileMessagesSidebarOpen } from '@/store/uiSlice';

import ConversationList from '@/components/ui/messages/ConversationList';

import styles from './messages.module.css';

/**
 * MessagesLayout
 * Root layout for the entire messages section (/messages)
 * Handles:
 * - Loading initial conversations
 * - Establishing real-time socket connection
 * - Mobile sidebar auto-open behavior when no chat is selected
 * - Rendering the conversation list sidebar + active chat area
 */
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();

  // UI state: controls mobile sidebar visibility
  const isMobileSidebarOpen = useSelector(
    (state: RootState) => state.ui.isMobileMessagesSidebarOpen
  );

  /* -------------------------------------------------------------------------- */
  /*                      Mobile UX: Auto-open Sidebar on Load                  */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const noActiveChat = !params?.id;

    // On mobile: if no chat is open, ensure sidebar is visible by default
    if (isMobile && noActiveChat && !isMobileSidebarOpen) {
      dispatch(setIsMobileMessagesSidebarOpen(true));
    }
  }, [dispatch, params?.id, isMobileSidebarOpen]);

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="bg-[var(--section-bg)]">
      {/* Accessible page title (hidden visually) */}
      <header className="sr-only">
        <h1>Messages</h1>
      </header>

      <div className={styles['messages__container']}>
        {/* Sidebar: List of conversations */}
        <ConversationList />

        {/* Main content: Active chat or empty state */}
        {children}
      </div>
    </div>
  );
}