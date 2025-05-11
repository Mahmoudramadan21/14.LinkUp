// 'use client';

// import React, { memo, useEffect, useState } from 'react';
// import Image from 'next/image';
// import { useProfileStore } from '@/store/profileStore';
// import { useRouter } from 'next/router';
// import Loading from './Loading';
// import Button from './Button';
// import FollowerFollowingDialog from './FollowerFollowingDialog';
// import PostCard from './PostCard';
// import Bio from './Bio';
// import PostModal from './PostModal';

// interface FollowingFollower {
//   userId: number;
//   username: string;
//   profileName: string;
//   profilePicture: string | null;
//   isPrivate: boolean;
//   bio: string | null;
// }

// interface Comment {
//   commentId: number;
//   userId: number;
//   username: string;
//   content: string;
//   createdAt: string;
// }

// interface Post {
//   postId: number;
//   content: string;
//   imageUrl: string | null;
//   videoUrl: string | null;
//   createdAt: string;
//   updatedAt: string;
//   user: {
//     UserID: number;
//     Username: string;
//     ProfilePicture: string;
//   };
//   likeCount: number;
//   commentCount: number;
// }

// const UserBanner: React.FC = () => {
//   const {
//     profile,
//     highlights,
//     savedPosts,
//     posts,
//     loading,
//     error,
//     highlightsLoading,
//     highlightsError,
//     savedPostsLoading,
//     savedPostsError,
//     postsLoading,
//     postsError,
//     fetchProfile,
//     fetchHighlights,
//     fetchSavedPosts,
//     fetchPosts,
//     followUser,
//     unfollowUser,
//     authData,
//     initializeAuth,
//     fetchFollowers,
//     fetchFollowing,
//   } = useProfileStore();
//   const router = useRouter();
//   const { username, tab } = router.query;

//   const [activeTab, setActiveTab] = useState<'menu' | 'saved'>('menu');
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [dialogType, setDialogType] = useState<'followers' | 'following'>('followers');
//   const [followersData, setFollowersData] = useState<FollowingFollower[]>([]);
//   const [followingData, setFollowingData] = useState<FollowingFollower[]>([]);
//   const [fetchingDialogData, setFetchingDialogData] = useState(false);
//   const [dialogError, setDialogError] = useState<string | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedPost, setSelectedPost] = useState<{
//     postId: number;
//     userId: number;
//     username: string;
//     profilePicture: string;
//     privacy: string;
//     content: string;
//     imageUrl: string | null;
//     videoUrl: string | null;
//     createdAt: string;
//     likeCount: number;
//     commentCount: number;
//     comments: Comment[];
//     isLiked: boolean;
//     likedBy: { username: string; profilePicture: string }[];
//   } | null>(null);

//   useEffect(() => {
//     if (tab === 'followers') {
//       setDialogType('followers');
//       setIsDialogOpen(true);
//     } else if (tab === 'following') {
//       setDialogType('following');
//       setIsDialogOpen(true);
//     } else {
//       setIsDialogOpen(false);
//     }
//   }, [tab]);

//   useEffect(() => {
//     initializeAuth();
//     if (username && typeof username === 'string') {
//       fetchProfile(username);
//     }
//   }, [username, fetchProfile, initializeAuth]);

//   useEffect(() => {
//     if (profile) {
//       fetchHighlights(profile.userId);
//       fetchPosts(profile.userId);
//       if (authData?.userId === profile.userId) {
//         fetchSavedPosts();
//       }
//     }
//   }, [profile, authData, fetchHighlights, fetchPosts, fetchSavedPosts]);

//   useEffect(() => {
//     if (profile && !followersData.length && !followingData.length) {
//       setFetchingDialogData(true);
//       setDialogError(null);
//       Promise.all([
//         fetchFollowers(profile.userId),
//         fetchFollowing(profile.userId),
//       ])
//         .then(([followersResponse, followingResponse]) => {
//           setFollowersData(followersResponse.followers || []);
//           setFollowingData(followingResponse.following || []);
//         })
//         .catch((err: any) => {
//           setDialogError(err.message || 'Failed to fetch followers or following');
//         })
//         .finally(() => {
//           setFetchingDialogData(false);
//         });
//     }
//   }, [profile, followersData.length, followingData.length, fetchFollowers, fetchFollowing]);

//   const handleEditProfile = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     if (!profile || profile.userId !== authData?.userId) {
//       alert('You can only edit your own profile.');
//       return;
//     }
//     router.push('/profile/edit');
//   };

//   const handleFollow = () => {
//     if (!profile) return;
//     followUser(profile.userId);
//   };

//   const handleUnfollow = () => {
//     if (!profile) return;
//     unfollowUser(profile.userId);
//   };

//   const handleMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     if (!profile) return;
//     router.push(`/messages/${profile.userId}`);
//   };

//   const handleTabChange = (tab: 'menu' | 'saved') => {
//     setActiveTab(tab);
//   };

//   const openDialog = (type: 'followers' | 'following', e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (profile) {
//       setDialogType(type);
//       setIsDialogOpen(true);
//       const newPath = `/profile/${username}?tab=${type}`;
//       router.push(newPath, undefined, { shallow: true });
//     }
//   };

//   const closeDialog = () => {
//     setIsDialogOpen(false);
//     const basePath = `/profile/${username}`;
//     router.replace(basePath, undefined, { shallow: true });
//   };

//   const handleViewHighlights = (userId: number) => {
//     router.push(`/profile/highlights/${userId}`);
//   };

//   const handlePostUpdate = (postId: number, updatedFields: any) => {
//     useProfileStore.setState((state) => ({
//       posts: state.posts.map((post) =>
//         post.postId === postId ? { ...post, ...updatedFields } : post
//       ),
//     }));
//   };

//   const handleOpenModal = (savedPost: any) => {
//   // Transform comments to match PostCard's expected structure
//   const transformedComments = (savedPost.Comments || []).map((comment: any) => ({
//     commentId: comment.CommentID,
//     userId: comment.UserID,
//     username: comment.User.Username || 'Unknown',
//     content: comment.Content,
//     createdAt: comment.CreatedAt,
//     profilePicture: comment.User.ProfilePicture || '/avatars/default.jpg',
//     isLiked: comment.isLiked || false,
//     likeCount: comment.likeCount || 0,
//     replies: (comment.Replies || []).map((reply: any) => ({
//       commentId: reply.CommentID,
//       userId: reply.UserID,
//       username: reply.User.Username || 'Unknown',
//       content: reply.Content,
//       createdAt: reply.CreatedAt,
//       profilePicture: reply.User.ProfilePicture || '/avatars/default.jpg',
//       isLiked: reply.isLiked || false,
//       likeCount: reply.likeCount || 0,
//     })),
//   }));

//   const transformedPost = {
//     postId: savedPost.PostID,
//     userId: savedPost.UserID,
//     username: savedPost.User.Username || 'Unknown',
//     profilePicture: savedPost.User.ProfilePicture || '/avatars/default.jpg',
//     privacy: savedPost.privacy,
//     content: savedPost.Content,
//     imageUrl: savedPost.ImageURL,
//     videoUrl: savedPost.VideoURL,
//     createdAt: savedPost.CreatedAt,
//     likeCount: savedPost.likeCount || 0,
//     commentCount: savedPost.commentCount || 0,
//     comments: transformedComments,
//     isLiked: savedPost.isLiked || false,
//     likedBy: savedPost.likedBy || [],
//   };
//   setSelectedPost(transformedPost);
//   setIsModalOpen(true);
// };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedPost(null);
//   };

//   if (loading) {
//     return <Loading />;
//   }

//   if (error) {
//     return (
//       <div className="user-banner__error" role="alert" aria-live="polite">
//         <p className="user-banner__error-text">{error}</p>
//       </div>
//     );
//   }

//   if (!profile) {
//     return (
//       <div className="user-banner__not-found" role="alert" aria-live="polite">
//         <p className="user-banner__not-found-text">Profile not found</p>
//       </div>
//     );
//   }

//   const isOwnProfile = authData?.userId === profile.userId;
//   const dialogData = dialogType === 'followers' ? followersData : followingData;

//   return (
//     <div className="user-banner relative">
//       {/* Cover Photo */}
//       <div className="user-banner__cover">
//         <Image
//           src={profile.coverPicture || '/cover-photos/sunset.jpg'}
//           alt={`${profile.username}'s cover photo`}
//           layout="fill"
//           objectFit="cover"
//           className="user-banner__cover-image"
//           loading="lazy"
//           onError={(e) => {
//             (e.target as HTMLImageElement).src = '/cover-photos/default.jpg';
//           }}
//         />
//         <button
//           onClick={handleEditProfile}
//           className="user-banner__edit-btn"
//           aria-label={`Edit ${profile.username}'s profile`}
//           disabled={!isOwnProfile}
//         >
//           Edit Profile
//         </button>
//         <div className="user-banner__info">
//           <div className="user-banner__profile-pic">
//             <Image
//               src={profile.profilePicture || '/avatars/placeholder.jpg'}
//               alt={`${profile.username}'s profile picture`}
//               layout="fill"
//               objectFit="cover"
//               className="user-banner__profile-image"
//               loading="lazy"
//               onError={(e) => {
//                 (e.target as HTMLImageElement).src = '/avatars/default.jpg';
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Combined Content Section */}
//       <div className="user-banner__content">
//         <div className="user-banner__details">
//           <h1 className="user-banner__name">{profile.username}</h1>
//           <p className="user-banner__username">@{profile.username}</p>
//         </div>

//         {/* Stats Section */}
//         <div className="user-banner__stats">
//           <div className="user-banner__stat">
//             <span className="user-banner__stat-label">Posts</span>
//             <span className="user-banner__stat-value">{profile.postCount}</span>
//           </div>
//           <div className="user-banner__stat">
//             <span className="user-banner__stat-label">Followers</span>
//             <button
//               type="button"
//               className="user-banner__stat-value cursor-pointer text-purple-600 hover:underline bg-transparent border-none p-0"
//               onClick={(e) => openDialog('followers', e)}
//               aria-label={`View ${profile.followerCount} followers`}
//             >
//               {profile.followerCount}
//             </button>
//           </div>
//           <div className="user-banner__stat">
//             <span className="user-banner__stat-label">Following</span>
//             <button
//               type="button"
//               className="user-banner__stat-value cursor-pointer text-purple-600 hover:underline bg-transparent border-none p-0"
//               onClick={(e) => openDialog('following', e)}
//               aria-label={`View ${profile.followingCount} following`}
//             >
//               {profile.followingCount}
//             </button>
//           </div>
//           <div className="user-banner__stat">
//             <span className="user-banner__stat-label">Likes</span>
//             <span className="user-banner__stat-value">{profile.likeCount}</span>
//           </div>
//         </div>

//         {!isOwnProfile && (
//           <div className="user-banner__actions">
//             <Button
//               onClick={profile.isFollowing ? handleUnfollow : handleFollow}
//               variant="primary"
//               size="medium"
//               disabled={loading}
//               aria-label={profile.isFollowing ? `Unfollow ${profile.username}` : `Follow ${profile.username}`}
//             >
//               {loading ? 'Processing...' : profile.isFollowing ? 'Unfollow' : 'Follow'}
//             </Button>
//             <Button
//               onClick={handleMessage}
//               variant="secondary"
//               size="medium"
//               aria-label={`Message ${profile.username}`}
//               className="user-banner__message-btn"
//             >
//               <Image
//                 src="/icons/message.svg"
//                 alt="Message Icon"
//                 width={48}
//                 height={48}
//                 className="user-banner__message-icon"
//               />
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Highlights Section */}
//       <div className="user-banner__highlights">
//         <h2 className="user-banner__highlights-title">Highlights</h2>
//         {highlightsLoading ? (
//           <Loading />
//         ) : highlightsError ? (
//           <p className="user-banner__highlights-error">{highlightsError}</p>
//         ) : highlights.length === 0 ? (
//           <p className="user-banner__highlights-empty">No highlights available</p>
//         ) : (
//           <div className="user-banner__highlights-list">
//             {highlights.map((highlight) => (
//               <div
//                 key={highlight.highlightId}
//                 className="user-banner__highlight-item cursor-pointer"
//                 onClick={() => handleViewHighlights(profile.userId)}
//               >
//                 <Image
//                   src={highlight.coverImage}
//                   alt={highlight.title}
//                   width={80}
//                   height={80}
//                   className="user-banner__highlight-image"
//                   loading="lazy"
//                   onError={(e) => {
//                     (e.target as HTMLImageElement).src = '/highlights/default.jpg';
//                   }}
//                 />
//                 <p className="user-banner__highlight-title">{highlight.title}</p>
//                 <p className="user-banner__highlight-count">
//                   {highlight.storyCount} Stories
//                 </p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Tabs Section */}
//       <div className="user-banner__tabs">
//         <button
//           onClick={() => handleTabChange('menu')}
//           className="user-banner__tab-btn"
//           aria-label="View Posts"
//         >
//           <Image
//             src={activeTab === 'menu' ? '/icons/menu-active.svg' : '/icons/menu.svg'}
//             alt="Menu Icon"
//             width={24}
//             height={24}
//             className="user-banner__tab-icon"
//           />
//         </button>
//         {isOwnProfile && (
//           <button
//             onClick={() => handleTabChange('saved')}
//             className="user-banner__tab-btn"
//             aria-label="View Saved Posts"
//           >
//             <Image
//               src={activeTab === 'saved' ? '/icons/saved.svg' : '/icons/save.svg'}
//               alt="Saved Icon"
//               width={24}
//               height={24}
//               className="user-banner__tab-icon"
//             />
//           </button>
//         )}
//       </div>

//       {/* Bio and Posts Section */}
//       {activeTab === 'menu' && (
//         <div className="user-banner__posts-section">
//           {/* Bio */}
//           <Bio
//             bio={profile.bio || ''}
//             jobTitle={profile.jobTitle || ''}
//             address={profile.address || ''}
//             dateOfBirth={profile.dateOfBirth || '1970-01-01T00:00:00.000Z'}
//           />

//           {/* Posts List */}
//           <div className="user-banner__posts-list">
//             {postsLoading ? (
//               <Loading />
//             ) : postsError ? (
//               <p className="user-banner__posts-error">{postsError}</p>
//             ) : !posts || posts.length === 0 ? (
//               <p className="user-banner__posts-empty">No posts available</p>
//             ) : (
//               posts.map((post) => (
//                 <PostCard
//                   key={post.postId}
//                   postId={post.postId}
//                   userId={post.user.UserID}
//                   username={post.user.Username}
//                   profilePicture={post.user.ProfilePicture}
//                   privacy={profile.isPrivate ? 'PRIVATE' : 'PUBLIC'}
//                   content={post.content}
//                   imageUrl={post.imageUrl}
//                   videoUrl={post.videoUrl}
//                   createdAt={post.createdAt}
//                   likeCount={post.likeCount}
//                   commentCount={post.commentCount}
//                   isLiked={false}
//                   likedBy={[]}
//                   comments={[]}
//                   onPostUpdate={handlePostUpdate}
//                 />
//               ))
//             )}
//           </div>
//         </div>
//       )}

//       {/* Saved Posts Section */}
//       {activeTab === 'saved' && isOwnProfile && (
//         <div className="user-banner__saved-posts">
//           <h2 className="user-banner__saved-posts-title">Saved Posts</h2>
//           {savedPostsLoading ? (
//             <Loading />
//           ) : savedPostsError ? (
//             <p className="user-banner__saved-posts-error">{savedPostsError}</p>
//           ) : !savedPosts || savedPosts.length === 0 ? (
//             <p className="user-banner__saved-posts-empty">No saved posts available</p>
//           ) : (
//             <div className="user-banner__saved-posts-grid">
//               {Array.isArray(savedPosts) ? (
//                 savedPosts.map((savedPost) => (
//                   <div
//                     key={savedPost.PostID}
//                     className="user-banner__saved-post-item cursor-pointer"
//                     onClick={() => handleOpenModal(savedPost)}
//                   >
//                     <Image
//                       src={savedPost.ImageURL || savedPost.VideoURL || '/saved-posts/default.jpg'}
//                       alt={`Saved post ${savedPost.PostID}`}
//                       width={200}
//                       height={200}
//                       className="user-banner__saved-post-image"
//                       loading="lazy"
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).src = '/saved-posts/default.jpg';
//                       }}
//                     />
//                   </div>
//                 ))
//               ) : (
//                 <p className="user-banner__saved-posts-error">Invalid saved posts data</p>
//               )}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Post Modal */}
//       {selectedPost && (
//         <PostModal
//           isOpen={isModalOpen}
//           onClose={handleCloseModal}
//           post={selectedPost}
//           onPostUpdate={handlePostUpdate}
//         />
//       )}

//       <FollowerFollowingDialog
//         isOpen={isDialogOpen}
//         onClose={closeDialog}
//         userId={profile.userId}
//         type={dialogType}
//         showSearch={true}
//         showRemove={isOwnProfile}
//         data={dialogData}
//         loading={fetchingDialogData}
//         error={dialogError}
//       />
//     </div>
//   );
// };

// export default memo(UserBanner);