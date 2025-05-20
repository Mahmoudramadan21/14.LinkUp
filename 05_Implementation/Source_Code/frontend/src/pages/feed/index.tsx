'use client';
import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import HeaderSection from '@/components/Header';
import FollowRequests from '@/components/FollowRequests';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import Loading from '@/components/Loading';
import Avatar from '@/components/Avatar';
import CreateStories from '@/components/CreateStories';
import { Transition } from '@headlessui/react';
import api from '@/utils/api';
import { useAppStore } from '@/store/feedStore';
import { getAuthData, removeAuthData, getAccessToken } from '@/utils/auth';
import MainLayout from '@/layout/MainLayout';
import FollowRequestsLoading from '@/components/FollowRequestsLoading';
import PostCardLoading from '@/components/PostCardLoading';
import StoriesLoading from '@/components/StoriesLoading';
import { User, UserStory, StoryListItem, StoriesSectionUser } from '@/types';
import StoriesModal from '@/components/StoriesModal';

const FeedPage: React.FC = () => {
  const {
    authLoading,
    followLoading,
    postLoading,
    postsLoading,
    storiesLoading,
    authData,
    followRequests,
    posts,
    stories,
    error,
    storiesError,
    page,
    hasMore,
    fetchFollowRequests,
    fetchPosts,
    fetchStories,
    handleAcceptRequest,
    handleRejectRequest,
    handlePostSubmit,
    handlePostStory,
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

  // Handle story click
  const handleStoryClick = useCallback(
    (userIndex: number) => {
      if (userIndex === 0) {
        setIsCreateDialogOpen(true);
      } else if (userIndex > 0 && userIndex - 1 < userStories.length) {
        const userStory = userStories[userIndex - 1];
        if (userStory?.stories?.length > 0) {
          const firstUnviewedStory = userStory.stories.find((story) => !story.isViewed);
          const storyToSelect = firstUnviewedStory || userStory.stories[0];
          setSelectedStoryId(storyToSelect.storyId);
          setIsDialogOpen(true);
        }
      }
    },
    [userStories]
  );

  // Handle discard story
  const handleDiscardStory = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  // Close dialog on outside click
  const handleOverlayClick = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

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

  // Authentication and data fetching
  useEffect(() => {
    console.log('Auth data check:', { authData, authLoading });
    if (!authData) {
      window.location.href = '/login';
    } else if (authLoading) {
      setAuthLoading(false);
      fetchFollowRequests();
      fetchPosts();
      console.log('Fetching stories with token:', token ? 'Present' : 'Missing');
      if (token) {
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
  }, [posts, postsLoading, hasMore, page]);

  useEffect(() => {
    console.log('Current state:', { posts, postsLoading, stories, storiesLoading, page, hasMore, authLoading, authData });
  }, [posts, postsLoading, stories, storiesLoading, page, hasMore, authLoading, authData]);

  // Logout handler
  const handleLogout = useCallback(() => {
    removeAuthData();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  if (authLoading) {
    return <Loading aria-label="Loading feed content" />;
  }

  const user: User = authData
    ? {
        name: authData.profileName,
        username: authData.username,
        profilePicture: authData.profilePicture || '/avatars/placeholder.jpg',
      }
    : {
        name: 'Guest',
        username: 'guest',
        profilePicture: '/avatars/placeholder.jpg',
      };

  return (
    <MainLayout title="Feed | LinkUp">
      <div className="feed-page__container" data-testid="feed-page">
        <div className="feed-page__main">
          <aside className="feed-page__sidebar">
            {followLoading ? (
              <FollowRequestsLoading />
            ) : (
              <>
                <FollowRequests
                  initialData={{ count: followRequests.length, followRequests }}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
                {error && <p className="feed-page__error-message">{error}</p>}
              </>
            )}
          </aside>
          <main className="feed-page__content">
            {storiesLoading ? (
              <StoriesLoading title="Stories" />
            ) : storiesError ? (
              <div className="feed-page__stories-error" aria-live="polite">
                {storiesError}
              </div>
            ) : (
              <section
                className="feed-page__stories stories"
                data-testid="stories-section"
                role="region"
                aria-labelledby="stories-section-title"
                itemScope
                itemType="http://schema.org/CreativeWork"
              >
                <h2 id="stories-section-title" className="feed-page__stories-title stories__title">
                  Stories
                </h2>
                <div className="feed-page__stories-list stories__list">
                  {stories.length > 0 ? (
                    stories.map((story: StoryListItem, index: number) => (
                      <div
                        key={`${story.username}-${index}`}
                        onClick={() => handleStoryClick(index)}
                        className="feed-page__stories-item stories__item"
                        role="button"
                        aria-label={`View ${story.username}'s story`}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleStoryClick(index)}
                      >
                        <Avatar
                          imageSrc={story.imageSrc}
                          username={story.username}
                          size="medium"
                          showUsername={true}
                          hasUnviewedStories={story.hasUnviewedStories}
                          status={story.hasUnviewedStories ? 'Super Active' : ''}
                          hasPlus={story.hasPlus}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="feed-page__stories-empty" aria-live="polite">
                      No stories available
                    </p>
                  )}
                </div>
                {isDialogOpen && selectedStoryId !== null && (
                  <StoriesModal
                    stories={userStories}
                    initialStoryId={selectedStoryId}
                    currentUserId={authData?.userId || 0}
                    onClose={() => setIsDialogOpen(false)}
                    token={token}
                  />
                )}
                <Transition
                  show={isCreateDialogOpen}
                  enter="transition-opacity duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div
                    className="feed-page__stories-create-overlay"
                    onClick={handleOverlayClick}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create story dialog"
                  >
                    <div
                      className="feed-page__stories-create-dialog"
                      onClick={(e) => e.stopPropagation()}
                      ref={dialogRef}
                    >
                      <CreateStories user={user} onDiscard={handleDiscardStory} />
                    </div>
                  </div>
                </Transition>
              </section>
            )}
            {authData && (
              <CreatePost user={user} onPostSubmit={handlePostSubmit} />
            )}
            {postsLoading && (
              <div className="feed-page__posts-list">
                {[...Array(3)].map((_, index) => (
                  <PostCardLoading key={`loading-${index}`} />
                ))}
              </div>
            )}
            <div className="feed-page__posts-list">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.postId}>
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
                      onPostUpdate={useAppStore.getState().handlePostUpdate}
                    />
                  </div>
                ))
              ) : (
                !postsLoading && <p className="feed-page__posts-empty">No posts available</p>
              )}
            </div>
            {postLoading && <PostCardLoading />}
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default memo(FeedPage);