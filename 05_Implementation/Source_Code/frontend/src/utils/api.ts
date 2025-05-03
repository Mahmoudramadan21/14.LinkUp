import axios, { AxiosError } from "axios";
import { getAccessToken, refreshAccessToken, removeAuthData } from "./auth";

// Define error response type
interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: { field?: string; message?: string; msg?: string }[];
}

// Create Axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false, // No cookies needed since we're using JWT
});

// Add request interceptor to include Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    let status = error.response?.status || 500;
    let message = "An unexpected error occurred";

    console.error(`API Error [${status}]:`, error.response?.data || error.message);

    // Handle 401 Unauthorized errors by attempting to refresh the token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("Attempting to refresh token...");
        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
          throw new Error("Failed to refresh token");
        }

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("Retrying original request:", originalRequest.url);
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error("Failed to refresh token:", refreshError.message);

        if (refreshError.response) {
          console.error("Refresh token error response:", refreshError.response.data);
        }

        // Clear auth data and redirect to login
        removeAuthData();
        if (typeof window !== "undefined") {
          console.log("Redirecting to login page...");
          window.location.href = "/login";
        }

        const refreshApiError: ApiErrorResponse = {
          status: 401,
          message: "Session expired. Please log in again.",
        };
        return Promise.reject(refreshApiError);
      }
    }

    // Handle different error statuses
    switch (status) {
      case 400:
        message =
          (error.response?.data as { message: string })?.message ||
          "Validation error. Please check your input.";
        break;
      case 401:
        message = "Authentication failed. Please log in.";
        break;
      case 403:
        message = "You do not have permission to perform this action.";
        break;
      case 404:
        message =
          (error.response?.data as { message: string })?.message ||
          "Resource not found.";
        break;
      case 429:
        message = "Too many requests. Please try again later.";
        break;
      case 500:
        message = "Internal server error. Please try again later.";
        break;
      default:
        message =
          (error.response?.data as { message: string })?.message ||
          "Request failed. Please try again.";
    }

    const apiError: ApiErrorResponse = {
      status,
      message,
      errors: (error.response?.data as { errors: { field?: string; message?: string; msg?: string }[] })?.errors,
    };

    return Promise.reject(apiError);
  }
);

export default api;