// pages/profile/[username]/[tab].tsx
import React from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/layout/MainLayout';
import ProfilePage from "../[username].tsx"

const ProfileTabPage: React.FC = () => {
  const router = useRouter();
  const { username, tab } = router.query;

  return (
    <MainLayout title={`LinkUp | ${typeof username === 'string' ? username : 'Profile'} - ${typeof tab === 'string' ? tab : ''}`}>
      <ProfilePage />
    </MainLayout>
  );
};

export default ProfileTabPage;