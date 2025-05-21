'use client';
import React, { memo, useCallback } from 'react';
import ProfileLayout from '@/layout/ProfileLayout';
import PostCard from '@/components/PostCard';
import PostCardLoading from '@/components/PostCardLoading';
import PrivateAccountNotice from '@/components/PrivateAccountNotice';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStore } from '@/store/profileStore';
import Bio from '@/components/Bio';

const PostsPage: React.FC = () => {
  const { profile, authData, posts, postsLoading, postsError } = useProfileStore();
  const { handlePostUpdate } = useProfile();

  if (!profile) {
    return null; // Handled by ProfileLayout
  }

  const isOwnProfile = authData?.userId === profile.userId;

  return (
    <ProfileLayout>
      <section className="profile-page__posts-section" aria-labelledby="posts-title">
        {/* Bio Section */}
        <Bio
          bio={profile.bio || ''}
          jobTitle={profile.jobTitle || ''}
          address={profile.address || ''}
          dateOfBirth={profile.dateOfBirth || '1970-01-01T00:00:00.000Z'}
        />

        {profile.isPrivate && !isOwnProfile && profile.followStatus !== 'ACCEPTED' ? (
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
              posts.map((post) => (
                <PostCard
                  key={post.postId}
                  postId={post.postId}
                  userId={post.user.UserID}
                  username={post.user.Username}
                  profilePicture={post.user.ProfilePicture}
                  privacy={profile.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                  content={post.content}
                  imageUrl={post.imageUrl}
                  videoUrl={post.videoUrl}
                  createdAt={post.createdAt}
                  likeCount={post.likeCount}
                  commentCount={post.commentCount}
                  isLiked={false}
                  likedBy={[]}
                  comments={[]}
                  onPostUpdate={handlePostUpdate}
                />
              ))
            )}
          </article>
        )}
      </section>
    </ProfileLayout>
  );
};

export default memo(PostsPage);