import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/profileStore';
import { changePassword, updateProfile } from '@/utils/api';
import { getAuthData } from '@/utils/auth';
import { ProfileFormData, ProfileFormErrors, AuthData } from '@/types';
import { validateAccountForm, validatePasswordForm } from '@/utils/profileEditUtils';

// Custom hook for managing profile edit logic
export const useProfileEdit = () => {
  const router = useRouter();
  const username = getAuthData()?.username;
  const { profile, fetchProfile, authData, initializeAuth, setProfile, setLoading, setError } = useProfileStore();

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    address: '',
    bio: '',
    jobTitle: '',
    dateOfBirth: '',
    isPrivate: false,
    profilePicture: null,
    coverPicture: null,
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [previewCoverPicture, setPreviewCoverPicture] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

  // Refs for hidden file inputs
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const coverPictureInputRef = useRef<HTMLInputElement>(null);

  // Initialize auth data and fetch profile
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        // Initialize auth data if not already loaded
        if (!authData) {
          await initializeAuth();
        }

        // Fetch profile data only if not already fetched or username differs
        if (!profile || profile.username !== username) {
          if (typeof username === 'string') {
            const response = await fetchProfile(username);
            if (response && response.profile) {
              setProfile(response.profile);
            } else {
              throw new Error('Invalid profile data received');
            }
            setHasFetchedProfile(true);
          } else {
            setErrors({ general: 'Invalid username parameter' });
            setHasFetchedProfile(true);
          }
        } else {
          setHasFetchedProfile(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrors({ general: err.message || 'Failed to load profile data' });
          setHasFetchedProfile(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [username, fetchProfile, authData, initializeAuth, setProfile, setLoading, setError, profile]);

  // Redirect if user is not authorized
  useEffect(() => {
    if (authData && profile && authData.userId !== profile.userId) {
      router.push(`/profile/${username}`);
    }
  }, [authData, profile, router, username]);

  // Populate form with profile data
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        firstName: profile.profileName?.split(' ')[0] || '',
        lastName: profile.profileName?.split(' ').slice(1).join(' ') || '',
        username: profile.username || '',
        address: profile.address || '',
        bio: profile.bio || '',
        jobTitle: profile.jobTitle || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        isPrivate: profile.isPrivate || false,
        profilePicture: null,
        coverPicture: null,
      }));
    }
  }, [profile]);

  // Update email from auth data
  useEffect(() => {
    if (authData) {
      setFormData((prev) => ({ ...prev, email: (authData as AuthData).email || '' }));
    }
  }, [authData]);

  // Clean up image previews to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewProfilePicture) URL.revokeObjectURL(previewProfilePicture);
      if (previewCoverPicture) URL.revokeObjectURL(previewCoverPicture);
    };
  }, [previewProfilePicture, previewCoverPicture]);

  // Handle file input changes for images
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));

      const previewUrl = URL.createObjectURL(file);
      if (name === 'profilePicture') {
        setPreviewProfilePicture(previewUrl);
      } else if (name === 'coverPicture') {
        setPreviewCoverPicture(previewUrl);
      }
    }
  }, []);

  // Handle text input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  // Trigger hidden file input click
  const handleImageClick = useCallback(
    (inputRef: React.RefObject<HTMLInputElement>, name: string, e: React.MouseEvent | React.KeyboardEvent) => {
      if (inputRef.current && (e.type === 'click' || (e as React.KeyboardEvent).key === 'Enter')) {
        inputRef.current.click();
      }
    },
    []
  );

  // Handle privacy radio button changes
  const handlePrivacyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, isPrivate: value === 'private' }));
    setErrors((prev) => ({ ...prev, isPrivate: undefined }));
  }, []);

  // Submit account form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateAccountForm(formData, setErrors)) return;

      setIsLoading(true);
      setErrors({});
      setSuccessMessage(null);

      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      if (formData.bio) formDataToSend.append('bio', formData.bio);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.jobTitle) formDataToSend.append('jobTitle', formData.jobTitle);
      if (formData.dateOfBirth) formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      if (formData.profilePicture) formDataToSend.append('profilePicture', formData.profilePicture);
      if (formData.coverPicture) formDataToSend.append('coverPicture', formData.coverPicture);
      formDataToSend.append('isPrivate', formData.isPrivate.toString());

      try {
        const response = await updateProfile(formDataToSend);
        setSuccessMessage(response.message);
        setTimeout(() => router.push(`/profile/${formData.username}`), 1500);
      } catch (err: any) {
        setErrors({ general: err.message || 'Failed to update profile' });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, router]
  );

  // Submit password form
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validatePasswordForm(formData, setErrors)) return;

      setIsLoading(true);
      setErrors({});
      setSecuritySuccess(null);

      try {
        const response = await changePassword(formData.oldPassword || '', formData.newPassword || '');
        setSecuritySuccess(response.message);
        setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmNewPassword: '' }));
        setTimeout(() => setSecuritySuccess(null), 3000);
      } catch (err: any) {
        setErrors({ general: err.message || 'Failed to change password' });
      } finally {
        setIsLoading(false);
      }
    },
    [formData]
  );

  // Handle tab change
  const handleTabChange = useCallback((tab: 'account' | 'security') => {
    setActiveTab(tab);
    setErrors({});
    setSuccessMessage(null);
    setSecuritySuccess(null);
  }, []);

  return {
    formData,
    errors,
    isLoading,
    successMessage,
    previewProfilePicture,
    previewCoverPicture,
    securitySuccess,
    activeTab,
    hasFetchedProfile,
    profilePictureInputRef,
    coverPictureInputRef,
    authData,
    profile,
    handleFileChange,
    handleInputChange,
    handleImageClick,
    handlePrivacyChange,
    handleSubmit,
    handlePasswordSubmit,
    handleTabChange,
  };
};