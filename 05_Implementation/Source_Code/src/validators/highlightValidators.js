const {
  validateHighlightTitle,
  validateImageUrl,
} = require("../utils/validators");
const { body } = require("express-validator");

const validateHighlightInput = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .custom((value) => value.length >= 2 && value.length <= 50)
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

const validateHighlightUpdate = [
  body("title")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .bail()
    .custom((value) => value.length >= 2 && value.length <= 50)
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
