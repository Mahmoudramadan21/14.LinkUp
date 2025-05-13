# LinkUp

LinkUp is a modern social media platform built with Next.js, TypeScript, and Tailwind CSS. It allows users to connect, share posts, create stories, manage profiles, and engage in real-time through notifications and WebSocket-powered updates. The platform emphasizes user experience, accessibility, and performance, with a responsive design and robust state management.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [State Management](#state-management)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication**:
  - Login, signup, forgot password, and password reset with email verification.
  - Secure token management using `localStorage`.
- **User Profiles**:
  - View and edit profiles with details like bio, profile picture, and privacy settings.
  - Follow/unfollow users, manage follow requests, and view followers/following lists.
- **Posts**:
  - Create, view, like, and comment on posts with text, images, or videos.
  - Save posts and view saved posts in the profile.
- **Stories**:
  - Create and view stories with media (images/videos).
  - Auto-advancing stories with like and reply functionality (reply TBD).
- **Highlights**:
  - Create and view highlight collections of stories.
  - Navigate highlights with progress bars and keyboard support.
- **Notifications**:
  - Real-time notifications via WebSocket for likes, follows, and comments.
  - Mark notifications as read or delete them.
- **Accessibility**:
  - ARIA attributes, focus traps, and keyboard navigation for forms and dialogs.
  - Semantic HTML and screen reader support.
- **Performance**:
  - Memoized components, lazy-loaded images, and pagination for posts and notifications.
  - Optimistic updates for follow requests and notifications.

## Technologies

- **Frontend**:
  - Next.js 13 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS
  - Zustand (state management)
  - Axios (API requests)
  - Socket.IO (WebSocket for notifications)
- **Tools & Libraries**:
  - Headless UI (accessible UI components)
  - Next Image (optimized images)
  - ESLint (code linting)
  - Prettier (code formatting)
- **Backend** (assumed, not provided):
  - REST API with endpoints for auth, posts, stories, profiles, and notifications.
  - WebSocket server for real-time updates.

## Project Structure

```
linkup/
├── components/
│   ├── ForgotPasswordForm.tsx
│   ├── HeaderSection.tsx
│   ├── LoginForm.tsx
│   ├── PasswordResetSuccess.tsx
│   ├── ResetPasswordForm.tsx
│   ├── SignupForm.tsx
│   ├── StoriesDialogSection.tsx
│   ├── StoriesSection.tsx
│   ├── VerificationCodeForm.tsx
│   ├── PostCard.tsx
│   ├── StoriesList.tsx
│   ├── StoriesViewer.tsx
│   ├── UserMenu.tsx
│   ├── Loading.tsx
├── pages/
│   ├── profile/
│   │   ├── [username].tsx
│   │   ├── highlights/[userId].tsx
│   ├── forgot-password.tsx
│   ├── login.tsx
│   ├── reset-password.tsx
│   ├── reset-password-success.tsx
│   ├── signup/index.tsx
│   ├── verify-code.tsx
├── stores/
│   ├── feedStore.ts
│   ├── notificationStore.ts
│   ├── profileStore.ts
├── utils/
│   ├── api.ts
│   ├── auth.ts
│   ├── constants.ts
│   ├── highlightUtils.ts
│   ├── profileUtils.ts
├── public/
│   ├── svgs/
│   │   ├── logo.svg
│   │   ├── success-checkmark.svg
│   ├── icons/
│   │   ├── home.svg
│   ├── avatars/
│   │   ├── placeholder.jpg
├── styles/
│   ├── globals.css
├── package.json
├── tsconfig.json
├── next.config.js
```

- **components/**: Reusable UI components for forms, stories, posts, and navigation.
- **pages/**: Next.js pages for authentication, profiles, and highlights.
- **stores/**: Zustand stores for state management (feed, notifications, profiles).
- **utils/**: Utility functions for API calls, authentication, and highlight navigation.
- **public/**: Static assets like logos, icons, and placeholder images.
- **styles/**: Global CSS with Tailwind integration.

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- Backend API server (assumed running at `http://localhost:3000/api`)
- WebSocket server (assumed running at `http://localhost:3000`)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Mahmoudramadan21/14.LinkUp.git
   cd 14.LinkUp/05_Implementation/Source_Code/frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_WS_URL=http://localhost:3000
   ```

   - `NEXT_PUBLIC_API_URL`: Backend API base URL.
   - `NEXT_PUBLIC_WS_URL`: WebSocket server URL.

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```
   The app will be available at `http://localhost:3000`.

## Usage

1. **Authentication**:

   - Navigate to `/signup` to create an account.
   - Log in at `/login` or recover your password via `/forgot-password`.
   - Verify reset codes at `/verify-code` and reset passwords at `/reset-password`.

2. **Profile Management**:

   - View profiles at `/profile/[username]`.
   - Edit profile details, follow/unfollow users, and manage follow requests.
   - View highlights at `/profile/highlights/[userId]`.

3. **Feed and Stories**:

   - Explore posts and stories in the feed (assumed at `/feed`).
   - Create stories via the “Your Story” avatar in the stories section.
   - Like and view stories in a dialog with auto-advance.

4. **Notifications**:
   - Receive real-time notifications via the header’s notification icon.
   - Mark notifications as read or delete them.

## API Endpoints

The frontend interacts with the backend via the following endpoints (defined in `utils/constants.ts`):

- **Auth**:
  - `POST /auth/login`: Log in.
  - `POST /auth/signup`: Sign up.
  - `POST /auth/forgot-password`: Initiate password reset.
  - `POST /auth/verify-code`: Verify reset code.
  - `POST /auth/reset-password`: Reset password.
- **Posts**:
  - `POST /posts`: Create a post.
  - `GET /posts`: Fetch posts (paginated).
  - `POST /posts/:postId/like`: Like a post.
- **Stories**:
  - `POST /stories`: Create a story.
  - `GET /stories/feed`: Fetch story feed.
  - `POST /stories/:storyId/like`: Like a story.
- **Profile**:
  - `GET /profile/:username`: Fetch profile by username.
  - `PUT /profile/edit`: Update profile.
  - `POST /profile/follow/:userId`: Follow a user.
  - `DELETE /profile/unfollow/:userId`: Unfollow a user.
- **Highlights**:
  - `GET /highlights/user/:userId`: Fetch user highlights.
  - `POST /highlights`: Create a highlight.
- **Notifications**:
  - `GET /notifications`: Fetch notifications (paginated).
  - `PUT /notifications/read`: Mark all as read.
  - `DELETE /notifications/:notificationId`: Delete a notification.

See `utils/api.ts` for implementation details.

## State Management

LinkUp uses **Zustand** for lightweight, performant state management. The stores are:

- **feedStore.ts**:
  - Manages feed data (posts, stories, follow requests).
  - Handles post creation, story creation, and pagination.
- **notificationStore.ts**:
  - Manages notifications with real-time updates via WebSocket.
  - Supports pagination, marking as read, and deletion.
- **profileStore.ts**:
  - Manages profile data, highlights, saved posts, and posts.
  - Handles follow/unfollow and profile updates.

Stores are type-safe and optimized with memoization and optimistic updates.

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit changes**:
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a pull request** with a clear description.

### Guidelines

- Follow the existing code style (ESLint, Prettier).
- Write type-safe code with TypeScript.
- Ensure accessibility (ARIA, keyboard navigation).
- Add unit tests for new features (using Jest).
- Update this README if new features are added.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
