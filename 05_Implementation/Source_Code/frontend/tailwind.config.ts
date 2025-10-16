/**
 * Tailwind CSS configuration for the LinkUp application.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  /**
   * Specifies the paths to scan for Tailwind CSS classes.
   */
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/sections/**/*.{js,ts,jsx,tsx}",
    "./src/layout/**/*.{js,ts,jsx,tsx}",
  ],

  /**
   * Customizes the Tailwind theme.
   */
  theme: {
    /**
     * Centers containers by default.
     */
    container: {
      center: true,
    },

    /**
     * Extends the default theme with custom colors.
     */
    extend: {
      colors: {
        /**
         * Custom purple color for LinkUp branding (consistent with CSS variables).
         */
        "linkup-purple": "#6B46C1",
      },
      keyframes: {
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        progress: "progress 2s linear infinite",
      },
    },
  },

  /**
   * Lists Tailwind plugins to be used.
   * Note: Uncomment and configure plugins as needed.
   */
  plugins: [
    // require('tailwind-scrollbar')({ nocompatible: true }),
    // require('tailwind-scrollbar-hide'),
  ],
};
