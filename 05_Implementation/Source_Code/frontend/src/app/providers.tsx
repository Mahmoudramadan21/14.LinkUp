// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import store from '@/store';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"          
        defaultTheme="system"      
        enableSystem                
        enableColorScheme           
        storageKey="theme"   
      >
        {children}
      </ThemeProvider>
    </Provider>
  );
}