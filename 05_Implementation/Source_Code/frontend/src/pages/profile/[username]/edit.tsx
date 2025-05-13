'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/layout/MainLayout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useProfileStore } from '@/store/profileStore';
import { changePassword, updateProfile } from '@/utils/api';

// Define interfaces for form data and errors
interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  address: string;
  bio: string;
  jobTitle: string;
  dateOfBirth: string;
  isPrivate: boolean;
  profilePicture: File | null;
  coverPicture: File | null;
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  address?: string;
  bio?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  isPrivate?: string;
  profilePicture?: string;
  coverPicture?: string;
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  general?: string;
}

// Define interface for authData to ensure type safety
interface AuthData {
  userId: number;
  username: string;
  profilePicture: string | null;
  email: string;
  token: string;
}

/**
 * EditProfilePage Component
 * Allows users to update their profile information and change their password.
 * Optimized for SEO, accessibility, and performance with semantic HTML and ARIA attributes.
 */
const EditProfilePage: React.FC = () => {
  const router = useRouter();
  const { username } = router.query;
  const { profile, fetchProfile, authData } = useProfileStore();

  const [formData, setFormData] = useState<FormData>({
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewProfilePicture, setPreviewProfilePicture] = useState<string | null>(null);
  const [previewCoverPicture, setPreviewCoverPicture] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');

  // Refs for hidden file inputs
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const coverPictureInputRef = useRef<HTMLInputElement>(null);

  // Initialize profile data
  useEffect(() => {
    if (typeof username === 'string') {
      fetchProfile(username);
    }
  }, [username, fetchProfile]);

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

  // Validate account form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.dateOfBirth) {
      const parsedDate = new Date(formData.dateOfBirth);
      if (isNaN(parsedDate.getTime()) || !formData.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        newErrors.dateOfBirth = 'Invalid date of birth (use YYYY-MM-DD)';
      }
    }
    if (formData.profilePicture && formData.profilePicture.size > 5 * 1024 * 1024) {
      newErrors.profilePicture = 'Profile picture must be less than 5MB';
    }
    if (formData.coverPicture && formData.coverPicture.size > 5 * 1024 * 1024) {
      newErrors.coverPicture = 'Cover picture must be less than 5MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Validate password form
  const validatePasswordForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.oldPassword?.trim()) newErrors.oldPassword = 'Current password is required';
    if (!formData.newPassword?.trim()) {
      newErrors.newPassword = 'New password is required';
    } else {
      if (formData.newPassword.length < 8) newErrors.newPassword = 'New password must be at least 8 characters';
      if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.newPassword)) {
        newErrors.newPassword = 'New password must contain both letters and numbers';
      }
      if (/[\s]/.test(formData.newPassword)) newErrors.newPassword = 'New password cannot contain spaces';
    }
    if (!formData.confirmNewPassword?.trim()) {
      newErrors.confirmNewPassword = 'Confirm new password is required';
    } else if (formData.confirmNewPassword !== formData.newPassword) {
      newErrors.confirmNewPassword = 'Confirm new password must match new password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.oldPassword, formData.newPassword, formData.confirmNewPassword]);

  // Submit account form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

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
    [formData, validateForm, router]
  );

  // Submit password form
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validatePasswordForm()) return;

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
    [formData.oldPassword, formData.newPassword, validatePasswordForm]
  );

  // Handle tab change
  const handleTabChange = useCallback((tab: 'account' | 'security') => {
    setActiveTab(tab);
    setErrors({});
    setSuccessMessage(null);
    setSecuritySuccess(null);
  }, []);

  if (!profile) {
    return (
      <main className="edit-profile__loading" aria-live="polite">
        Loading...
      </main>
    );
  }

  return (
    <MainLayout
      title={`Edit Profile | ${profile.username} - LinkUp`}
      description={`Edit the profile of ${profile.username} on LinkUp, including personal information and security settings.`}
    >
      <div className="edit-profile">
        {/* Header with cover and profile images */}
        <header className="edit-profile__header">
          <div
            className="edit-profile__cover"
            role="button"
            tabIndex={0}
            onClick={(e) => handleImageClick(coverPictureInputRef, 'coverPicture', e)}
            onKeyDown={(e) => handleImageClick(coverPictureInputRef, 'coverPicture', e)}
            aria-label="Change cover picture"
          >
            <img
              src={previewCoverPicture || profile.coverPicture || '/default-cover.jpg'}
              alt="Cover picture"
              className="edit-profile__cover-image"
              loading="lazy"
            />
            <img
              src="/icons/edit.svg"
              alt="Edit cover picture"
              className="edit-profile__cover-edit-icon"
              onClick={(e) => handleImageClick(coverPictureInputRef, 'coverPicture', e)}
              onKeyDown={(e) => handleImageClick(coverPictureInputRef, 'coverPicture', e)}
            />
          </div>
          <div
            className="edit-profile__profile-picture"
            role="button"
            tabIndex={0}
            onClick={(e) => handleImageClick(profilePictureInputRef, 'profilePicture', e)}
            onKeyDown={(e) => handleImageClick(profilePictureInputRef, 'profilePicture', e)}
            aria-label="Change profile picture"
          >
            <img
              src={previewProfilePicture || profile.profilePicture || '/default-profile.jpg'}
              alt="Profile picture"
              className="edit-profile__profile-picture-image"
              loading="lazy"
            />
            <img
              src="/icons/edit.svg"
              alt="Edit profile picture"
              className="edit-profile__profile-picture-edit-icon"
              onClick={(e) => handleImageClick(profilePictureInputRef, 'profilePicture', e)}
              onKeyDown={(e) => handleImageClick(profilePictureInputRef, 'profilePicture', e)}
            />
          </div>
          <input
            type="file"
            ref={profilePictureInputRef}
            onChange={handleFileChange}
            name="profilePicture"
            accept="image/*"
            className="edit-profile__hidden-input"
            aria-hidden="true"
          />
          <input
            type="file"
            ref={coverPictureInputRef}
            onChange={handleFileChange}
            name="coverPicture"
            accept="image/*"
            className="edit-profile__hidden-input"
            aria-hidden="true"
          />
        </header>

        {/* Page title */}
        <h1 className="edit-profile__title">Edit Profile</h1>

        {/* Tabs for account and security */}
        <nav className="edit-profile__tabs" role="tablist">
          <button
            className={`edit-profile__tab ${activeTab === 'account' ? 'edit-profile__tab--active' : ''}`}
            onClick={() => handleTabChange('account')}
            role="tab"
            aria-selected={activeTab === 'account'}
            aria-controls="account-panel"
            id="account-tab"
          >
            Account Settings
          </button>
          <button
            className={`edit-profile__tab ${activeTab === 'security' ? 'edit-profile__tab--active' : ''}`}
            onClick={() => handleTabChange('security')}
            role="tab"
            aria-selected={activeTab === 'security'}
            aria-controls="security-panel"
            id="security-tab"
          >
            Security
          </button>
        </nav>

        {/* Account form */}
        {activeTab === 'account' && (
          <form onSubmit={handleSubmit} className="edit-profile__form" noValidate aria-labelledby="account-tab">
            <section className="edit-profile__section" id="account-panel" role="tabpanel" aria-labelledby="account-tab">
              <h2 className="edit-profile__section-title">Information</h2>
              <div className="edit-profile__input-group">
                <div className="edit-profile__input-block">
                  <Input
                    id="firstName"
                    type="text"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                    name="firstName"
                    disabled={isLoading}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                </div>
                <div className="edit-profile__input-block">
                  <Input
                    id="lastName"
                    type="text"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    required
                    name="lastName"
                    disabled={isLoading}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                </div>
              </div>
              <div className="edit-profile__input-group">
                <div className="edit-profile__input-block">
                  <Input
                    id="username"
                    type="text"
                    label="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    error={errors.username}
                    required
                    name="username"
                    disabled={isLoading}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                  />
                </div>
                <div className="edit-profile__input-block">
                  <Input
                    id="email"
                    type="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    name="email"
                    disabled={isLoading}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
              </div>
              <div className="edit-profile__input-group">
                <div className="edit-profile__input-block">
                  <Input
                    id="jobTitle"
                    type="text"
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    error={errors.jobTitle}
                    name="jobTitle"
                    disabled={isLoading}
                    aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
                  />
                </div>
                <div className="edit-profile__input-block">
                  <Input
                    id="dateOfBirth"
                    type="date"
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    error={errors.dateOfBirth}
                    name="dateOfBirth"
                    disabled={isLoading}
                    aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
                  />
                </div>
              </div>
              <div className="edit-profile__input-block">
                <Input
                  id="address"
                  type="text"
                  label="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={errors.address}
                  name="address"
                  disabled={isLoading}
                  aria-describedby={errors.address ? 'address-error' : undefined}
                />
              </div>
              <div className="edit-profile__input-block">
                <Input
                  id="bio"
                  type="text"
                  label="Bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  error={errors.bio}
                  name="bio"
                  disabled={isLoading}
                  aria-describedby={errors.bio ? 'bio-error' : undefined}
                />
              </div>
            </section>

            <section className="edit-profile__section" id="privacy">
              <h2 className="edit-profile__section-title">Privacy</h2>
              <div className="edit-profile__privacy-group">
                <h3 className="edit-profile__privacy-title">Account Privacy</h3>
                <div className="edit-profile__radio-group">
                  <label className="edit-profile__radio-label">
                    <input
                      type="radio"
                      name="isPrivate"
                      value="public"
                      checked={!formData.isPrivate}
                      onChange={handlePrivacyChange}
                      disabled={isLoading}
                      aria-label="Make account public"
                    />
                    Public
                  </label>
                  <label className="edit-profile__radio-label">
                    <input
                      type="radio"
                      name="isPrivate"
                      value="private"
                      checked={formData.isPrivate}
                      onChange={handlePrivacyChange}
                      disabled={isLoading}
                      aria-label="Make account private"
                    />
                    Private
                  </label>
                </div>
              </div>
            </section>

            {errors.general && (
              <div className="edit-profile__error-general" role="alert" aria-live="polite">
                {errors.general}
              </div>
            )}

            {successMessage && (
              <div className="edit-profile__success" role="status" aria-live="polite">
                {successMessage}
              </div>
            )}

            <div className="edit-profile__actions">
              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={isLoading}
                aria-label="Update account"
              >
                {isLoading ? 'Saving...' : 'Update Account'}
              </Button>
            </div>
          </form>
        )}

        {/* Security form */}
        {activeTab === 'security' && (
          <section className="edit-profile__section" id="security-panel" role="tabpanel" aria-labelledby="security-tab">
            <h2 className="edit-profile__section-title">Security</h2>
            <form onSubmit={handlePasswordSubmit} className="edit-profile__form" noValidate aria-labelledby="security-tab">
              <div className="edit-profile__input-group">
                <div className="edit-profile__input-block">
                  <Input
                    id="oldPassword"
                    type="password"
                    label="Current Password"
                    value={formData.oldPassword || ''}
                    onChange={handleInputChange}
                    error={errors.oldPassword}
                    required
                    name="oldPassword"
                    disabled={isLoading}
                    aria-describedby={errors.oldPassword ? 'oldPassword-error' : undefined}
                  />
                </div>
                <div className="edit-profile__input-block">
                  <Input
                    id="newPassword"
                    type="password"
                    label="New Password"
                    value={formData.newPassword || ''}
                    onChange={handleInputChange}
                    error={errors.newPassword}
                    required
                    name="newPassword"
                    disabled={isLoading}
                    aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
                  />
                </div>
                <div className="edit-profile__input-block">
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    label="Confirm New Password"
                    value={formData.confirmNewPassword || ''}
                    onChange={handleInputChange}
                    error={errors.confirmNewPassword}
                    required
                    name="confirmNewPassword"
                    disabled={isLoading}
                    aria-describedby={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
                  />
                </div>
              </div>
              {errors.general && (
                <div className="edit-profile__error-general" role="alert" aria-live="polite">
                  {errors.general}
                </div>
              )}
              {securitySuccess && (
                <div className="edit-profile__success" role="status" aria-live="polite">
                  {securitySuccess}
                </div>
              )}
              <div className="edit-profile__actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  disabled={isLoading}
                  aria-label="Change password"
                >
                  {isLoading ? 'Saving...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default React.memo(EditProfilePage);