'use client';
import React, { memo } from 'react';
import Image from 'next/image';
import Loading from '@/components/Loading';
import PostModal from '@/components/PostModal';
import { useProfileStore } from '@/store/profileStore';
import { ProfileStoreProfile, ProfileStoreAuthData, Post, SavedPost } from '@/types';

interface SavedPostsPageProps {
  profile: ProfileStoreProfile | null;
  authData: ProfileStoreAuthData | null;
  selectedPost: Post | null;
  isModalOpen: boolean;
  handleCloseModal: () => void;
  handleOpenPostModal: (savedPost: SavedPost) => void; // Add to props interface
}

const SavedPostsPage: React.FC<SavedPostsPageProps> = ({
  profile,
  authData,
  selectedPost,
  isModalOpen,
  handleCloseModal,
  handleOpenPostModal, // Destructure from props
}) => {
  const { savedPosts, savedPostsLoading, savedPostsError } = useProfileStore();

  const handlePostUpdate = (postId: number, updatedFields: Partial<Post>) => {
    useProfileStore.setState((state) => ({
      savedPosts: state.savedPosts.map((post) =>
        post.PostID === postId ? { ...post, ...updatedFields } : post
      ),
    }));
  };

  const isOwnProfile = authData?.userId === profile?.userId;

  if (!isOwnProfile) {
    return (
      <section className="profile-page__saved-posts" aria-labelledby="saved-posts-title">
        <p className="profile-page__saved-posts-error">You can only view your own saved posts.</p>
      </section>
    );
  }

  return (
    <>
      <section className="profile-page__saved-posts" aria-labelledby="saved-posts-title">
        <h2 id="saved-posts-title" className="profile-page__saved-posts-title">
          Saved Posts
        </h2>
        {savedPostsLoading ? (
          <Loading />
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
      </section>

      {selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          post={selectedPost}
          onPostUpdate={handlePostUpdate}
        />
      )}
    </>
  );
};

export default memo(SavedPostsPage);