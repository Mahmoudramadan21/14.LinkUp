const { body, param } = require("express-validator");
const { isValidUserId } = require("../utils/validators");

// Update profile validation rules
const updateProfileValidationRules = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("Bio must be less than 150 characters"),

  body("profilePicture")
    .optional()
    .isURL()
    .withMessage("Invalid profile picture URL"),
];

// Change password validation rules
const changePasswordValidationRules = [
  body("oldPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

// Update privacy settings validation rules
const updatePrivacySettingsValidationRules = [
  body("isPrivate")
    .notEmpty()
    .withMessage("Privacy setting is required")
    .isBoolean()
    .withMessage("Privacy setting must be a boolean value"),
];

// User ID parameter validator
const userIdParamValidator = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("Invalid user ID")
    .custom(isValidUserId)
    .withMessage("User does not exist")
    .toInt(),
];

// Follow action validator
const followActionValidator = [
  body().custom((_, { req }) => {
    if (req.params.userId === req.user.UserID.toString()) {
      throw new Error("Cannot follow yourself");
    }
    return true;
  }),
];

module.exports = {
  updateProfileValidationRules,
  changePasswordValidationRules,
  updatePrivacySettingsValidationRules,
  userIdParamValidator,
  followActionValidator,
};
