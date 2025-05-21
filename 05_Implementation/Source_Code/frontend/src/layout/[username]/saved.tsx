'use client';
import React, { memo, useCallback } from 'react';
import Image from 'next/image';
import ProfileLayout from '@/layout/ProfileLayout';
import PostModal from '@/components/PostModal';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStore } from '@/store/profileStore';

const SavedPostsPage: React.FC = () => {
  const { profile, authData, savedPosts, savedPostsLoading, savedPostsError } = useProfileStore();
  const { selectedPost, isModalOpen, handleOpenPostModal, handleCloseModal, handlePostUpdate } = useProfile();

  if (!profile || !authData || authData.userId !== profile.userId) {
    return null; // Handled by ProfileLayout or redirect if not own profile
  }

  return (
    <ProfileLayout>
      <section className="profile-page__saved-posts" aria-labelledby="saved-posts-title">
        <h2 id="saved-posts-title" className="profile-page__saved-posts-title">
          Saved Posts
        </h2>
        {savedPostsLoading ? (
          <div className="profile-page__loading">Loading...</div>
        ) : savedPostsError ? (
          <p className="profile-page__saved-posts-error">{savedPostsError}</p>
        ) : !savedPosts || savedPosts.length === 0 ? (
          <p className="profile-page__saved-posts-empty">No saved posts available</p>
        ) : (
          <div className="profile-page__saved-posts-grid">
            {Array.isArray(savedPosts) ? (
              savedPosts.map((savedPost) => (
                <div
                  key={savedPost.PostID}
                  className="profile-page__saved-post-item"
                  onClick={() => handleOpenPostModal(savedPost)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenPostModal(savedPost)}
                  aria-label={`View saved post ${savedPost.PostID}`}
                >
                  <Image
                    src={savedPost.ImageURL || savedPost.VideoURL || '/saved-posts/default.jpg'}
                    alt={`Saved post ${savedPost.PostID}`}
                    width={200}
                    height={200}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="profile-page__saved-post-image"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/saved-posts/default.jpg';
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="profile-page__saved-posts-error">Invalid saved posts data</p>
            )}
          </div>
        )}
        {selectedPost && (
          <PostModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            post={selectedPost}
            onPostUpdate={handlePostUpdate}
          />
        )}
      </section>
    </ProfileLayout>
  );
};

export default memo(SavedPostsPage);