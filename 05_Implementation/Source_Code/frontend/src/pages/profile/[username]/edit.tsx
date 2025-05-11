'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/layout/MainLayout';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useProfileStore } from '@/store/profileStore';
import { changePassword, updateProfile } from '@/utils/api'; // استيراد updateProfile بدل api

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

  // Refs لـ Input الخفي لتحميل الصور
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const coverPictureInputRef = useRef<HTMLInputElement>(null);

  // جلب بيانات الملف الشخصي عند تحميل الصفحة
  useEffect(() => {
    if (typeof username === 'string') {
      fetchProfile(username);
    }
  }, [username, fetchProfile]);

  // ملء النموذج ببيانات الملف الشخصي
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

  // تحديث الـ Email بناءً على authData
  useEffect(() => {
    if (authData) {
      setFormData((prev) => ({ ...prev, email: authData.email || '' }));
    }
  }, [authData]);

  // التحقق من إن المستخدم هو صاحب الملف الشخصي
  useEffect(() => {
    if (authData && profile && authData.userId !== profile.userId) {
      router.push(`/profile/${username}`);
    }
  }, [authData, profile, router, username]);

  // التعامل مع تغيير ملفات الصور مع إضافة Preview
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));

      // عمل Preview للصورة
      const previewUrl = URL.createObjectURL(file);
      if (name === 'profilePicture') {
        setPreviewProfilePicture(previewUrl);
      } else if (name === 'coverPicture') {
        setPreviewCoverPicture(previewUrl);
      }
    }
  }, []);

  // تنظيف الـ Previews عند تغيير الصور أو تفريغ الكومبوننت
  useEffect(() => {
    return () => {
      if (previewProfilePicture) URL.revokeObjectURL(previewProfilePicture);
      if (previewCoverPicture) URL.revokeObjectURL(previewCoverPicture);
    };
  }, [previewProfilePicture, previewCoverPicture]);

  // التعامل مع تغيير الحقول النصية
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  // فتح Input الخفي عند الضغط على الصور
  const handleImageClick = (inputRef: React.RefObject<HTMLInputElement>, name: string) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  // التعامل مع تغيير الـ Radio Buttons
  const handlePrivacyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === 'private',
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  // التحقق من صحة النموذج (Information)
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email address';
    if (formData.dateOfBirth) {
      const parsedDate = new Date(formData.dateOfBirth);
      if (isNaN(parsedDate.getTime()) || !formData.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        newErrors.dateOfBirth = 'Invalid date of birth (use YYYY-MM-DD)';
      }
    }
    if (formData.profilePicture && formData.profilePicture.size > 5 * 1024 * 1024)
      newErrors.profilePicture = 'Profile picture must be less than 5MB';
    if (formData.coverPicture && formData.coverPicture.size > 5 * 1024 * 1024)
      newErrors.coverPicture = 'Cover picture must be less than 5MB';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // التحقق من صحة النموذج (Security)
  const validatePasswordForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validation for oldPassword
    if (!formData.oldPassword?.trim()) {
      newErrors.oldPassword = 'Current password is required';
    }

    // Validation for newPassword
    if (!formData.newPassword?.trim()) {
      newErrors.newPassword = 'New password is required';
    } else {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'New password must be at least 8 characters';
      }
      if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.newPassword)) {
        newErrors.newPassword = 'New password must contain both letters and numbers';
      }
      if (/[\s]/.test(formData.newPassword)) {
        newErrors.newPassword = 'New password cannot contain spaces';
      }
    }

    // Validation for confirmNewPassword
    if (!formData.confirmNewPassword?.trim()) {
      newErrors.confirmNewPassword = 'Confirm new password is required';
    } else if (formData.confirmNewPassword !== formData.newPassword) {
      newErrors.confirmNewPassword = 'Confirm new password must match new password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.oldPassword, formData.newPassword, formData.confirmNewPassword]);

  // إرسال النموذج (Information)
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      const response = await updateProfile(formDataToSend); // استخدام updateProfile
      setSuccessMessage(response.message);
      setTimeout(() => router.push(`/profile/${formData.username}`), 1500);
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, router]);

  // إرسال النموذج (Security - Change Password)
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    setErrors({});
    setSecuritySuccess(null);

    try {
      const response = await changePassword(formData.oldPassword || '', formData.newPassword || '');
      setSecuritySuccess(response.message); // Response will be something like "Password changed successfully"
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmNewPassword: '' }));
      setTimeout(() => setSecuritySuccess(null), 3000);
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  }, [formData.oldPassword, formData.newPassword, validatePasswordForm]);

  if (!profile) {
    return <div className="edit-profile__loading">Loading...</div>;
  }

  return (
    <MainLayout title={`Edit Profile | ${profile.username} - LinkUp`}>
      <div className="edit-profile">
        {/* قسم الصور في الأعلى */}
        <div className="edit-profile__header">
          <div
            className="edit-profile__cover relative"
            style={{
              backgroundImage: `url(${previewCoverPicture || profile.coverPicture || '/default-cover.jpg'})`,
            }}
            onClick={() => handleImageClick(coverPictureInputRef, 'coverPicture')}
          >
            <img
              src="/icons/edit.svg"
              alt="Edit Cover"
              className="absolute top-2 right-2 w-7 h-7 cursor-pointer bg-white p-1 rounded-full"
              onClick={() => handleImageClick(coverPictureInputRef, 'coverPicture')}
            />
            <div
              className="edit-profile__profile-picture relative"
              style={{
                backgroundImage: `url(${previewProfilePicture || profile.profilePicture || '/default-profile.jpg'})`,
              }}
              onClick={() => handleImageClick(profilePictureInputRef, 'profilePicture')}
            >
              <img
                src="/icons/edit.svg"
                alt="Edit Profile"
                className="absolute top-1 right-1 w-7 h-7 cursor-pointer bg-white p-1 rounded-full"
                onClick={() => handleImageClick(profilePictureInputRef, 'profilePicture')}
              />
            </div>
          </div>
          {/* Input الخفي لتحميل الصور */}
          <input
            type="file"
            ref={profilePictureInputRef}
            onChange={handleFileChange}
            name="profilePicture"
            accept="image/*"
            className="edit-profile__hidden-input"
          />
          <input
            type="file"
            ref={coverPictureInputRef}
            onChange={handleFileChange}
            name="coverPicture"
            accept="image/*"
            className="edit-profile__hidden-input"
          />
        </div>

        <h1 className="edit-profile__title">Edit Profile</h1>
        <div className="edit-profile__tabs">
          <a
            href="#account"
            className={`edit-profile__tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account Setting
          </a>
          <a
            href="#security"
            className={`edit-profile__tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </a>
        </div>

        {/* الـ Form الرئيسية لتحديث بيانات الملف الشخصي */}
        <form onSubmit={handleSubmit} className="edit-profile__form" noValidate>
          {activeTab === 'account' && (
            <>
              {/* Information Section */}
              <div className="edit-profile__section" id="account">
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
                      aria-required="true"
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
                      aria-required="true"
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
                      aria-required="true"
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
                  />
                </div>
              </div>

              {/* Privacy Section */}
              <div className="edit-profile__section" id="privacy">
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
              </div>
            </>
          )}

          {/* General Error Message */}
          {errors.general && activeTab === 'account' && (
            <div className="edit-profile__error-general" role="alert">
              {errors.general}
            </div>
          )}

          {/* Success Message */}
          {successMessage && activeTab === 'account' && (
            <div className="edit-profile__success" role="status">
              {successMessage}
            </div>
          )}

          {/* Buttons */}
          {activeTab === 'account' && (
            <div className="edit-profile__actions">
              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={isLoading}
                aria-label="Update your account"
              >
                {isLoading ? 'Saving...' : 'UPDATE YOUR ACCOUNT'}
              </Button>
            </div>
          )}
        </form>

        {/* قسم Security خارج الـ Form الرئيسية */}
        {(activeTab === 'security') && (
          <div className="edit-profile__section" id="security">
            <h2 className="edit-profile__section-title">Security</h2>
            <form onSubmit={handlePasswordSubmit} className="edit-profile__form" noValidate>
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
                    aria-required="true"
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
                    aria-required="true"
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
                    aria-required="true"
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={isLoading}
                aria-label="Change Password"
              >
                {isLoading ? 'Saving...' : 'Change Password'}
              </Button>
              {securitySuccess && (
                <div className="edit-profile__success" role="status">
                  {securitySuccess}
                </div>
              )}
              {errors.general && activeTab === 'security' && (
                <div className="edit-profile__error-general" role="alert">
                  {errors.general}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default React.memo(EditProfilePage);