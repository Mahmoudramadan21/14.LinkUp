/**
 * API client configuration for making HTTP requests with Axios.
 * @module services/api
 */

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ErrorResponse } from "@/types/api";
import { logout } from "./authService";

// CSRF token cookie name (must match backend configuration)
const CSRF_TOKEN_COOKIE = "csrf-token";

// Maximum number of retry attempts for CSRF token refresh
const MAX_CSRF_RETRIES = 1;

// Maximum number of attempts to read the cookie
const MAX_COOKIE_READ_ATTEMPTS = 3;
const COOKIE_READ_DELAY = 100; // Delay in milliseconds between attempts

/**
 * Retrieves a cookie value by name from the document's cookies.
 * @param name - The name of the cookie
 * @returns The cookie value or null if not found
 */
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  console.log("All cookies:", document.cookie);
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() || null : null;
};

/**
 * Creates and configures an Axios instance for API requests.
 * @returns Configured Axios instance
 * @throws Error if NEXT_PUBLIC_API_BASE_URL is not defined
 */
const createApiInstance = (): AxiosInstance => {
  // Validate environment variable
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in .env");
  }

  const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true, // Send cookies (accessToken, refreshToken, _csrf, csrf-token)
    headers: {
      "Content-Type": "application/json",
    },
  });

  /**
   * Fetches a new CSRF token from the backend.
   * @returns Promise that resolves when the token is fetched
   * @throws Error if the token fetch fails and no valid cookie exists
   */
  const fetchCsrfToken = async (): Promise<void> => {
    try {
      const response = await api.get("/auth/csrf-token", {
        headers: {
          "Cache-Control": "no-cache", // Prevent caching on client side
        },
      });
      console.log("CSRF token fetch response:", response.status, response.data);

      // Try multiple times to read the cookie
      let token: string | null = null;
      for (let attempt = 1; attempt <= MAX_COOKIE_READ_ATTEMPTS; attempt++) {
        token = getCookie(CSRF_TOKEN_COOKIE);
        console.log(
          `CSRF token cookie after fetch (attempt ${attempt}):`,
          token
        );
        if (token) break;
        console.warn(
          `CSRF token cookie not found on attempt ${attempt}, retrying...`
        );
        await new Promise((resolve) => setTimeout(resolve, COOKIE_READ_DELAY));
      }

      if (!token) {
        throw new Error("CSRF token cookie not found after fetching");
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      // Fallback to existing csrf-token cookie if endpoint fails
      const token = getCookie(CSRF_TOKEN_COOKIE);
      if (token) {
        console.warn("Using existing csrf-token cookie as fallback:", token);
        return;
      }
      throw new Error("Unable to fetch CSRF token");
    }
  };

  // Fetch CSRF token on instance creation
  fetchCsrfToken().catch((error) => {
    console.error("Initial CSRF token fetch failed:", error);
  });

  // Request interceptor to add CSRF token for non-GET requests
  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (config.method && !["get"].includes(config.method.toLowerCase())) {
        const csrfToken = getCookie(CSRF_TOKEN_COOKIE);
        if (!csrfToken) {
          await fetchCsrfToken();
          config.headers!["X-CSRF-Token"] = getCookie(CSRF_TOKEN_COOKIE) || "";
        } else {
          config.headers!["X-CSRF-Token"] = csrfToken;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
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

      // Handle 429 (Too Many Requests)
      if (error.response?.status === 429) {
        errorResponse.message =
          error.response?.data?.message ||
          "Too many requests, please try again later";
        return Promise.reject(errorResponse);
      }

      // Handle 403 (Invalid CSRF token)
      if (
        error.response?.status === 403 &&
        errorResponse.message.includes("CSRF") &&
        !originalRequest._retryCount
      ) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        if (originalRequest._retryCount <= MAX_CSRF_RETRIES) {
          try {
            await fetchCsrfToken();
            originalRequest.headers["X-CSRF-Token"] =
              getCookie(CSRF_TOKEN_COOKIE) || "";
            return api(originalRequest);
          } catch (retryError) {
            console.error("CSRF token retry failed:", retryError);
            return Promise.reject(errorResponse);
          }
        }
      }

      // Handle 401 (Unauthorized - No token provided or refresh token failed)
      if (
        error.response?.status === 401 &&
        (
          error.response?.data?.error === "No token provided" ||
          error.response?.data?.error?.includes?.("No access token provided") ||
          error.response?.data?.error === "Token expired or invalid, please refresh token" ||
          error.response?.data?.message === "No token provided" ||
          error.response?.data?.message?.includes?.("No access token provided")
        ) &&
        !originalRequest._retryCount
      ){
        console.log("401 Unauthorized - attempting token refresh", errorResponse.message);
        originalRequest._retryCount = 2; 
        try {
          if (process.env.NODE_ENV === "development") {
            console.warn("Access token missing/expired → refreshing...");
          }
          await api.post("/auth/refresh");
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // If the failed request was to /auth/refresh, trigger logout
          if (originalRequest.url === "/auth/refresh") {
            try {
              await logout(); // Call logout from authService
              console.log(
                "User logged out due to failed refresh token attempt"
              );
            } catch (logoutError) {
              console.error(
                "Logout failed after refresh failure:",
                logoutError
              );
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
