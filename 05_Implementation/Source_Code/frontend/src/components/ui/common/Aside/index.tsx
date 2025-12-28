'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';

import BookmarkIcon from "/public/icons/BookmarkIcon.svg";
import CompassIcon from "/public/icons/CompassIcon.svg";
import CogIcon from "/public/icons/CogIcon.svg";
import SignOutAltIcon from "/public/icons/SignOutAltIcon.svg";

import { RootState, AppDispatch } from '@/store';
import { logoutThunk } from '@/store/authSlice';

import styles from './aside.module.css';

/* -------------------------------------------------------------------------- */
/*                                 Sidebar (Aside)                            */
/* -------------------------------------------------------------------------- */

const Aside = memo(() => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  const handleLogout = useCallback(async () => {
    await dispatch(logoutThunk()).unwrap();
    window.location.href = '/login';
  }, [dispatch]);

  const sidebarLinks = [
    { href: `/${user?.username || ''}/saved`, icon: <BookmarkIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Saved' },
    { href: '/explore', icon: <CompassIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Explore' },
    { href: '/edit', icon: <CogIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Settings' },
    { href: '#', icon: <SignOutAltIcon className="w-6 h-6" aria-hidden="true"/>, label: 'Logout', onClick: handleLogout },
  ];

  return (
    <aside className={`${styles['aside__container']} h-fit hidden xl:flex`} role="complementary" aria-label="User sidebar">
      {user && (
        <Link href={`/${user.username}`} className={styles['aside__user']}>
          <Image
            src={user.profilePicture || '/avatars/default-avatar.svg'}
            alt=""
            width={48}
            height={48}
            className={styles['aside__avatar']}
          />
          <div className={styles['aside__user-info']}>
            <span className={styles['aside__name']}>{user.profileName || 'User'}</span>
            <span className={styles['aside__username']}>@{user.username}</span>
          </div>
        </Link>
      )}

      <nav className={styles['aside__nav']} aria-label="User actions">
        {sidebarLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            prefetch={link.href !== '#'}
            onClick={link.onClick}
            className={`${styles['aside__nav-link']} ${pathname === link.href ? styles['aside__nav-link--active'] : ''} ${link.label === "Logout" ? styles["aside__nav-link--logout"]: ""}`}
            aria-current={pathname === link.href ? 'page' : undefined}
          >
            {link.icon}
            <span className={styles['aside__nav-label']}>{link.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-2 ml-auto px-4 text-[11px] text-[var(--text-secondary)] flex items-center space-x-2">
        <Link href="/help" className="hover:underline">Help</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <span>•</span>
        <Link href="/terms" className="hover:underline">Terms</Link>
      </div>

    </aside>
  );
});
Aside.displayName = 'Aside';

export default Aside;