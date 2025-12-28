import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Enable React strict mode for catching issues during development.
   */
  reactStrictMode: true,

  /**
   * Optimize and compress output using built-in SWC minifier.
   */
  swcMinify: true,

  /**
   * Remove `X-Powered-By: Next.js` for better security.
   */
  poweredByHeader: false,

  /**
   * Enable HTTP compression (Gzip + Brotli).
   */
  compress: true,

  /**
   * Configure image optimization domains.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"], // Best performance
  },

  /**
   * Enable file-system based caching for faster incremental builds.
   */
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    webpackBuildWorker: true,
  },

  /**
   * Only generate source maps in development to avoid huge build size.
   */
  productionBrowserSourceMaps: false,

  /**
   * Custom Webpack config: SVG support via SVGR.
   */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  /**
   * Strict Content-Security-Policy headers (Optional enhancement).
   * Uncomment if using next-safe for best security.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
