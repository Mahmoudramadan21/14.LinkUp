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

const FeedPage: React.FC = () => {
  const {
    authLoading,
    followLoading,
    postLoading,
    postsLoading,
    authData,
    followRequests,
    posts,
    error,
    page,
    hasMore,
    fetchFollowRequests,
    fetchPosts,
    handleAcceptRequest,
    handleRejectRequest,
    handlePostSubmit,
    setAuthLoading,
  } = useAppStore();

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    console.log('Auth data check:', { authData, authLoading }); // Debug log
    if (!authData) {
      window.location.href = '/login';
    } else if (authLoading) {
      setAuthLoading(false); // Explicitly set authLoading to false when authData is valid
      fetchFollowRequests();
      fetchPosts();
    }
  }, [authLoading, authData, setAuthLoading]);

  useEffect(() => {
    if (page > 1 && !postsLoading) {
      fetchPosts();
    }
  }, [page]);

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
  }, [posts, postsLoading, hasMore]);

  useEffect(() => {
    console.log('Current state:', { posts, postsLoading, page, hasMore, authLoading, authData });
  }, [posts, postsLoading, page, hasMore, authLoading, authData]);

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
    <div className="feed-page-container" data-testid="feed-page">
      <HeaderSection />
      <div className="feed-page-main">
        <aside className="feed-page-sidebar">
          {followLoading ? (
            <Loading />
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
          <StoriesSection currentUserId={authData?.userId} token={token} user={user} /> {/* تمرير الـ Token */}
          {authData && (
            <CreatePost
              user={user}
              onPostSubmit={handlePostSubmit}
            />
          )}
          {postLoading && <Loading />}
          <div className="posts-list">
            {posts.length > 0 ? (
              posts.map((post, index) => (
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
          {postsLoading && <Loading />}
        </main>
        <aside className="feed-page-sidebar">
          <UserMenu user={user} onLogout={handleLogout} />
        </aside>
      </div>
    </div>
  );
};

export default FeedPage;