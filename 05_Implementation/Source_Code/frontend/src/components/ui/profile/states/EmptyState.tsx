'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-[var(--section-bg)] py-20 rounded-lg text-center">
      <ImageOff
        size={64}
        strokeWidth={1.5}
        className="text-gray-400 dark:text-gray-500 mb-4"
      />

      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-base max-w-sm">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
