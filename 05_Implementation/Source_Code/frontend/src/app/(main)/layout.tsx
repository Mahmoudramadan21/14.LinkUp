'use client';

import { ReactNode, Suspense, useEffect } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import Header from '@/components/ui/common/Header';
import Aside from '@/components/ui/common/Aside';
import { usePathname } from 'next/navigation';
import { useAppSocket } from '@/socket/useAppSocket';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { getConversationsThunk } from '@/store/messageSlice';
import AppLoader from '@/components/ui/common/AppLoader';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  useAppSocket();

  // Load conversations
  useEffect(() => {
    dispatch(getConversationsThunk({ page: 1, limit: 20 }));
  }, [dispatch]);

  const showSidebar = !pathname.includes('/messages');

  return (
    <AuthGuard>
      <Suspense fallback={<AppLoader />}>
        <div className="flex flex-col">
          <Header />
          <div className={`flex-1 ${showSidebar ? 'xl:grid xl:grid-cols-[77.5%_20%] xl:gap-6 container mx-auto mt-4' : ''}`}>
            <main className="flex-1">{children}</main>
            {showSidebar && <Aside />}
          </div>
        </div>
      </Suspense>
    </AuthGuard>
  );
};

export default MainLayout;
