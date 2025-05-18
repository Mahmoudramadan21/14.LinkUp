'use client';
import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import MainLayout from '@/layout/MainLayout';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import FollowerFollowingDialog from '@/components/FollowerFollowingDialog';
import PostCard from '@/components/PostCard';
import Bio from '@/components/Bio';
import PostModal from '@/components/PostModal';
import PrivateAccountNotice from '@/components/PrivateAccountNotice';
import PostCardLoading from '@/components/PostCardLoading';
import StoriesSectionLoading from '@/components/StoriesSectionLoading';
import { handleAddHighlightSubmit } from '@/utils/profileUtils';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStore } from '@/store/profileStore';
import { Comment } from '@/types';

/*
 * ProfilePage Component
 * Displays a user profile with tabs for posts, saved posts, and highlights.
 * Optimized for SEO with semantic HTML and for accessibility with ARIA attributes.
 */
const ProfilePage: React.FC = () => {
  const {
    profile,
    authData,
    loading,
    error,
    hasInitiallyLoaded,
    activeTab,
    setActiveTab,
    isDialogOpen,
    dialogType,
    dialogData,
    fetchingDialogData,
    dialogError,
    isFollowingLoading,
    isAddHighlightDialogOpen,
    highlightTitle,
    setHighlightTitle,
    step,
    setStep,
    userStories,
    selectedStories,
    coverImage,
    selectedPost,
    isModalOpen,
    handleEditProfile,
    handleFollow,
    handleUnfollow,
    handleMessage,
    handleOpenDialog,
    handleCloseDialog,
    handleViewHighlights,
    handleAddHighlight,
    handleNextStep,
    handleStorySelect,
    handleCoverImageChange,
    handleDialogClick,
    handleOpenPostModal,
    handleCloseModal,
  } = useProfile();

  const { highlights, savedPosts, posts, highlightsLoading, highlightsError, savedPostsLoading, savedPostsError, postsLoading, postsError } = useProfileStore();

  // Handle post updates
  const handlePostUpdate = useCallback((postId: number, updatedFields: any) => {
    useProfileStore.setState((state) => ({
      posts: state.posts.map((post) =>
        post.postId === postId ? { ...post, ...updatedFields } : post
      ),
    }));
  }, []);

  // Rendering
  console.log('Loading state:', loading, 'Error:', error, 'Profile:', profile, 'HasInitiallyLoaded:', hasInitiallyLoaded);

  if (loading || !hasInitiallyLoaded) {
    return <Loading aria-label="Loading profile data" />;
  }

  if (error) {
    return (
      <MainLayout title="Profile Error">
        <main className="profile-page__error" role="alert" aria-live="polite">
          <p className="profile-page__error-text">
            {error.includes('not found') ? 'Profile not found' : `Error: ${error}`}
          </p>
        </main>
      </MainLayout>
    );
  }

  if (!profile) {
    console.error('Unexpected state: profile is null after successful fetch');
    return (
      <MainLayout title="Profile Error">
        <main className="profile-page__error" role="alert" aria-live="polite">
          <p className="profile-page__error-text">Unexpected error: Profile data missing</p>
        </main>
      </MainLayout>
    );
  }

  const isOwnProfile = authData?.userId === profile.userId;

  return (
    <MainLayout title={`LinkUp | ${profile.username}`}>
      <div className="profile-page__container">
        {/* Profile Header */}
        <header className="profile-page__header">
          <div className="profile-page__cover">
            <Image
              src={profile.coverPicture || '/cover-photos/sunset.jpg'}
              alt={`${profile.username}'s cover photo`}
              fill
              sizes="100vw"
              priority
              className="profile-page__cover-image"
              loading="eager"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/cover-photos/default.jpg';
              }}
            />
            {isOwnProfile && (
              <button
                onClick={handleEditProfile}
                className="profile-page__edit-btn"
                aria-label={`Edit ${profile.username}'s profile`}
              >
                Edit Profile
              </button>
            )}
            <div className="profile-page__info">
              <div className="profile-page__profile-pic">
                <Image
                  src={profile.profilePicture || '/avatars/placeholder.jpg'}
                  alt={`${profile.username}'s profile picture`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="profile-page__profile-image"
                  loading="eager"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/avatars/default.jpg';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Profile Details and Stats */}
          <div className="profile-page__content">
            <div className="profile-page__details">
              <h1 className="profile-page__name">{profile.profileName}</h1>
              <p className="profile-page__username">@{profile.username}</p>
            </div>

            <div className="profile-page__stats">
              <div className="profile-page__stat--item">
                <span className="profile-page__stat-label">Posts</span>
                <span className="profile-page__stat-value">{profile.postCount}</span>
              </div>
              <div className="profile-page__stat--item">
                <span className="profile-page__stat-label">Followers</span>
                <button
                  type="button"
                  className="profile-page__stat-value"
                  onClick={() => handleOpenDialog('followers')}
                  aria-label={`View ${profile.followerCount} followers`}
                >
                  {profile.followerCount}
                </button>
              </div>
              <div className="profile-page__stat--item">
                <span className="profile-page__stat-label">Following</span>
                <button
                  type="button"
                  className="profile-page__stat-value"
                  onClick={() => handleOpenDialog('following')}
                  aria-label={`View ${profile.followingCount} following`}
                >
                  {profile.followingCount}
                </button>
              </div>
              <div className="profile-page__stat--item">
                <span className="profile-page__stat-label">Likes</span>
                <span className="profile-page__stat-value">{profile.likeCount}</span>
              </div>
            </div>

            {/* Follow and Message Buttons */}
            {!isOwnProfile && (
              <div className="profile-page__actions">
                <Button
                  onClick={profile.isFollowing || profile.followStatus === 'PENDING' ? handleUnfollow : handleFollow}
                  variant="primary"
                  size="medium"
                  disabled={isFollowingLoading}
                  aria-label={
                    profile.isFollowing
                      ? `Unfollow ${profile.username}`
                      : profile.followStatus === 'PENDING'
                      ? `Follow request pending for ${profile.username}`
                      : `Follow ${profile.username}`
                  }
                >
                  {isFollowingLoading
                    ? 'Processing...'
                    : profile.isFollowing
                    ? 'Unfollow'
                    : profile.followStatus === 'PENDING'
                    ? 'Pending'
                    : 'Follow'}
                </Button>
                <Button
                  onClick={handleMessage}
                  variant="secondary"
                  size="medium"
                  aria-label={`Message ${profile.username}`}
                  className="profile-page__message-btn"
                >
                  <Image
                    src="/icons/message.svg"
                    alt="Message icon"
                    width={24}
                    height={24}
                    className="profile-page__message-icon"
                  />
                </Button>
              </div>
            )}
          </div>

          {/* Highlights Section */}
          {(!profile.isPrivate || isOwnProfile) && (
            <section className="profile-page__highlights" aria-labelledby="highlights-title">
              {highlightsLoading ? (
                <StoriesSectionLoading title="Highlights" />
              ) : highlightsError ? (
                <p className="profile-page__highlights-error">{highlightsError}</p>
              ) : highlights.length === 0 && !isOwnProfile ? (
                <p className="profile-page__highlights-empty">No highlights available</p>
              ) : (
                <>
                  <h2 id="highlights-title" className="profile-page__highlights-title">
                    Highlights
                  </h2>
                  <div className="profile-page__highlights-list">
                    {isOwnProfile && (
                      <button
                        onClick={handleAddHighlight}
                        className="profile-page__highlight-item"
                        aria-label="Add a new highlight"
                      >
                        <div className="profile-page__highlight-add">
                          <Image
                            src="/icons/plus.svg"
                            alt="Add new highlight icon"
                            width={40}
                            height={40}
                            className="profile-page__highlight-add-icon"
                          />
                        </div>
                        <p className="profile-page__highlight-title">Add Highlight</p>
                      </button>
                    )}
                    {highlights.length === 0 && isOwnProfile ? (
                      <p className="profile-page__highlights-empty">No highlights yet. Add one!</p>
                    ) : (
                      highlights.map((highlight) => (
                        <div
                          key={highlight.highlightId}
                          className="profile-page__highlight-item"
                          onClick={() => handleViewHighlights(profile.userId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleViewHighlights(profile.userId)}
                          aria-label={`View ${highlight.title} highlight`}
                        >
                          <div className="profile-page__highlight-image">
                            <Image
                              src={highlight.coverImage}
                              alt={`${highlight.title} highlight`}
                              width={80}
                              height={80}
                              sizes="80px"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/highlights/default.jpg';
                              }}
                            />
                          </div>
                          <p className="profile-page__highlight-title">{highlight.title}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Tabs Navigation */}
          <nav className="profile-page__tabs" aria-label="Profile content tabs">
            <button
              onClick={() => setActiveTab('menu')}
              className={`profile-page__tab-btn ${activeTab === 'menu' ? 'profile-page__tab-btn--active' : ''}`}
              aria-label="View posts"
              aria-current={activeTab === 'menu' ? 'true' : undefined}
            >
              <Image
                src={activeTab === 'menu' ? '/icons/menu-active.svg' : '/icons/menu.svg'}
                alt="Posts tab icon"
                width={24}
                height={24}
                className="profile-page__tab-icon"
              />
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`profile-page__tab-btn ${activeTab === 'saved' ? 'profile-page__tab-btn--active' : ''}`}
                aria-label="View saved posts"
                aria-current={activeTab === 'saved' ? 'true' : undefined}
              >
                <Image
                  src={activeTab === 'saved' ? '/icons/saved.svg' : '/icons/save.svg'}
                  alt="Saved posts tab icon"
                  width={24}
                  height={24}
                  className="profile-page__tab-icon"
                />
              </button>
            )}
          </nav>
        </header>

        {/* Posts Section */}
        {activeTab === 'menu' && (
          <section className="profile-page__posts-section" aria-labelledby="posts-title">
            <Bio
              bio={profile.bio || ''}
              jobTitle={profile.jobTitle || ''}
              address={profile.address || ''}
              dateOfBirth={profile.dateOfBirth || '1970-01-01T00:00:00.000Z'}
            />

            {profile.isPrivate && !isOwnProfile && profile.followStatus !== 'ACCEPTED' ? (
              <PrivateAccountNotice />
            ) : (
              <article className="profile-page__posts-list">
                {postsLoading ? (
                  <div className="posts-list">
                    {[...Array(3)].map((_, index) => (
                      <PostCardLoading key={`loading-${index}`} />
                    ))}
                  </div>
                ) : postsError ? (
                  <p className="profile-page__posts-error">{postsError}</p>
                ) : !posts || posts.length === 0 ? (
                  <p className="profile-page__posts-empty">No posts available</p>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.postId}
                      postId={post.postId}
                      userId={post.user.UserID}
                      username={post.user.Username}
                      profilePicture={post.user.ProfilePicture}
                      privacy={profile.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                      content={post.content}
                      imageUrl={post.imageUrl}
                      videoUrl={post.videoUrl}
                      createdAt={post.createdAt}
                      likeCount={post.likeCount}
                      commentCount={post.commentCount}
                      isLiked={false}
                      likedBy={[]}
                      comments={[]}
                      onPostUpdate={handlePostUpdate}
                    />
                  ))
                )}
              </article>
            )}
          </section>
        )}

        {/* Saved Posts Section */}
        {activeTab === 'saved' && isOwnProfile && (
          <section className="profile-page__saved-posts" aria-labelledby="saved-posts-title">
            <h2 id="saved-posts-title" className="profile-page__saved-posts-title">
              Saved Posts
            </h2>
            {savedPostsLoading ? (
              <Loading />
            ) : savedPostsError ? (
              <p className="profile-page__saved-posts-error">{savedPostsError}</p>
            ) : !savedPosts || savedPosts.length === 0 ? (
              <p className="profile-page__saved-posts-empty">No saved posts available</p>
            ) : (
              <div className="profile-page__saved-posts-grid">
                {Array.isArray(savedPosts) ? (
                  savedPosts.map((savedPost) => (
                    <div
                      key={savedPost.PostID}
                      className="profile-page__saved-post-item"
                      onClick={() => handleOpenPostModal(savedPost)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenPostModal(savedPost)}
                      aria-label={`View saved post ${savedPost.PostID}`}
                    >
                      <Image
                        src={savedPost.ImageURL || savedPost.VideoURL || '/saved-posts/default.jpg'}
                        alt={`Saved post ${savedPost.PostID}`}
                        width={200}
                        height={200}
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="profile-page__saved-post-image"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/saved-posts/default.jpg';
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="profile-page__saved-posts-error">Invalid saved posts data</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Post Modal */}
        {selectedPost && (
          <PostModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            post={selectedPost}
            onPostUpdate={handlePostUpdate}
          />
        )}

        {/* Followers/Following Dialog */}
        {(!profile.isPrivate || isOwnProfile || profile.followStatus === 'ACCEPTED') && (
          <FollowerFollowingDialog
            isOpen={isDialogOpen}
            onClose={handleCloseDialog}
            userId={profile.userId}
            type={dialogType}
            showSearch={true}
            showRemove={isOwnProfile}
            data={dialogData}
            loading={fetchingDialogData}
            error={dialogError}
          />
        )}

        {/* Highlight Creation Dialog */}
        {isAddHighlightDialogOpen && (
          <div
            className="profile-page__highlight-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="highlight-dialog-title"
            onClick={handleDialogClick}
          >
            <div className="profile-page__highlight-dialog-content">
              {step === 1 && (
                <>
                  <h2 id="highlight-dialog-title" className="profile-page__highlight-dialog-title">
                    Create Highlight
                  </h2>
                  <label htmlFor="highlight-title" className="profile-page__highlight-dialog-label">
                    Highlight Title
                  </label>
                  <input
                    id="highlight-title"
                    type="text"
                    value={highlightTitle}
                    onChange={(e) => setHighlightTitle(e.target.value)}
                    placeholder="Enter highlight title"
                    className="profile-page__highlight-dialog-input"
                  />
                  <div className="profile-page__highlight-dialog-actions">
                    <Button
                      onClick={() => setIsAddHighlightDialogOpen(false)}
                      variant="secondary"
                      size="medium"
                      aria-label="Cancel highlight creation"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      variant="primary"
                      size="medium"
                      disabled={!highlightTitle.trim()}
                      aria-label="Proceed to select stories"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 id="highlight-dialog-title" className="profile-page__highlight-dialog-title">
                    Select Stories and Cover
                  </h2>
                  <div className="profile-page__highlight-dialog-stories">
                    {userStories.length > 0 ? (
                      userStories.map((story) => {
                        const storyDate = new Date(story.createdAt);
                        const day = storyDate.getDate();
                        const formattedDate = storyDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                        const isSelected = selectedStories.includes(story.storyId);
                        return (
                          <div key={story.storyId} className="profile-page__highlight-story">
                            <div className="profile-page__highlight-story-container">
                              <div className="profile-page__highlight-story-gradient">
                                <div className="profile-page__highlight-story-content">
                                  <label className="profile-page__highlight-story-label">
                                    <Image
                                      src={story.mediaUrl}
                                      alt={`Story ${story.storyId}`}
                                      fill
                                      sizes="100px"
                                      className="profile-page__highlight-story-image"
                                      loading="lazy"
                                    />
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleStorySelect(story.storyId)}
                                      className="profile-page__highlight-story-checkbox"
                                      aria-label={`Select story from ${formattedDate}`}
                                    />
                                    {isSelected && (
                                      <div className="profile-page__highlight-story-overlay" />
                                    )}
                                    <div className="profile-page__highlight-story-checkbox-indicator">
                                      <Image
                                        src={isSelected ? '/icons/check-circle.svg' : '/icons/circle.svg'}
                                        alt={isSelected ? 'Selected' : 'Not selected'}
                                        width={20}
                                        height={20}
                                        className="profile-page__highlight-story-checkbox-icon"
                                      />
                                    </div>
                                    <div className="profile-page__highlight-story-day">
                                      <span className="profile-page__highlight-story-day-text">{day}</span>
                                    </div>
                                    <div className="profile-page__highlight-story-date">
                                      {formattedDate}
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="profile-page__highlight-dialog-empty">No stories available.</p>
                    )}
                  </div>
                  <div className="profile-page__highlight-dialog-cover">
                    <h3 className="profile-page__highlight-dialog-cover-title">Upload Cover Image (Optional)</h3>
                    <label className="profile-page__highlight-dialog-cover-label">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverImageChange}
                        className="profile-page__highlight-dialog-cover-input"
                      />
                      <span className="profile-page__highlight-dialog-cover-text">
                        <Image
                          src="/icons/upload.svg"
                          alt="Upload icon"
                          width={24}
                          height={24}
                          className="profile-page__highlight-dialog-cover-icon"
                        />
                        Choose Image
                      </span>
                    </label>
                    {coverImage && (
                      <div className="profile-page__highlight-dialog-cover-preview">
                        <Image
                          src={URL.createObjectURL(coverImage)}
                          alt="Cover preview"
                          width={120}
                          height={120}
                          sizes="120px"
                          className="profile-page__highlight-dialog-cover-image"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {!coverImage && selectedStories.length > 0 && (
                      <p className="profile-page__highlight-dialog-cover-note">
                        No cover image selected. The latest story will be used as the cover.
                      </p>
                    )}
                  </div>
                  <div className="profile-page__highlight-dialog-actions">
                    <Button
                      onClick={() => setStep(1)}
                      variant="secondary"
                      size="medium"
                      aria-label="Go back to title input"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setIsAddHighlightDialogOpen(false)}
                      variant="secondary"
                      size="medium"
                      aria-label="Cancel highlight creation"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        handleAddHighlightSubmit(
                          authData?.userId,
                          highlightTitle,
                          selectedStories,
                          coverImage,
                          userStories,
                          useProfileStore.getState().fetchHighlights,
                          setIsAddHighlightDialogOpen,
                          setStep,
                          setHighlightTitle,
                          setSelectedStories,
                          setCoverImage
                        )
                      }
                      variant="primary"
                      size="medium"
                      disabled={selectedStories.length === 0}
                      aria-label="Add highlight"
                    >
                      Add
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default memo(ProfilePage);