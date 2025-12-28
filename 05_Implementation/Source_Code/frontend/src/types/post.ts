export interface User {
  UserID: number;
  Username: string;
  ProfileName?: string;
  ProfilePicture?: string | null;
  IsPrivate?: boolean;
  isFollowed?: boolean | "pending";
  likedAt?: string;
}

export interface Comment {
  CommentID: number;
  PostID?: number;
  ParentCommentID?: number;
  User: User;
  Content: string;
  CreatedAt: string;
  UpdatedAt?: string;
  likeCount: number;
  isLiked: boolean;
  replyCount: number;
  Replies?: Comment[];
  likedBy?: Array<{ username: string; profilePicture?: string | null }>;
  isMine: boolean;
}

export interface LikedBy {
  userId: number;
  username: string;
  profileName: string | undefined;
  profilePicture: string | null | undefined;
  isFollowed: boolean | "pending";
  likedAt: string;
}

export interface Post {
  PostID: number;
  User: User;
  Content?: string;
  ImageURL?: string | null;
  VideoURL?: string | null;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  shareCount: number;
  isSaved: boolean;
  isUnseen: boolean;
  isFollowed?: boolean | "pending";
  isSuggested?: boolean;
  CreatedAt: string;
  saveTime?: string;
  Comments?: Comment[];
  isMine: boolean;
  SharedPost?: Post | null;
  Likes?: LikedBy[];
}

export interface CreatePostRequest {
  content?: string;
  media?: File;
}

export interface UpdatePostRequest {
  content?: string;
}

export interface AddCommentRequest {
  content: string;
}

export interface ReplyCommentRequest {
  content: string;
}

export interface ReportPostRequest {
  reason: "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "OTHER";
}

export interface SharePostRequest {
  caption?: string;
}

// New type for batch post views request
export interface BatchPostViewsRequest {
  postIds: number[];
}

// New type for batch post views response
export interface BatchPostViewsResponse {
  message: string;
}

export interface PostResponse {
  post: Post;
}

export type PostsResponse = Post[];

export interface SimpleSuccessResponse {
  success?: boolean;
  message?: string;
  action?: "liked" | "unliked" | "saved" | "unsaved";
  status?: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED" | undefined;

}

export interface UsersResponse {
  likers: LikedBy[];
  total: number;
  page: number;
  limit: number;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
}

export interface RepliesResponse {
  replies: Comment[];
  total: number;
  page: number;
  limit: number;
}
