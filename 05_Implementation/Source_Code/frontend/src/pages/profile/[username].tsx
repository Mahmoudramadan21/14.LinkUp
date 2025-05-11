'use client';

import React, { memo, useEffect, useState } from 'react';
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
import api from '@/utils/api';

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

const ProfilePage: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<'menu' | 'saved'>('menu');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'followers' | 'following'>('followers');
  const [followersData, setFollowersData] = useState<FollowingFollower[]>([]);
  const [followingData, setFollowingData] = useState<FollowingFollower[]>([]);
  const [fetchingDialogData, setFetchingDialogData] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
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
  } | null>(null);
  const [isAddHighlightDialogOpen, setIsAddHighlightDialogOpen] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [step, setStep] = useState(1);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [selectedStories, setSelectedStories] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);

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

  useEffect(() => {
    initializeAuth();
    if (username && typeof username === 'string') {
      fetchProfile(username);
    }
  }, [username, fetchProfile, initializeAuth]);

  useEffect(() => {
    if (profile?.userId) {
      fetchHighlights(profile.userId);
      fetchPosts(profile.userId);
      if (authData?.userId === profile.userId) {
        fetchSavedPosts();
      }
    }
  }, [profile?.userId, authData, fetchHighlights, fetchPosts, fetchSavedPosts]);

  useEffect(() => {
    if (profile && !followersData.length && !followingData.length) {
      setFetchingDialogData(true);
      setDialogError(null);
      Promise.all([
        fetchFollowers(profile.userId),
        fetchFollowing(profile.userId),
      ])
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

  useEffect(() => {
    if (isAddHighlightDialogOpen && step === 2 && authData?.userId) {
      fetchUserStories();
    }
  }, [isAddHighlightDialogOpen, step, authData?.userId]);

  const fetchUserStories = async () => {
    try {
      const response = await api.get('/profile/stories');
      setUserStories(response.data.stories || []);
    } catch (err: any) {
      console.error('Failed to fetch user stories:', err.message);
    }
  };

  const handleEditProfile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!profile || profile.userId !== authData?.userId) {
      alert('You can only edit your own profile.');
      return;
    }
    router.push(`/profile/${profile.username}/edit`);
  };

  const handleFollow = async () => {
    if (!profile) return;
    setIsFollowingLoading(true);
    try {
      await followUser(profile.userId);
      // بعد الـ Follow، نعمل Fetch تاني للـ Profile عشان نتاكد إن الـ followStatus محدث
      await fetchProfile(profile.username);
    } catch (err: any) {
      console.error('Failed to follow:', err);
      alert('Failed to follow user. Please try again.');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    setIsFollowingLoading(true);
    try {
      await unfollowUser(profile.userId);
      await fetchProfile(profile.username); // نعمل Fetch تاني لتحديث الـ State
    } catch (err: any) {
      console.error('Failed to unfollow:', err);
      alert('Failed to unfollow user. Please try again.');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!profile) return;
    router.push(`/messages/${profile.userId}`);
  };

  const handleTabChange = (tab: 'menu' | 'saved') => {
    setActiveTab(tab);
  };

  const openDialog = (type: 'followers' | 'following', e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (profile) {
      setDialogType(type);
      setIsDialogOpen(true);
      const newPath = `/profile/${username}?tab=${type}`;
      router.push(newPath, undefined, { shallow: true });
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    const basePath = `/profile/${username}`;
    router.replace(basePath, undefined, { shallow: true });
  };

  const handleViewHighlights = (userId: number) => {
    router.push(`/profile/highlights/${userId}`);
  };

  const handleAddHighlight = () => {
    setIsAddHighlightDialogOpen(true);
    setStep(1);
    setHighlightTitle('');
    setSelectedStories([]);
    setCoverImage(null);
  };

  const handleNextStep = () => {
    if (step === 1 && highlightTitle.trim()) {
      setStep(2);
    }
  };

  const handleStorySelect = (storyId: number) => {
    setSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleAddHighlightSubmit = async () => {
    if (!authData?.userId || !highlightTitle.trim() || selectedStories.length === 0) {
      alert('Please fill the title and select at least one story.');
      return;
    }

    const formData = new FormData();
    formData.append('title', highlightTitle);
    
    if (!coverImage && selectedStories.length > 0) {
      const selectedStoriesData = userStories.filter((story) => selectedStories.includes(story.storyId));
      if (selectedStoriesData.length > 0) {
        const latestStory = selectedStoriesData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        try {
          const response = await fetch(latestStory.mediaUrl);
          const blob = await response.blob();
          const file = new File([blob], `cover-${latestStory.storyId}.jpg`, { type: blob.type });
          formData.append('coverImage', file);
        } catch (err: any) {
          console.error('Failed to fetch story image for cover:', err.message);
          alert('Failed to set cover image from story. Please upload a cover image manually.');
          return;
        }
      }
    } else if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    formData.append('storyIds', selectedStories.join(','));

    try {
      await api.post('/highlights', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchHighlights(authData.userId);
      setIsAddHighlightDialogOpen(false);
      setStep(1);
      setHighlightTitle('');
      setSelectedStories([]);
      setCoverImage(null);
    } catch (err: any) {
      console.error('Failed to create highlight:', err.message);
      alert(`Failed to create highlight: ${err.message}`);
    }
  };

  const handlePostUpdate = (postId: number, updatedFields: any) => {
    useProfileStore.setState((state) => ({
      posts: state.posts.map((post) =>
        post.postId === postId ? { ...post, ...updatedFields } : post
      ),
    }));
  };

  const handleOpenModal = (savedPost: any) => {
    const transformedComments = (savedPost.Comments || []).map((comment: any) => ({
      commentId: comment.CommentID,
      userId: comment.UserID,
      username: comment.User.Username || 'Unknown',
      content: comment.Content,
      createdAt: comment.CreatedAt,
      profilePicture: comment.User.ProfilePicture || '/avatars/default.jpg',
      isLiked: comment.isLiked || false,
      likeCount: comment.likeCount || 0,
      replies: (comment.Replies || []).map((reply: any) => ({
        commentId: reply.CommentID,
        userId: reply.UserID,
        username: reply.User.Username || 'Unknown',
        content: reply.Content,
        createdAt: reply.CreatedAt,
        profilePicture: reply.User.ProfilePicture || '/avatars/default.jpg',
        isLiked: reply.isLiked || false,
        likeCount: reply.likeCount || 0,
      })),
    }));

    const transformedPost = {
      postId: savedPost.PostID,
      userId: savedPost.UserID,
      username: savedPost.User.Username || 'Unknown',
      profilePicture: savedPost.User.ProfilePicture || '/avatars/default.jpg',
      privacy: savedPost.privacy,
      content: savedPost.Content,
      imageUrl: savedPost.ImageURL,
      videoUrl: savedPost.VideoURL,
      createdAt: savedPost.CreatedAt,
      likeCount: savedPost.likeCount || 0,
      commentCount: savedPost.commentCount || 0,
      comments: transformedComments,
      isLiked: savedPost.isLiked || false,
      likedBy: savedPost.likedBy || [],
    };
    setSelectedPost(transformedPost);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  if (loading) {
    return <Loading />;
  }

  if (!profile) {
    return (
      <div className="profile-page__not-found" role="alert" aria-live="polite">
        <p className="profile-page__not-found-text">Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = authData?.userId === profile.userId;
  const dialogData = dialogType === 'followers' ? followersData : followingData;

  return (
    <MainLayout title={`LinkUp | ${typeof username === 'string' ? username : 'Profile'}`}>
      <div className="profile-page relative">
        <div className="profile-page__header">
          <div className="profile-page__cover">
            <Image
              src={profile.coverPicture || '/cover-photos/sunset.jpg'}
              alt={`${profile.username}'s cover photo`}
              layout="fill"
              objectFit="cover"
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
                  layout="fill"
                  objectFit="cover"
                  className="profile-page__profile-image"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/avatars/default.jpg';
                  }}
                />
              </div>
            </div>
          </div>

          <div className="profile-page__content">
            <div className="profile-page__details">
              <h1 className="profile-page__name">{profile.profileName}</h1>
              <p className="profile-page__username">@{profile.username}</p>
            </div>

            <div className="profile-page__stats">
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">Posts</span>
                <span className="profile-page__stat-value">{profile.postCount}</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">Followers</span>
                <button
                  type="button"
                  className="profile-page__stat-value cursor-pointer text-purple-600 hover:underline bg-transparent border-none p-0"
                  onClick={(e) => openDialog('followers', e)}
                  aria-label={`View ${profile.followerCount} followers`}
                >
                  {profile.followerCount}
                </button>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">Following</span>
                <button
                  type="button"
                  className="profile-page__stat-value cursor-pointer text-purple-600 hover:underline bg-transparent border-none p-0"
                  onClick={(e) => openDialog('following', e)}
                  aria-label={`View ${profile.followingCount} following`}
                >
                  {profile.followingCount}
                </button>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">Likes</span>
                <span className="profile-page__stat-value">{profile.likeCount}</span>
              </div>
            </div>

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
                    alt="Message Icon"
                    width={48}
                    height={48}
                    className="profile-page__message-icon"
                  />
                </Button>
              </div>
            )}
          </div>

          {(!profile.isPrivate || isOwnProfile) && (
            <div className="profile-page__highlights">
              <h2 className="profile-page__highlights-title">Highlights</h2>
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
                      className="profile-page__highlight-item cursor-pointer flex flex-col items-center justify-center"
                      aria-label="Add a new highlight"
                    >
                      <div className="w-[80px] h-[80px] rounded-full bg-gray-100 flex items-center justify-center">
                        <Image
                          src="/icons/plus.svg"
                          alt="Add Highlight"
                          width={40}
                          height={40}
                          className="profile-page__highlight-add-icon"
                        />
                      </div>
                      <p className="profile-page__highlight-title mt-2">Add Highlight</p>
                    </button>
                  )}
                  {highlights.length === 0 && isOwnProfile ? (
                    <p className="profile-page__highlights-empty ml-4 mt-2">No highlights yet. Add one!</p>
                  ) : (
                    highlights.map((highlight) => (
                      <div
                        key={highlight.highlightId}
                        className="profile-page__highlight-item cursor-pointer"
                        onClick={() => handleViewHighlights(profile.userId)}
                      >
                        <Image
                          src={highlight.coverImage}
                          alt={highlight.title}
                          width={80}
                          height={80}
                          className="profile-page__highlight-image"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/highlights/default.jpg';
                          }}
                        />
                        <p className="profile-page__highlight-title">{highlight.title}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="profile-page__tabs">
            <button
              onClick={() => handleTabChange('menu')}
              className="profile-page__tab-btn"
              aria-label="View Posts"
            >
              <Image
                src={activeTab === 'menu' ? '/icons/menu-active.svg' : '/icons/menu.svg'}
                alt="Menu Icon"
                width={24}
                height={24}
                className="profile-page__tab-icon"
              />
            </button>
            {isOwnProfile && (
              <button
                onClick={() => handleTabChange('saved')}
                className="profile-page__tab-btn"
                aria-label="View Saved Posts"
              >
                <Image
                  src={activeTab === 'saved' ? '/icons/saved.svg' : '/icons/save.svg'}
                  alt="Saved Icon"
                  width={24}
                  height={24}
                  className="profile-page__tab-icon"
                />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'menu' && (
          <div className="profile-page__posts-section">
            <Bio
              bio={profile.bio || ''}
              jobTitle={profile.jobTitle || ''}
              address={profile.address || ''}
              dateOfBirth={profile.dateOfBirth || '1970-01-01T00:00:00.000Z'}
            />

            {(profile.isPrivate) && !isOwnProfile ? (
              <PrivateAccountNotice />
            ) : (
              <div className="profile-page__posts-list">
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
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && isOwnProfile && (
          <div className="profile-page__saved-posts">
            <h2 className="profile-page__saved-posts-title">Saved Posts</h2>
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
                      className="profile-page__saved-post-item cursor-pointer"
                      onClick={() => handleOpenModal(savedPost)}
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
          </div>
        )}

        {selectedPost && (
          <PostModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            post={selectedPost}
            onPostUpdate={handlePostUpdate}
          />
        )}

        {(
          !profile.isPrivate ||
          isOwnProfile ||
          profile.followStatus === 'ACCEPTED'
        ) && (
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


        {isAddHighlightDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              {step === 1 && (
                <>
                  <h2 className="text-xl font-bold mb-4">Create Highlight</h2>
                  <input
                    type="text"
                    value={highlightTitle}
                    onChange={(e) => setHighlightTitle(e.target.value)}
                    placeholder="Enter highlight title"
                    className="w-full p-2 mb-4 border rounded"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setIsAddHighlightDialogOpen(false)}
                      variant="secondary"
                      size="medium"
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      variant="primary"
                      size="medium"
                      disabled={!highlightTitle.trim()}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="text-xl font-bold mb-4">Select Stories and Cover</h2>
                  <div className="mb-4 max-h-64 overflow-y-auto grid grid-cols-3 gap-2">
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
                          <div key={story.storyId} className="relative">
                            <div className="relative w-full pt-[177.78%] rounded-lg overflow-hidden">
                              <div
                                className="absolute inset-0 p-1"
                                style={{
                                  background: 'linear-gradient(45deg, #ff2d55, #ffbc5b)',
                                  borderRadius: '10px',
                                }}
                              >
                                <div className="absolute inset-1 bg-white rounded-lg">
                                  <label className="relative block w-full h-full cursor-pointer">
                                    <Image
                                      src={story.mediaUrl}
                                      alt={`Story ${story.storyId}`}
                                      layout="fill"
                                      objectFit="cover"
                                      objectPosition="center"
                                      className="absolute inset-0 rounded-lg"
                                    />
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleStorySelect(story.storyId)}
                                      className="hidden"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-white opacity-30 rounded-lg"></div>
                                    )}
                                    <div
                                      className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isSelected ? 'bg-purple-700 border-purple-700' : 'bg-transparent border-gray-300'
                                      }`}
                                    >
                                      {isSelected && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="3"
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-gray-300 z-10">
                                      <span className="text-xs font-bold">{day}</span>
                                    </div>
                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-black text-xs px-2 py-1 rounded-full">
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
                      <p>No stories available.</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg mb-2">Upload Cover Image (Optional)</h3>
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                      <span className="text-gray-500 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 16v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 6l-4-4m0 0L8 6m4-4v12"
                          />
                        </svg>
                        Choose Image
                      </span>
                    </label>
                    {coverImage && (
                      <div className="mt-4 flex justify-center">
                        <Image
                          src={URL.createObjectURL(coverImage)}
                          alt="Cover Preview"
                          width={120}
                          height={120}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    {!coverImage && selectedStories.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        No cover image selected. The latest story will be used as the cover.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setStep(1)}
                      variant="secondary"
                      size="medium"
                      className="mr-2"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setIsAddHighlightDialogOpen(false)}
                      variant="secondary"
                      size="medium"
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddHighlightSubmit}
                      variant="primary"
                      size="medium"
                      disabled={selectedStories.length === 0}
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