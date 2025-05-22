export const getCsrfToken = (): string => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export const getResetToken = (): string => {
  return localStorage.getItem('resetToken') || '';
};

export const clearResetStorage = (): void => {
  localStorage.removeItem('resetToken');
  localStorage.removeItem('resetEmail');
};