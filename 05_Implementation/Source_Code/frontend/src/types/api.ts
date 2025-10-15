/**
 * Generic error response from the API
 */
export interface ErrorResponse {
  message: string;
  error?: string; // Only in development
  errors?: Array<{ field: string; error: string }>;
}

/**
 * Generic success response with optional data
 */
export interface SuccessResponse<T = unknown> {
  message: string;
  data?: T;
}
