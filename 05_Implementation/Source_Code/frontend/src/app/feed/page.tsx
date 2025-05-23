'use client';
import React, { memo } from 'react';
import HeaderSection from '@/components/Header';
import FollowRequests from '@/components/FollowRequests';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import Loading from '@/components/Loading';
import Avatar from '@/components/Avatar';
import CreateStories from '@/components/CreateStories';
import { Transition } from '@headlessui/react';
import { useAppStore } from '@/store/feedStore';
import MainLayout from '@/layout/MainLayout';
import FollowRequestsLoading from '@/components/FollowRequestsLoading';
import PostCardLoading from '@/components/PostCardLoading';
import StoriesLoading from '@/components/StoriesLoading';
import StoriesModal from '@/components/StoriesModal';
import { useFeed } from '@/hooks/useFeed';
import { handleStoryClick, handleDiscardStory, handleOverlayClick, getUserFromAuthData } from '@/utils/feedUtils';
import { StoryListItem } from '@/types';

const FeedPage: React.FC = () => {
  const {
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
  } = useFeed();

  const {
    followLoading,
    storiesLoading, // Added
    followRequests,
    posts,
    stories,
    error,
    storiesError,
    handleAcceptRequest,
    handleRejectRequest,
    handlePostSubmit,
  } = useAppStore();

  if (authLoading) {
    return <Loading aria-label="Loading feed content" />;
  }

  const user = getUserFromAuthData(authData);

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
                        onClick={() => handleStoryClick(index, userStories, setSelectedStoryId, setIsDialogOpen, setIsCreateDialogOpen)}
                        className="feed-page__stories-item stories__item"
                        role="button"
                        aria-label={`View ${story.username}'s story`}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleStoryClick(index, userStories, setSelectedStoryId, setIsDialogOpen, setIsCreateDialogOpen)}
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
                    onClick={() => handleOverlayClick(setIsCreateDialogOpen)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create story dialog"
                  >
                    <div
                      className="feed-page__stories-create-dialog"
                      onClick={(e) => e.stopPropagation()}
                      ref={dialogRef}
                    >
                      <CreateStories user={user} onDiscard={() => handleDiscardStory(setIsCreateDialogOpen)} />
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
            {postsLoading && <PostCardLoading />}
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default memo(FeedPage);