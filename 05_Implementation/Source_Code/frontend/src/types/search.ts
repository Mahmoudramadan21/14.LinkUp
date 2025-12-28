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

import { Post, User, Comment, LikedBy } from "./post";

export interface SearchPost extends Omit<Post, "User" | "Likes" | "Comments"> {
  privacy: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";

  User: User;

  Likes: LikedBy[];

  Comments: Comment[];

  SharedPost?:
    | (Omit<Post, "User" | "Likes" | "Comments"> & {
        User: User;
      })
    | null;
}

export interface SearchPostsResponse {
  posts: SearchPost[];
}

export interface SearchResponse {
  users: SearchUser[];
  posts: SearchPost[];
}
