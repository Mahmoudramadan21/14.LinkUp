'use client';
import React, { memo, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useProfileStore } from '@/store/profileStore';
import { useRouter } from 'next/router';
import MainLayout from '@/layout/MainLayout';
import Loading from '@/components/Loading';
import Button from '@/components/Button';
import FollowerFollowingDialog from '@/components/FollowerFollowingDialog';
import PostCard from '@/components/PostCard';
import Bio from '@/components/Bio';
import PostModal from '@/components/PostModal';
import PrivateAccountNotice from '@/components/PrivateAccountNotice';
import { fetchUserStories, handleAddHighlightSubmit, handleOpenModal } from '@/utils/profileUtils';

// Define TypeScript interfaces for data structures
interface FollowingFollower {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  isPrivate: boolean;
  bio: string | null;
}

interface Comment {
  commentId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
}

interface Post {
  postId: number;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    UserID: number;
    Username: string;
    ProfilePicture: string;
  };
  likeCount: number;
  commentCount: number;
}

interface Story {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
}

interface Highlight {
  highlightId: number;
  title: string;
  coverImage: string;
  storyCount: number;
  stories: Story[];
}

/*
 * ProfilePage Component
 * Displays a user profile with tabs for posts, saved posts, and highlights.
 * Optimized for SEO with semantic HTML and for accessibility with ARIA attributes.
 */
const ProfilePage: React.FC = () => {
  // State Management
  const {
    profile,
    highlights,
    savedPosts,
    posts,
    loading,
    error,
    highlightsLoading,
    highlightsError,
    savedPostsLoading,
    savedPostsError,
    postsLoading,
    postsError,
    fetchProfile,
    fetchHighlights,
    fetchSavedPosts,
    fetchPosts,
    followUser,
    unfollowUser,
    authData,
    initializeAuth,
    fetchFollowers,
    fetchFollowing,
  } = useProfileStore();
  const router = useRouter();
  const { username, tab } = router.query;

  const [activeTab, setActiveTab] = useState<'menu' | 'saved'>('menu'); // Tracks active tab (posts or saved)
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Controls followers/following dialog visibility
  const [dialogType, setDialogType] = useState<'followers' | 'following'>('followers'); // Dialog type
  const [followersData, setFollowersData] = useState<FollowingFollower[]>([]); // Followers list
  const [followingData, setFollowingData] = useState<FollowingFollower[]>([]); // Following list
  const [fetchingDialogData, setFetchingDialogData] = useState(false); // Dialog data loading state
  const [dialogError, setDialogError] = useState<string | null>(null); // Dialog error state
  const [isModalOpen, setIsModalOpen] = useState(false); // Post modal visibility
  const [isFollowingLoading, setIsFollowingLoading] = useState(false); // Follow/unfollow loading state
  const [selectedPost, setSelectedPost] = useState<{
    postId: number;
    userId: number;
    username: string;
    profilePicture: string;
    privacy: string;
    content: string;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    comments: Comment[];
    isLiked: boolean;
    likedBy: { username: string; profilePicture: string }[];
  } | null>(null); // Selected post for modal
  const [isAddHighlightDialogOpen, setIsAddHighlightDialogOpen] = useState(false); // Highlight dialog visibility
  const [highlightTitle, setHighlightTitle] = useState(''); // Highlight title input
  const [step, setStep] = useState(1); // Highlight creation step (1: title, 2: stories/cover)
  const [userStories, setUserStories] = useState<Story[]>([]); // User stories for highlight
  const [selectedStories, setSelectedStories] = useState<number[]>([]); // Selected story IDs
  const [coverImage, setCoverImage] = useState<File | null>(null); // Highlight cover image

  // API Calls and Side Effects
  // Open dialog based on URL query
  useEffect(() => {
    if (tab === 'followers') {
      setDialogType('followers');
      setIsDialogOpen(true);
    } else if (tab === 'following') {
      setDialogType('following');
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
    }
  }, [tab]);

  // Fetch profile and initialize authentication
  useEffect(() => {
    initializeAuth();
    if (username && typeof username === 'string') {
      fetchProfile(username);
    }
  }, [username, fetchProfile, initializeAuth]);

  // Fetch highlights, posts, and saved posts when profile is loaded
  useEffect(() => {
    if (profile?.userId) {
      fetchHighlights(profile.userId);
      fetchPosts(profile.userId);
      if (authData?.userId === profile.userId) {
        fetchSavedPosts();
      }
    }
  }, [profile?.userId, authData, fetchHighlights, fetchPosts, fetchSavedPosts]);

  // Fetch followers and following data for dialog
  useEffect(() => {
    if (profile && !followersData.length && !followingData.length) {
      setFetchingDialogData(true);
      setDialogError(null);
      Promise.all([fetchFollowers(profile.userId), fetchFollowing(profile.userId)])
        .then(([followersResponse, followingResponse]) => {
          setFollowersData(followersResponse.followers || []);
          setFollowingData(followingResponse.following || []);
        })
        .catch((err: any) => {
          setDialogError(err.message || 'Failed to fetch followers or following');
        })
        .finally(() => {
          setFetchingDialogData(false);
        });
    }
  }, [profile, followersData.length, followingData.length, fetchFollowers, fetchFollowing]);

  // Fetch user stories for highlight creation
  useEffect(() => {
    if (isAddHighlightDialogOpen && step === 2 && authData?.userId) {
      fetchUserStories(setUserStories);
    }
  }, [isAddHighlightDialogOpen, step, authData?.userId]);

  // Event Handlers
  // Navigate to edit profile page
  const handleEditProfile = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!profile || profile.userId !== authData?.userId) {
      alert('You can only edit your own profile.');
      return;
    }
    router.push(`/profile/${profile.username}/edit`);
  }, [profile, authData, router]);

  // Follow a user
  const handleFollow = useCallback(async () => {
    if (!profile) return;
    setIsFollowingLoading(true);
    try {
      await followUser(profile.userId);
      await fetchProfile(profile.username);
    } catch (err: any) {
      console.error('Failed to follow:', err);
      alert('Failed to follow user. Please try again.');
    } finally {
      setIsFollowingLoading(false);
    }
  }, [profile, followUser, fetchProfile]);

  // Unfollow a user
  const handleUnfollow = useCallback(async () => {
    if (!profile) return;
    setIsFollowingLoading(true);
    try {
      await unfollowUser(profile.userId);
      await fetchProfile(profile.username);
    } catch (err: any) {
      console.error('Failed to unfollow:', err);
      alert('Failed to unfollow user. Please try again.');
    } finally {
      setIsFollowingLoading(false);
    }
  }, [profile, unfollowUser, fetchProfile]);

  // Navigate to messaging page
  const handleMessage = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!profile) return;
      router.push(`/messages/${profile.userId}`);
    },
    [profile, router]
  );

  // Switch between posts and saved posts tabs
  const handleTabChange = useCallback((tab: 'menu' | 'saved') => {
    setActiveTab(tab);
  }, []);

  // Open followers or following dialog
  const openDialog = useCallback(
    (type: 'followers' | 'following', e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (profile) {
        setDialogType(type);
        setIsDialogOpen(true);
        const newPath = `/profile/${username}?tab=${type}`;
        router.push(newPath, undefined, { shallow: true });
      }
    },
    [profile, username, router]
  );

  // Close followers or following dialog
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    const basePath = `/profile/${username}`;
    router.replace(basePath, undefined, { shallow: true });
  }, [username, router]);

  // Navigate to highlights page
  const handleViewHighlights = useCallback(
    (userId: number) => {
      router.push(`/profile/highlights/${userId}`);
    },
    [router]
  );

  // Open highlight creation dialog
  const handleAddHighlight = useCallback(() => {
    setIsAddHighlightDialogOpen(true);
    setStep(1);
    setHighlightTitle('');
    setSelectedStories([]);
    setCoverImage(null);
  }, []);

  // Move to next step in highlight creation
  const handleNextStep = useCallback(() => {
    if (step === 1 && highlightTitle.trim()) {
      setStep(2);
    }
  }, [step, highlightTitle]);

  // Toggle story selection for highlight
  const handleStorySelect = useCallback((storyId: number) => {
    setSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  }, []);

  // Handle cover image upload for highlight
  const handleCoverImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  }, []);

  // Update post data after interaction
  const handlePostUpdate = useCallback((postId: number, updatedFields: any) => {
    useProfileStore.setState((state) => ({
      posts: state.posts.map((post) =>
        post.postId === postId ? { ...post, ...updatedFields } : post
      ),
    }));
  }, []);

  // Close post modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPost(null);
  }, []);

  // Close highlight dialog on outside click
  const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsAddHighlightDialogOpen(false);
      setStep(1);
      setHighlightTitle('');
      setSelectedStories([]);
      setCoverImage(null);
    }
  }, []);

  // Rendering
  if (loading) {
    return <Loading />;
  }

  if (!profile) {
    return (
      <main className="profile-page__not-found" role="alert" aria-live="polite">
        <p className="profile-page__not-found-text">Profile not found</p>
      </main>
    );
  }

  const isOwnProfile = authData?.userId === profile.userId;
  const dialogData = dialogType === 'followers' ? followersData : followingData;

  return (
    <MainLayout title={`LinkUp | ${typeof username === 'string' ? username : 'Profile'}`}>
      <main className="profile-page__container">
        {/* Profile Header */}
        <header className="profile-page__header">
          <div className="profile-page__cover">
            <Image
              src={profile.coverPicture || '/cover-photos/sunset.jpg'}
              alt={`${profile.username}'s cover photo`}
              fill
              className="profile-page__cover-image"
              loading="lazy"
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
                  className="profile-page__profile-image"
                  loading="lazy"
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
                  onClick={(e) => openDialog('followers', e)}
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
                  onClick={(e) => openDialog('following', e)}
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
                  disabled={isFollowingLoading || loading}
                  aria-label={
                    profile.isFollowing
                      ? `Unfollow ${profile.username}`
                      : profile.followStatus === 'PENDING'
                      ? `Follow request pending for ${profile.username}`
                      : `Follow ${profile.username}`
                  }
                >
                  {isFollowingLoading || loading
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
              <h2 id="highlights-title" className="profile-page__highlights-title">
                Highlights
              </h2>
              {highlightsLoading ? (
                <Loading />
              ) : highlightsError ? (
                <p className="profile-page__highlights-error">{highlightsError}</p>
              ) : highlights.length === 0 && !isOwnProfile ? (
                <p className="profile-page__highlights-empty">No highlights available</p>
              ) : (
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
              )}
            </section>
          )}

          {/* Tabs Navigation */}
          <nav className="profile-page__tabs" aria-label="Profile content tabs">
            <button
              onClick={() => handleTabChange('menu')}
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
                onClick={() => handleTabChange('saved')}
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

            {profile.isPrivate && !isOwnProfile ? (
              <PrivateAccountNotice />
            ) : (
              <article className="profile-page__posts-list">
                {postsLoading ? (
                  <Loading />
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
                      onClick={() => handleOpenModal(savedPost, setSelectedPost, setIsModalOpen)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenModal(savedPost, setSelectedPost, setIsModalOpen)}
                      aria-label={`View saved post ${savedPost.PostID}`}
                    >
                      <Image
                        src={savedPost.ImageURL || savedPost.VideoURL || '/saved-posts/default.jpg'}
                        alt={`Saved post ${savedPost.PostID}`}
                        width={200}
                        height={200}
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
            onClose={closeDialog}
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
                          fetchHighlights,
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
      </main>
    </MainLayout>
  );
};

export default memo(ProfilePage);