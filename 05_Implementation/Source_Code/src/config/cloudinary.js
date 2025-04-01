// Import Cloudinary SDK (using v2 API)
const { v2: cloudinary } = require("cloudinary");

/**
 * Configures Cloudinary with environment variables
 * Note: Ensure these ENV vars are set in your production environment:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // API key for authentication
  api_secret: process.env.CLOUDINARY_API_SECRET, // API secret (keep secure!)
  secure: true, // Enforce HTTPS for all requests
});

// Export configured Cloudinary instance
module.exports = cloudinary;
