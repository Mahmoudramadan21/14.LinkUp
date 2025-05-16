'use client';
import React, { useEffect, useRef } from 'react';
import HeaderSection from '@/sections/HeaderSection';
import FollowRequests from '@/components/FollowRequests';
import CreatePost from '@/components/CreatePost';
import StoriesSection from '@/sections/StoriesSection';
import PostCard from '@/components/PostCard';
import Loading from '@/components/Loading';
import { useAppStore } from '@/store/feedStore';
import UserMenu from '@/components/UserMenu';
import { getAuthData, removeAuthData, getAccessToken } from '@/utils/auth';
import MainLayout from '@/layout/MainLayout';
import FollowRequestsLoading from '@/components/FollowRequestsLoading';
import PostCardLoading from '@/components/PostCardLoading';
import StoriesSectionLoading from '@/components/StoriesSectionLoading';

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

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    console.log('Auth data check:', { authData, authLoading });
    if (!authData) {
      window.location.href = '/login';
    } else if (authLoading) {
      setAuthLoading(false);
      fetchFollowRequests();
      fetchPosts();
      const token = authData.accessToken || getAccessToken();
      console.log('Fetching stories with token:', token ? 'Present' : 'Missing');
      if (token) {
        fetchStories(token);
      }
    }
  }, [authLoading, authData, setAuthLoading, fetchFollowRequests, fetchPosts, fetchStories]);

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

      const lastPost = document.querySelector('.posts-list > div:last-child');
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
  const handleLogout = () => {
    removeAuthData();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  const user = authData
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

  const token = authData?.accessToken || getAccessToken();

  return (
    <MainLayout title="Feed">
      <div className="feed-page-container" data-testid="feed-page">
        <div className="feed-page-main">
          <aside className="feed-page-sidebar">
            {followLoading ? (
              <FollowRequestsLoading />
            ) : (
              <>
                <FollowRequests
                  initialData={{ count: followRequests.length, followRequests }}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
                {error && <p className="error-message">{error}</p>}
              </>
            )}
          </aside>
          <main className="feed-page-content">
            {storiesLoading ? (
              <StoriesSectionLoading />
            ) : storiesError ? (
              <div className="stories-section__error" aria-live="polite">
                {storiesError}
              </div>
            ) : (
              <StoriesSection
                currentUserId={authData?.userId}
                token={token}
                user={user}
                stories={stories}
                onPostStory={handlePostStory}
              />
            )}
            {authData && (
              <CreatePost
                user={user}
                onPostSubmit={handlePostSubmit}
              />
            )}
            {postsLoading && (
              <div className="posts-list">
                {[...Array(3)].map((_, index) => (
                  <PostCardLoading key={`loading-${index}`} />
                ))}
              </div>
            )}
            <div className="posts-list">
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
                !postsLoading && <p>No posts available</p>
              )}
            </div>
            {postLoading && <PostCardLoading />}
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default FeedPage;