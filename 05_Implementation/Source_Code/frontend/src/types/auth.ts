/**
 * Types related to Authentication APIs
 */

/**
 * Enum for user gender
 */
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

/**
 * Represents a user in the authentication system
 */
export interface User {
  userId: number;
  username: string;
  profileName: string;
  profilePicture: string | null;
  email: string;
  isPrivate: boolean;
}

/**
 * Request body for user signup
 */
export interface SignupRequest {
  profileName: string;
  username: string;
  email: string;
  password: string;
  gender: Gender;
  dateOfBirth: string; // ISO 8601 format (YYYY-MM-DD)
}

/**
 * Request body for user login
 */
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

/**
 * Request body for forgot password
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Request body for verifying reset code
 */
export interface VerifyCodeRequest {
  email: string;
  code: string; // 4-digit code
}

/**
 * Request body for resetting password
 */
export interface ResetPasswordRequest {
  newPassword: string;
}

/**
 * Response for successful signup or login
 */
export interface AuthSuccessResponse {
  message: string;
  data: User;
}

/**
 * Response for refresh token
 */
export interface RefreshTokenSuccessResponse {
  message: string;
  data: User;
}

/**
 * Response for isAuthenticated endpoint
 */
export interface IsAuthenticatedResponse {
  isAuthenticated: boolean;
  message: string;
  data?: User; // Optional, only present if isAuthenticated is true
}

/**
 * Response for forgot password
 */
export interface ForgotPasswordResponse {
  message: string;
  codeSent: boolean;
}

/**
 * Response for verify code
 */
export interface VerifyCodeResponse {
  message: string;
}

/**
 * Response for reset password or logout
 */
export interface SimpleSuccessResponse {
  message: string;
}
