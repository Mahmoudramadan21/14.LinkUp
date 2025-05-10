// layouts/MainLayout.tsx
import React from 'react';
import Head from 'next/head';
import HeaderSection from '@/sections/HeaderSection';
import UserMenu from '@/components/UserMenu'; // استيراد UserMenu
import { useProfileStore } from '@/store/profileStore'; // استيراد الـ Store لجلب بيانات المستخدم
import { removeAuthData } from '@/utils/auth'; // استيراد دالة الخروج

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = "LinkUp" }) => {
  const { authData, initializeAuth } = useProfileStore();

  // جلب بيانات المستخدم عند تحميل الـ Layout
  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // دالة الخروج
  const handleLogout = () => {
    removeAuthData();
    window.location.href = '/login'; // إعادة توجيه لصفحة الـ Login بعد الخروج
  };

  // التأكد من وجود بيانات المستخدم
  if (!authData) {
    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content="Connect with friends and share your moments on LinkUp." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta charSet="UTF-8" />
          <meta name="csrf-token" content="dummy-csrf-token" />
        </Head>
        <div>Loading...</div>
      </>
    );
  }

  const user = {
    name: authData.name || 'User', // اسم المستخدم
    username: authData.username || 'username', // الـ Username
    profilePicture: authData.profilePicture || '/avatars/default.jpg', // الصورة الشخصية
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Connect with friends and share your moments on LinkUp." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
        <meta name="csrf-token" content="dummy-csrf-token" />
      </Head>

      <div className="main-layout">
        {/* Header Section */}
        <HeaderSection />
        
        <div className="main-layout__content container">
          {/* Main Content */}
          <main className="main-layout__container">{children}</main>
          
          {/* Sidebar with UserMenu */}
          <aside className="main-layout__sidebar">
              <UserMenu user={user} onLogout={handleLogout} />
          </aside>
        </div>
      </div>
    </>
  );
};

export default MainLayout;