const { body } = require("express-validator");
const {
  validateUsername,
  validateEmail,
  validatePassword,
} = require("../utils/validators");

// Update profile validation rules
const updateProfileValidationRules = [
  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .custom(validateUsername)
    .withMessage(
      "Username must be 3-20 characters long and can only contain letters, numbers, and underscores."
    ),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .custom(validateEmail)
    .withMessage("Invalid email address"),
  body("bio")
    .optional()
    .isLength({ max: 150 })
    .withMessage("Bio must be less than 150 characters"),
  body("profilePicture")
    .optional()
    .isURL()
    .withMessage("Invalid profile picture URL"),
];

// Change password validation rules
const changePasswordValidationRules = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .custom((value) => {
      if (!validatePassword(value)) {
        throw new Error(
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        );
      }
      return true;
    }),
];

// Update privacy settings validation rules
const updatePrivacySettingsValidationRules = [
  body("isPrivate")
    .notEmpty()
    .withMessage("Privacy setting is required")
    .isBoolean()
    .withMessage("Privacy setting must be a boolean value (true or false)"),
];

module.exports = {
  updateProfileValidationRules,
  changePasswordValidationRules,
  updatePrivacySettingsValidationRules,
};
