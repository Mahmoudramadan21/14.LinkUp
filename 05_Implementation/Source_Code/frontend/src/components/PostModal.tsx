'use client';

import React from 'react';
import PostCard from './PostCard';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    postId: number;
    userId: number;
    username: string;
    profilePicture: string;
    privacy: string;
    content: string;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    comments: { commentId: number; userId: number; username: string; content: string; createdAt: string }[];
    isLiked: boolean;
    likedBy: { username: string; profilePicture: string }[];
  };
  onPostUpdate: (postId: number, updatedFields: any) => void; // أضفنا Prop لتحديث البوست
}

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, post, onPostUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* PostCard */}
        <PostCard
          postId={post.postId}
          userId={post.userId}
          username={post.username}
          profilePicture={post.profilePicture}
          privacy={post.privacy}
          content={post.content}
          imageUrl={post.imageUrl}
          videoUrl={post.videoUrl}
          createdAt={post.createdAt}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          isLiked={post.isLiked}
          likedBy={post.likedBy}
          comments={post.comments || []}
          onPostUpdate={onPostUpdate} // مررنا الـ onPostUpdate
        />
      </div>
    </div>
  );
};

export default PostModal;