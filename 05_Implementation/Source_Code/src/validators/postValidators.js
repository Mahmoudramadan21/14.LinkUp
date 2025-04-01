const { body, param, query } = require("express-validator");

/**
 * Validation rules for creating a new post
 * Ensures either content or valid media is provided
 * @returns {Array} Express-validator middleware array
 */
const postCreationRules = [
  body("content")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Post content must be less than 2000 characters"),

  body("media").custom((_, { req }) => {
    if (!req.file) {
      if (!req.body.content) {
        throw new Error("Either content or media is required");
      }
      return true;
    }

    const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error(
        "Invalid media type. Only JPEG, PNG, and MP4 are allowed"
      );
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      throw new Error("Media file too large. Maximum size is 50MB");
    }

    return true;
  }),
];

/**
 * Validation rules for updating an existing post
 * Validates post ID and optional content
 * @returns {Array} Express-validator middleware array
 */
const postUpdateRules = [
  param("postId").isInt().withMessage("Invalid post ID").toInt(),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Post content must be less than 2000 characters")
    .escape(),
];

/**
 * Validation rules for reporting a post
 * Ensures valid post ID and report reason
 * @returns {Array} Express-validator middleware array
 */
const reportPostRules = [
  param("postId").isInt().withMessage("Invalid post ID").toInt(),

  body("reason")
    .isIn(["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"])
    .withMessage("Invalid report reason"),
];

/**
 * Validation rules for querying posts
 * Ensures valid pagination parameters
 * @returns {Array} Express-validator middleware array
 */
const postQueryRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1-50")
    .toInt(),
];

module.exports = {
  postCreationRules,
  postUpdateRules,
  reportPostRules,
  postQueryRules,
};
