import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

// Main App component for Next.js
const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;