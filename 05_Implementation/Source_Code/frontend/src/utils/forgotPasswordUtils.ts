export const getCsrfToken = (): string => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export const storeResetEmail = (email: string): void => {
  localStorage.setItem('resetEmail', email);
};