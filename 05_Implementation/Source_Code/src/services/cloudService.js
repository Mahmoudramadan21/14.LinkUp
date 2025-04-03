const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

// Configure Cloudinary with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary and returns the secure URL
 * @param {Buffer} fileBuffer - File data to upload
 * @param {Object} [options] - Optional Cloudinary upload options
 * @returns {Promise<string>} Secure URL of the uploaded file
 */
async function uploadToCloud(fileBuffer, options = {}) {
  try {
    // Stream file buffer to Cloudinary and resolve with result
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(fileBuffer);
    });

    return result.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload file");
  }
}

module.exports = { uploadToCloud };
