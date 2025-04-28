# LinkUp Frontend

## Overview

This is the frontend for the **LinkUp** application, a platform for user authentication and interaction. The project is built using **Next.js** with **TypeScript**, providing a modern, type-safe, and optimized user experience. The initial implementation includes a login page for user authentication.

## Features

- **Login Page**: A responsive login page for users to authenticate with their credentials (located at `/login`).
- Built with **Next.js** for server-side rendering and routing.
- Uses **TypeScript** for type safety and better developer experience.
- Styled using **CSS Modules** for modular and scoped styling.
- Reusable components like `Button` and `Input` for a consistent UI.

## Tech Stack

- **Next.js**: React framework for building the frontend with SSR/SSG capabilities.
- **TypeScript**: Superset of JavaScript for type safety.
- **React**: JavaScript library for building user interfaces.
- **CSS Modules**: For modular and scoped styling.
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

### 2. Install Dependencies

Install the required packages using npm:

```bash
npm install
```

### 3. Run the Development Server

Start the development server to see the app in action:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

- Visit `http://localhost:3000/login` to see the login page.

## Project Structure

```
frontend/
├── public/               # Static assets (e.g., images, favicon)
├── src/                  # Source code
│   ├── components/       # Reusable React components
│   │   ├── Button.tsx    # Button component
│   │   └── Input.tsx     # Input component
│   ├── pages/            # Next.js pages (routing)
│   │   ├── index.tsx     # Home page
│   │   ├── login/        # Login page directory
│   │   │   └── app.tsx   # Login page component
│   │   └── _app.tsx      # Custom App component for Next.js
│   ├── sections/         # Page sections
│   │   └── LoginForm.tsx # Login form section
│   ├── styles/           # CSS styles
│   │   ├── globals.css   # Global styles
│   │   ├── Input.css     # Styles for Input component
│   │   ├── login.css     # Styles for login page
│   │   └── Button.css    # Styles for Button component
│   ├── api.ts            # API utilities (for future backend integration)
│   ├── constants.ts      # Constants (e.g., API endpoints, configs)
│   └── cookie.ts         # Cookie handling utilities
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Dependency lock file
├── tailwind.config.js    # Tailwind CSS configuration (if used)
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation (this file)
```

## Available Scripts

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the app in production mode (after building).

## Future Enhancements

- Add signup page for user registration.
- Implement API integration with the backend for authentication.
- Add form validation and error handling for the login page.
- Enhance UI with more reusable components.
- Add protected routes for authenticated users.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.
