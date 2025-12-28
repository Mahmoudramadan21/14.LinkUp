import api from "./api";
import { AxiosResponse } from "axios";
import {
  SearchUsersResponse,
  SearchPostsResponse,
} from "@/types/search";

/**
 * Searches for users and posts based on the provided parameters.
 * @param params - Search parameters including query, type, page, and limit
 * @returns Search results containing users and posts
 **/
export const search = async (params: {
  query: string;
  type?: "USERS" | "POSTS" | "ALL";
    page?: number;
    limit?: number;
}): Promise<{
  users: SearchUsersResponse["users"];
    posts: SearchPostsResponse["posts"];    
}> => {
  const response: AxiosResponse<{
    users: SearchUsersResponse["users"];
    posts: SearchPostsResponse["posts"];
  }> = await api.get("/search", { params });
  return response.data;
}; 