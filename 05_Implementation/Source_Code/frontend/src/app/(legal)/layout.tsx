// app/legal/layout.tsx
import LegalHeader from './LegalHeader';
import { ReactNode } from 'react';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LegalHeader />
      <main className="min-h-screen bg-[var(--app-bg)]">
        {children}
      </main>
    </>
  );
}