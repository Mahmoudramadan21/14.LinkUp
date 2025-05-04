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

// Main App component for Next.js
const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  const handleShare = (story: {
    text: string;
    media?: File;
    backgroundColor?: string;
    textColor: string;
    position: { x: number; y: number };
    fontSize: number;
  }) => {
    console.log('Shared Story:', story);
  };

  const handleDiscard = () => {
    console.log('Discarded Story');
  };
  
  const storyData = {
    StoryID: 6,
    MediaURL: "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746179840/profile_pictures/user_2_profile.jpg",
    CreatedAt: "2025-05-04T18:04:30.363Z",
    ExpiresAt: "2025-05-05T18:04:30.361Z",
    User: {
      UserID: 1,
      Username: "john_doe",
      ProfilePicture: "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
      IsPrivate: false,
    },
    _count: {
      StoryLikes: 1,
      StoryViews: 1,
    },
    hasLiked: true,
  };

  const handleLike = (storyId: number) => {
    console.log(`Liked story ${storyId}`);
  };

  const handleReply = (storyId: number, reply: string) => {
    console.log(`Replied to story ${storyId}: ${reply}`);
  };

  return (
    <>
      <HeaderSection />
      <StoriesSection  />
      <PostCard  />
      <FollowRequests initialData={{
        "count": 3,
        "followRequests": [
          {
            "requestId": 14,
            "user": {
              "UserID": 1,
              "Username": "john_doe",
              "ProfilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
              "Bio": null
            },
            "createdAt": "2025-05-04T13:17:16.975Z"
          },
          {
            "requestId": 15,
            "user": {
              "UserID": 1,
              "Username": "john_doe",
              "ProfilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
              "Bio": null
            },
            "createdAt": "2025-05-04T13:17:16.975Z"
          },
          {
            "requestId": 16,
            "user": {
              "UserID": 1,
              "Username": "john_doe",
              "ProfilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
              "Bio": null
            },
            "createdAt": "2025-05-04T13:17:16.975Z"
          },
        ]
      }} />
      <UserMenu
        user={{
          name: 'Noor Ahmad',
          username: 'noor_ahmed',
          profilePicture: 'https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp',
        }}
        notifications={2}
        onLogout={() => {}}
    />
    <CreatePost  />
    <Notifications data={
      {
        notifications: [
          {
            notificationId: 72,
            type: "COMMENT_REPLY",
            content: "mahmoud10 replied to your comment",
            isRead: false,
            createdAt: "2025-05-04T12:39:05.396Z",
            sender: {
              userId: 42,
              username: "mahmoud10",
              profilePicture: null
            },
            metadata: {
              postId: 26,
              commentId: 9,
              replierId: 42,
              replierUsername: "mahmoud10"
            }
          },
          {
            notificationId: 72,
            type: "COMMENT_REPLY",
            content: "mahmoud10 replied to your comment",
            isRead: false,
            createdAt: "2025-05-04T12:39:05.396Z",
            sender: {
              userId: 42,
              username: "mahmoud10",
              profilePicture: null
            },
            metadata: {
              postId: 26,
              commentId: 9,
              replierId: 42,
              replierUsername: "mahmoud10"
            }
          },
          {
            notificationId: 72,
            type: "COMMENT_REPLY",
            content: "mahmoud10 replied to your comment",
            isRead: false,
            createdAt: "2025-05-04T12:39:05.396Z",
            sender: {
              userId: 42,
              username: "mahmoud10",
              profilePicture: null
            },
            metadata: {
              postId: 26,
              commentId: 9,
              replierId: 42,
              replierUsername: "mahmoud10"
            }
          },
          {
            notificationId: 72,
            type: "COMMENT_REPLY",
            content: "mahmoud10 replied to your comment",
            isRead: false,
            createdAt: "2025-05-04T12:39:05.396Z",
            sender: {
              userId: 42,
              username: "mahmoud10",
              profilePicture: null
            },
            metadata: {
              postId: 26,
              commentId: 9,
              replierId: 42,
              replierUsername: "mahmoud10"
            }
          },
          {
            notificationId: 72,
            type: "COMMENT_REPLY",
            content: "mahmoud10 replied to your comment",
            isRead: false,
            createdAt: "2025-05-04T12:39:05.396Z",
            sender: {
              userId: 42,
              username: "mahmoud10",
              profilePicture: null
            },
            metadata: {
              postId: 26,
              commentId: 9,
              replierId: 42,
              replierUsername: "mahmoud10"
            }
          },
        ],
        totalCount: 8,
        page: 1,
        totalPages: 1
      }
    } />
    <StoriesList data={
      [
        {
          "userId": 1,
          "username": "john_doe",
          "profilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
          "hasUnviewedStories": false,
          "stories": [
            {
              "storyId": 6,
              "createdAt": "2025-05-04T18:04:30.363Z",
              "isViewed": true
            }
          ]
        },
        {
          "userId": 1,
          "username": "john_doe",
          "profilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
          "hasUnviewedStories": false,
          "stories": [
            {
              "storyId": 6,
              "createdAt": "2025-05-04T18:04:30.363Z",
              "isViewed": true
            }
          ]
        },
        {
          "userId": 1,
          "username": "john_doe",
          "profilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
          "hasUnviewedStories": false,
          "stories": [
            {
              "storyId": 6,
              "createdAt": "2025-05-04T18:04:30.363Z",
              "isViewed": true
            }
          ]
        },
        {
          "userId": 1,
          "username": "john_doe",
          "profilePicture": "https://res.cloudinary.com/duw4x8iqq/image/upload/v1746144265/profile_pictures/user_1_profile.webp",
          "hasUnviewedStories": false,
          "stories": [
            {
              "storyId": 6,
              "createdAt": "2025-05-04T18:04:30.363Z",
              "isViewed": true
            }
          ]
        },
      ]
    } />
    <StoryViewer
      story={storyData}
      currentUserId={1} // Change to 1 to test as owner
      onLike={handleLike}
      onReply={handleReply}
    />

    <CreateStories
      user={{
        name: 'Noor Ahmad',
        username: 'noor_ahmed',
        profilePicture: '/avatars/placeholder.jpg',
      }}
      onShare={handleShare}
      onDiscard={handleDiscard}
    />
      <Component {...pageProps} />
    </>
  );
};

export default MyApp;