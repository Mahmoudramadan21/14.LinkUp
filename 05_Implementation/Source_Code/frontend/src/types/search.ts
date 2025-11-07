export interface SearchUser {
  userId: number; // Prisma user ID
  username: string;
  profilePicture: string | null;
  bio: string | null;
  isPrivate: boolean;
  isFollowed: boolean | "pending";
}

export interface SearchUsersResponse {
  users: SearchUser[];
}

export interface SearchPost {
  PostID: number;
  Content: string | null;
  ImageURL: string | null;
  VideoURL: string | null;
  CreatedAt: string; // serialized date
  UpdatedAt: string;
  privacy: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
  isMine: boolean;
  isLiked: boolean;
  isSaved: boolean;
  isUnseen: boolean;
  isFollowed?: boolean | "pending";
  likeCount: number;
  commentCount: number;
  shareCount: number;

  User: {
    UserID: number;
    Username: string;
    ProfilePicture: string | null;
    IsPrivate: boolean;
    isFollowed?: boolean | "pending";
  };

  Likes: {
    UserID: number;
    Username: string;
    ProfileName: string | null;
    ProfilePicture: string | null;
    isFollowed: boolean | "pending";
    likedAt: string;
  }[];

  Comments: {
    CommentID: number;
    Content: string;
    CreatedAt: string;
    User: {
      UserID: number;
      Username: string;
      ProfilePicture: string | null;
    };
    isMine: boolean;
    isLiked: boolean;
    likeCount: number;
    replyCount: number;
    likedBy: {
      username: string;
      profilePicture: string | null;
    }[];
    Replies: {
      CommentID: number;
      Content: string;
      CreatedAt: string;
      User: {
        UserID: number;
        Username: string;
        ProfilePicture: string | null;
      };
      isMine: boolean;
      isLiked: boolean;
      likeCount: number;
      likedBy: {
        username: string;
        profilePicture: string | null;
      }[];
    }[];
  }[];

  SharedPost?: {
    PostID: number;
    Content: string | null;
    ImageURL: string | null;
    VideoURL: string | null;
    CreatedAt: string;
    User: {
      UserID: number;
      Username: string;
      ProfilePicture: string | null;
    };
    likeCount: number;
    commentCount: number;
    shareCount: number;
  } | null;
}

export interface SearchPostsResponse {
  posts: SearchPost[];
}

export interface SearchResponse {
  users: SearchUser[];
  posts: SearchPost[];
}
