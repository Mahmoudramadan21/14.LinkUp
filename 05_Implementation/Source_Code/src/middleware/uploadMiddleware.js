const multer = require("multer");

// Configured multer instance for file uploads
const upload = multer({
  // Store files in memory instead of disk
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1, // Limit to single file upload
  },
  /**
   * Filters uploaded files to allow only images and videos
   * @param {Object} req - Express request object
   * @param {Object} file - Uploaded file details
   * @param {Function} cb - Callback to accept or reject file
   */
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"), false);
    }
  },
});

module.exports = upload;
