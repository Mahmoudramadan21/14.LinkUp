/**
 * API client configuration for making HTTP requests with Axios.
 * @module services/api
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { ErrorResponse } from "@/types/api";
import { logout } from "./authService";

/**
 * Creates and configures an Axios instance for API requests.
 * @returns Configured Axios instance
 * @throws Error if NEXT_PUBLIC_API_BASE_URL is not defined
 */
const createApiInstance = (): AxiosInstance => {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in .env");
  }

  const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true, // Send cookies (accessToken & refreshToken)
    headers: {
      "Content-Type": "application/json",
    },
  });


  // Response interceptor
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;
      const errorResponse: ErrorResponse = {
        message:
          error.response?.data?.message || "An unexpected error occurred",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        errors: error.response?.data?.errors,
      };

      // 429 Too Many Requests
      if (error.response?.status === 429) {
        errorResponse.message =
          error.response?.data?.message ||
          "Too many requests, please try again later";
        return Promise.reject(errorResponse);
      }

      // 401 Unauthorized
      if (
        error.response?.status === 401 &&
        (!originalRequest._retryCount || originalRequest._retryCount < 2)
      ) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        try {
          await api.post("/auth/refresh");
          return api(originalRequest);
        } catch {
          if (originalRequest.url === "/auth/refresh") {
            try {
              await logout();
            } catch {
            }
          }
          return Promise.reject(errorResponse);
        }
      }

      return Promise.reject(errorResponse);
    }
  );

  return api;
};

// Singleton Axios instance
const api = createApiInstance();
export default api;
