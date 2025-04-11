const multer = require("multer");

// Configured multer instance for story file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size for stories
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only images (JPEG, PNG, WebP) and videos (MP4, MOV) are allowed"
        ),
        false
      );
    }
  },
});

module.exports = upload;
