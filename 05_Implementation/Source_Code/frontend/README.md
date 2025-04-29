# LinkUp Frontend

## Overview

This is the frontend for the **LinkUp** application, a platform for user authentication and interaction. The project is built using **Next.js** with **TypeScript**, providing a modern, type-safe, and optimized user experience. The current implementation includes a login page with reusable components and a custom layout for authentication pages, designed to be extensible for other auth-related pages like signup.

## Features

- **Login Page**: A responsive login page with form validation, password visibility toggle, and "Remember Me" functionality (located at `/login`).
- **Reusable Components**: Custom `Button` and `Input` components for consistent UI across the app.
- **Auth Layout**: A dedicated layout for authentication pages with decorative SVGs and SEO meta tags.
- **Generic Auth Styles**: CSS classes (e.g., `auth-page`, `auth-form`) designed for reuse across multiple authentication pages.
- Built with **Next.js** for server-side rendering and routing.
- Uses **TypeScript** for type safety and better developer experience.
- Styled using **Tailwind CSS** with **CSS Modules** and **BEM** naming convention for modular and scoped styling.
- Utilities for API requests (`api.ts`) and cookie management (`cookie.ts`).

## Tech Stack

- **Next.js**: React framework for building the frontend with SSR/SSG capabilities.
- **TypeScript**: Superset of JavaScript for type safety.
- **React**: JavaScript library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **CSS Modules**: For modular and scoped styling.
- **BEM**: Naming convention for CSS classes.
- **Axios**: For making API requests.
- **js-cookie**: For managing cookies.
- **Node.js**: For managing dependencies and running the development server.
- **npm**: Package manager for installing dependencies.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Mahmoudramadan21/14.LinkUp.git
cd 14.LinkUp/05_Implementation/Source_Code/frontend
```

### 2. Set Up Environment Variables

Create a `.env` file in the `frontend` directory and add the following:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api # Replace with your backend API URL
```

### 3. Install Dependencies

Install the required packages using npm:

```bash
npm install
```

### 4. Run the Development Server

Start the development server to see the app in action:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

- Visit `http://localhost:3000/login` to see the login page.

## Project Structure

```
frontend/
├── public/                  # Static assets
│   ├── illustrations/       # Illustration images (e.g., login-illustration.svg)
│   └── svgs/                # Decorative SVGs (e.g., liquid.svg, footer.svg)
├── src/                     # Source code
│   ├── components/          # Reusable React components
│   │   ├── Button.tsx       # Button component with variants and sizes
│   │   └── Input.tsx        # Input component with password toggle and error handling
│   ├── layout/              # Layout components
│   │   └── AuthLayout.tsx   # Layout for authentication pages with SEO and SVGs
│   ├── pages/               # Next.js pages (routing)
│   │   ├── index.tsx        # Home page
│   │   ├── login/           # Login page directory
│   │   │   └── index.tsx    # Login page component
│   │   └── _app.tsx         # Custom App component for Next.js
│   ├── sections/            # Page sections
│   │   └── LoginForm.tsx    # Login form section with form handling
│   ├── styles/              # CSS styles
│   │   ├── globals.css      # Global styles with Tailwind imports
│   │   ├── auth.css         # Generic styles for authentication pages
│   │   ├── Input.css        # Styles for Input component
│   │   └── Button.css       # Styles for Button component
│   ├── utils/               # Utility functions
│   │   ├── api.ts           # Axios instance for API requests
│   │   ├── constants.ts     # Constants (e.g., API endpoints, error messages)
│   │   └── cookie.ts        # Cookie handling utilities
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── package-lock.json        # Dependency lock file
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation (this file)
```

## Available Scripts

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the app in production mode (after building).

## Future Enhancements

- Add signup page for user registration using the generic `auth-page` and `auth-form` classes.
- Implement API integration with the backend for authentication (e.g., handle cookies like `qkz7m4p8v2`).
- Add form validation on the client side for better UX.
- Create more reusable components for the UI.
- Add protected routes for authenticated users.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.
