import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LinkUp',
  description: 'A social media platform to connect and share moments.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}