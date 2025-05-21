'use client';
import React, { memo } from 'react';
import Bio from '@/components/Bio';
import PostCard from '@/components/PostCard';
import PostCardLoading from '@/components/PostCardLoading';
import PrivateAccountNotice from '@/components/PrivateAccountNotice';
import PostModal from '@/components/PostModal';
import { useProfileStore } from '@/store/profileStore';
import { useAppStore } from '@/store/feedStore';
import { Post } from '@/types';

interface PostsPageProps {
  authData: any;
  selectedPost: Post | null;
  isModalOpen: boolean;
  handleOpenPostModal: (post: any) => void;
  handleCloseModal: () => void;
}

const PostsPage: React.FC<PostsPageProps> = ({
  authData,
  selectedPost,
  isModalOpen,
  handleOpenPostModal,
  handleCloseModal,
}) => {
  const { profile, posts, postsLoading, postsError } = useProfileStore();

  const isOwnProfile = authData?.userId === profile?.userId;

  console.log('PostsPage component loaded');
  console.log('PostsPage props:', { profile, authData, selectedPost, isModalOpen });

  return (
    <>
      <section className="profile-page__posts-section" aria-labelledby="posts-title">
        <Bio
          bio={profile?.bio || ''}
          jobTitle={profile?.jobTitle || ''}
          address={profile?.address || ''}
          dateOfBirth={profile?.dateOfBirth || '1970-01-01T00:00:00.000Z'}
        />

        {profile?.isPrivate && !isOwnProfile && profile?.followStatus !== 'ACCEPTED' ? (
          <PrivateAccountNotice />
        ) : (
          <article className="profile-page__posts-list">
            {postsLoading ? (
              <div className="posts-list">
                {[...Array(3)].map((_, index) => (
                  <PostCardLoading key={`loading-${index}`} />
                ))}
              </div>
            ) : postsError ? (
              <p className="profile-page__posts-error">{postsError}</p>
            ) : !posts || posts.length === 0 ? (
              <p className="profile-page__posts-empty">No posts available</p>
            ) : (
              posts.map((post) => {
                // Determine initial values for isLiked and likedBy based on authData
                const isLiked = post.likedBy?.some(
                  (user: any) => user.userId === authData?.userId
                ) || false;
                const likedBy = post.likedBy || [];
                // Transform Comments to match PostCard structure expected by feed
                const comments = post.Comments?.map((comment) => ({
                  commentId: comment.CommentID,
                  userId: comment.UserID,
                  username: comment.User.Username,
                  profilePicture: comment.User.ProfilePicture || '/avatars/placeholder.jpg',
                  content: comment.Content,
                  createdAt: comment.CreatedAt,
                  isLiked: comment.isLiked || false,
                  likeCount: comment.likeCount || comment._count?.CommentLikes || 0,
                  likedBy: comment.likedBy || [],
                  replies: comment.Replies?.map((reply) => ({
                    commentId: reply.CommentID,
                    userId: reply.UserID,
                    username: reply.User.Username,
                    profilePicture: reply.User.ProfilePicture || '/avatars/placeholder.jpg',
                    content: reply.Content,
                    createdAt: reply.CreatedAt,
                    isLiked: reply.isLiked || false,
                    likeCount: reply.likeCount || 0,
                    likedBy: reply.likedBy || [],
                    replyingToUsername: reply.Content.startsWith('@') ? reply.Content.split(' ')[0].slice(1) : null,
                  })) || [],
                })) || [];

                return (
                  <div key={post.postId}>
                    <PostCard
                      postId={post.postId}
                      userId={post.user?.UserID || post.userId}
                      username={post.user?.Username || post.username}
                      profilePicture={post.user?.ProfilePicture || post.profilePicture}
                      privacy={profile?.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                      content={post.content}
                      imageUrl={post.imageUrl}
                      videoUrl={post.videoUrl}
                      createdAt={post.createdAt}
                      likeCount={post.likeCount || 0}
                      commentCount={post.commentCount || 0}
                      isLiked={isLiked}
                      likedBy={likedBy}
                      comments={comments}
                      onPostUpdate={useAppStore.getState().handlePostUpdate} // Align with feed/index.tsx
                    />
                  </div>
                );
              })
            )}
          </article>
        )}
      </section>

      {selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          post={selectedPost}
          onPostUpdate={useAppStore.getState().handlePostUpdate} // Align with feed/index.tsx
        />
      )}
    </>
  );
};

export default memo(PostsPage);