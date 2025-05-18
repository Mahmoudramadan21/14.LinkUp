import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useProfileStore } from '@/store/profileStore';
import { fetchUserStories, handleOpenModal } from '@/utils/profileUtils';
import { FollowingFollower, Story, Comment, Post } from '@/types';

export const useProfile = () => {
  const {
    profile,
    authData,
    loading,
    error,
    fetchProfile,
    fetchHighlights,
    fetchPosts,
    fetchSavedPosts,
    fetchFollowers,
    fetchFollowing,
    followUser,
    unfollowUser,
    initializeAuth,
    setLoading,
    setError,
  } = useProfileStore();
  const router = useRouter();
  const { username, tab } = router.query;

  // State Management
  const [activeTab, setActiveTab] = useState<'menu' | 'saved'>('menu');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'followers' | 'following'>('followers');
  const [followersData, setFollowersData] = useState<FollowingFollower[]>([]);
  const [followingData, setFollowingData] = useState<FollowingFollower[]>([]);
  const [fetchingDialogData, setFetchingDialogData] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isAddHighlightDialogOpen, setIsAddHighlightDialogOpen] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState('');
  const [step, setStep] = useState(1);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [selectedStories, setSelectedStories] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track fetch status
  const hasFetchedProfile = useRef(false);
  const hasFetchedContent = useRef(false);

  // Initialize authentication
  useEffect(() => {
    console.log('Initializing auth...');
    initializeAuth();
  }, [initializeAuth]);

  // Handle dialog based on URL query
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

  // Fetch profile
  useEffect(() => {
    if (router.isReady && username && typeof username === 'string') {
      if (hasFetchedProfile.current && username !== profile?.username) {
        hasFetchedProfile.current = false;
        hasFetchedContent.current = false;
        setHasInitiallyLoaded(false);
        setFollowersData([]);
        setFollowingData([]);
        setLoading(true);
        setError(null);
      }

      if (!hasFetchedProfile.current) {
        console.log('Fetching profile for username:', username);
        setLoading(true);
        setError(null);
        fetchProfile(username)
          .then(() => {
            setHasInitiallyLoaded(true);
          })
          .catch((err) => {
            console.error('Profile fetch error:', err);
            setError(err.message || 'Failed to fetch profile');
          })
          .finally(() => {
            setLoading(false);
            hasFetchedProfile.current = true;
          });
      }
    }
  }, [router.isReady, username, fetchProfile, setLoading, setError, profile?.username]);

  // Fetch highlights, posts, and saved posts
  useEffect(() => {
    if (profile?.userId && !hasFetchedContent.current) {
      console.log('Profile loaded, fetching highlights and posts for userId:', profile.userId);
      fetchHighlights(profile.userId);
      fetchPosts(profile.userId);
      if (authData?.userId === profile.userId) {
        fetchSavedPosts();
      }
      hasFetchedContent.current = true;
    }
  }, [profile?.userId, authData, fetchHighlights, fetchPosts, fetchSavedPosts]);

  // Fetch followers and following data
  useEffect(() => {
    if (profile && !followersData.length && !followingData.length) {
      setFetchingDialogData(true);
      setDialogError(null);
      console.log('Fetching followers and following for userId:', profile.userId);
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
      console.log('Fetching user stories for highlights, userId:', authData.userId);
      fetchUserStories(setUserStories);
    }
  }, [isAddHighlightDialogOpen, step, authData?.userId]);

  // Event Handlers
  const handleEditProfile = useCallback(() => {
    if (!profile || profile.userId !== authData?.userId) {
      alert('You can only edit your own profile.');
      return;
    }
    router.push(`/profile/${profile.username}/edit`);
  }, [profile, authData, router]);

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

  const handleMessage = useCallback(() => {
    if (!profile) return;
    router.push(`/messages/${profile.userId}`);
  }, [profile, router]);

  const handleOpenDialog = useCallback(
    (type: 'followers' | 'following') => {
      if (!profile || !username) return;
      setDialogType(type);
      setIsDialogOpen(true);
      const newPath = `/profile/${username}?tab=${type}`;
      router.push(newPath, undefined, { shallow: true });
    },
    [profile, username, router]
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    if (username) {
      const basePath = `/profile/${username}`;
      router.replace(basePath, undefined, { shallow: true });
    }
  }, [username, router]);

  const handleViewHighlights = useCallback(
    (userId: number) => {
      router.push(`/profile/highlights/${userId}`);
    },
    [router]
  );

  const handleAddHighlight = useCallback(() => {
    setIsAddHighlightDialogOpen(true);
    setStep(1);
    setHighlightTitle('');
    setSelectedStories([]);
    setCoverImage(null);
  }, []);

  const handleNextStep = useCallback(() => {
    if (step === 1 && highlightTitle.trim()) {
      setStep(2);
    }
  }, [step, highlightTitle]);

  const handleStorySelect = useCallback((storyId: number) => {
    setSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  }, []);

  const handleCoverImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  }, []);

  const handleDialogClick = useCallback(() => {
    setIsAddHighlightDialogOpen(false);
    setStep(1);
    setHighlightTitle('');
    setSelectedStories([]);
    setCoverImage(null);
  }, []);

  const handleOpenPostModal = useCallback(
    (savedPost: any) => {
      handleOpenModal(savedPost, setSelectedPost, setIsModalOpen);
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPost(null);
  }, []);

  return {
    profile,
    authData,
    loading,
    error,
    hasInitiallyLoaded,
    activeTab,
    setActiveTab,
    isDialogOpen,
    dialogType,
    dialogData: dialogType === 'followers' ? followersData : followingData,
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
  };
};