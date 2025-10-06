'use client';

import UserListModal from '@/components/ui/modal/UserListModal';
import { useRouter, useParams } from 'next/navigation';

export default function FollowersPage() {
  const router = useRouter();
  const params = useParams();
  const username = typeof params?.username === 'string' ? params.username : '';

  if (typeof username !== 'string') {
    return <div className="p-6 text-center text-red-500">Invalid username</div>;
  }

  const handleClose = () => {
    if (typeof window === 'undefined') return; 
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${username}`);
    }
  };


  return (
    <UserListModal
      isOpen={true}
      onClose={handleClose}
      type="followers"
      id={username}
      title="Followers"
    />
  );
}