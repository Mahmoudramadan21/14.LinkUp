// app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css'; // Adjust path if your CSS is elsewhere
import { ReactNode } from 'react';

// Define metadata for SEO
export const metadata: Metadata = {
  title: 'LinkUp',
  description: 'A social media platform to connect and share moments.',
};

// Root layout component
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}