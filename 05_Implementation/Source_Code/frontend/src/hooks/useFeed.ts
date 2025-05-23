'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/feedStore';
import { getAccessToken } from '@/utils/auth';
import api from '@/utils/api';
import { UserStory } from '@/types';

export const useFeed = () => {
  const {
    authLoading,
    postsLoading,
    authData,
    page,
    hasMore,
    fetchFollowRequests,
    fetchPosts,
    fetchStories,
    setAuthLoading,
  } = useAppStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const token = authData?.accessToken || getAccessToken();

  // Fetch user stories for dialog
  useEffect(() => {
    const loadUserStories = async () => {
      if (!token) {
        setDialogError('No authentication token available');
        return;
      }
      try {
        const response = await api.get<UserStory[]>('/stories/feed', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched user stories:', response.data, 'Status:', response.status);
        setUserStories(response.data);
        setDialogError(null);
      } catch (err: any) {
        console.error('Failed to load user stories:', err.response?.data, err.response?.status);
        setDialogError(err.response?.data?.message || err.message || 'Failed to load stories');
      }
    };
    loadUserStories();
  }, [token]);

  // Authentication and data fetching
  useEffect(() => {
    console.log('Auth data check:', { authData, authLoading });
    if (!authData) {
      window.location.href = '/login';
      return;
    }
    if (authLoading) {
      setAuthLoading(false);
      fetchFollowRequests();
      fetchPosts();
      if (token) {
        console.log('Fetching stories with token:', token);
        fetchStories(token);
      }
    }
  }, [authLoading, authData, setAuthLoading, fetchFollowRequests, fetchPosts, fetchStories, token]);

  // Infinite scroll for posts
  useEffect(() => {
    if (page > 1 && !postsLoading) {
      fetchPosts();
    }
  }, [page, fetchPosts, postsLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !postsLoading) {
            console.log('Intersection detected, incrementing page to:', page + 1);
            useAppStore.setState((state) => ({ page: state.page + 1 }));
          }
        },
        { threshold: 1.0 }
      );

      const lastPost = document.querySelector('.feed-page__posts-list > div:last-child');
      if (lastPost && !postsLoading) {
        observerRef.current.observe(lastPost);
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [postsLoading, hasMore, page]);

  // Focus trap for create story dialog
  useEffect(() => {
    if (isCreateDialogOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
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
        if (e.key === 'Escape') {
          setIsCreateDialogOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isCreateDialogOpen]);

  return {
    authLoading,
    postsLoading,
    authData,
    token,
    isDialogOpen,
    setIsDialogOpen,
    selectedStoryId,
    setSelectedStoryId,
    userStories,
    dialogError,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    dialogRef,
    observerRef,
  };
};