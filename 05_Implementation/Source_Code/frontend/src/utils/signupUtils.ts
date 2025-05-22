export const getCsrfToken = (): string => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export const formatDateOfBirth = (dateOfBirth: string): string => {
  return new Date(dateOfBirth).toISOString().split('T')[0];
};