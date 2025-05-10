import React from 'react';
import Image from 'next/image';

const PrivateAccountNotice: React.FC = () => {
  return (
    <div className="private-account-notice flex flex-col items-center justify-center py-12 w-full bg-white rounded-lg">
      <Image
        src="/icons/locked-profile.svg"
        alt="Locked Profile Icon"
        width={48}
        height={48}
        className="mb-4"
      />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">This Account is Private</h2>
      <p className="text-gray-600 text-center">
        Follow this account to see their posts and activity.
      </p>
    </div>
  );
};

export default PrivateAccountNotice;