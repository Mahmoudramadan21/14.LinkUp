/**
 * Tailwind CSS configuration for the LinkUp application.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: "class",

  /**
   * Specifies the paths to scan for Tailwind CSS classes.
   */
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/sections/**/*.{js,ts,jsx,tsx}",
    "./src/layout/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.css",
    "./src/styles/globals.css",
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
      padding: {
        DEFAULT: "1rem",
        sm: "1rem",
        md: "2rem",
        lg: "3rem",
        xl: "4rem",
        "2xl": "5rem",
      },
      screens: {
        sm: "90%",
        md: "90%",
        lg: "90%",
        xl: "min(90%, 1700px)",
        "2xl": "min(95%, 1900px)",
      },
    },

    /**
     * Extends the default theme with custom configurations.
     */
    extend: {
      colors: {
        /**
         * Custom colors for LinkUp branding and theming.
         */
        "linkup-purple": "#6B46C1",
        "section-bg-light": "#FFFFFF",
        "section-bg-dark": "#1A202C",
      },
      fontSize: {
        xs: "0.75rem", // 12px
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.25rem", // 20px
        xl: "1.5rem", // 24px
        "2xl": "2rem", // 32px
      },
      spacing: {
        xs: "0.25rem", // 4px
        sm: "0.5rem", // 8px
        md: "1rem", // 16px
        lg: "1.5rem", // 24px
        xl: "2rem", // 32px
      },
      maxWidth: {
        stories: "47rem", // --stories-max-width
      },
      minWidth: {
        "avatar-lg": "4rem", // --story-avatar-size
        "avatar-lg-inner": "3.5rem", // -story--avatar-inner-size
        "avatar-md": "3rem", // --avatar-size
        "avatar-md-inner": "2.5rem", // --avatar-inner-size
        "avatar-sm": "1.5rem", // --avatar-size
        "avatar-sm-inner": "1.25rem", // --avatar-inner-size
      },
      minHeight: {
        "avatar-lg": "4rem", // --story-avatar-size
        "avatar-lg-inner": "3.5rem", // -story--avatar-inner-size
        "avatar-md": "3rem", // --avatar-size
        "avatar-md-inner": "2.5rem", // --avatar-inner-size
        "avatar-sm": "1.5rem", // --avatar-size
        "avatar-sm-inner": "1.25rem", // --avatar-inner-size
      },
      width: {
        "avatar-lg": "4rem", // --story-avatar-size
        "avatar-lg-inner": "3.5rem", // -story--avatar-inner-size
        "avatar-md": "3rem", // --avatar-size
        "avatar-md-inner": "2.5rem", // --avatar-inner-size
        "avatar-sm": "1.5rem", // --avatar-size
        "avatar-sm-inner": "1.25rem", // --avatar-inner-size
      },
      height: {
        "avatar-lg": "4rem", // --story-avatar-size
        "avatar-lg-inner": "3.5rem", // -story--avatar-inner-size
        "avatar-md": "3rem", // --avatar-size
        "avatar-md-inner": "2.5rem", // --avatar-inner-size
        "avatar-sm": "1.5rem", // --avatar-size
        "avatar-sm-inner": "1.25rem", // --avatar-inner-size
      },
      padding: {
        ring: "0.375rem", // --ring-padding
      },
      aspectRatio: {
        story: "9 / 16", // --story-aspect-w / --story-aspect-h
      },
      transitionDuration: {
        fast: "200ms", // --anim-fast
        medium: "350ms", // --anim-medium
        slow: "600ms", // --anim-slow
        progress: "15000ms", // --progress-duration
      },
      keyframes: {
        heartPulse: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "20%": { transform: "scale(1.3)", opacity: "0.9" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        fadeInModal: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeOutModal: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        swipeHint: {
          "0%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(8px)" },
          "100%": { transform: "translateX(0)" },
        },
        videoGlow: {
          "0%": { boxShadow: "0 0 5px var(--border-color)" },
          "50%": { boxShadow: "0 0 12px var(--border-color)" },
          "100%": { boxShadow: "0 0 5px var(--border-color)" },
        },
        bounceAndRotate: {
          "0%": { transform: "scale(1) rotate(0deg)" },
          "50%": { transform: "scale(1.2) rotate(8deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        slideBookmark: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        waveFlag: {
          "0%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(12deg)" },
          "50%": { transform: "rotate(0deg)" },
          "75%": { transform: "rotate(-12deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        shareArrow: {
          "0%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(6px)" },
          "100%": { transform: "translateX(0)" },
        },
        buttonScale: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        heartPulse: "heartPulse 1.5s ease-in-out infinite",
        progress: "progress 2s linear infinite",
        fadeInModal: "fadeInModal 350ms ease-out",
        fadeOutModal: "fadeOutModal 350ms ease-out",
        swipeHint: "swipeHint 1s ease-in-out infinite",
        videoGlow: "videoGlow 1.5s ease-in-out infinite",
        bounceAndRotate: "bounceAndRotate 0.5s ease-in-out",
        slideBookmark: "slideBookmark 0.3s ease-out",
        waveFlag: "waveFlag 0.8s ease-in-out infinite",
        shareArrow: "shareArrow 0.6s ease-in-out infinite",
        buttonScale: "buttonScale 0.2s ease-in-out",
      },
    },

    /**
     * Responsive breakpoints with adjusted typography and spacing.
     */
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "md-down": { max: "1023px" },
      "sm-down": { max: "640px" },
    },
  },

  /**
   * Lists Tailwind plugins to be used.
   */
  plugins: [
    /**
     * Plugin for base, components, and utilities layers.
     */
    function ({ addBase, addComponents, addUtilities }) {
      /* ========== Base Layer ========== */
      addBase({
        html: {
          "@apply bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-[350ms]":
            {},
        },
      });

      /* ========== Components Layer ========== */
      addComponents({
        /* Focus Rings */
        ".focus-ring": {
          "@apply focus:outline-none focus:ring-2 focus:ring-[var(--linkup-purple)]":
            {},
        },
        ".focus-ring-teal": {
          "@apply focus:outline-none focus:ring-2 focus:ring-[var(--linkup-purple)]":
            {},
        },

        /* Buttons */
        ".btn-rounded": {
          "@apply rounded-full px-md py-sm font-medium transition-all duration-fast":
            {},
        },
        ".btn-rounded--purple": {
          "@apply btn-rounded bg-[var(--linkup-purple)] text-white hover:bg-[var(--linkup-purple-light)]":
            {},
        },
        ".btn-rounded--success": {
          "@apply btn-rounded bg-[var(--linkup-purple)] text-white hover:bg-[var(--linkup-purple-light)]":
            {},
        },
        ".btn-rounded--disabled": {
          "@apply opacity-50 cursor-not-allowed pointer-events-none": {},
        },

        ".btn-follow-state": {
          "@apply btn-rounded md-down:text-base sm-down:text-sm will-transform ml-auto":
            {},
        },
        ".btn-follow": {
          "@apply btn-follow-state btn-rounded--purple": {},
        },
        ".btn-pending": {
          "@apply btn-follow-state bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] opacity-80 hover:bg-[var(--border-color)] disabled:btn-rounded--disabled":
            {},
        },
        ".btn-unfollow": {
          "@apply btn-follow-state bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--border-color)] disabled:btn-rounded--disabled":
            {},
        },

        /* Cards */
        ".card": {
          "@apply bg-[var(--section-bg)] rounded-lg shadow-md p-md": {},
        },
        ".card--hover": {
          "@apply card hover:shadow-lg hover:translate-y-[-2px] transition-transform duration-medium":
            {},
        },

        /* Modals */
        ".modal": {
          "@apply p-lg w-full max-w-[600px] mx-md max-h-[90vh] bg-[var(--section-bg)] overflow-y-auto sm-down:max-w-[90vw] scrollbar-thin-purple":
            {},
        },
        ".modal--sm": {
          "@apply modal max-w-[400px]": {},
        },
        ".modal--lg": {
          "@apply modal max-w-stories max-h-[800px] rounded-2xl overflow-hidden shadow-2xl":
            {},
        },

        /* Loading */
        ".loading": {
          "@apply text-center text-[var(--text-secondary)] animate-pulse": {},
        },
        ".loading--lg": {
          "@apply loading text-lg": {},
        },
        ".loading--sm": {
          "@apply loading text-sm": {},
        },

        /* Text Styles */
        ".text-secondary": {
          "@apply text-sm text-[var(--text-secondary)] md-down:text-sm sm-down:text-sm":
            {},
        },
        ".text-primary-bold": {
          "@apply text-lg font-semibold text-[var(--text-primary)]": {},
        },

        /* Modal Overlay */
        ".modal-overlay": {
          "@apply fixed inset-0 flex justify-center items-center bg-[rgba(var(--app-bg-rgb),0.6)] dark:bg-[rgba(var(--app-bg-rgb),0.8)] backdrop-blur-sm":
            {},
        },

        /* Avatars */
        ".avatar": {
          "@apply rounded-full border-2 border-[var(--border-color)] object-cover":
            {},
        },
        ".avatar--lg": {
          "@apply min-w-avatar-lg h-avatar-lg avatar": {},
        },
        ".avatar--ring": {
          "@apply avatar--lg flex items-center justify-center": {},
        },
        ".avatar--md": {
          "@apply min-w-avatar-md h-avatar-md avatar": {},
        },
        ".avatar--sm": {
          "@apply min-w-avatar-sm h-avatar-sm avatar": {},
        },
        ".avatar--inner": {
          "@apply min-w-avatar-lg-inner h-avatar-lg-inner rounded-full object-cover box-content border-2 border-[var(--card-bg)]":
            {},
        },
      });

      /* ========== Utilities Layer ========== */
      addUtilities(
        {
          /* Background Utilities */
          ".bg-neutral-gray": {
            "background-color": "var(--neutral-gray-light)",
            "@apply dark:bg-[var(--neutral-gray-dark)]": {},
          },
          ".bg-overlay": {
            "background-color": "rgba(var(--app-bg-rgb), 0.7)",
            "@apply dark:bg-[rgba(var(--app-bg-rgb),0.85)]": {},
          },

          /* Responsive Typography for md-down */
          ".md-down\\:text-xs": {
            "@media (max-width: 1023px)": {
              "font-size": "0.75rem", // 12px
            },
          },
          ".md-down\\:text-sm": {
            "@media (max-width: 1023px)": {
              "font-size": "0.875rem", // 14px
            },
          },
          ".md-down\\:text-base": {
            "@media (max-width: 1023px)": {
              "font-size": "1rem", // 16px
            },
          },
          ".md-down\\:text-lg": {
            "@media (max-width: 1023px)": {
              "font-size": "1.125rem", // 18px
            },
          },
          ".md-down\\:text-xl": {
            "@media (max-width: 1023px)": {
              "font-size": "1.375rem", // 22px
            },
          },
          ".md-down\\:text-2xl": {
            "@media (max-width: 1023px)": {
              "font-size": "1.75rem", // 28px
            },
          },

          /* Responsive Padding for md-down */
          ".md-down\\:p-xs": {
            "@media (max-width: 1023px)": {
              padding: "0.375rem", // 6px
            },
          },
          ".md-down\\:p-sm": {
            "@media (max-width: 1023px)": {
              padding: "0.5rem", // 8px
            },
          },
          ".md-down\\:p-md": {
            "@media (max-width: 1023px)": {
              padding: "0.875rem", // 14px
            },
          },
          ".md-down\\:p-lg": {
            "@media (max-width: 1023px)": {
              padding: "1.125rem", // 18px
            },
          },
          ".md-down\\:p-xl": {
            "@media (max-width: 1023px)": {
              padding: "1.5rem", // 24px
            },
          },

          /* Responsive Typography for sm-down */
          ".sm-down\\:text-xs": {
            "@media (max-width: 640px)": {
              "font-size": "0.75rem", // 12px
            },
          },
          ".sm-down\\:text-sm": {
            "@media (max-width: 640px)": {
              "font-size": "0.8125rem", // 13px
            },
          },
          ".sm-down\\:text-base": {
            "@media (max-width: 640px)": {
              "font-size": "0.9375rem", // 15px
            },
          },
          ".sm-down\\:text-lg": {
            "@media (max-width: 640px)": {
              "font-size": "1rem", // 16px
            },
          },
          ".sm-down\\:text-xl": {
            "@media (max-width: 640px)": {
              "font-size": "1.125rem", // 18px
            },
          },
          ".sm-down\\:text-2xl": {
            "@media (max-width: 640px)": {
              "font-size": "1.375rem", // 22px
            },
          },

          /* Responsive Padding for sm-down */
          ".sm-down\\:p-xs": {
            "@media (max-width: 640px)": {
              padding: "0.25rem", // 4px
            },
          },
          ".sm-down\\:p-sm": {
            "@media (max-width: 640px)": {
              padding: "0.375rem", // 6px
            },
          },
          ".sm-down\\:p-md": {
            "@media (max-width: 640px)": {
              padding: "0.625rem", // 10px
            },
          },
          ".sm-down\\:p-lg": {
            "@media (max-width: 640px)": {
              padding: "0.875rem", // 14px
            },
          },
          ".sm-down\\:p-xl": {
            "@media (max-width: 640px)": {
              padding: "1rem", // 16px
            },
          },

          /* Responsive Avatar Sizes for sm-down */
          ".sm-down\\:w-avatar": {
            "@media (max-width: 640px)": {
              width: "2.5rem", // 40px
            },
          },
          ".sm-down\\:w-avatar-inner": {
            "@media (max-width: 640px)": {
              width: "2.25rem", // 36px
            },
          },
          ".sm-down\\:h-avatar": {
            "@media (max-width: 640px)": {
              height: "2.5rem", // 40px
            },
          },
          ".sm-down\\:h-avatar-inner": {
            "@media (max-width: 640px)": {
              height: "2.25rem", // 36px
            },
          },
          ".sm-down\\:p-ring": {
            "@media (max-width: 640px)": {
              padding: "0.25rem", // 4px
            },
          },

          /* Scrollbar Styles */
          ".scrollbar": {
            "scrollbar-color": "rgba(var(--linkup-purple-rgb),0.6) transparent",
            "scrollbar-width": "thin",
          },
          ".scrollbar::-webkit-scrollbar": { height: "8px", width: "8px" },
          ".scrollbar::-webkit-scrollbar-thumb": {
            background: "rgba(var(--linkup-purple-rgb),0.6)",
            "border-radius": "9999px",
            transition: "background 0.3s",
          },
          ".scrollbar::-webkit-scrollbar-thumb:hover": {
            background: "rgba(var(--linkup-purple-rgb),0.9)",
          },
          ".scrollbar-hidden::-webkit-scrollbar": { display: "none" },
          ".scrollbar-hidden": {
            "-ms-overflow-style": "none",
            "scrollbar-width": "none",
          },
          ".scrollbar-thin": { "scrollbar-width": "thin" },
          ".scrollbar-thin-purple": {
            "scrollbar-width": "thin",
            "scrollbar-color": "rgba(var(--linkup-purple-rgb),0.6) transparent",
          },
          ".scrollbar-thin-purple::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          ".scrollbar-thin-purple::-webkit-scrollbar-thumb": {
            background: "rgba(var(--linkup-purple-rgb),0.6)",
            "border-radius": "3px",
          },
          ".scrollbar-thin-purple::-webkit-scrollbar-thumb:hover": {
            background: "rgba(var(--linkup-purple-rgb),0.9)",
          },

          /* Touch Action */
          ".touch-action-pan-y": {
            touchAction: "pan-y",
          },

          /* Masonry Layout */
          ".column-count-2": {
            columnCount: "2",
          },
          ".column-count-3": {
            columnCount: "3",
          },
          ".column-count-4": {
            columnCount: "4",
          },
          ".column-count-5": {
            columnCount: "5",
          },
          ".column-gap-md": {
            columnGap: "1rem",
          },
          ".break-inside-avoid": {
            breakInside: "avoid",
          },

          ".will-transform": {
            willChange: "transform, opacity",
          },
        },
        ["responsive", "dark"]
      );
    },
  ],
};
