'use client';

// import { MainLayout } from '@/layout/MainLayout';
import MainLayout from '@/layout/MainLayout';
import { ReactNode } from 'react';
import '@/styles/globals.css'; // Assuming you have global styles

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}