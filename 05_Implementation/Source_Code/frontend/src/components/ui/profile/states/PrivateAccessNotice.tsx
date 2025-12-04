'use client';

import React from 'react';

interface PrivateAccessNoticeProps {
  username: string;
  onFollow?: () => void;
}

const PrivateAccessNotice: React.FC<PrivateAccessNoticeProps> = ({ username }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[var(--section-bg)] rounded-lg px-6 py-16 shadow-md">
      <svg
        className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.209 0-4 1.791-4 4v1h8v-1c0-2.209-1.791-4-4-4z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]  mb-2">
        Private Account
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
        This account&apos;s posts are private. Follow @{username} to see their content.
      </p>
    </div>
  );
};

export default PrivateAccessNotice;