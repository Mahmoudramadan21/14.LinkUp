import axios, { AxiosError } from "axios";

// Define error response type
interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: { field: string; message: string }[];
}

// Create Axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: true, // Important: Ensures cookies are sent with requests
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let status = error.response?.status || 500;
    let message = "An error occurred";

    switch (status) {
      case 400:
        message =
          (error.response?.data as { message: string })?.message ||
          "Validation error";
        break;
      case 401:
        message = "Invalid credentials";
        break;
      case 429:
        message = "Too many login attempts. Please try again later.";
        break;
      case 500:
        message = "Internal server error. Please try again later.";
        break;
      default:
        message =
          (error.response?.data as { message: string })?.message ||
          "Request failed";
    }

    const apiError: ApiErrorResponse = {
      status,
      message,
      errors: (error.response?.data as { errors: { field: string; message: string }[] })?.errors,
    };
    return Promise.reject(apiError);
  }
);

export default api;