'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProfileStore } from '@/store/profileStore';
import { fetchUserStories, handleOpenModal } from '@/utils/profileUtils';
import { FollowingFollower, Story, Post } from '@/types';

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
  const pathname = usePathname();
  const username = pathname.split('/')[2];
  const isSavedTab = pathname.includes('/saved');

  // State Management
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>(isSavedTab ? 'saved' : 'posts');
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
  const lastFetchedUsername = useRef<string | null>(null);
  const hasFetchedContent = useRef(false); // Added missing ref

  // Initialize authentication (run once)
  useEffect(() => {
    console.log('Initializing auth...');
    initializeAuth();
  }, [initializeAuth]);

  // Handle dialog based on URL query
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab === 'followers') {
      setDialogType('followers');
      setIsDialogOpen(true);
    } else if (tab === 'following') {
      setDialogType('following');
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false);
    }
  }, [pathname]);

  // Set active tab based on pathname
  useEffect(() => {
    setActiveTab(isSavedTab ? 'saved' : 'posts');
  }, [isSavedTab]);

  // Fetch profile
  useEffect(() => {
    if (!username || typeof username !== 'string') {
      console.log('No valid username, skipping profile fetch');
      return;
    }

    // Avoid fetching if already fetched for this username
    if (hasFetchedProfile.current && lastFetchedUsername.current === username) {
      console.log('Profile already fetched for:', username);
      return;
    }

    console.log('Fetching profile for username:', username);
    setLoading(true);
    setError(null);
    fetchProfile(username)
      .then((result) => {
        console.log('Profile fetched successfully:', result);
        setHasInitiallyLoaded(true);
        hasFetchedProfile.current = true;
        lastFetchedUsername.current = username;
        console.log('Profile fetch completed for:', username);
      })
      .catch((err) => {
        console.error('Profile fetch error:', err);
        setError(err.message || 'Failed to fetch profile');
        setHasInitiallyLoaded(true); // Still set to true to prevent infinite loading
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, fetchProfile, setLoading, setError]);

  // Fetch highlights, posts, and saved posts
  useEffect(() => {
    if (!profile?.userId || hasFetchedContent.current) {
      console.log('Skipping content fetch:', {
        hasUserId: !!profile?.userId,
        hasFetchedContent: hasFetchedContent.current,
      });
      return;
    }

    console.log('Fetching content for userId:', profile.userId);
    fetchHighlights(profile.userId);
    fetchPosts(profile.userId);
    if (authData?.userId === profile.userId) {
      fetchSavedPosts();
    }
    hasFetchedContent.current = true;
  }, [profile?.userId, authData?.userId, fetchHighlights, fetchPosts, fetchSavedPosts]);

  // Fetch followers and following data
  useEffect(() => {
    if (!profile || followersData.length || followingData.length) {
      console.log('Skipping followers/following fetch:', {
        hasProfile: !!profile,
        followersLength: followersData.length,
        followingLength: followingData.length,
      });
      return;
    }

    setFetchingDialogData(true);
    setDialogError(null);
    console.log('Fetching followers and following for userId:', profile.userId);
    Promise.all([
      fetchFollowers(profile.userId).catch(() => ({ followers: [] })),
      fetchFollowing(profile.userId).catch(() => ({ following: [] })),
    ])
      .then(([followersResponse, followingResponse]) => {
        setFollowersData(followersResponse.followers || []);
        setFollowingData(followingResponse.following || []);
        console.log('Followers/Following fetch completed');
      })
      .catch((err: any) => {
        setDialogError('Failed to load followers or following. Please try again later.');
        console.error('Followers/Following fetch error:', err);
      })
      .finally(() => {
        setFetchingDialogData(false);
      });
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
    router.push(`/profile/edit`);
  }, [profile, authData, router]);

  const handleFollow = useCallback(async () => {
    if (!profile) return;
    setIsFollowingLoading(true);
    try {
      await followUser(profile.userId);
      await fetchProfile(profile.username);
      hasFetchedProfile.current = true;
      lastFetchedUsername.current = profile.username;
      console.log('Follow and profile refresh completed for:', profile.username);
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
      hasFetchedProfile.current = true;
      lastFetchedUsername.current = profile.username;
      console.log('Unfollow and profile refresh completed for:', profile.username);
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
      router.push(newPath, { scroll: false });
    },
    [profile, username, router]
  );

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    if (username) {
      const basePath = activeTab === 'saved' ? `/profile/${username}/saved` : `/profile/${username}`;
      router.replace(basePath, { scroll: false });
    }
  }, [username, activeTab, router]);

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

  const handleTabChange = useCallback(
    (tab: 'posts' | 'saved') => {
      setActiveTab(tab);
      const basePath = `/profile/${username}`;
      const newPath = tab === 'saved' ? `${basePath}/saved` : basePath;
      router.push(newPath, { scroll: false });
    },
    [username, router]
  );

  return {
    profile,
    authData,
    loading,
    error,
    hasInitiallyLoaded,
    activeTab,
    setActiveTab: handleTabChange,
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