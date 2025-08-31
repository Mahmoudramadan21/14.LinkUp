# LinkUp Authentication Pages

This document provides an overview of the authentication pages for the **LinkUp** application, built using **Next.js 14** with the **App Router**. The pages include `Login`, `Signup`, `Forgot Password`, `Verify Code`, `Reset Password`, and `Password Reset Success`. These pages handle user authentication and password reset flows, ensuring a secure, accessible, and user-friendly experience.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Pages](#pages)
  - [Login](#login)
  - [Signup](#signup)
  - [Forgot Password](#forgot-password)
  - [Verify Code](#verify-code)
  - [Reset Password](#reset-password)
  - [Password Reset Success](#password-reset-success)
- [Shared Components and Utilities](#shared-components-and-utilities)
- [Technologies](#technologies)
- [Setup and Running](#setup-and-running)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [SEO](#seo)
- [Contributing](#contributing)

## Overview

The authentication pages are a core part of the **LinkUp** application's user authentication system. They provide the following functionality:

1. **Login**: Authenticates users with their email and password.
2. **Signup**: Allows new users to create an account with required details.
3. **Forgot Password**: Initiates the password reset process by sending a verification code to the user's email.
4. **Verify Code**: Verifies the user's identity using a 4-digit code.
5. **Reset Password**: Enables users to set a new password after verification.
6. **Password Reset Success**: Confirms successful password reset and redirects to the login page.

The pages follow a consistent structure, leveraging reusable components, hooks, and utilities for maintainability and scalability. The codebase prioritizes **accessibility**, **SEO**, and **type safety** using TypeScript.

## Project Structure

The authentication pages and their related files are organized as follows:

```
app/(auth)
├── login
│   └── page.tsx
├── signup
│   └── page.tsx
├── forgot-password
│   └── page.tsx
├── verify-code
│   └── page.tsx
├── reset-password
│   └── page.tsx
├── password-reset-success
│   └── page.tsx
forms/auth
├── LoginForm.tsx
├── SignupForm.tsx
├── ForgotPasswordForm.tsx
├── VerificationCodeForm.tsx
├── ResetPasswordForm.tsx
├── PasswordResetSuccess.tsx
hooks/auth
├── useLogin.ts
├── useSignup.ts
├── useForgotPassword.ts
├── useVerifyCode.ts
├── useResetPassword.ts
├── usePasswordResetSuccess.ts
types
├── authTypes.ts
utils
├── validation.ts
services
├── authService.ts
```

- **`app/(auth)/*.tsx`**: Next.js page components for each authentication route.
- **`forms/auth/*.tsx`**: Reusable form components for each page.
- **`hooks/auth/*.ts`**: Custom hooks encapsulating form logic, validation, and API calls.
- **`types/authTypes.ts`**: TypeScript interfaces for form data, errors, and API responses.
- **`utils/validation.ts`**: Centralized validation logic for all forms.
- **`services/authService.ts`**: API service for authentication-related HTTP requests.

## Pages

### Login

- **Path**: `/login`
- **Purpose**: Authenticates users by accepting their email and password.
- **Components**:
  - `LoginForm`: Renders inputs for email and password, and a submit button.
- **Hook**: `useLogin`
  - Manages form state, validation, and submission.
  - Handles API response to store authentication tokens.
- **API**: Calls `login` from `authService.ts` to authenticate the user.
- **Features**:
  - Email and password validation using `validateLoginForm`.
  - Success/error messages with ARIA roles for accessibility.
  - Redirects to the dashboard or home page (e.g., `/dashboard`) on successful login.
  - Link to `/forgot-password` for password recovery.

### Signup

- **Path**: `/signup`
- **Purpose**: Allows new users to create an account by providing details like username, email, password, and additional fields (e.g., gender, date of birth).
- **Components**:
  - `SignupForm`: Renders inputs for registration details, password confirmation, and a submit button.
- **Hook**: `useCallback`
  - Manages form state, validation, and submission.
  - Handles API response to store authentication tokens or redirect on success.
- **API**: Calls `signup` from `authService.ts` to create a new user.
- **Features**:
  - Comprehensive validation (username, email, password complexity, etc.) using `validateSignupForm`.
  - Success/error messages with ARIA roles.
  - Redirects to `/login` or `/dashboard` on successful signup.
  - Link to `/login` for existing users.

### Forgot Password

- **Path**: `/forgot-password`
- **Purpose**: Allows users to initiate the password reset process by entering their email address.
- **Components**:
  - `ForgotPasswordForm`: Renders an email input and a submit button.
- **Hook**: `useForgotPassword`
  - Manages form state, validation, and submission.
  - Stores `resetEmail` in `sessionStorage`.
  - Redirects to `/verify-code` on success.
- **API**: Calls `forgotPassword` from `authService.ts` to send a verification code.
- **Features**:
  - Email validation using `validateForgotPasswordForm`.
  - Success/error messages with ARIA roles.
  - Redirects to `/verify-code` after 1.5 seconds on success.

### Verify Code

- **Path**: `/verify-code`
- **Purpose**: Verifies the user's identity by accepting a 4-digit code sent to their email.
- **Components**:
  - `VerificationCodeForm`: Renders a 4-digit code input, a timer, and resend/verify buttons.
- **Hook**: `useVerifyCode`
  - Manages form state, code validation, timer, and resend logic.
  - Retrieves `resetEmail` from `sessionStorage`.
  - Stores `resetToken` in `sessionStorage` on success.
  - Redirects to `/reset-password` on success.
- **API**:
  - `verifyCode`: Verifies the code.
  - `forgotPassword`: Resends a new code if requested.
- **Features**:
  - Code validation using `validateVerifyCodeForm`.
  - 30-second timer for resend functionality.
  - Success/error messages with ARIA roles.
  - Redirects to `/reset-password` after 1.5 seconds on success.

### Reset Password

- **Path**: `/reset-password`
- **Purpose**: Allows users to set a new password after verifying their identity.
- **Components**:
  - `ResetPasswordForm`: Renders inputs for new password and confirm password, and a submit button.
- **Hook**: `usePasswordReset`
  - Manages form state, password validation, and submission.
  - Retrieves `resetToken` from `sessionStorage`.
  - Clears `sessionStorage` on success.
  - Redirects to `/password-reset-success` on success.
- **API**: Calls `resetPassword` from `authService.ts` to update the password.
- **Features**:
  - Password validation (8+ characters, uppercase, lowercase, number, special character) using `validateResetPasswordForm`.
  - Success/error messages with ARIA roles.
  - Redirects to `/password-reset-success` after 1.5 seconds on success.

### Password Reset Success

- **Path**: `/password-reset-success`
- **Purpose**: Displays a success message after a password reset and provides navigation to the login page.
- **Components**:
  - `PasswordResetSuccess`: Renders a success message, a checkmark icon, and a continue button.
- **Hook**: `useCallback`
  - Handles navigation to `/login`.
- **API**: None (static success page).
- **Features**:
  - Displays a success checkmark (`/svgs/success-checkmark.svg`).
  - Accessible success message with `aria-describedby`.
  - Navigates to `/login` when the "Continue to Login" button is clicked.

## Shared Components and Utilities

- **Components**:
  - `Input` (`@/components/auth/InputData`): Used for text and password inputs in `LoginForm`, `SignupForm`, `ForgotPasswordForm`, and `ResetPasswordForm`.
  - `Button` (`@/components/button/Button`): Used for form submissions and navigation across all forms.
  - `CodeInput` (`@/components/code/CodeInput`): Custom 4-digit code input for `VerificationCodeForm`.
  - `Select` (optional, `@/components/ui/select`): Used in `SignupForm` for fields like `gender`.
- **Utilities**:
  - `validation.ts`: Contains validation functions (`validateLoginForm`, `validateSignupForm`, `validateForgotPasswordForm`, `validateVerifyCodeForm`, `validateResetPasswordForm`) for form data.
  - `authService.ts`: Handles API calls using `axiosInstance` for `login`, `signup`, `forgotPassword`, `verifyCode`, and `resetPassword`.
- **Types**:
  - `authTypes.ts`: Defines interfaces for form data (`LoginFormData`, `SignupFormData`, `ForgotPasswordFormData`, `VerifyCodeFormData`, `ResetPasswordFormData`), errors, and API responses (`LoginResponse`, `SignupResponse`, `ForgotPasswordResponse`, `VerifyCodeResponse`, `ResetPasswordResponse`).

## Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (assumed, based on `className` usage)
- **HTTP Client**: Axios (`axiosInstance` in `lib/api.ts`)
- **Storage**: `sessionStorage` for temporary data (`resetEmail`, `resetToken`)
- **Accessibility**: ARIA roles and attributes for screen reader support
- **SEO**: Next.js `Metadata` for API verification

## Setup and Running

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/Mahmoudramadan21/linkup-app
   cd linkup
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Run the Development Server**:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in your browser.

4. **Access the Pages**:

   - **Login**: `/login`
   - **Signup**: `/signup`
   - **Forgot Password**: `/forgot-password`
   - **Verify Code**: `/verify-code` (after submitting `/forgot-password`)
   - **Reset Password**: `/reset-password` (after verifying code)
   - **Password Reset Success**: `/password-reset-success` (after resetting password)

5. **Manual Testing**:
   - **Login**:
     - Enter valid/invalid email and password → Check success/error messages.
     - Submit → Should redirect to `/dashboard` or `/home`.
     - Verify link to `/forgot-password`.
   - **Signup**:
     - Enter valid/invalid registration details → Check validation errors.
     - Submit → Should redirect to `/login`.
     - Verify link to `/login`.
   - **Forgot Password**:
     - Enter valid/invalid email → Check success/error messages.
     - Submit → Should redirect to `/verify-code` after 1.5 seconds.
     - Check `sessionStorage` for `resetEmail`.
   - **Verify Code**:
     - Enter valid/invalid 4-digit code → Check error messages.
     - Test resend after 30 seconds → Should show success message.
     - Submit valid code → Should redirect to `/reset-password` and store `resetToken` in `sessionStorage`.
   - **Reset Password**:
     - Enter valid/invalid passwords → Check validation errors.
     - Submit → Should redirect to `/password-reset-success` and clear `sessionStorage`.
   - **Password Reset Success**:
     - Click "Continue to Login" → Should navigate to `/login`.
