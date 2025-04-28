// Constants for API endpoints and other configurations
export const API_ENDPOINTS = {
    LOGIN: "/auth/login",
  } as const;
  
  export const ERROR_MESSAGES = {
    VALIDATION_ERROR: "Validation error",
    INVALID_CREDENTIALS: "Invalid credentials",
    TOO_MANY_ATTEMPTS: "Too many login attempts, please try again after 15 minutes",
    SERVER_ERROR: "Internal server error",
  } as const;