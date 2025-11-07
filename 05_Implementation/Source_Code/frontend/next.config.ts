/**
 * Next.js configuration for the LinkUp application.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /**
   * Enables React Strict Mode for development to catch potential issues.
   */
  reactStrictMode: true,

  /**
   * Configures allowed domains for Next.js Image optimization.
   */
  images: {
    domains: ["res.cloudinary.com"],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  /**
   * Enables source maps in production for debugging.
   * Note: This may increase bundle size and should be disabled if not needed.
   */
  productionBrowserSourceMaps: false,
};

export default nextConfig;
