export interface FollowingFollower {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  isPrivate: boolean;
  bio: string | null;
}

export interface ApiStory {
  StoryID: number;
  MediaURL: string;
  CreatedAt: string;
  ExpiresAt: string;
  isViewed: boolean;
}

export interface Story {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  isViewed: boolean;
  hasLiked: boolean;
  likeCount: number;
}

export interface Comment {
  commentId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  profilePicture: string;
  isLiked: boolean;
  likeCount: number;
  replies: Comment[];
}

export interface Post {
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
  comments: Comment[];
  isLiked: boolean;
  likedBy: { username: string; profilePicture: string }[];
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface User {
  name: string;
  username: string;
  profilePicture: string;
}

export interface StoriesSectionUser {
  name: string;
  username: string;
  profilePicture?: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  address: string;
  bio: string;
  jobTitle: string;
  dateOfBirth: string;
  isPrivate: boolean;
  profilePicture: File | null;
  coverPicture: File | null;
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface ProfileFormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  address?: string;
  bio?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  isPrivate?: string;
  profilePicture?: string;
  coverPicture?: string;
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  general?: string;
}

export interface AuthData {
  userId: number;
  username: string;
  profilePicture: string | null;
  email: string;
  token: string;
}

export interface PasswordResetSuccessProps {
  onContinue?: () => void;
}

export interface AvatarProps {
  imageSrc: string;
  username: string;
  hasPlus?: boolean;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  showUsername?: boolean;
  isInteractive?: boolean;
}

export interface BioProps {
  bio?: string;
  address?: string;
  jobTitle?: string;
  dateOfBirth?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
}

export interface CodeInputProps {
  length: number;
  onChange: (code: string) => void;
  error?: string;
}

export interface CreatePostProps {
  user: User;
  onPostSubmit: (content: string, image?: File, video?: File) => void;
}

export interface AppStore {
  handlePostStory: (file: File) => Promise<void>;
  setError: (error: string) => void;
}

export interface ProfileStore {
  authData: { userId: number } | null;
  removeFollower: (followerId: number) => Promise<void>;
  unfollowUser: (followedUserId: number) => Promise<void>;
  fetchFollowers: (userId: number) => Promise<void>;
  fetchFollowing: (userId: number) => Promise<void>;
  setError: (error: string) => void;
}

export interface FollowerFollowingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
  showSearch: boolean;
  showRemove: boolean;
  data: FollowingFollower[];
  loading?: boolean;
  error?: string | null;
}

export interface FollowRequestUser {
  UserID: number;
  Username: string;
  ProfilePicture: string | null;
  Bio: string | null;
}

export interface FollowRequest {
  requestId: number;
  user: FollowRequestUser;
  createdAt: string;
}

export interface FollowRequestsProps {
  initialData: {
    count: number;
    followRequests: FollowRequest[];
  };
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>,
    'onChange' | 'type'
  > {
  id: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'date' | 'select';
  placeholder?: string;
  label?: string;
  value: string | boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  error?: string;
  required?: boolean;
  options?: SelectOption[];
}

export interface NavIconProps {
  iconSrc: string;
  activeIconSrc?: string;
  alt: string;
  ariaLabel: string;
  to?: string;
  badgeCount?: number;
  variant?: 'default' | 'mobile';
  onClick?: () => void;
}

export interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export interface PostUser {
  username: string;
  profilePicture: string;
}

export interface PostComment {
  commentId: string;
  username: string;
  content: string;
  createdAt: string;
  profilePicture?: string;
  isLiked: boolean;
  likeCount: number;
  replies?: PostComment[];
  isPending?: boolean;
  userId?: number;
  replyingToUsername?: string;
}

export interface PostCardAppStore {
  authData: { userId: number; username: string; profilePicture: string } | null;
  setError: (error: string) => void;
}

export interface PostCardProps {
  postId: number;
  userId: number;
  username: string;
  profilePicture: string;
  privacy: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  likedBy: PostUser[];
  comments: PostComment[];
  isLoading?: boolean;
  onPostUpdate: (postId: number, updatedFields: Partial<PostCardProps>) => void;
}

export interface PostModalPost {
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
  isLiked: boolean;
  likedBy: PostUser[];
  comments: PostComment[];
}

export interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostModalPost;
  onPostUpdate: (postId: number, updatedFields: Partial<PostModalPost>) => void;
}

export interface SearchBarProps {
  // Reserved for future props (e.g., onSearch callback, default value)
}

export interface StoriesListStory {
  storyId: number;
  createdAt: string;
  mediaUrl: string;
  expiresAt: string;
  isViewed: boolean;
  hasLiked: boolean;
  likeCount: number;
}

export interface UserStory {
  userId: number;
  username: string;
  profilePicture: string | null;
  hasUnviewedStories: boolean;
  stories: StoriesListStory[];
}

export interface StoriesListProps {
  data: UserStory[];
  onStorySelect: (storyId: number) => void;
  activeUserId?: number;
}

export interface StoriesLoadingProps {
  title?: string;
}

export interface StoryUser {
  UserID: number;
  Username: string;
  ProfilePicture: string | null;
  IsPrivate: boolean;
}

export interface StoryDetails {
  StoryID: number;
  MediaURL: string;
  CreatedAt: string;
  ExpiresAt: string;
  User: StoryUser;
  _count: {
    StoryLikes: number;
    StoryViews: number;
  };
  hasLiked: boolean;
  likeCount: number;
}

export interface StoryViewerProps {
  story: StoryDetails;
  currentUserId: number;
  onLike: (storyId: number) => void;
  onReply: (storyId: number, reply: string) => void;
  onPrev: () => void;
  onNext: () => void;
  totalStories: number;
  currentStoryIndex: number;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  duration?: number;
}

export interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export interface ToggleStoryLikeResponse {
  action: 'liked' | 'unliked';
}

export interface StoriesDialogSectionProps {
  stories: UserStory[];
  initialStoryId: number;
  currentUserId: number;
  onClose: () => void;
  token: string;
  onLike: (storyId: number) => void;
}

export interface StoryListItem {
  username: string;
  imageSrc: string;
  hasPlus?: boolean;
  hasUnviewedStories?: boolean;
}

export interface StoriesSectionProps {
  currentUserId?: number;
  token: string;
  user: StoriesSectionUser;
  stories: StoryListItem[];
  onPostStory: (media: File, text?: string, backgroundColor?: string, textColor?: string, position?: { x: number; y: number }, fontSize?: number) => Promise<void>;
}

export interface FeedStoreUser {
  UserID: number;
  Username: string;
  ProfilePicture: string | null;
  Bio: string | null;
}

export interface FeedStoreFollowRequest {
  requestId: number;
  user: FeedStoreUser;
  createdAt: string;
}

export interface FeedStoreFollowRequestsResponse {
  count: number;
  pendingRequests: FeedStoreFollowRequest[];
}

export interface FeedStoreStoryUser {
  userId: number;
  username: string;
  profilePicture: string;
  hasUnviewedStories: boolean;
  stories: Story[];
}

export interface FeedStoreComment {
  commentId: number;
  username: string;
  content: string;
  createdAt: string;
  profilePicture?: string;
  isLiked: boolean;
  likeCount: number;
  replies?: FeedStoreComment[];
}

export interface FeedStoreAuthData {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string;
  email: string;
}

export interface FeedStoreAppState {
  authLoading: boolean;
  followLoading: boolean;
  postLoading: boolean;
  storiesLoading: boolean;
  postsLoading: boolean;
  authData: FeedStoreAuthData | null;
  followRequests: FeedStoreFollowRequest[];
  stories: StoryListItem[];
  storiesError: string | null;
  posts: Post[];
  error: string | null;
  page: number;
  hasMore: boolean;

  setAuthLoading: (loading: boolean) => void;
  setFollowLoading: (loading: boolean) => void;
  setPostLoading: (loading: boolean) => void;
  setStoriesLoading: (loading: boolean) => void;
  setPostsLoading: (loading: boolean) => void;
  setAuthData: (data: FeedStoreAuthData | null) => void;
  setFollowRequests: (requests: FeedStoreFollowRequest[]) => void;
  setStories: (stories: StoryListItem[]) => void;
  setStoriesError: (error: string | null) => void;
  setPosts: (posts: Post[]) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;

  fetchFollowRequests: () => Promise<void>;
  fetchStories: (token: string) => Promise<void>;
  fetchPosts: () => Promise<void>;
  handleAcceptRequest: (requestId: number) => Promise<void>;
  handleRejectRequest: (requestId: number) => Promise<void>;
  handlePostSubmit: (content: string, image?: File, video?: File) => Promise<void>;
  handlePostUpdate: (postId: number, updatedFields: Partial<Post>) => void;
  handlePostStory: (media: File, text?: string, backgroundColor?: string, textColor?: string, position?: { x: number; y: number }, fontSize?: number) => Promise<void>;
}

export interface NotificationMetadata {
  postId?: number;
  commentId?: number;
  replierId?: number;
  replierUsername?: string;
  requestId?: number;
  requesterId?: number;
  requesterUsername?: string;
  followerId?: number;
  followerUsername?: string;
  reason?: string;
  reporterId?: number;
  reporterUsername?: string;
  signupDate?: string;
}

export interface NotificationSender {
  userId: number;
  username: string;
  profilePicture: string | null;
}

export interface Notification {
  notificationId: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: NotificationSender | null;
  metadata: NotificationMetadata;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface NotificationsState {
  notifications: Notification[];
  totalCount: number;
  totalPages: number;
  page: number;
  unreadCount: number;
  loading: boolean;
  error: string | null;

  setNotifications: (notifications: Notification[]) => void;
  setTotalCount: (totalCount: number) => void;
  setTotalPages: (totalPages: number) => void;
  setPage: (page: number) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchNotifications: (page: number, limit?: number, readStatus?: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markNotificationAsRead: (notificationId: number) => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

export interface ProfileStoreProfile {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  coverPicture: string | null;
  bio: string | null;
  address: string | null;
  jobTitle: string | null;
  dateOfBirth: string | null;
  isPrivate: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  isFollowing: boolean;
  followStatus: 'PENDING' | 'ACCEPTED' | null;
}

export interface ProfileStoreAuthData {
  userId: number;
  username: string;
  profilePicture: string | null;
  token: string;
}

export interface HighlightStory {
  storyId: number;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  assignedAt: string;
}

export interface Highlight {
  highlightId: number;
  title: string;
  coverImage: string;
  storyCount: number;
  stories: HighlightStory[];
}

export interface SavedPost {
  PostID: number;
  UserID: number;
  Content: string;
  ImageURL: string | null;
  VideoURL: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  privacy: string;
  User: {
    UserID: number;
    Username: string;
    ProfilePicture: string | null;
    IsPrivate: boolean;
  };
  Likes: Array<{
    LikeID: number;
    PostID: number;
    UserID: number;
    CreatedAt: string;
    User: {
      Username: string;
      ProfilePicture: string | null;
    };
  }>;
  Comments: Array<{
    CommentID: number;
    PostID: number;
    UserID: number;
    Content: string;
    CreatedAt: string;
    ParentCommentID: number | null;
    User: {
      Username: string;
      ProfilePicture: string | null;
    };
    CommentLikes: Array<{
      LikeID: number;
      CommentID: number;
      UserID: number;
      CreatedAt: string;
      User: {
        Username: string;
        ProfilePicture: string | null;
      };
    }>;
    Replies: Array<{
      CommentID: number;
      PostID: number;
      UserID: number;
      Content: string;
      CreatedAt: string;
      ParentCommentID: number | null;
      User: {
        Username: string;
        ProfilePicture: string | null;
      };
      CommentLikes: Array<{
        LikeID: number;
        CommentID: number;
        UserID: number;
        CreatedAt: string;
        User: {
          Username: string;
          ProfilePicture: string | null;
        };
      }>;
      isLiked: boolean;
      likeCount: number;
      replyCount: number;
      likedBy: Array<{
        username: string;
        profilePicture: string | null;
      }>;
    }>;
    _count: {
      CommentLikes: number;
      Replies: number;
    };
    isLiked: boolean;
    likeCount: number;
    replyCount: number;
    likedBy: Array<{
      username: string;
      profilePicture: string | null;
    }>;
  }>;
  _count: {
    Likes: number;
    Comments: number;
  };
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  likedBy: Array<{
    username: string;
    profilePicture: string | null;
  }>;
}

export interface ProfileStorePost {
  postId: number;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    UserID: number;
    Username: string;
    ProfilePicture: string;
  };
  likeCount: number;
  commentCount: number;
}

export interface PostsResponse {
  count: number;
  posts: ProfileStorePost[];
}

export interface SavedPostsResponse {
  savedPosts: SavedPost[];
}

export interface FollowResponse {
  message: string;
  status?: 'PENDING' | 'ACCEPTED';
}

export interface FollowingFollowersResponse {
  count: number;
  following?: FollowingFollower[];
  followers?: FollowingFollower[];
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: { field?: string; message?: string; msg?: string }[];
}

export interface ApiLikeToggleResponse {
  success: boolean;
  action: 'liked' | 'unliked';
}

export interface ProfileResponse {
  profile: ProfileStoreProfile;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateProfileResponse {
  message: string;
}