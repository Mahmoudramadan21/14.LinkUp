'use client';
import React from 'react';
import MainLayout from '@/layout/MainLayout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useProfileEdit } from '@/hooks/useProfileEdit';

/**
 * EditProfilePage Component
 * Allows users to update their profile information and change their password.
 * Optimized for SEO, accessibility, and performance with semantic HTML and ARIA attributes.
 */
const EditProfilePage: React.FC = () => {
  const {
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
  } = useProfileEdit();

  // Show loading state if profile or authData is not loaded yet
  if (!authData || !hasFetchedProfile) {
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