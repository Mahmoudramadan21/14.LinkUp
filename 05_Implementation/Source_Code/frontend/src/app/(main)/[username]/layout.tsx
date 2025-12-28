'use client';

import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';

import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import {
  getProfileByUsernameThunk,
  setCurrentProfileUsername,
  clearError,
  followUserThunk,
  unfollowUserThunk,
} from '@/store/profileSlice';

import {
  getUserHighlightsThunk,
  clearError as clearHighlightError,
} from '@/store/highlightSlice';

import { clearError as clearStoryError } from '@/store/storySlice';
import { deletePostThunk } from '@/store/postSlice';
import { startConversationThunk } from '@/store/messageSlice';

import { Profile } from '@/types/profile';

import styles from '@/app/(main)/[username]/profile.module.css';
import storiesStyles from '@/app/(main)/(feed-search)/feed/stories.module.css';

import CreateHighlightAvatar from '@/components/ui/profile/highlights/CreateHighlightAvatar';
import PostsGrid from '@/components/ui/profile/sections/PostsGrid';
import ProfileHeaderSkeleton from '@/components/ui/profile/sections/ProfileHeaderSkeleton';
import BioSkeleton from '@/components/ui/profile/sections/BioSkeleton';
import ProfileNotFound from '@/components/ui/profile/states/ProfileNotFound';

import CreatePostTrigger from '@/components/ui/post/CreatePostTrigger';
import CreatePostModal from '@/components/ui/post/modals/CreatePostModal';
import EditPostModal from '@/components/ui/post/modals/EditPostModal';
import PostModal from '@/components/ui/post/modals/PostModal';
import ShareModal from '@/components/ui/post/modals/ShareModal';
import CreatingPostIndicator from '@/components/ui/post/CreatingPostIndicator';

import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import ReportModal from '@/components/ui/modal/ReportModal';
import UserListModal from '@/components/ui/modal/UserListModal';

import {
  FaSpinner,
} from "react-icons/fa";

import GridIcon from "/public/icons/GridIcon.svg"
import BookmarkIcon from "/public/icons/BookmarkIcon.svg"

import MapMarkerAlt from "/public/icons/MapMarkerAlt.svg"
import CalendarAlt from "/public/icons/CalendarAlt.svg"
import Briefcase from "/public/icons/Briefcase.svg"
import TruncatedText from '@/components/ui/common/TruncatedText';

/**
 * ProfileLayout component serves as the main layout for user profiles.
 * It manages fetching profile data, highlights, and various modals for post interactions.
 * 
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render within the layout.
 * @returns {JSX.Element} The rendered profile layout.
 */
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extract username from URL parameters
  const { username } = useParams<{ username: string }>();

  // Redux hooks for dispatch and state selection
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  // Selectors for profile, highlights, stories, auth, posts, and messages
  const {
    profiles,
    loading: profileLoading,
    error: profileError,
  } = useSelector((state: RootState) => state.profile);
  const { highlightsByUsername, loading: highlightLoading, error: highlightError } = useSelector(
    (state: RootState) => state.highlight
  );
  const { error: storyError } = useSelector((state: RootState) => state.story);
  const { user, error: authError } = useSelector((state: RootState) => state.auth);
  const { usersPosts, savedPosts, error: postError, loading: { createPost: createPostLoading, reportPost: reportPostLoading } } = useSelector((state: RootState) => state.post);
  const { loading: messageLoading } = useSelector((state: RootState) => state.message);

  // Derive profile and highlights data
  const profile: Profile | null = username
    ? profiles[username] || null
    : null;
  const highlightsData = highlightsByUsername[username] || { highlights: [], pagination: null };
  const highlights = highlightsData.highlights || [];
  const hasMoreHighlights = highlightsData.pagination
    ? highlightsData.pagination.page < highlightsData.pagination.totalPages
    : false;

  // Determine posts to display based on pathname
  const postsToShow = pathname.endsWith('/saved')
    ? savedPosts
    : usersPosts.find((up) => up.username === username)?.posts || [];

  // Refs for infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const highlightSentinelRef = useRef<HTMLDivElement>(null);

  // State for preselected media in create post modal
  const [preselectedMedia, setPreselectedMedia] = useState<{
    file: File | null;
    isVideo: boolean;
  }>({
    file: null,
    isVideo: false,
  });

  // States for various modals
  const [showCommentForm, setShowCommentForm] = useState<number | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [showUserListModal, setShowUserListModal] = useState<number | null>(null);
  const [showPostModal, setShowPostModal] = useState<number | null>(null);

  /**
   * Handles media selection from the create post trigger and opens the create modal.
   * 
   * @param {File} file - The selected media file.
   * @param {boolean} isVideo - Indicates if the selected file is a video.
   */
  const handleMediaFromTrigger = (file: File, isVideo: boolean) => {
    setPreselectedMedia({ file, isVideo });
    setShowCreateModal(true);
  };

  // Effect to fetch profile and highlights if not already loaded
  useEffect(() => {
    if (!profiles[username]) {
      dispatch(getProfileByUsernameThunk(username));
    }
    if (!highlightsByUsername[username]) {
      dispatch(getUserHighlightsThunk({ username, params: { limit: 15, offset: 0 } }));
    }

    // Cleanup function to clear errors and reset current profile
    return () => {
      dispatch(clearError('getProfile'));
      dispatch(clearHighlightError('getUserHighlights'));
      dispatch(setCurrentProfileUsername(null));
    };
  }, [dispatch, username, profiles, highlightsByUsername]);

  // Effect for infinite scrolling of highlights
  useEffect(() => {
    if (!hasMoreHighlights || highlightLoading.getUserHighlights) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          dispatch(
            getUserHighlightsThunk({
              username,
              params: {
                limit: highlightsData.pagination?.limit || 15,
                offset: (highlightsData.pagination?.page || 0) * (highlightsData.pagination?.limit || 15),
              },
            })
          );
        }
      },
      { threshold: 0.1 }
    );

    if (highlightSentinelRef.current) {
      observerRef.current.observe(highlightSentinelRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current && highlightSentinelRef.current) {
        observerRef.current.unobserve(highlightSentinelRef.current);
      }
    };
  }, [dispatch, username, hasMoreHighlights, highlightLoading.getUserHighlights, highlightsData.pagination]);

  // Effect to clear errors from various Redux slices
  useEffect(() => {
    if (profileError.getProfile) {
      dispatch(clearError('getProfile'));
    }
    if (highlightError.getUserHighlights) {
      dispatch(clearHighlightError('getUserHighlights'));
    }
    if (storyError.toggleStoryLike) {
      dispatch(clearStoryError('toggleStoryLike'));
    }
    if (storyError.deleteStory) {
      dispatch(clearStoryError('deleteStory'));
    }
    if (authError) {
      dispatch({ type: 'auth/clearError' });
    }
    if (postError.getUserPosts || postError.getSavedPosts) {
      dispatch({ type: 'post/clearError', payload: postError.getUserPosts ? 'getUserPosts' : 'getSavedPosts' });
    }
  }, [
    profileError.getProfile,
    highlightError.getUserHighlights,
    storyError.toggleStoryLike,
    storyError.deleteStory,
    authError,
    postError.getUserPosts,
    postError.getSavedPosts,
    dispatch,
  ]);

  /**
   * Toggles following the current profile user.
   */
  const handleFollowToggle = () => {
    if (!profile) return;
    dispatch(followUserThunk(profile.userId));
  };

  /**
   * Toggles unfollowing the current profile user.
   */
  const handleUnfollowToggle = () => {
    if (!profile) return;
    dispatch(unfollowUserThunk(profile.userId));
  };

  /**
   * Navigates to the profile edit page.
   */
  const handleEditProfile = () => {
    router.push('/edit');
  };

  /**
   * Navigates to view a specific highlight.
   * 
   * @param {number} highlightId - The ID of the highlight to view.
   */
  const handleViewHighlight = (highlightId: number) => {
    router.push(`/${username}/highlights/${highlightId}`, { scroll: false });
  };

  /**
   * Navigates to the user's posts page.
   */
  const handleNavigateToPosts = () => {
    router.push(`/${username}`);
  };

  /**
   * Navigates to the followers list page.
   */
  const handleNavigateToFollowers = () => {
    router.push(`/${username}/followers`);
  };

  /**
   * Navigates to the following list page.
   */
  const handleNavigateToFollowing = () => {
    router.push(`/${username}/following`);
  };

  /**
   * Handles messaging: navigates to existing conversation or starts a new one.
   */
  const handleMessageClick = async () => {
    if (!profile) return;

    if (profile.conversationId) {
      router.push(`/messages/${profile.conversationId}`);
    } else {
      const result = await dispatch(startConversationThunk({ participantId: profile.userId }));
      if (startConversationThunk.fulfilled.match(result)) {
        const newConversationId = result.payload.conversationId;
        router.push(`/messages/${newConversationId}`);
      } else {
        // Error handled silently in production
      }
    }
  };
  

  // Determine if current path is for saved posts or regular posts
  const isSavedPath = pathname.endsWith('/saved');
  const isPostsPath = !isSavedPath && pathname === `/${username}`;

  // Render not found if profile doesn't exist and not loading
  if ((!profile && !profileLoading.getProfile) || profileError.getProfile) {
    return <ProfileNotFound username={username} />;
  }

  return (
    <div className={styles["bg-[var(--app-bg)]"]}>
      <header>
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          {profileLoading.getProfile ? (
            <ProfileHeaderSkeleton />
          ) : profileError.getProfile || !profile ? (
            <div className={styles["profile-header__not-found"]}>
              <p className={styles["profile-header__not-found-text"]}>
                {profileError.getProfile || 'Profile not found'}
              </p>
            </div>
          ) : (
            <div className={styles["profile-header__container"]}>
              {/* Profile header with cover and profile picture */}
              <div className={styles["profile-header__header"]}>
                <div className={styles["profile-header__cover"]}>
                  {profile.coverPicture ? (
                    <Image
                      src={profile.coverPicture}
                      alt="Cover"
                      fill
                      priority
                      className={styles["profile-header__cover-image"]}
                    />
                  ) : (
                    <div className={styles["profile-header__cover-placeholder"]} />
                  )}
                  {profile.isMine && (
                    <button
                      onClick={handleEditProfile}
                      className={styles["profile-header__edit-btn"]}
                      aria-label="Edit Profile"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                <div className={styles["profile-header__info"]}>
                  {profile.hasActiveStories && (profile.hasAccess || profile.isMine) ? (
                    <Link
                      href={`/${username}/stories`}
                      className={`${storiesStyles["stories__avatar_ring"]} 
                      ${profile.hasUnViewedStories && profile.hasActiveStories ? storiesStyles["stories__avatar_ring_unviewed"] : ''}
                      ${styles["profile-header__profile-pic"]}`}
                      data-unviewed={profile.hasUnViewedStories && profile.hasActiveStories ? 'true' : 'false'}
                      aria-label={`View ${profile.username}'s stories`}
                      prefetch={false}
                      scroll={false}
                    >
                      <Image
                        src={profile.profilePicture || '/avatars/default-avatar.svg'}
                        alt={profile.username}
                        width={150}
                        height={150}
                        priority
                        className={`
                          ${styles["profile-header__profile-image"]}
                          ${profile.hasActiveStories && !profile.hasUnViewedStories ? storiesStyles["stories__avatar"] : ''}
                        `}
                      />
                    </Link>
                  ) : (
                    <div
                      className={`${storiesStyles["stories__avatar_ring"]} 
                      ${profile.hasUnViewedStories && profile.hasActiveStories && (profile.hasAccess || profile.isMine) ? storiesStyles["stories__avatar_ring_unviewed"] : ''}
                      ${styles["profile-header__profile-pic"]}`}
                    >
                      <Image
                        src={profile.profilePicture || '/avatars/default-avatar.svg'}
                        alt={profile.username}
                        width={150}
                        height={150}
                        priority
                        className={`${styles["profile-header__profile-image"]} ${
                          profile.hasActiveStories && !profile.hasUnViewedStories
                            ? storiesStyles["stories__avatar"]
                            : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile details, stats, and actions */}
              <div className={styles["profile-header__content"]}>
                <div className={styles["profile-header__details"]}>
                  <h1 className={styles["profile-header__name"]}>
                    {profile.profileName || profile.username}
                  </h1>
                  <p className={styles["profile-header__username"]}>
                    @{profile.username}
                  </p>
                  {profile.followedBy.length > 0 && (
                    <div className={styles["profile-header__followed-by"]}>
                      <span>Followed by </span>
                      {profile.followedBy.slice(0, 2).map((follower, index) => (
                        <span key={follower.userId}>
                          <Link
                            href={`/${follower.username}`}
                            className={styles["profile-header__followed-by-link"]}
                            aria-label={`View ${follower.profileName || follower.username}'s profile`}
                          >
                            {follower.username || follower.profileName}
                          </Link>
                          {index < profile.followedBy.length - 1 && index < 1 && ', '}
                        </span>
                      ))}
                      {profile.followedBy.length > 2 && (
                        <span> and {profile.followedBy.length - 2} others</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles["profile-header__stats"]}>
                  <div className={styles["profile-header__stat__item"]}>
                    <button
                      className={styles["profile-header__stat_value"]}
                      onClick={handleNavigateToPosts}
                      aria-label="View posts"
                    >
                      {profile.postCount}
                    </button>
                    <span className={styles["profile-header__stat_label"]}>Posts</span>
                  </div>
                  <div className={styles["profile-header__stat__item"]}>
                    <button
                      className={styles["profile-header__stat_value"]}
                      onClick={handleNavigateToFollowers}
                      aria-label="View followers"
                    >
                      {profile.followerCount}
                    </button>
                    <span className={styles["profile-header__stat_label"]}>Followers</span>
                  </div>
                  <div className={styles["profile-header__stat__item"]}>
                    <button
                      className={styles["profile-header__stat_value"]}
                      onClick={handleNavigateToFollowing}
                      aria-label="View following"
                    >
                      {profile.followingCount}
                    </button>
                    <span className={styles["profile-header__stat_label"]}>Following</span>
                  </div>
                </div>
                {!profile.isMine && (
                  <div className={styles["profile-header__actions"]}>
                    <button
                      onClick={() => {
                        if (profile.followStatus === "PENDING" || profile.isFollowed) {
                          handleUnfollowToggle(); 
                        } else {
                          handleFollowToggle();
                        }
                      }}
                      disabled={
                        profileLoading.followUser[profile.userId] ||
                        profileLoading.unfollowUser[profile.userId]
                      }
                     className={`${
                        profile.isFollowed === true
                          ? "btn-unfollow"
                          : profile.followStatus === "PENDING"
                          ? "btn-pending"
                          : "btn-follow"
                     } ml-0`}
                      aria-label={
                        profile.isFollowed
                          ? "Unfollow"
                          : profile.followStatus === "PENDING"
                          ? "Cancel follow request"
                          : "Follow"
                      }
                    >
                      {profileLoading.followUser[profile.userId] ||
                      profileLoading.unfollowUser[profile.userId] ? (
                        <FaSpinner className="animate-spin" />
                      ) : profile.isFollowed ? (
                        "Unfollow"
                      ) : profile.followStatus === "PENDING" ? (
                        "Requested"
                      ) : (
                        "Follow"
                      )}
                    </button>

                    <button
                      className={`${styles["profile-header__message-btn"]} bg-neutral-gray`}
                      onClick={handleMessageClick}
                      disabled={messageLoading.startConversation}
                      aria-label="Send Message"
                    >
                      {messageLoading.startConversation ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <svg
                          className={styles["profile-header__message-icon"]}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Highlights section with create option for own profile */}
              <div className={styles["profile-header__highlights"]}>
                {profile.isMine && <CreateHighlightAvatar />}
                {highlightLoading.getUserHighlights && highlights.length === 0 && (
                  <>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className={`${styles['profile-header__highlight-item']} animate-pulse`}>
                        <div className={`h-[60px] w-[60px] bg-neutral-gray rounded-full`}/>
                        <div className={`mt-2 h-4 w-full bg-neutral-gray rounded`}/>
                      </div>
                    ))}
                  </>
                )}
                {highlights.length > 0 && (
                  <>
                    {highlights.map((highlight) => (
                      <button
                        key={highlight.highlightId}
                        className={styles["profile-header__highlight-item"]}
                        onClick={() => handleViewHighlight(highlight.highlightId)}
                        aria-label={`View highlight: ${highlight.title}`}
                      >
                        <div className={styles["profile-header__highlight-image-wrapper"]}>
                          <Image
                            src={highlight.coverImage || '/default-highlight.png'}
                            alt={`Cover image for highlight: ${highlight.title}`}
                            className={styles["profile-header__highlight-image"]}
                            width={70}
                            height={70}
                            loading="lazy"
                          />
                        </div>
                        <span className={styles["profile-header__highlight-title"]}>
                          {highlight.title}
                        </span>
                      </button>
                    ))}
                    {highlightLoading.getUserHighlights && highlights.length > 0 && (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className={`${styles['profile-header__highlight-item']} animate-pulse`}>
                          <div className={`h-[60px] w-[60px] bg-neutral-gray rounded-full`}/>
                          <div className={`mt-2 h-4 w-full bg-neutral-gray rounded`}/>
                        </div>
                      ))
                    )}
                    {hasMoreHighlights && (
                      <div
                        ref={highlightSentinelRef}
                        className={styles["h-10 w-full"]}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
                {highlightError.getUserHighlights && (
                  <div className={styles["profile-header__error"]}>
                    <p>{highlightError.getUserHighlights}</p>
                  </div>
                )}
              </div>

              {/* Tabs for posts and saved (if own profile) */}
              <div className={styles["profile-header__tabs"]}>
                <button
                  onClick={handleNavigateToPosts}
                  className={`${styles["profile-header__tab"]} ${
                    isPostsPath ? styles["profile-header__tab--active"] : ''
                  }`}
                  aria-label="View Posts"
                  aria-current={isPostsPath ? 'true' : 'false'}
                >
                  <GridIcon className="w-6 h-6" aria-hidden="true"/>
                </button>
                {profile.isMine && (
                  <button
                    onClick={() => router.push(`/${username}/saved`)}
                    className={`${styles["profile-header__tab"]} ${
                      isSavedPath ? styles["profile-header__tab--active"] : ''
                    }`}
                    aria-label="View Saved Posts"
                    aria-current={isSavedPath ? 'true' : 'false'}
                  >
                    <BookmarkIcon className="w-6 h-6" aria-hidden="true"/>
                  </button>
                )}
              </div>
            </div>
          )}
        </Suspense>
      </header>
      
      <section className={styles["profile_content"]}>
        {/* Sidebar with bio information */}
        <aside className={styles["profile_content__sidebar"]}>
          <Suspense fallback={<BioSkeleton />}>
            {profileLoading.getProfile ? (
              <BioSkeleton />
            ) : (
              <div className={styles["profile-content__bio_card"]}>
                <div className={styles["profile_bio"]}>
                  <div className={styles["profile_bio__header"]}>
                    <h2 className={styles["profile_bio__title"]}>Bio</h2>
                    {profile?.isMine && (
                      <Link
                        href="/edit"
                        className={styles["profile_bio__edit_link"]}
                        aria-label="Edit bio"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  <TruncatedText
                    text={profile?.bio || "No bio available."}
                    maxChars={150}
                    className={styles["profile_bio__description"]}
                  />
                  <ul className={styles["profile_bio__details"]}>
                    {profile?.address && (
                      <li className={styles["profile_bio__detail_item"]}>
                       <MapMarkerAlt className={styles["profile_bio__detail_icon"]} aria-hidden="true" />
                       <TruncatedText
                         text={profile.address}
                         maxChars={40}
                         className={styles["profile_bio__detail_text"]}
                       />
                      </li>
                    )}
                    {profile?.jobTitle && (
                      <li className={styles["profile_bio__detail_item"]}>
                        <Briefcase className={styles["profile_bio__detail_icon"]} aria-hidden="true" />
                        <TruncatedText
                          text={profile.jobTitle}
                          maxChars={40}
                          className={styles["profile_bio__detail_text"]}
                        />
                      </li>
                    )}
                    {profile?.dateOfBirth && (
                      <li className={styles["profile_bio__detail_item"]}>
                        <CalendarAlt className={styles["profile_bio__detail_icon"]} aria-hidden="true" />
                          <span className={styles["profile_bio__detail_text"]}>
                            {new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </Suspense>
        </aside>

        {/* Main feed content */}
        <main className={styles["profile_content__feed"]}>
          {profile?.isMine && (
            <>
              <div className={styles["profile_content__create-post"]}>
                <CreatePostTrigger
                  user={user}
                  onClick={() => setShowCreateModal(true)}
                  onMediaSelect={handleMediaFromTrigger}
                  aria-label="Create a new post"
                />
              </div>
              {createPostLoading && <CreatingPostIndicator />}
            </>
          )}
          <Suspense>
            <PostsGrid
              username={username}
              isMine={profile?.isMine || false}
              hasAccess={profile?.hasAccess || false}
              type={isSavedPath ? 'saved' : 'posts'}
              state={{
                showCommentForm,
                showReplyForm,
                showPostMenu,
              }}
              actions={{
                setShowCommentForm,
                setShowReplyForm,
                setShowPostMenu,
                setShowEditModal,
                setShowDeleteModal,
                setShowReportModal,
                setShowShareModal,
                setShowUserListModal,
                setShowPostModal,
              }}
            />
          </Suspense>
          {children}
        </main>
      </section>

      {/* Render modals for post interactions */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setPreselectedMedia({ file: null, isVideo: false });
          }}
          user={user}
          preselectedMedia={preselectedMedia}
        />
      )}
      {showEditModal !== null && (
        <EditPostModal
          isOpen={true}
          postId={showEditModal}
          onClose={() => setShowEditModal(null)}
          user={user}
          postSource={isSavedPath ? 'savedPosts' : 'usersPosts'}
        />
      )}
      {showDeleteModal !== null && (
        <ConfirmationModal
          isOpen={true}
          entityType="post"
          entityId={showDeleteModal}
          actionThunk={deletePostThunk}
          onClose={() => setShowDeleteModal(null)}
        />
      )}
      {showReportModal !== null && (
        <ReportModal
          isOpen={true}
          postId={showReportModal}
          onClose={() => setShowReportModal(null)}
          loadingState={reportPostLoading}
        />
      )}
      {showShareModal !== null && (
        <ShareModal
          isOpen={true}
          post={postsToShow.find((p) => p.PostID === showShareModal)}
          onClose={() => setShowShareModal(null)}
        />
      )}
      {showUserListModal !== null && (
        <UserListModal
          isOpen={true}
          onClose={() => setShowUserListModal(null)}
          type="likes"
          id={showUserListModal}
          title="Likes"
          postSource={isSavedPath ? 'savedPosts' : 'usersPosts'}
        />
      )}
      {showPostModal !== null && (
        <PostModal
          isOpen={true}
          postId={showPostModal}
          onClose={() => setShowPostModal(null)}
          actions={{
            setShowEditModal,
            setShowDeleteModal,
            setShowReportModal,
            setShowShareModal,
            setShowUserListModal,
          }}
        />
      )}
    </div>
  );
}