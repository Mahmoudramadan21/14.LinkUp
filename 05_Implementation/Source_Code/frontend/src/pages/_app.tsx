import React from 'react';
import type { AppProps } from 'next/app';
import HeaderSection from '../sections/HeaderSection';
import '../styles/globals.css';
import StoriesSection from '@/sections/StoriesSection';
import PostCard from '@/components/PostCard';
import FollowRequests from '@/components/FollowRequests';
import UserMenu from '@/components/UserMenu';
import CreatePost from '@/components/CreatePost';
import Notifications from '@/components/Notifications';
import StoriesList from '@/components/StoriesList';
import StoryViewer from '@/components/StoryViewer';
import CreateStories from '@/components/CreateStories';
import Loading from '@/components/Loading';
import UserBanner from '@/components/UserBanner';

// Main App component for Next.js
const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;