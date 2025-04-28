/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/sections/**/*.{js,ts,jsx,tsx}",
    "./src/layout/**/*.{js,ts,jsx,tsx}",
  ],  
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "16px",
        sm: "16px",
        md: "24px",
        lg: "32px",
      },
    },
    extend: {
      screens: {
        sm: "393px",
        md: "744px",
        lg: "1440px",
      },
      colors: {
        "linkup-purple": "#6D28D9",
      },
    },
  },
  plugins: [],
};