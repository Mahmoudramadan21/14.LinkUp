import { ProfileFormData, ProfileFormErrors } from '@/types';

// Validate account form data
export const validateAccountForm = (formData: ProfileFormData, setErrors: (errors: ProfileFormErrors) => void): boolean => {
  const newErrors: ProfileFormErrors = {};

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
};

// Validate password form data
export const validatePasswordForm = (formData: ProfileFormData, setErrors: (errors: ProfileFormErrors) => void): boolean => {
  const newErrors: ProfileFormErrors = {};

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
};