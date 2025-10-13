/**
 * Authentication service for handling user-related API requests.
 * @module services/authService
 */

import api from "./api";
import {
  SignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
  AuthSuccessResponse,
  RefreshTokenSuccessResponse,
  IsAuthenticatedResponse,
  ForgotPasswordResponse,
  VerifyCodeResponse,
  SimpleSuccessResponse,
} from "@/types/auth";
import { AxiosResponse } from "axios";

/**
 * Generic function to make API requests and handle responses.
 * @param method - HTTP method (e.g., 'post', 'get')
 * @param endpoint - API endpoint
 * @param data - Request payload (optional)
 * @returns Response data
 * @throws ErrorResponse on failure
 */
const makeApiRequest = async <T>(
  method: "get" | "post",
  endpoint: string,
  data?: unknown
): Promise<T> => {
  try {
    let response: AxiosResponse<T>;
    if (method === "get") {
      response = await api.get<T>(endpoint, { params: data });
    } else {
      response = await api.post<T>(endpoint, data);
    }
    return response.data;
  } catch (error) {
    throw error; // ErrorResponse is handled by api.ts interceptor
  }
};

/**
 * Signs up a new user with the provided data.
 * @param data - User signup data
 * @returns User data on successful signup
 * @throws ErrorResponse on failure
 */
export const signup = async (
  data: SignupRequest
): Promise<AuthSuccessResponse> => {
  return makeApiRequest<AuthSuccessResponse>("post", "/auth/signup", data);
};

/**
 * Logs in a user with the provided credentials.
 * @param data - User login data
 * @returns User data on successful login
 * @throws ErrorResponse on failure
 */
export const login = async (
  data: LoginRequest
): Promise<AuthSuccessResponse> => {
  return makeApiRequest<AuthSuccessResponse>("post", "/auth/login", data);
};

/**
 * Refreshes the user's access token.
 * @returns Refreshed user data
 * @throws ErrorResponse on failure
 */
export const refresh = async (): Promise<RefreshTokenSuccessResponse> => {
  return makeApiRequest<RefreshTokenSuccessResponse>("post", "/auth/refresh");
};

/**
 * Logs out the current user.
 * @returns Logout confirmation
 * @throws ErrorResponse on failure
 */
export const logout = async (): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>("post", "/auth/logout");
};

/**
 * Checks if the user is authenticated.
 * @returns Authentication status and user data if authenticated
 * @throws ErrorResponse on failure
 */
export const isAuthenticated = async (): Promise<IsAuthenticatedResponse> => {
  return makeApiRequest<IsAuthenticatedResponse>(
    "get",
    "/auth/isAuthenticated"
  );
};

/**
 * Requests a password reset code for the provided email.
 * @param data - Email data for password reset
 * @returns Confirmation of reset code request
 * @throws ErrorResponse on failure
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  return makeApiRequest<ForgotPasswordResponse>(
    "post",
    "/auth/forgot-password",
    data
  );
};

/**
 * Verifies the password reset code for the provided email.
 * @param data - Verification data (email and code)
 * @returns Verification result with reset token
 * @throws ErrorResponse on failure
 */
export const verifyCode = async (
  data: VerifyCodeRequest
): Promise<VerifyCodeResponse> => {
  return makeApiRequest<VerifyCodeResponse>("post", "/auth/verify-code", data);
};

/**
 * Resets the user's password with the provided data.
 * @param data - Reset data (reset token and new password)
 * @returns Reset confirmation
 * @throws ErrorResponse on failure
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<SimpleSuccessResponse> => {
  return makeApiRequest<SimpleSuccessResponse>(
    "post",
    "/auth/reset-password",
    data
  );
};
