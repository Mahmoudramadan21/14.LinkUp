const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

/**
 * Uploads a file buffer to Cloudinary using streaming
 * @param {Buffer} buffer - File buffer to upload
 * @param {Object} options - Custom upload options
 * @returns {Promise} - Resolves with upload result or rejects with error
 */
const uploadToCloud = async (buffer, options) => {
  return new Promise((resolve, reject) => {
    // Set upload options with defaults
    const uploadOptions = {
      ...options,
      timestamp: Math.round(Date.now() / 1000), // Current timestamp in seconds
      unique_filename: true, // Ensure unique file names
      overwrite: false, // Prevent overwriting existing files
    };

    // Log upload options for debugging
    console.log("Upload options:", uploadOptions);

    // Create upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          // Log detailed error information
          console.error("Cloudinary upload error details:", {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
          });
          return reject(new Error(`Upload failed: ${error.message}`));
        }

        // Check if secure URL is returned
        if (!result?.secure_url) {
          return reject(new Error("No secure URL received from Cloudinary"));
        }

        // Log successful upload
        console.log("Upload successful:", result.secure_url);
        resolve(result);
      }
    );

    // Convert buffer to readable stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null); // Signal end of stream
    bufferStream.pipe(uploadStream); // Pipe buffer to Cloudinary
  });
};

module.exports = { uploadToCloud };
