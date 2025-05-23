import { FollowerFollowingData } from '@/types';

export const filterUsers = (data: FollowerFollowingData[], searchQuery: string): FollowerFollowingData[] => {
  return data.filter(
    (item) =>
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profileName &&
        item.profileName.toLowerCase().includes(searchQuery.toLowerCase()))
  );
};

export const getFocusableElements = (dialog: HTMLDialogElement): NodeListOf<HTMLElement> => {
  return dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
};