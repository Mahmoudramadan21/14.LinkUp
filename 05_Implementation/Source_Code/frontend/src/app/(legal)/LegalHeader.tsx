// app/legal/LegalHeader.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Image from 'next/image';
import Button from '@/components/ui/common/Button';
import { LogIn, User } from 'lucide-react';

const LegalHeader = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const isHelp = pathname === '/help';
  const isTerms = pathname === '/terms';
  const isPrivacy = pathname === '/privacy';

  return (
    <header className="sticky top-0 z-50 bg-[var(--section-bg)] border-b border-[var(--border-color)] backdrop-blur-sm">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link href={isAuthenticated ? "/feed" : "/login"} className="flex items-center gap-3">
          <Image
            src="/svgs/logo.svg"
            alt="LinkUp"
            width={100}
            height={36}
            className="dark:invert"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/help"
            className={`text-lg font-medium transition-colors ${
              isHelp
                ? 'text-[var(--linkup-purple)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--linkup-purple)]'
            }`}
          >
            Help Center
          </Link>
          <Link
            href="/terms"
            className={`text-lg font-medium transition-colors ${
              isTerms
                ? 'text-[var(--linkup-purple)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--linkup-purple)]'
            }`}
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className={`text-lg font-medium transition-colors ${
              isPrivacy
                ? 'text-[var(--linkup-purple)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--linkup-purple)]'
            }`}
          >
            Privacy Policy
          </Link>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href={`/${user?.username}`}
              className="flex items-center gap-3 text-[var(--text-primary)] hover:text-[var(--linkup-purple)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <span className="hidden md:block font-medium">{user?.username}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant='primary' className="flex items-center px-4 py-2 rounded-full bg-[var(--linkup-purple)] hover:bg-[var(--linkup-purple-light)] text-white transition-colors duration-medium">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" className="border-[var(--linkup-purple)] text-[var(--linkup-purple)] transition-colors duration-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-[var(--border-color)]">
        <nav className="flex">
          <Link
            href="/help"
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
              isHelp
                ? 'text-[var(--linkup-purple)] bg-[var(--card-bg)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Help Center
          </Link>
          <Link
            href="/terms"
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
              isTerms
                ? 'text-[var(--linkup-purple)] bg-[var(--card-bg)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
              isPrivacy
                ? 'text-[var(--linkup-purple)] bg-[var(--card-bg)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default LegalHeader;