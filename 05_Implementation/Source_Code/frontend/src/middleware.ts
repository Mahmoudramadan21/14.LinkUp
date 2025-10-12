import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to handle authentication flow for auth-related routes.
 *
 * - If a user is already authenticated (has either `accessToken` or `refreshToken` in cookies),
 *   they are redirected away from authentication pages to the `/feed`.
 * - Otherwise, the request is allowed to proceed normally.
 *
 * @param request - The incoming Next.js request object
 * @returns NextResponse - Either a redirect response or the original request continuation
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve authentication token from cookies (either accessToken or refreshToken)
  const token =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("refreshToken")?.value;

  // Define auth-related routes
  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password/verify",
    "/reset-password",
    "/reset-password/success",
  ];

  // Check if current request is for an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Allow request to proceed if unauthenticated or not on an auth route
  return NextResponse.next();
}

/**
 * Middleware configuration:
 * - Applies only to authentication-related routes
 */
export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password/verify",
    "/reset-password",
    "/reset-password/success",
  ],
};
