'use client';

import { Suspense, useEffect, useState, memo, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { RootState, AppDispatch } from '@/store';
import {
  getProfileByUsernameThunk,
  updateProfileThunk,
  changePasswordThunk,
  clearError,
} from '@/store/profileSlice';
import { Profile } from '@/types/profile';
import {
  updateProfileSchema,
  UpdateProfileFormData,
  changePasswordSchema,
  ChangePasswordFormData,
} from '@/utils/validationSchemas';

import Button from '@/components/ui/common/Button';
import styles from './edit.module.css';

/**
 * EditProfilePagClient Component
 * Allows authenticated users to update their profile information,
 * upload profile/cover pictures, and change their password.
 */
const EditProfilePagClient = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Selectors
  const { user } = useSelector((state: RootState) => state.auth);
  const { profiles, loading, error } = useSelector((state: RootState) => state.profile);

  const username = user?.username || '';
  const profile: Profile | undefined = profiles[username];

  // Local state for image previews and selected files
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [coverPicturePreview, setCoverPicturePreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | undefined>(undefined);
  const [coverPictureFile, setCoverPictureFile] = useState<File | undefined>(undefined);

  // Profile Update Form (react-hook-form + zod)
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue,
    watch,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
      address: '',
      jobTitle: '',
      dateOfBirth: '',
      isPrivate: false,
      firstName: '',
      lastName: '',
    },
  });

  // Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Watch bio field to display character counter
  const bioValue = watch('bio');

  /* -------------------------------------------------------------------------- */
  /*                               Data Fetching                                */
  /* -------------------------------------------------------------------------- */

  // Fetch user profile if not already loaded
  useEffect(() => {
    if (username && !profile) {
      dispatch(getProfileByUsernameThunk(username));
    }
  }, [dispatch, username, profile]);

  // Populate form fields once profile data is available
  useEffect(() => {
    if (profile) {
      const formattedDateOfBirth = profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
        : '';

      setValue('username', profile.username || '');
      setValue('email', user?.email || '');
      setValue('bio', profile.bio || '');
      setValue('address', profile.address || '');
      setValue('jobTitle', profile.jobTitle || '');
      setValue('dateOfBirth', formattedDateOfBirth);
      setValue('isPrivate', profile.isPrivate || false);
      setValue('firstName', user?.profileName.split(' ')[0] || '');
      setValue('lastName', user?.profileName.split(' ').slice(1).join(' ') || '');

      setProfilePicturePreview(profile.profilePicture || null);
      setCoverPicturePreview(profile.coverPicture || null);
    }
  }, [profile, setValue, user]);

  // Cleanup error state on component unmount
  useEffect(() => {
    return () => {
      dispatch(clearError('updateProfile'));
      dispatch(clearError('changePassword'));
    };
  }, [dispatch]);

  /* -------------------------------------------------------------------------- */
  /*                             Image Upload Handlers                          */
  /* -------------------------------------------------------------------------- */

  const handleProfilePictureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleCoverPictureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPictureFile(file);
      setCoverPicturePreview(URL.createObjectURL(file));
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              Form Submissions                              */
  /* -------------------------------------------------------------------------- */

  /** Submit updated profile data and optional images */
  const onProfileSubmit: SubmitHandler<UpdateProfileFormData> = useCallback(
    async (data) => {
      try {
        await dispatch(
          updateProfileThunk({
            data,
            profilePicture: profilePictureFile,
            coverPicture: coverPictureFile,
          })
        ).unwrap();

        router.push(`/${username}`);
      } catch {
      }
    },
    [dispatch, router, username, profilePictureFile, coverPictureFile]
  );

  /** Submit password change request */
  const onPasswordSubmit: SubmitHandler<ChangePasswordFormData> = useCallback(
    async (data) => {
      try {
        await dispatch(
          changePasswordThunk({
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
          })
        ).unwrap();

        // Success feedback removed
        resetPassword();
      } catch {
        // Error feedback removed
      }
    },
    [dispatch, resetPassword]
  );

  /* -------------------------------------------------------------------------- */
  /*                               Early Returns                                */
  /* -------------------------------------------------------------------------- */

  if (!profile) {
    return (
      <div className={styles.loading} aria-live="polite">
        Loading profile...
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Suspense fallback={<div className={styles.loading}>Loading profile editor...</div>}>
      <div className={styles['edit-profile']} role="main" aria-labelledby="edit-profile-title">
        {/* Page Header */}
        <header className={styles['edit-profile__header']}>
          <h1 id="edit-profile-title" className={styles['edit-profile__title']}>
            Edit Profile
          </h1>
        </header>

        {/* Profile Header - Cover & Profile Picture */}
        <div className={styles['profile-header']}>
          {/* Cover Photo */}
          <div className={styles['profile-header__cover']}>
            {coverPicturePreview ? (
              <Image src={coverPicturePreview} alt="Cover Preview" fill className="object-cover" priority />
            ) : profile.coverPicture ? (
            <Image src={profile.coverPicture} alt="Current Cover" fill className="object-cover" priority />
            ) : (
              <div className={styles['profile-header__cover-placeholder']} />
            )}

            <label className={styles['profile-header__cover-label']}>
              <span className={styles['profile-header__cover-label-text']}>Change Cover</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverPictureChange}
                className="sr-only"
                aria-label="Upload cover picture"
              />
            </label>
          </div>

          {/* Profile Picture */}
          <div className={styles['profile-header__profile-picture-container']}>
            <div className={styles['profile-header__profile-picture']}>
              {profilePicturePreview ? (
                <Image
                  src={profilePicturePreview}
                  alt="Profile Preview"
                  fill
                  className="rounded-full border-4 border-white dark:border-gray-800 object-cover"
                  priority
                />
              ) : profile.profilePicture ? (
                <Image
                  src={profile.profilePicture || "/avatars/default-avatar.svg"}
                  alt="Current Profile"
                  fill
                  className="rounded-full border-4 border-white dark:border-gray-800 object-cover"
                  priority
                />
              ) : (
                <div className={styles['profile-header__profile-picture-placeholder']} />
              )}

              <label className={styles['profile-header__profile-picture-label']}>
                <span className={styles['profile-header__profile-picture-label-text']}>Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="sr-only"
                  aria-label="Upload profile picture"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className={styles['profile-form']}
          aria-labelledby="profile-info-section"
        >
          <h2 id="profile-info-section" className={styles['profile-form__title']}>
            Profile Information
          </h2>

          <div className={styles['profile-form__grid']}>
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className={styles['profile-form__label']}>
                First Name
              </label>
              <input
                id="firstName"
                {...registerProfile('firstName')}
                placeholder="Enter your first name"
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.firstName ? 'firstName-error' : undefined}
              />
              {profileErrors.firstName?.message && (
                <p id="firstName-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className={styles['profile-form__label']}>
                Last Name
              </label>
              <input
                id="lastName"
                {...registerProfile('lastName')}
                placeholder="Enter your last name"
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.lastName ? 'lastName-error' : undefined}
              />
              {profileErrors.lastName?.message && (
                <p id="lastName-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.lastName.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className={styles['profile-form__label']}>
                Username
              </label>
              <input
                id="username"
                {...registerProfile('username')}
                placeholder="Enter your username"
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.username ? 'username-error' : undefined}
              />
              {profileErrors.username?.message && (
                <p id="username-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={styles['profile-form__label']}>
                Email
              </label>
              <input
                id="email"
                type="email"
                {...registerProfile('email')}
                placeholder="Enter your email"
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.email ? 'email-error' : undefined}
              />
              {profileErrors.email?.message && (
                <p id="email-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.email.message}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label htmlFor="bio" className={styles['profile-form__label']}>
                Bio
              </label>
              <textarea
                id="bio"
                {...registerProfile('bio')}
                placeholder="Enter your bio"
                className={styles['profile-form__textarea']}
                rows={6}
                dir="auto"
                aria-describedby={profileErrors.bio ? 'bio-error' : undefined}
              />
              {profileErrors.bio?.message && (
                <p id="bio-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.bio.message}
                </p>
              )}
              <p className={styles['profile-form__bio-counter']}>
                {(bioValue?.length || 0)}/500 characters
              </p>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className={styles['profile-form__label']}>
                Address
              </label>
              <input
                id="address"
                {...registerProfile('address')}
                placeholder="Enter your address"
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.address ? 'address-error' : undefined}
              />
              {profileErrors.address?.message && (
                <p id="address-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.address.message}
                </p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className={styles['profile-form__label']}>
                Job Title
              </label>
              <input
                id="jobTitle"
                {...registerProfile('jobTitle')}
                placeholder="Enter your job title"
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.jobTitle ? 'jobTitle-error' : undefined}
              />
              {profileErrors.jobTitle?.message && (
                <p id="jobTitle-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.jobTitle.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className={styles['profile-form__label']}>
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                {...registerProfile('dateOfBirth')}
                className={styles['profile-form__input']}
                dir="auto"
                aria-describedby={profileErrors.dateOfBirth ? 'dateOfBirth-error' : undefined}
              />
              {profileErrors.dateOfBirth?.message && (
                <p id="dateOfBirth-error" className={styles['profile-form__error']} aria-live="polite">
                  {profileErrors.dateOfBirth.message}
                </p>
              )}
            </div>
          </div>

          {/* Privacy Checkbox */}
          <div className={styles['profile-form__checkbox-container']}>
            <input
              type="checkbox"
              {...registerProfile('isPrivate')}
              className={styles['profile-form__checkbox']}
              aria-label="Make profile private"
            />
            Make profile private
            {profileErrors.isPrivate?.message && (
              <p className={styles['profile-form__error']} aria-live="polite">
                {profileErrors.isPrivate.message}
              </p>
            )}
          </div>

          {/* Server Error (if any) */}
          {error.updateProfile && (
            <p className={styles['profile-form__server-error']} role="alert">
              {error.updateProfile}
            </p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading.updateProfile}
            className={styles['profile-form__button']}
            aria-label="Save profile changes"
          >
            {loading.updateProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>

        {/* Change Password Form */}
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className={styles['password-form']}
          aria-labelledby="change-password-section"
        >
          <h2 id="change-password-section" className={styles['password-form__title']}>
            Change Password
          </h2>

          <div className={styles['password-form__fields']}>
            {/* Old Password */}
            <div>
              <label htmlFor="oldPassword" className={styles['password-form__label']}>
                Old Password
              </label>
              <input
                id="oldPassword"
                type="password"
                {...registerPassword('oldPassword')}
                placeholder="Enter your old password"
                className={styles['password-form__input']}
                dir="auto"
                aria-describedby={passwordErrors.oldPassword ? 'oldPassword-error' : undefined}
              />
              {passwordErrors.oldPassword?.message && (
                <p id="oldPassword-error" className={styles['password-form__error']} aria-live="polite">
                  {passwordErrors.oldPassword.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className={styles['password-form__label']}>
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                placeholder="Enter your new password"
                className={styles['password-form__input']}
                dir="auto"
                aria-describedby={passwordErrors.newPassword ? 'newPassword-error' : undefined}
              />
              {passwordErrors.newPassword?.message && (
                <p id="newPassword-error" className={styles['password-form__error']} aria-live="polite">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className={styles['password-form__label']}>
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                placeholder="Confirm your new password"
                className={styles['password-form__input']}
                dir="auto"
                aria-describedby={passwordErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {passwordErrors.confirmPassword?.message && (
                <p id="confirmPassword-error" className={styles['password-form__error']} aria-live="polite">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Server Error */}
          {error.changePassword && (
            <p className={styles['password-form__server-error']} role="alert">
              {error.changePassword}
            </p>
          )}

          {/* Submit Button */}
          <div className="space-y-4 max-w-md mx-auto flex justify-end">
            <Button
              type="submit"
              disabled={loading.changePassword}
              className={styles['password-form__button']}
              aria-label="Change password"
            >
              {loading.changePassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </Suspense>
  );
});

EditProfilePagClient.displayName = 'EditProfilePagClient';

export default EditProfilePagClient;