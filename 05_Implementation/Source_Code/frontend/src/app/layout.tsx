/**
 * Root layout for the LinkUp application.
 * Defines global metadata, applies global styles, and wraps all pages with a base HTML structure.
 */

import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";
import AuthInitializer from "@/components/initializers/AuthInitializer";
import type { ReactNode, ReactElement } from "react";

/**
 * Metadata for the application.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "LinkUp",
  description: "A social media platform to connect and share moments.",
  icons: {
    icon: "/favicon.svg",
  },
};

/**
 * Props for the RootLayout component.
 * @interface RootLayoutProps
 */
interface RootLayoutProps {
  /** The child components to be rendered within the layout. */
  children: ReactNode;
}

/**
 * Renders the root layout for the application.
 * Wraps the app with Redux Provider and initializes authentication state.
 * 
 * @param {RootLayoutProps} props - The component props.
 * @returns {ReactElement} The root layout with children.
 */
export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  return (
    <html lang="en" className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400&family=Montserrat:wght@400&family=Oswald:wght@400&family=Pacifico&family=Playfair+Display:wght@400&family=Roboto+Condensed:wght@400&family=Roboto:wght@400&family=Verdana&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AuthInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}