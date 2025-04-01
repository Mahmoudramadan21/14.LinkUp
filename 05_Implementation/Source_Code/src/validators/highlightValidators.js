const {
  validateHighlightTitle,
  validateImageUrl,
} = require("../utils/validators");
const { body } = require("express-validator");

/**
 * Validation rules for creating a new highlight
 * Ensures title, cover image, and story IDs meet requirements
 * @returns {Array} Express-validator middleware array
 */
const validateHighlightInput = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .custom(validateHighlightTitle) // Reuses utility function for consistency
    .withMessage("Title must be 2-50 characters"),

  body("coverImage")
    .trim()
    .notEmpty()
    .withMessage("Cover image is required")
    .bail()
    .custom(validateImageUrl)
    .withMessage("Invalid image URL format"),

  body("storyIds")
    .isArray({ min: 1, max: 20 })
    .withMessage("Must include 1-20 stories"),

  body("storyIds.*").isInt().withMessage("Invalid story ID").toInt(),
];

/**
 * Validation rules for updating an existing highlight
 * Allows optional updates to title, cover image, and story IDs
 * @returns {Array} Express-validator middleware array
 */
const validateHighlightUpdate = [
  body("title")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .bail()
    .custom(validateHighlightTitle) // Reuses utility function for consistency
    .withMessage("Title must be 2-50 characters"),

  body("coverImage")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Cover image cannot be empty")
    .bail()
    .custom(validateImageUrl)
    .withMessage("Invalid image URL format"),

  body("storyIds")
    .optional({ checkFalsy: true })
    .isArray({ min: 1, max: 20 })
    .withMessage("Must include 1-20 stories"),

  body("storyIds.*").optional().isInt().withMessage("Invalid story ID").toInt(),
];

module.exports = {
  validateHighlightInput,
  validateHighlightUpdate,
};
